/**
 * @module appCivistApp
 *
 *
 * @description
 *
 * AppCivist Platform Demo Client developed with AngularJS
 */

(function () {
  var dependencies = ['ngRoute', 'ui.bootstrap', 'ngResource', 'ngMessages', 'LocalStorageModule', 'ngFileUpload',
    'angularMoment', 'angularSpinner', 'angularMultiSlider', 'ngmodel.format', 'pascalprecht.translate', 'duScroll',
    'tmh.dynamicLocale', 'ngclipboard', 'ui.router', 'angular-inview', 'ngNotify', 'vcRecaptcha',
    'angularUtils.directives.dirPagination', 'ErrorCatcher', 'rzModule', 'ui.tinymce', 'ngCookies', 'facebook',
    'ngSanitize', 'ncy-angular-breadcrumb', 'infinite-scroll'
  ];
  var appCivistApp = angular.module('appCivistApp', dependencies);

  // TODO: add the right url for the mimove voting api
  var appcivist = {
    api: {
      voting: {
        production: "https://platform.appcivist.org/voting/api/v0",
        testing: "https://testplatform.appcivist.org/voting/api/v0",
        development: "https://devplatform.org/voting/api/v0",
        local: "http://localhost:5000/api/v0",
        mimove: "https://mimove-apps.paris.inria.fr/voting/api/v0"
      },
      core: {
        production: "https://platform.appcivist.org/api",
        testing: "https://testplatform.appcivist.org/backend/api",
        local: "http://localhost:9000/api",
        development: "https://devplatform.appcivist-dev.org/api",
        mimove: "https://mimove-apps.paris.inria.fr/platform/api",

      }
    },
    ui: {
      forgotForms: {
        production: "https://pb.appcivist.org/#/v2/user/password/reset/",
        testing: "https://testapp.appcivist.org/#/v2/user/password/reset/",
        local: "http://localhost:8000/#/v2/user/password/reset/",
        development: "https://testapp.appcivist.org/#/v2/user/password/reset/"
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
    production: "https://etherpad.appcivist.org/",
    testing: "https://testetherpad.appcivist.org/",
    development: "https://testetherpad.appcivist.org/",
    //local: "http://localhost:9001/",
    local: "https://testetherpad.appcivist.org/",
    //local: "https://etherpad.appcivist.org/",
    mimove: "https://mimove-apps.paris.inria.fr/etherpad/"
    //mimove: "https://etherpad.appcivist.org/"
  };

  // By default, the backend servers are selected in base of the hostname (e.g., if localhost, development is choose)
  var appCivistCoreBaseURL = selectProperURL(window.location.hostname, appcivist.api.core);
  var votingApiUrl = selectProperURL(window.location.hostname, appcivist.api.voting);
  var etherpadServerURL = selectProperURL(window.location.hostname, etherpad);
  var appCivistForgotFormURL= selectProperURL(window.location.hostname, appcivist.ui.forgotForms);

  var hideLogin = (window.location.hostname === "appcivist.org" ||
    window.location.hostname === "www.appcivist.org");

  /**
   * AngularJS initial configurations:
   * - Routes
   * - Libraries specifics (e.g., local storage, resource provider, etc.)
   */

  appCivistApp
    .constant('DEBUG_MODE', /*DEBUG_MODE*/ true /*DEBUG_MODE*/)
    .constant('VERSION_TAG', /*VERSION_TAG_START*/ new Date().getTime() /*VERSION_TAG_END*/)
    .constant('LOCALES', {
      'locales': {
        'en-US': 'English',
        'de-DE': 'Deutsch',
        'es-ES': 'Español',
        'fr-FR': 'Français',
        'it-IT': 'Italiano'
      },
      'preferredLocale': 'en-US'
    })
    .constant('RECAPTCHA_KEY', '6Le_ow8UAAAAALdzF8F_LaqQI6t6MDw4USLMedMy');

  appCivistApp.config(config);
  appCivistApp.config(function (FacebookProvider) {
    FacebookProvider.init('1639456526287470');
  });
  appCivistApp.run(run);

  /**
   * Dependencies needed during configuration of the App
   * @type {string[]}
   */
  config.$inject = ['$routeProvider', '$locationProvider', '$resourceProvider', '$httpProvider', '$sceDelegateProvider',
    'localStorageServiceProvider', '$translateProvider', 'tmhDynamicLocaleProvider', '$stateProvider',
    'RECAPTCHA_KEY', 'vcRecaptchaServiceProvider', 'FacebookProvider', '$breadcrumbProvider'
  ];

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
    localStorageServiceProvider, $translateProvider, tmhDynamicLocaleProvider, $stateProvider, RECAPTCHA_KEY,
    vcRecaptchaServiceProvider) {

    vcRecaptchaServiceProvider.setDefaults({
      key: RECAPTCHA_KEY,
    });
    /**
     * Whitelist of external domains/URLs allowed to be queried (e.g., the etherpad server)
     */
    $sceDelegateProvider.resourceUrlWhitelist([
      // Allow same origin resource loads.
      'self',
      // Allow loading from our assets domain.  Notice the difference between * and **.
      etherpadServerURL + '**',
      '*://www.youtube.com/**',
      '*://drive.google.com/**',
      '*://docs.google.com/**'
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


    /*$stateProvider.state('app', {
      url: '/',
      controller: 'v2.HomeCtrl',
      templateUrl: 'app/v2/partials/home.html'
    });*/
    // V2 routes
    $stateProvider.state('v2', {
      url: '/v2',
      abstract: true,
      templateUrl: 'app/v2/partials/main.html',
      controller: 'v2.MainCtrl'
    })
      .state('v2.homepage', {
        url: '/home',
        controller: 'v2.HomeCtrl',
        templateUrl: 'app/v2/partials/home.html',
        ncyBreadcrumb: {
          label: "AppCivist"
        }
      })
      // Uncomment the following to test the newsletter templates
      // Adds a /newsletter-template URL to test
      /*
      .state('v2.newsletter-template', {
        url: '/newsletter-template',
        controller: 'v2.HomeCtrl',
        templateUrl: 'app/v2/mockups/newsletter-backend-template-no-activity.html'
      })
      .state('v2.newsletter-template-with-activity', {
        url: '/newsletter-template-with-activity',
        controller: 'v2.HomeCtrl',
        templateUrl: 'app/v2/mockups/newsletter-backend-template-with-activity.html'
      })
      .state('v2.newsletter-template-proposal-stage', {
        url: '/newsletter-template-proposal-stage',
        controller: 'v2.HomeCtrl',
        templateUrl: 'app/v2/mockups/newsletter-backend-template-proposal-stage.html'
      })
      .state('v2.newsletter-template-text-only', {
        url: '/newsletter-template-text-only',
        controller: 'v2.HomeCtrl',
        templateUrl: 'app/v2/mockups/newsletter-backend-template-text-only.html'
      })
      */
      .state('v2.public', {
        url: '/p',
        abstract: true,
        template: '<div ui-view></div>'
      })
      .state('v2.public.assembly', {
        url: '/assembly',
        abstract: true,
        template: '<div ui-view></div>',
        ncyBreadcrumb: {
          label: "Assemblies"
        }
      })
      .state('v2.assembly', {
        url: '/assembly',
        abstract: true,
        template: '<div ui-view></div>',
        ncyBreadcrumb: {
          label: "Assemblies"
        }
      })
      //assembly: new routes
      .state('v2.assembly.new', {
        url: '/new',
        controller: 'v2.AssemblyFormWizardCtrl',
        templateUrl: 'app/v2/partials/assembly/form.html',
        access: {
          requiresLogin: true
        }
      })
      .state('v2.assembly.new.description', {
        url: '/description',
        templateUrl: 'app/v2/partials/assembly/description.html',
        controller: 'v2.AssemblyFormCtrl',
        access: {
          requiresLogin: true
        }
      })
      .state('v2.assembly.new.configuration', {
        url: '/configuration',
        templateUrl: 'app/v2/partials/assembly/configuration.html',
        controller: 'v2.AssemblyFormCtrl',
        access: {
          requiresLogin: true
        }
      })
      //assembly: no principal assembly routes
      .state('v2.assembly.aid', {
        url: '/:aid',
        abstract: true,
        template: '<div ui-view></div>',
        ncyBreadcrumb: {
          label: "Assembly"
        }
      })
      .state('v2.public.assembly.auuid', {
        url: '/:auuid',
        abstract: true,
        template: '<div ui-view></div>',
        ncyBreadcrumb: {
          label: "Assembly"
        }
      })
      //assembly: no princial assembly routes
      .state('v2.assembly.aid.fallbackHome', {
        url: '/home',
        templateUrl: 'app/v2/partials/assembly/home.html',
        controller: 'v2.AssemblyHomeCtrl',
        ncyBreadcrumb: {
          label: "Assembly"
        }
      })
      // the new URL for assembly home is /assembly/:id /assembly/:uuid. We left /assembly/:id/home for compatibility.
      .state('v2.assembly.aid.home', {
        url: '',
        templateUrl: 'app/v2/partials/assembly/home.html',
        controller: 'v2.AssemblyHomeCtrl',
        ncyBreadcrumb: {
          label: "Assembly"
        }
      })
      .state('v2.public.assembly.auuid.home', {
        url: '',
        templateUrl: 'app/v2/partials/assembly/home.html',
        controller: 'v2.AssemblyHomeCtrl',
        ncyBreadcrumb: {
          label: "Assembly"
        }
      })
      .state('v2.assembly.aid.assembly', {
        url: '/assembly/new',
        controller: 'v2.AssemblyFormWizardCtrl',
        templateUrl: 'app/v2/partials/assembly/form.html',
        access: {
          requiresLogin: true
        }
      })
      .state('v2.assembly.aid.assembly.description', {
        url: '/description',
        templateUrl: 'app/v2/partials/assembly/description.html',
        controller: 'v2.AssemblyFormCtrl',
        access: {
          requiresLogin: true
        }
      })
      .state('v2.assembly.aid.assembly.configuration', {
        url: '/configuration',
        templateUrl: 'app/v2/partials/assembly/configuration.html',
        controller: 'v2.AssemblyFormCtrl',
        access: {
          requiresLogin: true
        }
      })
      //assembly: edit routes
      .state('v2.assembly.aid.edit', {
        url: '/edit',
        controller: 'v2.AssemblyFormWizardCtrl',
        templateUrl: 'app/v2/partials/assembly/form.html',
        access: {
          requiresLogin: true
        }
      })
      .state('v2.assembly.aid.edit.description', {
        url: '/description',
        templateUrl: 'app/v2/partials/assembly/description.html',
        controller: 'v2.AssemblyFormCtrl',
        access: {
          requiresLogin: true
        }
      })
      .state('v2.assembly.aid.edit.configuration', {
        url: '/configuration',
        templateUrl: 'app/v2/partials/assembly/configuration.html',
        controller: 'v2.AssemblyFormCtrl',
        access: {
          requiresLogin: true
        }
      })
      //campaign routes
      .state('v2.assembly.aid.campaign', {
        url: '/campaign',
        abstract: true,
        template: '<div ui-view></div>'
      })
      .state('v2.public.assembly.auuid.campaign', {
        url: '/campaign',
        abstract: true,
        template: '<div ui-view></div>'
      })
      .state('v2.assembly.aid.campaign.new', {
        url: '/new',
        controller: 'v2.CampaignFormWizardCtrl',
        templateUrl: 'app/v2/partials/campaign/form.html',
        access: {
          requiresLogin: true
        }
      })
      .state('v2.assembly.aid.campaign.cid', {
        url: '/:cid',
        controller: 'v2.CampaignDashboardCtrl',
        templateUrl: 'app/v2/partials/campaign/dashboard.html',
        // WARNING: THIS IS JUST TO TEST THE LOWER TOOLBAR AND THE NEWSLETTERS MODAL
        //templateUrl: 'app/v2/mockups/dashboard.html',
        // END WARNING
        access: {
          requiresLogin: true
        },
        ncyBreadcrumb: {
          parent: 'v2.assembly.aid.home',
          label: 'Campaign'
        }
      })

      // // PUBLIC campaign URLs
      .state('v2.public.assembly.auuid.campaign.cuuid', {
        url: '/:cuuid',
        abstract: true,
        template: '<div ui-view></div>'
      })
      .state('v2.public.assembly.auuid.campaign.cuuid.dashboard', {
        url: '',
        controller: 'v2.CampaignDashboardCtrl',
        templateUrl: 'app/v2/partials/campaign/dashboard.html',
        ncyBreadcrumb: {
          parent: 'v2.public.assembly.auuid.home',
          label: 'Campaign'
        }
      })

      .state('v2.assembly.aid.campaign.start', {
        url: '/start',
        controller: 'v2.StartCampaignCtrl',
        templateUrl: 'app/v2/partials/assembly/start.campaign.html',
        controllerAs: 'vm',
        access: {
          requiresLogin: true
        }
      })
      .state('v2.assembly.aid.campaign.new.description', {
        url: '/description',
        controller: 'v2.CampaignFormCtrl',
        templateUrl: 'app/v2/partials/campaign/form.description.html',
        access: {
          requiresLogin: true
        }
      })
      .state('v2.assembly.aid.campaign.new.milestones', {
        url: '/milestones',
        controller: 'v2.CampaignFormCtrl',
        templateUrl: 'app/v2/partials/campaign/form.milestones.html',
        access: {
          requiresLogin: true
        }
      })
      .state('v2.assembly.aid.campaign.new.stages', {
        url: '/stages',
        controller: 'v2.CampaignFormCtrl',
        templateUrl: 'app/v2/partials/campaign/form.stages.html',
        access: {
          requiresLogin: true
        }
      })
      .state('v2.assembly.aid.campaign.edit', {
        url: '/:cid/edit',
        controller: 'v2.CampaignFormWizardCtrl',
        templateUrl: 'app/v2/partials/campaign/form.html',
        access: {
          requiresLogin: true
        }
      })
      .state('v2.assembly.aid.campaign.edit.description', {
        url: '/description',
        controller: 'v2.CampaignFormCtrl',
        templateUrl: 'app/v2/partials/campaign/form.description.html',
        access: {
          requiresLogin: true
        }
      })
      .state('v2.assembly.aid.campaign.edit.milestones', {
        url: '/milestones',
        controller: 'v2.CampaignFormCtrl',
        templateUrl: 'app/v2/partials/campaign/form.milestones.html',
        access: {
          requiresLogin: true
        }
      })
      .state('v2.assembly.aid.campaign.edit.stages', {
        url: '/stages',
        controller: 'v2.CampaignFormCtrl',
        templateUrl: 'app/v2/partials/campaign/form.stages.html',
        access: {
          requiresLogin: true
        }
      })
      //working group routes
      .state('v2.assembly.aid.campaign.workingGroup', {
        url: '/:cid/group',
        abstract: true,
        template: '<div ui-view></div>'
      })
      .state('v2.public.assembly.auuid.campaign.workingGroup', {
        url: '/:cuuid/group',
        abstract: true,
        template: '<div ui-view></div>'
      })
      .state('v2.assembly.aid.campaign.workingGroup.new', {
        url: '/new',
        controller: 'v2.WgroupFormWizardCtrl',
        templateUrl: 'app/v2/partials/working-group/form.html',
        access: {
          requiresLogin: true
        }
      })
      .state('v2.assembly.aid.campaign.workingGroup.new.description', {
        url: '/description',
        controller: 'v2.WorkingGroupFormCtrl',
        templateUrl: 'app/v2/partials/working-group/form.description.html',
        access: {
          requiresLogin: true
        }
      })
      .state('v2.assembly.aid.campaign.workingGroup.new.configuration', {
        url: '/configuration',
        controller: 'v2.WorkingGroupFormCtrl',
        templateUrl: 'app/v2/partials/working-group/form.configuration.html',
        access: {
          requiresLogin: true
        }
      })
      .state('v2.assembly.aid.campaign.workingGroup.gid', {
        url: '/:gid',
        abstract: true,
        template: '<div ui-view></div>'
      })
      .state('v2.public.assembly.auuid.campaign.workingGroup.guuid', {
        url: '/:guuid',
        abstract: true,
        template: '<div ui-view></div>'
      })
      .state('v2.assembly.aid.campaign.workingGroup.gid.dashboard', {
        url: '',
        controller: 'v2.WorkingGroupDashboardCtrl',
        templateUrl: 'app/v2/partials/working-group/dashboard.html',
        access: {
          requiresLogin: true
        },
        ncyBreadcrumb: {
          parent: "v2.assembly.aid.campaign.cid",
          label: "Working Group"
        }
      })
      .state('v2.public.assembly.auuid.campaign.workingGroup.guuid.dashboard', {
        url: '',
        controller: 'v2.WorkingGroupDashboardCtrl',
        templateUrl: 'app/v2/partials/working-group/dashboard.html',
        access: {
          requiresLogin: true
        },
        ncyBreadcrumb: {
          parent: "v2.public.assembly.auuid.campaign.cid",
          label: "Working Group"
        }
      })
      .state('v2.assembly.aid.campaign.workingGroup.gid.edit', {
        url: '/edit',
        controller: 'v2.WgroupFormWizardCtrl',
        templateUrl: 'app/v2/partials/working-group/form.html',
        access: {
          requiresLogin: true
        }
      })
      .state('v2.assembly.aid.campaign.workingGroup.gid.edit.description', {
        url: '/description',
        controller: 'v2.WorkingGroupFormCtrl',
        templateUrl: 'app/v2/partials/working-group/form.description.html',
        access: {
          requiresLogin: true
        }
      })
      .state('v2.assembly.aid.campaign.workingGroup.gid.edit.configuration', {
        url: '/configuration',
        controller: 'v2.WorkingGroupFormCtrl',
        templateUrl: 'app/v2/partials/working-group/form.configuration.html',
        access: {
          requiresLogin: true
        }
      })
      // deprecated. Now is /contribution. Soon to be removed.
      .state('v2.assembly.aid.campaign.workingGroup.gid.proposal', {
        url: '/proposal',
        abstract: true,
        template: '<div ui-view></div>'
      })
      // deprecated. Now is /contribution. Soon to be removed.
      .state('v2.public.assembly.auuid.campaign.workingGroup.guuid.proposal', {
        url: '/proposal',
        abstract: true,
        template: '<div ui-view></div>'
      })
      .state('v2.assembly.aid.campaign.workingGroup.gid.proposal.pid', {
        url: '/:pid',
        templateUrl: 'app/v2/partials/proposal/page.html',
        controller: 'v2.ProposalPageCtrl',
        access: {
          requiresLogin: true
        }
      })
      .state('v2.public.assembly.auuid.campaign.workingGroup.guuid.proposal.puuid', {
        url: '/:puuid',
        templateUrl: 'app/v2/partials/proposal/page.html',
        controller: 'v2.ProposalPageCtrl',
        access: {
          requiresLogin: true
        }
      })
      .state('v2.assembly.aid.campaign.workingGroup.gid.contribution', {
        url: '/contribution',
        abstract: true,
        template: '<div ui-view></div>'
      })
      .state('v2.public.assembly.auuid.campaign.workingGroup.guuid.contribution', {
        url: '/contribution',
        abstract: true,
        template: '<div ui-view></div>'
      })
      .state('v2.assembly.aid.campaign.workingGroup.gid.contribution.pid', {
        url: '/:pid',
        templateUrl: 'app/v2/partials/proposal/page.html',
        controller: 'v2.ProposalPageCtrl',
        access: {
          requiresLogin: true
        },
        ncyBreadcrumb: {
          parent: "v2.assembly.aid.campaign.workingGroup.gid",
          label: "Proposal"
        }
      })
      .state('v2.public.assembly.auuid.campaign.workingGroup.guuid.contribution.puuid', {
        url: '/:puuid',
        templateUrl: 'app/v2/partials/proposal/page.html',
        controller: 'v2.ProposalPageCtrl',
        access: {
          requiresLogin: true
        }
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
        url: '/contributions?type&from',
        templateUrl: 'app/v2/partials/contribution/all.html',
        controller: 'v2.ProposalsCtrl'
      })

      // TODO: for the general login, let's add a step after signing in to ask which assembly to connect if the user
      // is member of several assemblies
      .state('v2.login', {
        url: '/login',
        controller: 'v2.LoginCtrl',
        templateUrl: 'app/v2/partials/login.html'
      })
      .state('v2.login2', {
        url: '/:domain/login',
        controller: 'v2.LoginCtrl',
        templateUrl: 'app/v2/partials/login.html'
      })
      .state('v2.user', {
        url: '/user',
        abstract: true,
        template: '<div ui-view></div>'
      })
      .state('v2.user.password', {
        url: '/password',
        abstract: true,
        template: '<div ui-view></div>'
      })
      .state('v2.user.password.forgot', {
        url: '/forgot',
        template: '<user-password-forgot></user-password-forgot>'
      })
      .state('v2.user.password.rest', {
        url: '/reset/:token',
        template: '<user-password-reset></user-password-reset>'
      })
      .state('v2.user.uid', {
        url: '/:uid',
        abstract: true,
        template: '<div ui-view></div>'
      })
      .state('v2.user.uid.profile', {
        url: '/profile',
        controller: 'v2.ProfileCtrl',
        templateUrl: 'app/v2/partials/user/profile.html',
        // Uncomment to test the new profile updates
        //templateUrl: 'app/v2/mockups/profile.html',
        access: {
          requiresLogin: true
        }
      });

    /**
     * DEPRECATED
     * Routes below correspond to the original v1 prototype, soon to be disconnected.
     *
     * Main routes available in the APP. Each route has its onw controller, which allows the user to
     * simply write down the route and if that's available, it will load everything needed.
     */
    $routeProvider
      .when('/', {
        // controller: 'MainCtrl',
        // templateUrl: '/app/partials/main.html'
        controller: 'v2.HomeCtrl',
        templateUrl: 'app/v2/partials/home.html'
      })
      .when('/v1/home', {
        controller: 'HomeCtrl',
        templateUrl: 'app/partials/home/home.html',
        activetab: 'home'
      })
      .when('/v1/profile', {
        controller: 'ProfileCtrl',
        templateUrl: 'app/partials/profile/profile.html'
      })
      .when('/v1/assemblies', {
        controller: 'AssemblyListCtrl',
        templateUrl: 'app/partials/assemblies/assemblies.html',
        activetab: 'assemblies'
      })
      .when('/v1/assembly/create', {
        controller: 'NewAssemblyCtrl',
        templateUrl: 'app/partials/assembly/newAssembly.html'
      })
      .when('/v1/assembly/create?:userIsNew', {
        controller: 'NewAssemblyCtrl',
        templateUrl: 'app/partials/assembly/newAssembly.html'
      })
      .when('/v1/assembly/:aid/campaign/create', {
        controller: "CreateCampaignCtrl",
        templateUrl: 'app/partials/campaign/creation/newCampaign.html'
      })
      .when('/v1/assembly/:aid/forum', {
        controller: 'AssemblyCtrl',
        templateUrl: 'app/partials/forum/forum.html'
      })
      // TODO: This should be /assembly/:aid/campaign/:cid/wgroup/create
      .when('/v1/assembly/:aid/campaign/:cid/wgroup/create', {
        controller: 'CampaignComponentCtrl',
        templateUrl: 'app/partials/contributions/newWorkingGroup/newWorkingGroup.html'
      })
      .when('/v1/assembly/:aid/wgroup/create', {
        controller: 'NewWorkingGroupCtrl',
        templateUrl: 'app/partials/contributions/newWorkingGroup/newWorkingGroup.html'
      })
      .when('/v1/assembly/:aid/campaign/:cid/contribution/:coid', {
        controller: 'ContributionPageCtrl',
        templateUrl: 'app/partials/contributions/contribution/contributionPage.html'
      })
      .when('/v1/assembly/:aid/campaign/:cid/:ciid/:mid', {
        controller: 'CampaignComponentCtrl',
        templateUrl: 'app/partials/campaign/component/campaignComponent.html'
      })
      .when('/v1/assembly/:aid/campaign/:cid', {
        controller: 'CampaignComponentCtrl',
        templateUrl: 'app/partials/campaign/component/campaignComponent.html'
      })
      .when('/v1/assembly/:aid/campaign/:cid/edit', { //edit
        controller: "EditCampaignCtrl",
        templateUrl: 'app/partials/campaign/edit/editCampaign.html'
      })
      .when('/v1/assembly/:aid/campaign/:cid/:ciid', {
        controller: 'CampaignComponentCtrl',
        templateUrl: 'app/partials/campaign/component/campaignComponent.html'
      })
      .when('/v1/assembly/:aid/group/:wid', {
        controller: 'WorkingGroupCtrl',
        templateUrl: 'app/partials/wGroupForum/wGroupForum.html'
      })
      // TODO: This should be /assembly/:aid/campaign/:cid/wgroup/create
      .when('/v1/assembly/:aid/campaign/:cid/wgroup/create', {
        controller: 'NewWorkingGroupCtrl',
        templateUrl: 'app/partials/contributions/newWorkingGroup/newWorkingGroup.html'
      })
      // TODO: finalize voting UIs #Issue #231
      .when('/v1/ballot/:uuid', {
        redirectTo: '/ballot/:uuid/start'
      })
      .when('/v1/ballot/:uuid/start', {
        controller: 'ballotStartCtrl',
        templateUrl: 'public/ballot/start.html'
      })
      .when('/v1/ballot/:uuid/register', {
        controller: 'ballotRegisterCtrl',
        templateUrl: 'public/ballot/register.html'
      })
      .when('/v1/ballot/:uuid/success', {
        controller: 'ballotSuccessCtrl',
        templateUrl: 'public/ballot/success.html'
      })
      .when('/v1/ballot/:uuid/vote', {
        controller: 'ballotVoteCtrl',
        templateUrl: 'public/ballot/vote.html'
      })
      .when('/v1/ballot/:uuid/summary', {
        controller: 'ballotVoteSummaryCtrl',
        templateUrl: 'public/ballot/summary.html'
      })
      .when('/v1/ballot/:uuid/result', {
        controller: 'ballotResultCtrl',
        templateUrl: 'public/ballot/result.html'
      })
      .when('/v1/invitation/:uuid', {
        controller: 'InvitationCtrl',
        templateUrl: 'app/partials/verify.html'
      });

    /**
     * HTTP Interceptor that makes sure that all HTTP requests have the session key inserted as HEADER
     */
    $httpProvider.interceptors.push(['$q', '$location', 'localStorageService', function ($q, $location, localStorageService) {
      return {
        request: function (config) {
          config.headers = config.headers || {};
          var sessionKey = localStorageService.get('sessionKey');
          if (sessionKey) {
            config.headers.SESSION_KEY = '' + sessionKey;
          }
          config.headers.UI_PATH = '' + $location.absUrl(); // Added for Research Purposes
          return config;
        },
        responseError: function (response) {
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
      .registerAvailableLanguageKeys(["en-US", "es-ES", "fr-FR", "de-DE", "pt-BR"], {
        'en': 'en-US',
        'es': 'es-ES',
        'it': 'it-IT',
        'fr': 'fr-FR',
        'de': 'de-DE',
        'pt': 'pt-BR',
        'en_US': 'en-US',
        'es_ES': 'es-ES',
        'it_IT': 'it-IT',
        'fr_FR': 'fr-FR',
        'de_DE': 'de-DE',
        'pt_BR': 'pt-BR'
      })
      .useSanitizeValueStrategy(null);

    tmhDynamicLocaleProvider.localeLocationPattern('bower_components/angular-i18n/angular-locale_{{locale}}.js');
    $translateProvider.translationNotFoundIndicator('$$$');
  }

  /**
   * Services that are injected to the main method of the app to make them available when it starts running
   * @type {string[]}
   */
  run.$inject = [
    '$rootScope', '$location', '$http', 'localStorageService', 'logService', '$uibModal',
    'usSpinnerService', '$timeout', '$document', 'Authorization', '$translate', 'LocaleService'
  ];

  /**
   * The function that runs the App on the browser
   * @param $rootScope
   * @param $location
   * @param $http
   * @param localStorageService
   */
  function run($rootScope, $location, $http, localStorageService, logService, $uibModal, usSpinnerService,
    $timeout, $document, Authorization, $translate, LocaleService) {
    localStorageService.set("serverBaseUrl", appCivistCoreBaseURL);
    localStorageService.set("votingApiUrl", votingApiUrl);
    localStorageService.set("etherpadServer", etherpadServerURL);
    localStorageService.set("hideLogin", hideLogin);
    localStorageService.set("forgotFormUrl", appCivistForgotFormURL);
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

    // authentication control
    $rootScope.$on('$stateChangeStart', function (event, next, nextParams) {
      var authorized;
      var pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      var isAnonymous = true;

      angular.forEach(_.keys(nextParams), function (key) {
        if (!pattern.test(nextParams[key])) {
          isAnonymous = false;
        }
      });

      if (isAnonymous) {
        return;
      }

      if (next.access !== undefined) {
        authorized = Authorization.authorize(next.access.requiresLogin);

        if (authorized === Authorization.enums.LOGIN_REQUIRED) {
          $location.path('/v2/login');
        } else if (authorized === Authorization.enums.NOT_AUTHORIZED) {
          $location.path('/').replace();
        }
      }
    });


    $rootScope.$on('$stateChangeSuccess', function () {
      // I18N for current view
      let user = localStorageService.get('user');

      if (user && user.language) {
        $translate.use(user.language);
      } else {
        $translate.use(LocaleService.getLocale());
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
  function selectProperURL(hostname, urls) {
    var possibleHosts = [
      "localhost", "pb.appcivist.org", "testpb.appcivist.org", "devpb.appcivist.org",
      "platform.appcivist.org", "testplatform.appcivist.org", "appcivist.org",
      "www.appcivist.org", "testapp.appcivist.org", "mimove-apps.paris.inria.fr"];
    if (hostname === possibleHosts[0]) {
      return urls.local;
    } else if (hostname === possibleHosts[1] || hostname === possibleHosts[4] || hostname === possibleHosts[6] || hostname === possibleHosts[7]) {
      return urls.production;
    } else if (hostname === possibleHosts[2] || hostname === possibleHosts[5] || hostname === possibleHosts[8]) {
      return urls.testing;
    } else if (hostname === possibleHosts[9]) {
      return urls.mimove;
    } else {
      return urls.development;
    }
  }

  appCivistApp.config(function($breadcrumbProvider) {
    $breadcrumbProvider.setOptions({
      prefixStateName: "v2.homepage",
      templateUrl: "app/v2/components/breadcrumb/template.html"
    });
  });

  // expose global variables
  window.appCivistApp = appCivistApp;

}());
