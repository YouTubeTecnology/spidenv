module.exports = {
    discovery_url: process.env.CIE_DISCOVERY_URL || 'https://cie-provider.example.com/.well-known/openid-configuration',
    client_id: process.env.CIE_CLIENT_ID || 'your_cie_client_id',
    client_secret: process.env.CIE_CLIENT_SECRET || 'your_cie_client_secret',
    redirect_uris: [(process.env.BASE_URL || 'https://localhost:3000') + '/callback'],
    response_type: 'code',
    scope: 'openid profile email',
    acr_values: 'https://www.spid.gov.it/SpidL2' // CIE Levels map similarly to SPID
};
