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

(function () {
  var dependencies = ['ngRoute', 'ui.bootstrap', 'ngResource', 'ngMessages', 'LocalStorageModule', 'ngFileUpload',
    'angularMoment', 'angularSpinner', 'angularMultiSlider', 'ngmodel.format', 'pascalprecht.translate', 'duScroll',
    'tmh.dynamicLocale', 'ngclipboard', 'ui.router', 'angular-inview', 'ngNotify'];
  var appCivistApp = angular.module('appCivistApp', dependencies);

  var appcivist = {
    api: {
      voting: {
        production: "https://platform.appcivist.org/voting/api/v0",
        testing: "https://testplatform.appcivist.org/voting/api/v0",
        development: "https://devplatform.org/voting/api/v0",
        local: "http://localhost:5000/api/v0"
      },
      core: {
        production: "https://platform.appcivist.org/api",
        testing: "https://testplatform.appcivist.org/backend/api",
        development: "https://devplatform.appcivist-dev.org/api",
        local: "http://localhost:9000/api"
      }
    },
    handleError: function (error) {
      console.log(error);
      if (error.status == 500)
        alert("Something went wrong on our end. Please try again at a later time.");
      else if (error.status == -1 && error.data == null)
        alert("Voting API service is probably not running!")
      else
        alert(error.data.error);
    }
  };

  var etherpad = {
    server: "https://etherpad.appcivist.org/"
  };

  // By default, the backend servers are selected in base of the hostname (e.g., if localhost, development is choose)
  var appCivistCoreBaseURL = selectBackendServer(window.location.hostname, appcivist.api.core);
  var votingApiUrl = selectBackendServer(window.location.hostname, appcivist.api.voting);
  var etherpadServerURL = etherpad.server;
  var hideLogin = (window.location.hostname==="appcivist.org" || window.location.hostname==="www.appcivist.org");

  var helpInfo = {
    assemblyDefinition: "Assemblies are group of citizens with common interests",
    locationTooltip: "Can be the name of a specific place, address, city or country associated with your assembly",
    targetAudienceTooltip: "Describe who you want to participate",
    supportedMembershipRegistrationTooltip: "Members can be invited or request to join the assembly, or both.",
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
    campaignFastrackTooltip: "Fastrack uses default values for each stage of a " +
    "campaign (e.g., default dates and duration, default configuration values)",
    proposalTimeline: "Click on the stage name to activate or deactivate the stages you wish to include in your " +
    "campaign. Stages shown as disabled take place in the linked campaign.",
    campaignTimeframeTooltip: "Select a period of time to represent in the timeline below.",
    componentContributionTemplateTooltip: "A proposal template is the list of sections (with its descriptions) that " +
    "are used to initialized proposal drafts"
  };

  /**
   * AngularJS initial configurations:
   * - Routes
   * - Libraries specifics (e.g., local storage, resource provider, etc.)
   */

  appCivistApp
    .constant('DEBUG_MODE', /*DEBUG_MODE*/true/*DEBUG_MODE*/)
    .constant('VERSION_TAG', /*VERSION_TAG_START*/new Date().getTime()/*VERSION_TAG_END*/)
    .constant('LOCALES', {
      'locales': {
        'en-US': 'English',
        'de-DE': 'Deutsch',
        'es-ES': 'Español',
        'fr-FR': 'Français',
        'it-IT': 'Italiano'
      },
      'preferredLocale': 'en-US'
    });

  appCivistApp.config(config);
  appCivistApp.run(run);

  /**
   * Dependencies needed during configuration of the App
   * @type {string[]}
   */
  config.$inject = ['$routeProvider', '$locationProvider', '$resourceProvider', '$httpProvider', '$sceDelegateProvider',
    'localStorageServiceProvider', '$translateProvider', 'tmhDynamicLocaleProvider', '$stateProvider'];

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
    localStorageServiceProvider, $translateProvider, tmhDynamicLocaleProvider, $stateProvider) {

    /**
     * Whitelist of external domains/URLs allowed to be queried (e.g., the etherpad server)
     */
    $sceDelegateProvider.resourceUrlWhitelist([
      // Allow same origin resource loads.
      'self',
      // Allow loading from our assets domain.  Notice the difference between * and **.
      etherpadServerURL + '**'
    ]);

    /**
     * Setup CORS requests
     */
    $httpProvider.defaults.useXDomain = true;
    delete $httpProvider.defaults.headers.common["X-Requested-With"];
    localStorageServiceProvider
      .setPrefix('appcivist')
      .setStorageType('sessionStorage')
      .setNotify(true, true);


    // temporary new templates integration
    $stateProvider.state('v2', {
      url: '/v2',
      abstract: true,
      templateUrl: 'app/v2/partials/main.html',
      controller: 'v2.MainCtrl'
    })
      .state('v2.assembly', {
        url: '/assembly',
        abstract: true,
        template: '<div ui-view></div>'
      })
      .state('v2.assembly.aid', {
        url: '/:aid',
        abstract: true,
        template: '<div ui-view></div>'
      })
      .state('v2.assembly.aid.campaign', {
        url: '/campaign',
        abstract: true,
        template: '<div ui-view></div>'
      })
      .state('v2.assembly.aid.campaign.cid', {
        url: '/:cid',
        controller: 'v2.CampaignDashboardCtrl',
        templateUrl: 'app/v2/partials/campaign/dashboard.html'
      })
      .state('v2.assembly.aid.group', {
        url: '/group',
        abstract: true,
        template: '<div ui-view></div>'
      })
      .state('v2.assembly.aid.group.gid', {
        url: '/:gid',
        abstract: true,
        template: '<div ui-view></div>'
      })
      .state('v2.assembly.aid.group.gid.item', {
        url: '',
        controller: 'v2.WorkingGroupDashboardCtrl',
        templateUrl: 'app/v2/partials/working-group/dashboard.html'
      })
      .state('v2.assembly.aid.group.gid.proposal', {
        url: '/proposal',
        abstract: true,
        template: '<div ui-view></div>'
      })
      .state('v2.assembly.aid.group.gid.proposal.pid', {
        url: '/:pid',
        templateUrl: 'app/v2/partials/contribution/page.html',
        controller: 'v2.ProposalPageCtrl'
      })
      .state('v2.space', {
        url: '/space',
        template: '<div ui-view></div>',
        abstract: true
      })
      .state('v2.space.sid', {
        url: '/:sid',
        template: '<div ui-view></div>',
        abstract: true
      })
      .state('v2.space.sid.contribution', {
        url: '/contributions?type',
        templateUrl: 'app/v2/partials/contribution/all.html',
        controller: 'v2.ProposalsCtrl'
      })
      .state('v2.campaign', {
        url: '/campaign',
        abstract: true,
        template: '<div ui-view></div>'
      })
      .state('v2.campaign.cuuid', {
        url: '/:cuuid',
        controller: 'v2.CampaignDashboardCtrl',
        templateUrl: 'app/v2/partials/campaign/dashboard.html'
      })
      .state('v2.workingGroup', {
        url: '/group',
        abstract: true,
        template: '<div ui-view></div>'
      })
      .state('v2.workingGroup.gid', {
        url: '/:gid',
        controller: 'v2.WorkingGroupDashboardCtrl',
        templateUrl: 'app/v2/partials/working-group/dashboard.html'
      })
      .state('v2.proposal', {
        url: '/proposal',
        abstract: true,
        template: '<div ui-view></div>'
      })
      .state('v2.proposal.pid', {
        url: '/:pid',
        controller: 'v2.ProposalPageCtrl',
        templateUrl: 'app/v2/partials/proposal/page.html'
      })
      .state('v2.login', {
        url: '/login',
        controller: 'v2.LoginCtrl',
        templateUrl: 'app/v2/partials/login.html'
      })
      .state('v2.user', {
        url: '/user',
        abstract: true,
        template: '<div ui-view></div>'
      })
      .state('v2.user.uid', {
        url: '/:uid',
        abstract: true,
        template: '<div ui-view></div>'
      })
      .state('v2.user.uid.profile', {
        url: '/profile',
        controller: 'v2.ProfileCtrl',
        templateUrl: 'app/v2/partials/user/profile.html'
      });

    /**
     * Main routes available in the APP. Each route has its onw controller, which allows the user to
     * simply write down the route and if that's available, it will load everything needed.
     */
    $routeProvider
      .when('/', {
        controller: 'MainCtrl',
        templateUrl: '/app/partials/main.html'
      })
      .when('/home', {
        controller: 'HomeCtrl',
        templateUrl: 'app/partials/home/home.html',
        activetab: 'home'
      })
      .when('/profile', {
        controller: 'ProfileCtrl',
        templateUrl: 'app/partials/profile/profile.html'
      })
      .when('/assemblies', {
        controller: 'AssemblyListCtrl',
        templateUrl: 'app/partials/assemblies/assemblies.html',
        activetab: 'assemblies'
      })
      .when('/assembly/create', {
        controller: 'NewAssemblyCtrl',
        templateUrl: 'app/partials/assembly/newAssembly.html'
      })
      .when('/assembly/create?:userIsNew', {
        controller: 'NewAssemblyCtrl',
        templateUrl: 'app/partials/assembly/newAssembly.html'
      })
      .when('/assembly/:aid/campaign/create', {
        controller: "CreateCampaignCtrl",
        templateUrl: 'app/partials/campaign/creation/newCampaign.html'
      })
      .when('/assembly/:aid/forum', {
        controller: 'AssemblyCtrl',
        templateUrl: 'app/partials/forum/forum.html'
      })
      // TODO: This should be /assembly/:aid/campaign/:cid/wgroup/create
      .when('/assembly/:aid/campaign/:cid/wgroup/create', {
        controller: 'CampaignComponentCtrl',
        templateUrl: 'app/partials/contributions/newWorkingGroup/newWorkingGroup.html'
      })
      .when('/assembly/:aid/wgroup/create', {
        controller: 'NewWorkingGroupCtrl',
        templateUrl: 'app/partials/contributions/newWorkingGroup/newWorkingGroup.html'
      })
      .when('/assembly/:aid/campaign/:cid/contribution/:coid', {
        controller: 'ContributionPageCtrl',
        templateUrl: 'app/partials/contributions/contribution/contributionPage.html'
      })
      .when('/assembly/:aid/campaign/:cid/:ciid/:mid', {
        controller: 'CampaignComponentCtrl',
        templateUrl: 'app/partials/campaign/component/campaignComponent.html'
      })
      .when('/assembly/:aid/campaign/:cid', {
        controller: 'CampaignComponentCtrl',
        templateUrl: 'app/partials/campaign/component/campaignComponent.html'
      })
      .when('/assembly/:aid/campaign/:cid/edit', { //edit
        controller: "EditCampaignCtrl",
        templateUrl: 'app/partials/campaign/edit/editCampaign.html'
      })
      .when('/assembly/:aid/campaign/:cid/:ciid', {
        controller: 'CampaignComponentCtrl',
        templateUrl: 'app/partials/campaign/component/campaignComponent.html'
      })
      .when('/assembly/:aid/group/:wid', {
        controller: 'WorkingGroupCtrl',
        templateUrl: 'app/partials/wGroupForum/wGroupForum.html'
      })
      // TODO: This should be /assembly/:aid/campaign/:cid/wgroup/create
      .when('/assembly/:aid/campaign/:cid/wgroup/create', {
        controller: 'NewWorkingGroupCtrl',
        templateUrl: 'app/partials/contributions/newWorkingGroup/newWorkingGroup.html'
      })
      // TODO: finalize voting UIs #Issue #231
      .when('/ballot/:uuid', {
        redirectTo: '/ballot/:uuid/start'
      })
      .when('/ballot/:uuid/start', {
        controller: 'ballotStartCtrl',
        templateUrl: 'public/ballot/start.html'
      })
      .when('/ballot/:uuid/register', {
        controller: 'ballotRegisterCtrl',
        templateUrl: 'public/ballot/register.html'
      })
      .when('/ballot/:uuid/success', {
        controller: 'ballotSuccessCtrl',
        templateUrl: 'public/ballot/success.html'
      })
      .when('/ballot/:uuid/vote', {
        controller: 'ballotVoteCtrl',
        templateUrl: 'public/ballot/vote.html'
      })
      .when('/ballot/:uuid/summary', {
        controller: 'ballotVoteSummaryCtrl',
        templateUrl: 'public/ballot/summary.html'
      })
      .when('/ballot/:uuid/result', {
        controller: 'ballotResultCtrl',
        templateUrl: 'public/ballot/result.html'
      })
      .when('/invitation/:uuid', {
        controller: 'InvitationCtrl',
        templateUrl: 'app/partials/verify.html'
      });
    //.otherwise({
    //redirectTo : '/'
    //});

    /**
     * HTTP Interceptor that makes sure that all HTTP requests have the session key inserted as HEADER
     */
    $httpProvider.interceptors.push(['$q', '$location', 'localStorageService', function ($q, $location, localStorageService) {
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
        'responseError': function (response) {
          //if(response.status === 401 || response.status === 403) {
          //    $location.path('/');
          //}
          return $q.reject(response);
        }
      };
    }]);

    /**
     * Configure translations
     */
    $translateProvider.useStaticFilesLoader({
      prefix: 'assets/i18n/locale-',
      suffix: '.json'
    });

    $translateProvider
      .preferredLanguage('en-US')
      .fallbackLanguage('en-US')
      .registerAvailableLanguageKeys(["en-US", "es-ES", "it-IT", "de-DE", "fr-FR"], {
        'en': 'en-US',
        'es': 'es-ES',
        'it': 'it-IT',
        'fr': 'fr-FR',
        'de': 'de-DE',
        'en_US': 'en-US',
        'es_ES': 'es-ES',
        'it_IT': 'it-IT',
        'fr_FR': 'fr-FR',
        'de_DE': 'de-DE'
      })
      .useSanitizeValueStrategy(null);

    tmhDynamicLocaleProvider.localeLocationPattern('bower_components/angular-i18n/angular-locale_{{locale}}.js');
  }

  /**
   * Services that are injected to the main method of the app to make them available when it starts running
   * @type {string[]}
   */
  run.$inject = [
    '$rootScope', '$location', '$http', 'localStorageService', 'logService', '$uibModal',
    'usSpinnerService', '$timeout'
  ];

  /**
   * The function that runs the App on the browser
   * @param $rootScope
   * @param $location
   * @param $http
   * @param localStorageService
   */
  function run($rootScope, $location, $http, localStorageService, logService, $uibModal, usSpinnerService,
    $timeout) {
    localStorageService.set("serverBaseUrl", appCivistCoreBaseURL);
    localStorageService.set("votingApiUrl", votingApiUrl);
    localStorageService.set("etherpadServer", etherpadServerURL);
    localStorageService.set("help", helpInfo);
    localStorageService.set("hideLogin", hideLogin);
    $rootScope.$on('$locationChangeStart', function (event, next, current) {
      // redirect to login page if not logged in and trying to access a restricted page

      //var nonRestrictedPage = $.inArray($location.path(), ['/assembly', '/register']) === -1;
      var nonRestrictedPage = pathIsNotRestricted($location.path());
      var authenticated = localStorageService.get('authenticated');
      var sessionKey = localStorageService.get('sessionKey');
      var user = localStorageService.get("user");

      // in v2 version there are anonymous pages, so we dont need permissions
      if (next.indexOf('v2') === -1 && !nonRestrictedPage && !authenticated &&
        (sessionKey === null || sessionKey === undefined || sessionKey === "") &&
        (user === null || user === undefined)) {
        console.log('entro al uf');
        $location.path('/');
      }
    });
    // TODO: move configurations to config file and angular constants
    // set to true to log actions
    $rootScope.logActions = true;
    $rootScope.logService = logService;

    // devModeOn controls some functionalities that are useful for debugging and testing
    $rootScope.devModeOn = false;

    // set error modal
    $rootScope.supportContact = "Cristhian Parra (cdparra [at] berkeley [dot] edu)";
    $rootScope.showError = function (error, rType, rId) {
      if (!$rootScope.inModal) {
        var modalInstance = $uibModal.open({
          animation: true,
          templateUrl: 'app/partials/errorModal.html',
          controller: 'ErrorModalCtrl',
          size: 'lg',
          resolve: {
            error: function () { return error; },
            resourceType: function () { return rType; },
            resourceId: function () { return rId; },
            supportContact: function () { return $rootScope.supportContact; }
          }
        });

        modalInstance.result.then(function () {
          console.log('Closed error modal');
        }, function () {
          console.log('Modal dismissed at: ' + new Date());
        });

        logService.logAction("ERROR", rType, rId);

      }
    };

    // set alert info modal
    $rootScope.showAlert = function (title, message, messageExtra, allowCancelOption) {
      if (!$rootScope.inModal) {
        var modalInstance = $uibModal.open({
          animation: true,
          templateUrl: 'app/partials/alertModal.html',
          controller: 'AlertModalCtrl',
          size: 'lg',
          resolve: {
            title: function () { return title; },
            message: function () { return message; },
            messageExtra: function () { return messageExtra; },
            allowCancelOption: function () { return allowCancelOption; }
          }
        });

        modalInstance.result.then(function () {
          console.log('Closed alert modal');
        }, function () {
          console.log('Modal dismissed at: ' + new Date());
        });
      }
    };


    // global spinner
    $rootScope.startSpinner = function () {
      $(angular.element.find('[spinner-key="spinner-1"]')[0]).addClass('spinner-container');
      usSpinnerService.spin('spinner-1');
    };

    $rootScope.stopSpinner = function () {
      usSpinnerService.stop('spinner-1');
      $(angular.element.find('[spinner-key="spinner-1"]')[0]).removeClass('spinner-container');
    };

    // global spinner by key
    $rootScope.startSpinnerByKey = function (key) {
      var element = '[spinner-key="' + key + '"]';
      $(angular.element.find(key)[0]).addClass('spinner-container');
      usSpinnerService.spin(key);
    };

    $rootScope.stopSpinnerByKey = function (key) {
      var element = '[spinner-key="' + key + '"]';
      usSpinnerService.stop(key);
      $(angular.element.find(element)[0]).removeClass('spinner-container');
    };
  }

  /**
   * Special function to configure a list of URLs inside the APP that will be available even without being
   * logged in our having an account.
   * @param path
   * @returns {boolean}
   */
  function pathIsNotRestricted(path) {
    var allowedPaths = ["assembly/create", "ballot/", "invitation/"];
    var pathMatch = allowedPaths.filter(function (ap) {
      return path.match(ap);
    });
    return (pathMatch.length > 0);
  }

  /**
   * Special function to decide automatically what backend server to use by default
   * - If this is a local instance (running in localhost), then use the local dev server
   * - If this is *.org, then use the remote testing server
   * - TODO: when production version are ready, add a rule for selecting the production server
   */
  function selectBackendServer(hostname, apis) {
    var possibleHosts = ["localhost", "pb.appcivist.org", "testpb.appcivist.org", "devpb.appcivist.org", "platform.appcivist.org", "testplatform.appcivist.org", "appcivist.org", "www.appcivist.org"];
    if (hostname===possibleHosts[0]) {
      return apis.local;
    } else if (hostname===possibleHosts[1] || hostname===possibleHosts[4] || hostname===possibleHosts[6] || hostname===possibleHosts[7]) {
      return apis.production;
    } else if (hostname===possibleHosts[2] || hostname===possibleHosts[5]) {
      return apis.testing;
    } else {
      return apis.development;
    }
  }


  // expose global variables
  window.appCivistApp = appCivistApp;

} ());
