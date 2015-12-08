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

var dependencies = [ 'ngRoute', 'ui.bootstrap', 'ngResource', 'ngMessages', 'LocalStorageModule', 'ngFileUpload',
    'angularMoment', 'angularSpinner', 'angularMultiSlider', 'ngmodel.format'];
var appCivistApp = angular.module('appCivistApp', dependencies);
//var appCivistCoreBaseURL = "http://localhost:9000/api";
// Uncomment the previous line and comment the following to use the local API Server if you have it running
var appCivistCoreBaseURL = "http://appcivist.littlemacondo.com/backend/api";
var etherpadServerURL = "http://etherpad.littlemacondo.com/";
var helpInfo = {
    assemblyDefinition : "Assemblies are group of citizens with common interests",
    locationTooltip : "Can be the name of a specific place, address, city or country associated with your assembly",
    targetAudienceTooltip : "Describe who you want to participate",
    supportedMembershipRegistrationTooltip : "Members can be invited or request to join the assembly, or both.",
    moderatorsTooltip: "Moderators are assembly members empowered to delete inappropriate content. AppCivist " +
        "recommends that assemblies have at least two. An alternative is to allow all members to be moderators. In both " +
        "cases at least two moderators must agree.",
    coordinatorsTooltip: "Coordinators are assembly members empowered to change settings",
    invitationsTooltip: "Add one or more email addresses of people you want to invite, separated by comma, then click " +
        "add to list",
    invitationsEmailTooltip: "Each invitee will receive the following email",
    listedAssemblyTooltip: "If true, the 'profile' of the assembly will be searchable and public",
    campaignDefinition: "Campaigns are initiatives that the assembly undertakes to achieve a specific goal. Each " +
        "campaign has its own template that structures its components, working groups, and timeline.",
    campaignTemplateTooltip: "The campaign template determines an initial configuration of the proposal development " +
        "components. Linking to another campaign will bring that campaign's configuration",
    campaignFastrackTooltip: "Fastrack creation of a campaign will use default values for each phase of the " +
        "campaign (e.g., default dates and durations for each phase, default values for each phases specific " +
        "configurations, etc.)",
    proposalTimeline: "Click on the phase name to activate or deactivate the phases you wish to include in your " +
        "campaign. Phases shown as disabled take place in the linked campaign.",
    campaignTimeframeTooltip: "Select a period of time to represent in the timeline below.",
    componentContributionTemplateTooltip: "A proposal template is the list of sections (with its descriptions) that " +
        "are used to initialized proposal drafts"
};

/**
 * AngularJS initial configurations: 
 * - Routes
 * - Libraries specifics (e.g., local storage, resource provider, etc.)
 */
appCivistApp.config(config);
appCivistApp.run(run);

config.$inject = ['$routeProvider', '$locationProvider', '$resourceProvider', '$httpProvider', '$sceDelegateProvider',
    'localStorageServiceProvider'];
function config($routeProvider, $locationProvider, $resourceProvider, $httpProvider, $sceDelegateProvider,
         localStorageServiceProvider) {

    // Added to whilelist the etherpad server
    $sceDelegateProvider.resourceUrlWhitelist([
        // Allow same origin resource loads.
        'self',
        // Allow loading from our assets domain.  Notice the difference between * and **.
        etherpadServerURL+'**'
    ]);

    // Setup CORS requests
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
        .when('/assembly/create?:userIsNew',{
            controller: 'NewAssemblyCtrl',
            templateUrl: 'app/partials/assembly/newAssembly.html'
        })
        .when('/assembly/:aid/campaign/create',{
            controller: "CreateCampaignCtrl",
            templateUrl: 'app/partials/campaign/creation/newCampaign.html'
        })
        .when('/assembly/:aid/forum',{
            controller: 'AssemblyCtrl',
            templateUrl: 'app/partials/forum/forum.html'
        })
        // TODO Check the following 3
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
        // TODO: This should be /assembly/:aid/campaign/:cid/wgroup/create
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
        .when('/voting/:uuid/ballotlanding',{
            controller: 'VotingLandingCtrl',
            templateUrl: 'app/partials/voting/landing/votingBallotLanding.html'
        })
        .when('/voting/:uuid/rangevoting',{
            controller: 'RangeVotingCtrl',
            templateUrl: 'app/partials/voting/vote/RangeVoting.html'
        })
        .when('/voting/:uuid/rangeresult',{
            controller: 'RangeResultCtrl',
            templateUrl: 'app/partials/voting/result/RangeResult.html'
        })
        .when('/voting/:uuid/registration',{
            controller: 'RegistrationForm',
            templateUrl: 'app/partials/voting/RegistrationForm.html'
        })
        //Define a route that has a route parameter in it (:customerID)
        //.when('/assembly/:assemblyID/campaign/:campaignId',
        //{
        //  controller: 'AssemblyController',
        //  templateUrl: '/app/partials/assemblyCampaignView.html'
        //})
        .when('/assembly/:aid/campaign/:cid/:ciid/:mid/:coid',{
            controller: 'ContributionReadEditCtrl',
            templateUrl: 'app/partials/contributions/contribution/contributionPage.html'
        })
        .when('/assembly/:aid/group/:wid',{
            controller: 'WorkingGroupCtrl',
            templateUrl: 'app/partials/wGroupForum/wGroupForum.html'
        })
        // TODO: remove the following
        .when('/campaign/:aid/temp',{
            controller: 'CampaignCtrl',
            templateUrl: 'app/partials/campaign/pmaking/campaignPmakingDrafts.html'
        })
        // TODO: finalize voting UIs
        .when('/ballot/:uuid/summary',{
            controller: 'RangeSummaryCtrl',
            templateUrl: 'app/partials/voting/summary/rangeVotingSummary.html'
        })
        .when('/campaign/:aid/temp3',{
            controller: 'RangeResultCtrl',
            templateUrl: 'app/partials/voting/result/RangeResult.html'
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
                //else{
                //    if (!pathIsNotRestricted($location.path()))
                //        $location.path('/');
                //}
                return config;
            },
            'responseError': function(response) {
                //if(response.status === 401 || response.status === 403) {
                //    $location.path('/');
                //}
                return $q.reject(response);
            }
        };
    }]);

}

run.$inject = ['$rootScope', '$location', '$http', 'localStorageService', 'loginService'];
function run($rootScope, $location, $http, localStorageService) {
    //// keep user logged in after page refresh
    //$rootScope.globals = $cookieStore.get('globals') || {};
    //if ($rootScope.globals.currentUser) {
    //    $http.defaults.headers.common['Authorization'] = 'Basic ' + $rootScope.globals.currentUser.authdata; // jshint ignore:line
    //}

    $rootScope.$on('$locationChangeStart', function (event, next, current) {
        // redirect to login page if not logged in and trying to access a restricted page

        //var nonRestrictedPage = $.inArray($location.path(), ['/assembly', '/register']) === -1;
        var nonRestrictedPage = pathIsNotRestricted($location.path());
        var authenticated = localStorageService.get('authenticated');
        var sessionKey = localStorageService.get('sessionKey');
        var user = localStorageService.get("user");

        if (!nonRestrictedPage && !authenticated
            && (sessionKey === null || sessionKey === undefined || sessionKey === "" )
            && (user === null || user === undefined)) {
            $location.path('/');
        }
    });
}

function pathIsNotRestricted(path) {
    //var allowedPaths = /\/assembly\/[0-9]*\/create/g;
    var allowedPaths = "/assembly/create"
    var pathMatches = path.match(allowedPaths);
    var result = pathMatches != undefined && pathMatches.length > 0;
    if (result) {
        console.log("Requested path '"+path+"' is not restricted");
    }
    return result;
}
