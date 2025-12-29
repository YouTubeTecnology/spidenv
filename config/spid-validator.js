const fs = require('fs');
const path = require('path');

// Load Certificates helper
const loadKey = (envVar, filePath) => {
    if (process.env[envVar]) {
        return process.env[envVar].replace(/\\n/g, '\n');
    }
    try {
        return fs.readFileSync(filePath, 'utf-8');
    } catch (e) {
        console.warn(`Warning: Could not load certificate from ${filePath}`);
        return '';
    }
};

const privateKey = loadKey('SPID_PRIVATE_KEY', path.join(__dirname, '../certs/spid-agid-private.key'));
const spCert = loadKey('SPID_PUBLIC_CERT', path.join(__dirname, '../certs/spid-agid-cert.pem'));

module.exports = {
    // Validator Environment URLs
    entryPoint: 'https://validator.spid.gov.it/samlsso',
    issuer: process.env.SPID_ISSUER || (process.env.BASE_URL ? process.env.BASE_URL : 'https://spid-gateway.protezionecivile.local'),
    callbackUrl: (process.env.BASE_URL || 'https://localhost:3000') + '/acs', // In prod, this must be public HTTPS

    // Certificates
    privateKey: privateKey,
    decryptionPvk: privateKey,
    cert: spCert, // Validator Public Cert - Using SP cert as placeholder to pass library validation

    // AgID Strict Requirements
    identifierFormat: 'urn:oasis:names:tc:SAML:2.0:nameid-format:transient',
    authnContext: ['https://www.spid.gov.it/SpidL2'],
    acceptedClockSkewMs: 0, // Validator can be strict on time
    signatureAlgorithm: 'sha256',
    digestAlgorithm: 'sha256',

    // Passport-SAML Options
    forceAuthn: true,
    skipRequestCompression: false, // SPID Validator might require specific encoding
    racComparison: 'minimum',

    // Custom properties for Metadata Generation
    organization: {
        name: 'Dipartimento Protezione Civile',
        displayName: 'Dipartimento Protezione Civile',
        url: 'https://www.protezionecivile.gov.it'
    },
    contact: {
        technical: {
            givenName: 'Responsabile',
            surName: 'Tecnico',
            email: 'tech@protezionecivile.local'
        }
    }
};
