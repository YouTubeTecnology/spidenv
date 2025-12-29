const fs = require('fs');
const path = require('path');

// Load AgID Compliant Certificates
// In production (Render), we can pass the key content via Env Var to avoid committing secrets
const loadKey = (envVar, filePath) => {
    if (process.env[envVar]) {
        // Handle potential newlines in env vars (often escaped as \n)
        return process.env[envVar].replace(/\\n/g, '\n');
    }
    if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, 'utf-8');
    }
    return ''; // Return empty or handle error
};

const privateKey = loadKey('SPID_PRIVATE_KEY', path.join(__dirname, '../certs/spid-agid-private.key'));
const spCert = loadKey('SPID_PUBLIC_CERT', path.join(__dirname, '../certs/spid-agid-cert.pem'));

// Configuration for passport-saml
module.exports = {
    // URL-IdP usually looks like: https://hostname/sso
    entryPoint: process.env.SPID_IDP_ENTRYPOINT || 'https://spid-testenv2:8088/sso',
    issuer: process.env.SPID_ISSUER || (process.env.BASE_URL ? process.env.BASE_URL : 'https://spid-gateway.protezionecivile.local'),
    callbackUrl: (process.env.BASE_URL || 'https://localhost:3000') + '/acs',


    // Certificates
    privateKey: privateKey,
    decryptionPvk: privateKey,
    cert: spCert, // Validator Public Cert - Using SP cert as placeholder to pass library validation

    // SPID Specifics
    identifierFormat: 'urn:oasis:names:tc:SAML:2.0:nameid-format:transient',
    authnContext: ['https://www.spid.gov.it/SpidL2'],
    acceptedClockSkewMs: 2000,

    // Signature & Binding
    signatureAlgorithm: 'sha256',
    digestAlgorithm: 'sha256',
    authnRequestBinding: 'HTTP-Redirect', // Force Redirect binding for authn requests
    forceAuthn: true,
    skipRequestCompression: false, // SPID usually expects Deflate
    racComparison: 'minimum',
};
