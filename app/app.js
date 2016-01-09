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
    'angularMoment', 'angularSpinner', 'angularMultiSlider', 'ngmodel.format', 'pascalprecht.translate'];
var appCivistApp = angular.module('appCivistApp', dependencies);

var backendServers = {
  "localDev" : "http://localhost:9000/api",
  "remoteDev" : "http://appcivist.littlemacondo.com/backend/api",
  "voting": "http://127.0.0.1:5000/api/v0"
};

//var appCivistCoreBaseURL = backendServers.localDev;;
// Uncomment the previous line and comment the following to use the local API Server if you have it running
var appCivistCoreBaseURL = backendServers.remoteDev;
var votingApiURL = backendServers.voting;

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

/**
 * Dependencies needed during configuration of the App
 * @type {string[]}
 */
config.$inject = ['$routeProvider', '$locationProvider', '$resourceProvider', '$httpProvider', '$sceDelegateProvider',
    'localStorageServiceProvider'];

/**
 * Configuration of the app, executed before everything else.
 * @param $routeProvider
 * @param $locationProvider
 * @param $resourceProvider
 * @param $httpProvider
 * @param $sceDelegateProvider
 * @param localStorageServiceProvider
 */
function config($routeProvider, $locationProvider, $resourceProvider, $httpProvider, $sceDelegateProvider,
         localStorageServiceProvider) {

    // Whilelist of external domains/URLs allowed to be queried (e.g., the etherpad server)
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
        .setNotify(true,true);

    /**
     * Main routes available in the APP. Each route has its onw controller, which allows the user to
     * simply write down the route and if that's available, it will load everything needed.
     */
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
        // TODO: This should be /assembly/:aid/campaign/:cid/wgroup/create
        .when('/assembly/:aid/campaign/:cid/wgroup/create',{
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
            controller: 'ContributionPageCtrl',
            templateUrl: 'app/partials/contributions/contribution/contributionPage.html'
        })
        .when('/assembly/:aid/group/:wid',{
            controller: 'WorkingGroupCtrl',
            templateUrl: 'app/partials/wGroupForum/wGroupForum.html'
        })
        // TODO: This should be /assembly/:aid/campaign/:cid/wgroup/create
        .when('/assembly/:aid/campaign/:cid/wgroup/create',{
            controller: 'NewWorkingGroupCtrl',
            templateUrl: 'app/partials/contributions/newWorkingGroup/newWorkingGroup.html'
        })

        // TODO: finalize voting UIs s
        .when('/ballot/',{ // TODO: this redirect is just temporal
            redirectTo: '/ballot/abcd-efgh-ijkl-mnop/register'
        })

        // TODO: finalize voting UIs
        .when('/ballot/:uuid/start',{
          controller: 'ballotStartCtrl',
          templateUrl: 'public/ballot/start.html'
        })
        .when('/ballot/:uuid/register',{
          controller: 'ballotRegisterCtrl',
          templateUrl: 'public/ballot/register.html'
        })
        .when('/ballot/:uuid/vote',{
          controller: 'ballotVoteCtrl',
          templateUrl: 'public/ballot/vote.html'
        })
        .when('/ballot/:uuid/summary',{
          controller: 'ballotVoteSummaryCtrl',
          templateUrl: 'public/ballot/summary.html'
        })
        .when('/ballot/:uuid/result',{
          controller: 'ballotResultCtrl',
          templateUrl: 'public/ballot/result.html'
        })
        .otherwise({
            redirectTo : '/'
        });

    /**
     * HTTP Interceptor that makes sure that all HTTP requests have the session key inserted as HEADER
     */
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

/**
 * Services that are injected to the main method of the app to make them available when it starts running
 * @type {string[]}
 */
run.$inject = ['$rootScope', '$location', '$http', 'localStorageService', 'loginService'];

/**
 * The function that runs the App on the browser
 * @param $rootScope
 * @param $location
 * @param $http
 * @param localStorageService
 */
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

/**
 * Special function to configure a list of URLs inside the APP that will be available even without being
 * logged in our having an account.
 * @param path
 * @returns {boolean}
 */
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
