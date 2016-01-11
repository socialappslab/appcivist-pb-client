appCivistApp.config(function ($translateProvider) {
    //English strings
    $translateProvider.translations('en', {

        // Landing Page Strings
        "landing.tagline": "AppCivist is a platform for democratic assembly and collective action.",
        "landing.Learn more": "How it works",
        "landing.goal": "AppCivist lets users design and build their own Assemblies with modular components to organize democratic action.",
        "landing.goal.assembly": "CREATE OR JOIN AN ASSEMBLY",
        "landing.goal.campaign": "CREATE A CAMPAIGN",
        "landing.goal.proposal": "SUBMIT AND EVALUATE PROPOSALS",
        "definition.assembly":"Assemblies are groups of people with shared concerns, like neighborhood safety or city budgets, and who want to become organized for taking action.",
        "definition.campaign":"Campaigns are initiatives that an assembly undertake to achieve a specific goal.",
        "definition.proposal.development":"Assembly members organize in Working Groups to brainstorm, develop and democratically select proposals for collective action.",
        "landing.section2.button": "AppCivist for Participatory Budgeting",
        "landing.section3.title" : "The Participatory Budgeting Campaign",
        "landing.section3.desc" : "AppCivist is designed to support assemblies in a bottom-up process of collaborative development and selection of proposals. This process is ideal for participatory budgeting campaigns and it consists of the following four main stages, each with its distinctive milestones.",
        "landing.component.Proposal Making" : "PROPOSAL MAKING",
        "landing.component.Proposal Making.Brainstorming" : "Brainstorming",
        "landing.component.Proposal Making.Forming working groups" : "Forming working groups",
        "landing.component.Proposal Making.Drafting proposals" : "Drafting proposals",
        "landing.component.Versioning" : "VERSIONING",
        "landing.component.Versioning.Proposal editing" : "Proposal Editing",
        "landing.component.Versioning.Proposal merging/splitting" : "Proposal merging/splitting",
        "landing.component.Versioning.Proposal selection within groups" : "Proposal selection within groups",
        "landing.component.Deliberation" : "DELIBERATION",
        "landing.component.Deliberation.Open discussion" : "Open discussion",
        "landing.component.Deliberation.Technical assessment" : "Technical assessment",
        "landing.component.Voting" : "VOTING",
        "landing.component.Voting.Final selection" : "Final selection",
        "landing.section3.button": "Other features",
        "landing.section4.title": "Customizable tools for democratic action",



        // Header and Footer Strings
        "header.sign_in": "Log In",
        "header.sign_up": "Sign Up",
        "header.sign_up_group": "Group Sign Up",
        "header.sign_up_individual": "Individual Sign Up",
        "header.sign_out": "Sign Out",
        "header.Forgot password": "Forgot Password?",
        "footer.text": "Created by the <a href='http://socialappslab.org/'>Social Apps Lab</a> at CITRIS, University of California, Berkeley.<br/> 2015-2016 &copy; Regents of the University of California <br/> In partnership with the <a href='https://mimove.inria.fr/'>MiMove Team</a> at <a href='http://www.inria.fr/'>INRIA</a>, France.",
        "footer.text.dev": "[DEV] Change Backend Server: Currently Using ",

        // User Menus
        "header.menu.Send message": "Send message",
        "header.menu.Profile": "Profile",
        "header.menu.Settings": "Settings",
        "header.menu.Notification": "Notification",
        "header.menu.Notifications": "Notifications",

        // AppCivist Common Strings
        "appcivist": "AppCivist",
        "Home" : "Home",
        "Assembly": "Assembly",
        "Assemblies": "Assemblies",
        "Campaign": "Campaign",
        "Campaigns": "Campaigns",
        "WorkingGroup": "Working Group",
        "WorkingGroups": "Working Groups",
        "WorkingGroupDefinition": "Working groups develop campaigns by taking speCciofincsaeicltBioenllesv,islleuch as drafting proposals and organizing events.",
        "Contribution": "Contribution",
        "Contributions": "Contributions",
        "Proposal": "Proposal",
        "Proposals": "Proposals",
        "ProposalDraft": "Proposal Draft",
        "ProposalDrafts": "Proposal Drafts",
        "Idea": "Idea",
        "Ideas": "Ideas"
    });

    //French strings
    $translateProvider.translations('fr', {
    });

    //Spanish strings
    $translateProvider.translations('es', {
    });

    $translateProvider.preferredLanguage('en');
});