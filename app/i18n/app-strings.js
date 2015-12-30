appCivistApp.config(function ($translateProvider) {
    //English strings
    $translateProvider.translations('en', {
        MAIN_TITLE: 'AppCivist is a platform for democratic assembly and collective action.',
        APPCIVIST_STRING: 'AppCivist',
        LOG_IN: 'Log In',
        SIGN_UP: 'Sign Up',
        FOOTER_FIRST_LINE: 'By the Social Apps Lab at UC Berkeley',
        FOOTER_SECOND_LINE: 'In partnership with the MiMove Team at INRIA, France'
        //FOOTER_FIRST_LINE: 'By the <a href="http://socialappslab.org/">Social Apps Lab</a> at UC Berkeley',
        //FOOTER_SECOND_LINE: 'In partnership with the "<a href="https://mimove.inria.fr/">MiMove Team</a>" at "<a href="http://www.inria.fr/">INRIA</a>", France'
    });

    //French strings
    $translateProvider.translations('fr', {
    });

    //Spanish strings
    $translateProvider.translations('es', {
    });

    $translateProvider.preferredLanguage('en');
});