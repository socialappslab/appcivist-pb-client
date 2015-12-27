appCivistApp.config(function ($translateProvider) {
    //English strings
    $translateProvider.translations('en', {
        MAIN_TITLE: 'AppCivist is a platform for democratic assembly and collective action.'
    });

    //French strings
    $translateProvider.translations('fr', {
    });

    //Spanish strings
    $translateProvider.translations('es', {
    });

    $translateProvider.preferredLanguage('en');
});