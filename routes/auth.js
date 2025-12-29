const express = require('express');
const passport = require('passport');
const SamlStrategy = require('passport-saml').Strategy;
const { Issuer, Strategy: OpenIDStrategy } = require('openid-client');
const spidConfig = require('../config/spid');
const cieConfig = require('../config/cie');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// --- SPID Strategy Setup ---
const samlStrategy = new SamlStrategy(spidConfig, (profile, done) => {
    // Map SPID attributes to local user model
    const user = {
        provider: 'spid',
        id: profile.nameID,
        name: profile.name,
        surname: profile.familyName,
        fiscalNumber: profile.fiscalNumber,
        email: profile.email,
        raw: profile
    };
    return done(null, user);
});

passport.use('saml', samlStrategy);

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

router.use(passport.initialize());
router.use(passport.session());

// --- Routes ---

// Login Page
router.get('/login', (req, res) => {
    res.render('login');
});

const idpRegistry = require('../config/idp_registry');

// SPID Login Trigger with Dynamic IdP Support
router.get('/login/spid', (req, res, next) => {
    const idpKey = req.query.idp || 'demo';
    const selectedIdp = idpRegistry[idpKey];

    if (!selectedIdp) {
        return res.status(400).send('Invalid Identity Provider selected');
    }

    // Dynamic Strategy Configuration
    // We modify the Strategy's options for this specific request.
    // Passport-SAML allows overriding options in the `authenticate` call.

    // NOTE: In a strict production environment, you might need to re-instantiate the strategy 
    // or use a MultiSamlStrategy if certificates differ significantly per IdP.
    // For this gateway approach with standard SAML 2.0, overriding entryPoint is often sufficient 
    // provided we trust the IdP.

    const additionalOptions = {
        entryPoint: selectedIdp.entryPoint,
        issuer: spidConfig.issuer, // Our Entity ID remains the same
        // cert: selectedIdp.cert // If we had per-IdP certs loaded
    };

    // Merge with request-specific params
    const options = {
        ...additionalOptions,
        authnContext: ['https://www.spid.gov.it/SpidL2'],
        additionalParams: {
            'RelayState': req.query.relayState || '/'
        }
    };

    // We need to use a trick to pass 'entryPoint' dynamic override to passport-saml 
    // because standard 'authenticate' options might not override the strategy instance config basic props easily 
    // depending on version. 
    // Passport-SAML > 3.x is stricter. 

    // Workaround: Temporarily patch the strategy instance (Not thread safe!) 
    // OR better: use MultiSamlStrategy. 
    // OR simplest for this demo: use the `getSamlOptions` callback if available, or just re-create strategy? No that's heavy.

    // Let's try assigning to the strategy object directly (Node.js single threaded nature helps, but async calls beware).
    // BETTER APPROACH for Passport-SAML:
    // It reads `this.options`.

    samlStrategy._saml.options.entryPoint = selectedIdp.entryPoint;

    // Update cert if needed
    // if (selectedIdp.cert) samlStrategy._saml.options.cert = selectedIdp.cert;

    passport.authenticate('saml', options)(req, res, next);
});

// SPID Assertion Consumer Service (ACS)
router.post('/acs',
    passport.authenticate('saml', {
        failureRedirect: '/error',
        failureFlash: true
    }),
    (req, res) => {
        res.redirect('/');
    }
);

// SPID Metadata
router.get('/metadata', (req, res) => {
    res.type('application/xml');
    res.send(samlStrategy.generateServiceProviderMetadata(
        fs.readFileSync(path.join(__dirname, '../certs/spid-cert.pem'), 'utf-8')
    ));
});

// --- CIE Strategy Setup (Async) ---
let cieClient;

async function setupCieStrategy() {
    try {
        // In a real scenario with a discovery URL:
        // const issuer = await Issuer.discover(cieConfig.discovery_url);

        // For Manual Config (if discovery fails or using mock without discovery):
        const issuer = new Issuer({
            issuer: 'https://cie-provider.example.com',
            authorization_endpoint: 'https://cie-provider.example.com/auth',
            token_endpoint: 'https://cie-provider.example.com/token',
            userinfo_endpoint: 'https://cie-provider.example.com/userinfo',
            jwks_uri: 'https://cie-provider.example.com/jwks'
        });

        cieClient = new issuer.Client({
            client_id: cieConfig.client_id,
            client_secret: cieConfig.client_secret,
            redirect_uris: cieConfig.redirect_uris,
            response_types: ['code']
        });

        // Passport Wrapper for OIDC not always strictly needed if using openid-client directly in routes
        // But we can use it. For this demo, we'll use openid-client helpers directly in routes for clarity.
    } catch (err) {
        console.error('Failed to setup CIE Strategy:', err);
    }
}
setupCieStrategy();

// CIE Login Trigger
router.get('/login/cie', (req, res) => {
    if (!cieClient) return res.status(500).send('CIE Provider not initialized');

    const authUrl = cieClient.authorizationUrl({
        scope: cieConfig.scope,
        acr_values: cieConfig.acr_values,
        state: 'random_state_string_for_security' // Use crypto.randomBytes in prod
    });

    res.redirect(authUrl);
});

// CIE Callback
router.get('/callback', async (req, res) => {
    try {
        if (!cieClient) throw new Error('CIE Client not ready');
        const params = cieClient.callbackParams(req);
        const tokenSet = await cieClient.callback(cieConfig.redirect_uris[0], params, { state: 'random_state_string_for_security' });
        const userinfo = await cieClient.userinfo(tokenSet);

        // Normalize user for session
        const user = {
            provider: 'cie',
            id: userinfo.sub,
            name: userinfo.given_name,
            surname: userinfo.family_name,
            fiscalNumber: userinfo.fiscal_number, // Depends on claim name
            email: userinfo.email,
            raw: userinfo
        };

        req.login(user, (err) => {
            if (err) throw err;
            res.redirect('/');
        });

    } catch (err) {
        console.error('CIE Callback Error:', err);
        res.redirect('/error');
    }
});

// Logout
router.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) { return next(err); }
        res.redirect('/');
    });
});

// Error Page
router.get('/error', (req, res) => {
    res.render('error', { message: 'Authentication Failed' });
});

// ... (Existing Routes) ...

// --- SPID Validator Integration ---
const spidValidatorConfig = require('../config/spid-validator');

const samlValidatorStrategy = new SamlStrategy(spidValidatorConfig, (profile, done) => {
    // Map Validator attributes
    const user = {
        provider: 'spid-validator',
        id: profile.nameID,
        name: profile.name,
        surname: profile.familyName,
        fiscalNumber: profile.fiscalNumber,
        email: profile.email,
        raw: profile
    };
    return done(null, user);
});

passport.use('saml-validator', samlValidatorStrategy);

// Validator Login Trigger
router.get('/login/validator', (req, res, next) => {
    const options = {
        authnContext: ['https://www.spid.gov.it/SpidL2'],
        additionalParams: {
            'RelayState': '/'
        }
    };
    passport.authenticate('saml-validator', options)(req, res, next);
});

// Validator Metadata
router.get('/metadata/validator', (req, res) => {
    res.type('application/xml');

    // Custom Metadata Generation for AgID with Organization and Contacts
    // Note: passport-saml 3.x generateServiceProviderMetadata is limited. 
    // We are manually injecting fields or relying on config if supported (newer versions).
    // For this demo, we use the strategy's generator but would need XML manipulation for strict AgID compliance
    // if the library doesn't output Organization/ContactPerson.

    // Hack: Post-process XML to add Organization if missing (simplified)
    let metadata = samlValidatorStrategy.generateServiceProviderMetadata(
        fs.readFileSync(path.join(__dirname, '../certs/spid-agid-cert.pem'), 'utf-8')
    );

    // Inject Organization info if not present (passport-saml might not add it by default)
    // This is a basic string replacement for demo purposes. In prod, use xmlbuilder.
    if (!metadata.includes('Organization')) {
        const orgXml = `
   <md:Organization>
       <md:OrganizationName xml:lang="it">Dipartimento Protezione Civile</md:OrganizationName>
       <md:OrganizationDisplayName xml:lang="it">Dipartimento Protezione Civile</md:OrganizationDisplayName>
       <md:OrganizationURL xml:lang="it">https://www.protezionecivile.gov.it</md:OrganizationURL>
   </md:Organization>
   <md:ContactPerson contactType="technical">
       <md:Company>Protezione Civile</md:Company>
       <md:GivenName>Responsabile</md:GivenName>
       <md:SurName>Tecnico</md:SurName>
       <md:EmailAddress>tech@protezionecivile.local</md:EmailAddress>
   </md:ContactPerson>`;

        metadata = metadata.replace('</md:SPSSODescriptor>', `</md:SPSSODescriptor>${orgXml}`);
    }

    res.send(metadata);
});

module.exports = router;
