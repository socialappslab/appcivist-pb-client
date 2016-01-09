appCivistApp.config(function ($translateProvider) {
    //English strings
    $translateProvider.translations('en', {
        // Home, Header and Footer Strings
        TAGLINE: 'AppCivist is a platform for democratic assembly and collective action.',
        APPCIVIST_STRING: 'AppCivist',
        SIGN_IN: 'Log In',
        SIGN_UP: 'Sign Up',
        SIGN_UP_GROUP: 'Group Sign Up',
        SIGN_UP_INDIVIDUAL: 'Individual Sign Up',
        SIGN_UP_GROUP: 'Group Sign Up',
        SIGN_OUT: 'Sign Out',
        FOOTER_TEXT: 'Created by the <a href="http://socialappslab.org/">Social Apps Lab</a> at CITRIS, University of California, Berkeley.<br/> 2015-2016 &copy; Regents of the University of California <br/> In partnership with the <a href="https://mimove.inria.fr/">MiMove Team</a> at <a href="http://www.inria.fr/">INRIA</a>, France.',
        FOOTER_TEXT_DEV: '[DEV] Change Backend Server: Currently Using ',
        ForgotPassword: 'Forgot Password?',
        Home: 'Home',
        LearnMore: 'Learn More',

        // User Menus
        SendMessage: 'Send message',
        Profile: 'Profile',
        Settings: 'Settings',
        Notification: 'Notification',
        Notifications: 'Notifications',

        // AppCivist Concepts
        Assembly: 'Assembly',
        Assemblies: 'Assemblies',
        Campaign: 'Campaign',
        Campaigns: 'Campaigns',
        WorkingGroup: 'Working Group',
        WorkingGroups: 'Working Groups',
        Contribution: 'Contribution',
        Contributions: 'Contributions',
        Proposal: 'Proposal',
        Proposals: 'Proposals',
        ProposalDraft: 'Proposal Draft',
        ProposalDrafts: 'Proposal Drafts',
        Idea: 'Idea',
        Ideas: 'Ideas'
    });

    //French strings
    $translateProvider.translations('fr', {
    });

    //Spanish strings
    $translateProvider.translations('es', {
    });

    $translateProvider.preferredLanguage('en');
});