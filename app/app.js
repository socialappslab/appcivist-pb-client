/// AppCivist Simple Demo Client
/**
 * AppCivist Platform Demo Client developed with AngularJS
 * Folders: 
 * 	/app
 * 		/controllers
 * 		/directives
 * 		/services
 * 		/partials
 * 		/views
 */

console.log("Welcome to AppCivist!");

var dependencies = [ 'ngRoute', 'ui.bootstrap', 'ngResource',  'LocalStorageModule', 'ngFileUpload', 'angularMoment', 'angularSpinner'];
var appCivistApp = angular.module('appCivistApp', dependencies);
//var appCivistCoreBaseURL = "https://appcivist-pb.herokuapp.com/";
var appCivistCoreBaseURL = "http://localhost:9000/api";
var etherpadServerURL = "http://etherpad.littlemacondo.com/";
var helpInfo = {
    assemblyDefinition : "Assemblies are group of citizens with common interests",
    locationTooltip : "Can be the name of a specific place, address, city or country associated with your assembly",
    targetAudienceTooltip : "Describe who you want to participate",
    supportedMembershipRegistrationTooltip : "Members can be invited or request to join the assembly, or both.",
    moderatorsTooltip: "Moderators are assembly members empowered to delete inappropriate content. AppCivist recommends that assemblies have at least two. An alternative is to allow all members to be moderators. In both cases at least two moderators must agree.",
    coordinatorsTooltip: "Coordinators are assembly members empowered to change settings",
    invitationsTooltip: "Add one or more email addresses of people you want to invite, separated by comma, then click add to list",
    invitationsEmailTooltip: "Each invitee will receive the following email",
    listedAssemblyTooltip: "If true, the 'profile' of the assembly will be searchable and public",
    campaignDefinition: "Campaigns are initiatives that the assembly undertakes to achieve a specific goal. Each campaign has its own template that structures its components, working groups, and timeline.",
    campaignTemplateTooltip: "The campaign template determines an initial configuration of the proposal development components. Linking to another campaign will bring that campaign's configuration"
};

/**
 * AngularJS initial configurations: 
 * - Routes
 * - Libraries specifics (e.g., local storage, resource provider, etc.)
 */
appCivistApp.config(function($routeProvider, $resourceProvider, $httpProvider, $sceDelegateProvider, localStorageServiceProvider) {

    // Added to whilelist the etherpad server
    $sceDelegateProvider.resourceUrlWhitelist([
        // Allow same origin resource loads.
        'self',
        // Allow loading from our assets domain.  Notice the difference between * and **.
        etherpadServerURL+'**'
    ]);

    $httpProvider.defaults.useXDomain = true;
    delete $httpProvider.defaults.headers.common["X-Requested-With"];

    localStorageServiceProvider
        .setPrefix('appcivist')
            .setStorageType('sessionStorage')
        //.set("appcivist_api_base_url",appCivistCoreBaseURL)
        .setNotify(true,true);

    $routeProvider
		.when('/', {
			controller : 'MainCtrl',
			templateUrl : '/app/partials/main.html'
		})
		.when('/home',{
            controller: 'HomeCtrl',
            templateUrl: 'app/partials/home/home.html',
            activetab: 'home'
        })
        .when('/assemblies',{
            controller: 'AssemblyListCtrl',
            templateUrl: 'app/partials/assemblies/assemblies.html',
            activetab: 'assemblies'
        })
        .when('/assembly/create',{
            controller: 'NewAssemblyCtrl',
            templateUrl: 'app/partials/assembly/newAssembly.html'

        })
        .when('/assembly/:aid/campaign/create',{
            controller: "CreateCampaignCtrl",
            templateUrl: 'app/partials/campaign/creation/newCampaign.html'
        })
        .when('/campaign/create/step2',{
            templateUrl: 'app/partials/campaign/creation/campaignPartTwo.html'

        })
        .when('/campaign/create/step3',{
            templateUrl: 'app/partials/campaign/creation/campaignPartThree.html'

        })
        .when('/campaign/create/step4',{
            templateUrl: 'app/partials/campaign/creation/campaignPartFour.html'

        })
        .when('/campaign/create/step5',{
            templateUrl: 'app/partials/campaign/creation/campaignPartFive.html'

        })
        .when('/assembly/:aid/forum',{
            controller: 'AssemblyCtrl',
            templateUrl: 'app/partials/forum/forum.html'
        })
        //.when('/campaign/:aid',{
        //    controller: 'CampaignComponentCtrl',
        //    templateUrl: 'app/partials/campaign/component/campaignComponent.html'
        //})
        .when('/campaign/:aid/pmaking/wgroups',{
            controller: 'CampaignComponentCtrl',
            templateUrl: 'app/partials/campaign/pmaking/campaignPmakingWorkingGroups.html'
        })
        .when('/campaign/:aid/pmaking/wgroups/new',{
            controller: 'CampaignComponentCtrl',
            templateUrl: 'app/partials/campaign/pmaking/wGroups/campaignWorkingGroups.html'
        })
        .when('/campaign/:aid/pmaking/wgroups/forum',{
            controller: 'CampaignComponentCtrl',
            templateUrl: 'app/partials/campaign/pmaking/campaignPmakingWorkingGroups.html'
        })
        .when('/campaign/:aid/wgroup/create',{
            controller: 'CampaignComponentCtrl',
            templateUrl: 'app/partials/contributions/newWorkingGroup/newWorkingGroup.html'
        })
        .when('/assembly/:aid/campaign/:cid/:ciid/:mid',{
            controller: 'CampaignComponentCtrl',
            templateUrl: 'app/partials/campaign/component/campaignComponent.html'
        })
        .when('/assembly/:aid/campaign/:cid',{
            controller: 'CampaignComponentCtrl',
            templateUrl: 'app/partials/campaign/component/campaignComponent.html'
        })
        .when('/assembly/:aid/campaign/:cid/:ciid',{
            controller: 'CampaignComponentCtrl',
            templateUrl: 'app/partials/campaign/component/campaignComponent.html'
        })
        .when('/assembly/:aid/campaign/:cid/:ciid/:mid/:coid',{
            controller: 'ContributionReadEditCtrl',
            templateUrl: 'app/partials/contributions/contribution/contributionPage.html'
        })
        .when('/assembly/:aid/group/:wid',{
            controller: 'ContributionReadEditCtrl',
            templateUrl: 'app/partials/wGroupForum/wGroupForum.html'
        })
        .otherwise({
			redirectTo : '/'
		});

    $httpProvider.interceptors.push(['$q', '$location', 'localStorageService', function($q, $location, localStorageService) {
        return {
            'request': function (config) {
                config.headers = config.headers || {};
                var sessionKey = localStorageService.get('sessionKey');
                if (sessionKey) {
                    config.headers.SESSION_KEY = '' + sessionKey;
                }
                else{
                    $location.path('/');
                }
                return config;
            },
            'responseError': function(response) {
                if(response.status === 401 || response.status === 403) {
                    $location.path('/');
                }
                return $q.reject(response);
            }
        };
    }]);
});
