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

/**
 * AngularJS initial configurations: 
 * - Routes
 * - Libraries specifics (e.g., local storage, resource provider, etc.)
 */
appCivistApp.config(function($routeProvider, $resourceProvider, $httpProvider, localStorageServiceProvider) {

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
        .when('/assembly/create/step1',{
            templateUrl: 'app/partials/assembly/assemblyPartOne.html'

        })
        .when('/assembly/create/step2',{
            controller: 'AssemblyListCtrl',
            templateUrl: 'app/partials/assembly/assemblyPartTwo.html'

        })
        .when('/assembly/create/step3',{
            controller: 'AssemblyListCtrl',
            templateUrl: 'app/partials/assembly/assemblyPartThree.html'

        })
        .when('/campaign/create/step1',{
            templateUrl: 'app/partials/campaign/creation/campaignPartOne.html'

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
        .when('/campaign/:aid',{
            controller: 'CampaignCtrl',
            templateUrl: 'app/partials/campaign/pmaking/campaignPmakingBrainstorming.html'
        })
        .when('/campaign/:aid/pmaking/wgroups',{
            controller: 'CampaignCtrl',
            templateUrl: 'app/partials/campaign/pmaking/campaignPmakingWorkingGroups.html'
        })
        .when('/campaign/:aid/pmaking/wgroups/new',{
            controller: 'CampaignCtrl',
            templateUrl: 'app/partials/campaign/pmaking/wGroups/campaignWorkingGroups.html'
        })
        .when('/campaign/:aid/pmaking/wgroups/forum',{
            controller: 'CampaignCtrl',
            templateUrl: 'app/partials/campaign/pmaking/campaignPmakingWorkingGroups.html'
        })
        .when('/assembly/:aid/campaign/:cid/:ciid/:mid',{
            controller: 'CampaignComponentCtrl',
            templateUrl: 'app/partials/campaign/component/campaignComponent.html'
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
