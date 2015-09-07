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

var dependencies = [ 'ngRoute', 'ui.bootstrap', 'ngResource',  'LocalStorageModule'];
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
            //controller: 'AssemblyListCtrl',
            templateUrl: 'app/partials/home/home.html'
        })
        .when('/assemblies',{
            controller: 'AssemblyListCtrl',
            templateUrl: 'app/partials/assemblies/assemblies.html'
        })
        .when('/assembly/create/step1',{
            controller: 'AssemblyListCtrl',
            templateUrl: 'app/partials/assembly/assemblyPartOne.html'

        })
        .when('/assembly/create/step2',{
            controller: 'AssemblyListCtrl',
            templateUrl: 'app/partials/assembly/assemblyPartTwo.html'

        })
        .when('/campaign/create/step1',{
            controller: 'CreateCampaignCtrl',
            templateUrl: 'app/partials/campaign/creation/campaignPartOne.html'

        })
        .when('/campaign/create/step2',{
            controller: 'CreateCampaignCtrl',
            templateUrl: 'app/partials/campaign/creation/campaignPartTwo.html'

        })
        .when('/assembly/:aid/forum',{
            controller: 'AssemblyCtrl',
            templateUrl: 'app/partials/forum/forum.html'
        })
        .when('/campaign/:aid',{
            controller: 'CampaignCtrl',
            templateUrl: 'app/partials/campaign/pmaking/campaignPmakingBrainstorming.html'
        })
        //Define a route that has a route parameter in it (:customerID)
        //.when('/assembly/:assemblyID/campaign/:campaignId',
        //{
        //  controller: 'AssemblyController',
        //  templateUrl: '/app/partials/assemblyCampaignView.html'
        //})
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
