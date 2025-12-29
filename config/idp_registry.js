module.exports = {
    'posteid': {
        entityId: 'https://posteid.poste.it',
        entryPoint: 'https://posteid.poste.it/jod-fs/ssoservicepost',
        logoutUrl: 'https://posteid.poste.it/jod-fs/sloservicepost',
        displayName: 'Poste ID',
        // In fully compliant apps, you would load the individual certs here
        // cert: fs.readFileSync('certs/posteid.pem') 
    },
    'arubaid': {
        entityId: 'https://loginspid.aruba.it',
        entryPoint: 'https://loginspid.aruba.it/ServiceLoginWelcome',
        logoutUrl: 'https://loginspid.aruba.it/ServiceLogoutRequest',
        displayName: 'Aruba ID'
    },
    'infocertid': {
        entityId: 'https://identity.infocert.it',
        entryPoint: 'https://identity.infocert.it/spid/samlsso',
        logoutUrl: 'https://identity.infocert.it/spid/samlslo',
        displayName: 'InfoCert ID'
    },
    'intesaid': {
        entityId: 'https://spid.intesa.it',
        entryPoint: 'https://spid.intesa.it/webservices/idp/sso',
        logoutUrl: 'https://spid.intesa.it/webservices/idp/slo',
        displayName: 'Intesa ID'
    },
    'namirialid': {
        entityId: 'https://idp.namirialtsp.com/idp',
        entryPoint: 'https://idp.namirialtsp.com/idp/profile/SAML2/Redirect/SSO',
        logoutUrl: 'https://idp.namirialtsp.com/idp/profile/SAML2/Redirect/SLO',
        displayName: 'Namirial ID'
    },
    'registerit': {
        entityId: 'https://spid.register.it',
        entryPoint: 'https://spid.register.it/sso',
        logoutUrl: 'https://spid.register.it/slo',
        displayName: 'SpidItalia Register.it'
    },
    'sielteid': {
        entityId: 'https://identity.sieltecloud.it',
        entryPoint: 'https://identity.sieltecloud.it/simplesaml/saml2/idp/SSOService.php',
        logoutUrl: 'https://identity.sieltecloud.it/simplesaml/saml2/idp/SingleLogoutService.php',
        displayName: 'Sielte ID'
    },
    'timid': {
        entityId: 'https://login.id.tim.it/affwebservices/public/saml2sso',
        entryPoint: 'https://login.id.tim.it/affwebservices/public/saml2sso',
        logoutUrl: 'https://login.id.tim.it/affwebservices/public/saml2slo',
        displayName: 'TIM ID'
    },
    'lepidaid': {
        entityId: 'https://id.lepida.it/idp/shibboleth',
        entryPoint: 'https://id.lepida.it/idp/profile/SAML2/Redirect/SSO',
        logoutUrl: 'https://id.lepida.it/idp/profile/SAML2/Redirect/SLO',
        displayName: 'Lepida ID'
    },
    // Validator for testing
    'validator': {
        entityId: 'https://validator.spid.gov.it',
        entryPoint: 'https://validator.spid.gov.it/samlsso',
        displayName: 'AgID Validator'
    },
    // Local Demo
    'demo': {
        entityId: 'https://spid-testenv2:8088',
        entryPoint: 'https://spid-testenv2:8088/sso',
        displayName: 'Demo Locale'
    }
};
