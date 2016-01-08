appCivistApp.config(function ($translateProvider) {
    //English strings
    $translateProvider.translations('en', {
        MAIN_TITLE: 'AppCivist is a platform for democratic assembly and collective action.',
        APPCIVIST_STRING: 'AppCivist',
        LOG_IN: 'Log In',
        SIGN_UP: 'Sign Up',
        FOOTER_TEXT: 'Created by the <a href="http://socialappslab.org/">Social Apps Lab</a> at CITRIS, University of California, Berkeley.<br/> 2015-2016 &copy; Regents of the University of California <br/> In partnership with the <a href="https://mimove.inria.fr/">MiMove Team</a> at <a href="http://www.inria.fr/">INRIA</a>, France.',
        FOOTER_TEXT_DEV: '[DEV] Change Backend Server: Currently Using '
    });

    //French strings
    $translateProvider.translations('fr', {
    });

    //Spanish strings
    $translateProvider.translations('es', {
    });

    $translateProvider.preferredLanguage('en');
});