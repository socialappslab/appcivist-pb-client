/**
 * @module appCivistApp
 *
 *
 * @description
 *
 * AppCivist Platform Demo Client developed with AngularJS
 */

(function () {
  var dependencies = ['ngRaven', 'ngRoute', 'ui.bootstrap', 'ngResource', 'ngMessages', 'LocalStorageModule', 'ngFileUpload',
    'angularMoment', 'angularSpinner', 'angularMultiSlider', 'ngmodel.format', 'pascalprecht.translate', 'duScroll',
    'tmh.dynamicLocale', 'ngclipboard', 'ui.router', 'angular-inview', 'ngNotify', 'vcRecaptcha',
    'angularUtils.directives.dirPagination', 'ErrorCatcher', 'rzModule', 'ui.tinymce', 'ngCookies', 'facebook',
    'ngSanitize', 'ncy-angular-breadcrumb', 'infinite-scroll'
  ];
  var appCivistApp = angular.module('appCivistApp', dependencies);


  var env = {};

  // Import variables if present (from env.js)
  if(window){
    Object.assign(env, window.__env);
  }

  Raven
    .config(env.sentryConfig)
    .addPlugin(Raven.Plugins.Angular)
    .install();

  var appcivist = {

    api: {
      voting: {
        production: "https://platform.appcivist.org/voting/api/v0",
        production_louisville: "https://louisvilleplatform.appcivist.org/voting/api/v0",
        testing: "https://testplatform.appcivist.org/voting/api/v0",
        development: "https://testplatform.appcivist.org/voting/api/v0",
        local: "http://localhost:5000/api/v0",
        mimove: "https://mimove-apps.paris.inria.fr/voting/api/v0"
      },
      core: {
        production: "https://platform.appcivist.org/api",
        production_louisville: "https://louisvillepbplatform.appcivist.org/api",
        testing: "https://testplatform.appcivist.org/api",
        local: "https://testplatform.appcivist.org/api",
        // local: "http://localhost:9000/api",
        // local: "https://platform.appcivist.org/api",
        development: "https://devplatform.appcivist-dev.org/api",
        mimove: "https://mimove-apps.paris.inria.fr/platform/api"
      }
    },
    ui: {
      forgotForms: {
        production: "https://pb.appcivist.org/#/v2/user/password/reset/",
        production_louisville: "https://ourmoneyourvoice.appcivist.org/#/v2/user/password/reset/",
        testing: "https://testpb.appcivist.org/#/v2/user/password/reset/",
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
    },
    landingPage: {
      "url": env.landing
    }
  };

  var etherpad = {
    production: "https://etherpad.appcivist.org/",
    production_louisville: "https://louisvilleetherpad.appcivist.org/",
    testing: "https://testetherpad.appcivist.org/",
    development: "https://testetherpad.appcivist.org/",
    local: "http://localhost:9001/",
    //local: "https://testetherpad.appcivist.org/",
    //local: "https://etherpad.appcivist.org/",
    mimove: "https://mimove-apps.paris.inria.fr/etherpad/"
    //mimove: "https://etherpad.appcivist.org/"
  };


  var peerdoc = {
    production: "https://peerdoc.org/",
    testing: "https://peerdoc.appcivist.org/",
    development: "https://peerdoc.appcivist.org/",
    local: "http://localhost:3000/"
  };

  // By default, the backend servers are selected in base of the hostname (e.g., if localhost, development is choose)
  // unless they are defined in the env.js variables
  var appCivistCoreBaseURL =
    env && env.appcivist && env.appcivist.api && env.appcivist.api.core
      ? env.appcivist.api.core : selectProperURL(window.location.hostname, appcivist.api.core);
  var votingApiUrl =
    env && env.appcivist && env.appcivist.api && env.appcivist.api.voting
      ? env.appcivist.api.voting : selectProperURL(window.location.hostname, appcivist.api.voting);
  var etherpadServerURL =
    env && env.external && env.external.etherpad && env.external.etherpad.url
      ? env.external.etherpad.url : selectProperURL(window.location.hostname, etherpad);
  var appCivistForgotFormURL =
    env && env.appcivist && env.appcivist.ui && env.appcivist.ui.forgotForm
      ? env.appcivist.ui.forgotForm : selectProperURL(window.location.hostname, appcivist.ui.forgotForms);
  var peerdocServerURL =
    env && env.external && env.external.peerdoc && env.external.peerdoc.url
      ? env.external.peerdoc.url : selectProperURL(window.location.hostname, peerdoc);
  var landingURL = appcivist.landingPage.url;

  var hideLogin = (window.location.hostname === "appcivist.org" ||
    window.location.hostname === "www.appcivist.org");

  var siteLogo = null;
  if (env.siteLogo) {
    siteLogo = env.siteLogo;
  }

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
        'fr-CA': 'Français (CA)',
        'it-IT': 'Italiano',
        'es-PY': 'Español (PY)',
        'pt-BR': 'Portugués (BR)'
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
      '*://etherpad.appcivist.org/**',
      '*://testetherpad.appcivist.org/**',
      '*://www.youtube.com/**',
      '*://youtube.com/**',
      '*://youtu.be/**',
      '*://drive.google.com/**',
      '*://docs.google.com/**',
      '*://vimeo.com/**',
      '*://player.vimeo.com/**',
      '*://vallejopb.appcivist.org/**',
      '*://ctsfrance.appcivist.org/**',
      '*://dieppepb.appcivist.org/**',
      '*://ourmoneyourvoice.appcivist.org/**',
      '*://unifesp.appcivist.org/**',
      '*://files.appcivist.org/**',
      '*://pb.appcivist.org/**',
      '*://www.facebook.com/**',
      '*://facebook.com/**',
      '*://testpb.appcivist.org/**',
      '*://testplatform.appcivist.org/**',
      '*://appcivist.org/**',
      '*://www.appcivist.org/**',
      peerdocServerURL + '**',
      appCivistCoreBaseURL+'**',
      votingApiUrl+'**'
    ]);

    /**
     * Setup CORS requests
     */
    $httpProvider.defaults.useXDomain = true;
    delete $httpProvider.defaults.headers.common["X-Requested-With"];
    localStorageServiceProvider
      .setPrefix('appcivist')
      .setStorageType('localStorage')
      .setNotify(true, true);


    // V2 routes
    $stateProvider
      .state('v2', {
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
          skip: true
        }
      })
      .state('v2.assembly', {
        url: '/assembly',
        abstract: true,
        template: '<div ui-view></div>',
        ncyBreadcrumb: {
          label: "{{ 'Assemblies' | translate}}"
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
          label: "{{assemblyLabel || ('Assembly' | translate) }}"
        }
      })
      //assembly: no princial assembly routes
      .state('v2.assembly.aid.fallbackHome', {
        url: '/home',
        templateUrl: 'app/v2/partials/assembly/home.html',
        controller: 'v2.AssemblyHomeCtrl',
        ncyBreadcrumb: {
          label: "{{ assemblyLabel || ('Assembly' | translate) }}"
        }
      })
      // the new URL for assembly home is /assembly/:id /assembly/:uuid. We left /assembly/:id/home for compatibility.
      .state('v2.assembly.aid.home', {
        url: '',
        templateUrl: 'app/v2/partials/assembly/home.html',
        controller: 'v2.AssemblyHomeCtrl',
        ncyBreadcrumb: {
          label: "{{ assemblyLabel || ('Assembly' | translate) }}"
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
      .state('v2.assembly.aid.campaign.new', {
        url: '/new',
        controller: 'v2.CampaignFormWizardCtrl',
        templateUrl: 'app/v2/partials/campaign/form.html',
        access: {
          requiresLogin: true
        }
      })
      .state('v2.assembly.aid.campaign.start', {
        url: '/start',
        redirect: 'v2.assembly.aid.campaign.new.description',
        access: {
          requiresLogin: true
        },
        ncyBreadcrumb: {
          parent: 'v2.assembly.aid.home',
          label: "{{'New Campaign' | translate}}"
        }
      })
      .state('v2.assembly.aid.campaign.new.description', {
        url: '/description',
        controller: 'v2.CampaignFormCtrl',
        templateUrl: 'app/v2/partials/campaign/form.description.html',
        access: {
          requiresLogin: true
        },
        ncyBreadcrumb: {
          parent: 'v2.assembly.aid.home',
          label: "{{'New Campaign Description' | translate}}"
        }
      })
      .state('v2.assembly.aid.campaign.new.milestones', {
        url: '/milestones',
        controller: 'v2.CampaignFormCtrl',
        templateUrl: 'app/v2/partials/campaign/form.milestones.html',
        access: {
          requiresLogin: true
        },
        ncyBreadcrumb: {
          parent: 'v2.assembly.aid.home',
          label: "{{'New Campaign Milestones' | translate}}"
        }
      })
      .state('v2.assembly.aid.campaign.new.stages', {
        url: '/stages',
        controller: 'v2.CampaignFormCtrl',
        templateUrl: 'app/v2/partials/campaign/form.stages.html',
        access: {
          requiresLogin: true
        },
        ncyBreadcrumb: {
          parent: 'v2.assembly.aid.home',
          label: "{{'New Campaign Stages' | translate}}"
        }
      })
      .state('v2.assembly.aid.campaign.cid', {
        url: '/:cid',
        controller: 'v2.CampaignDashboardCtrl',
        templateUrl: 'app/v2/partials/campaign/dashboard.html',
        access: {
          requiresLogin: true
        },
        ncyBreadcrumb: {
          parent: "v2.assembly.aid.home",
          label: "{{ campaignLabel || ('Campaign' | translate) }}"
        }
      })
      .state('v2.assembly.aid.campaign.edit', {
        url: '/:cid/edit',
        controller: 'v2.CampaignFormWizardCtrl',
        templateUrl: 'app/v2/partials/campaign/form.html',
        access: {
          requiresLogin: true
        },
        ncyBreadcrumb: {
          parent: 'v2.assembly.aid.campaign.cid',
          label: "{{ 'Campaign Edit' | translate }}"
        }
      })
      .state('v2.assembly.aid.campaign.edit.description', {
        url: '/description',
        controller: 'v2.CampaignFormCtrl',
        templateUrl: 'app/v2/partials/campaign/form.description.html',
        access: {
          requiresLogin: true
        },
        ncyBreadcrumb: {
          parent: 'v2.assembly.aid.campaign.cid',
          label: "{{'Campaign Edit Description' | translate}}"
        }
      })
      .state('v2.assembly.aid.campaign.edit.milestones', {
        url: '/milestones',
        controller: 'v2.CampaignFormCtrl',
        templateUrl: 'app/v2/partials/campaign/form.milestones.html',
        access: {
          requiresLogin: true
        },
        ncyBreadcrumb: {
          parent: 'v2.assembly.aid.campaign.cid',
          label: "{{'Campaign Edit Milestones' | translate}}"
        }
      })
      .state('v2.assembly.aid.campaign.edit.stages', {
        url: '/stages',
        controller: 'v2.CampaignFormCtrl',
        templateUrl: 'app/v2/partials/campaign/form.stages.html',
        access: {
          requiresLogin: true
        },
        ncyBreadcrumb: {
          parent: 'v2.assembly.aid.campaign.cid',
          label: "{{'Campaign Edit Stages' | translate}}"
        }
      })
      //working group routes
      .state('v2.assembly.aid.campaign.workingGroup', {
        url: '/:cid/group',
        abstract: true,
        template: '<div ui-view></div>'
      })
      .state('v2.assembly.aid.campaign.workingGroup.new', {
        url: '/new',
        controller: 'v2.WgroupFormWizardCtrl',
        templateUrl: 'app/v2/partials/working-group/form.html',
        access: {
          requiresLogin: true
        },
        ncyBreadcrumb: {
          parent: 'v2.assembly.aid.campaign.cid',
          label: "{{'New Working Group' | translate}}"
        }
      })
      .state('v2.assembly.aid.campaign.workingGroup.new.description', {
        url: '/description',
        controller: 'v2.WorkingGroupFormCtrl',
        templateUrl: 'app/v2/partials/working-group/form.description.html',
        access: {
          requiresLogin: true
        },
        ncyBreadcrumb: {
          parent: 'v2.assembly.aid.campaign.cid',
          label: "{{'New Working Group Description' | translate}}"
        }
      })
      .state('v2.assembly.aid.campaign.workingGroup.new.configuration', {
        url: '/configuration',
        controller: 'v2.WorkingGroupFormCtrl',
        templateUrl: 'app/v2/partials/working-group/form.configuration.html',
        access: {
          requiresLogin: true
        },
        ncyBreadcrumb: {
          parent: 'v2.assembly.aid.campaign.cid',
          label: "{{'New Working Group configuration' | translate}}"
        }
      })
      .state('v2.assembly.aid.campaign.workingGroup.gid', {
        url: '/:gid',
        controller: 'v2.WorkingGroupDashboardCtrl',
        templateUrl: 'app/v2/partials/working-group/dashboard.html',
        access: {
          requiresLogin: true
        },
        ncyBreadcrumb: {
          parent: "v2.assembly.aid.campaign.cid",
          label: "{{ workingGroupLabel || ('Working Group' | translate) }}"
        }
      })
      .state('v2.assembly.aid.campaign.workingGroup.edit', {
        url: '/:gid/edit',
        controller: 'v2.WgroupFormWizardCtrl',
        templateUrl: 'app/v2/partials/working-group/form.html',
        access: {
          requiresLogin: true
        },
        ncyBreadcrumb: {
          parent: "v2.assembly.aid.campaign.workingGroup.gid",
          label: "{{'Working Group Edit' | translate}}"
        }
      })
      .state('v2.assembly.aid.campaign.workingGroup.edit.description', {
        url: '/description',
        controller: 'v2.WorkingGroupFormCtrl',
        templateUrl: 'app/v2/partials/working-group/form.description.html',
        access: {
          requiresLogin: true
        },
        ncyBreadcrumb: {
          parent: "v2.assembly.aid.campaign.workingGroup.gid",
          label: "{{ 'Working Group Edit Description' | translate}}"
        }
      })
      .state('v2.assembly.aid.campaign.workingGroup.edit.configuration', {
        url: '/configuration',
        controller: 'v2.WorkingGroupFormCtrl',
        templateUrl: 'app/v2/partials/working-group/form.configuration.html',
        access: {
          requiresLogin: true
        },
        ncyBreadcrumb: {
          parent: "v2.assembly.aid.campaign.workingGroup.gid",
          label: "{{ 'Working Group Edit Configuration' | translate }}"
        }
      })
      // deprecated. Now is /contribution. Soon to be removed.
      .state('v2.assembly.aid.campaign.workingGroup.proposal', {
        url: '/:gid/proposal',
        abstract: true,
        template: '<div ui-view></div>'
      })
      .state('v2.assembly.aid.campaign.workingGroup.proposal.pid', {
        url: '/:pid',
        templateUrl: 'app/v2/partials/contribution/page.html',
        controller: 'v2.ContributionPageCtrl',
        access: {
          requiresLogin: true
        },
        ncyBreadcrumb: {
          parent: "v2.assembly.aid.campaign.workingGroup.gid",
          label: "{{ contributionLabel || ('Contribution' | translate) }}"
        }
      })
      .state('v2.assembly.aid.campaign.workingGroup.contribution', {
        url: '/:gid/contribution',
        abstract: true,
        template: '<div ui-view></div>'
      })
      .state('v2.assembly.aid.campaign.workingGroup.contribution.pid', {
        url: '/:pid',
        templateUrl: 'app/v2/partials/contribution/page.html',
        controller: 'v2.ContributionPageCtrl',
        access: {
          requiresLogin: true
        },
        ncyBreadcrumb: {
          parent: "v2.assembly.aid.campaign.workingGroup.gid",
          label: "{{ contributionLabel || ('Contribution' | translate) }}"
        }
      })
      .state('v2.public.assembly.auuid.campaign.workingGroup.guuid.contribution.puuid', {
        url: '/:puuid',
        templateUrl: 'app/v2/partials/contribution/page.html',
        controller: 'v2.ContributionPageCtrl',
        access: {
          requiresLogin: true
        },
        ncyBreadcrumb: {
          parent: "v2.public.assembly.auuid.campaign.workingGroup.guuid",
          label: "{{ contributionLabel || ('Contribution' | translate) }}"
        }
      })
      .state('v2.assembly.aid.campaign.contribution', {
        url: '/:cid/contribution',
        abstract: true,
        template: '<div ui-view></div>'
      })
      .state('v2.public.assembly.auuid.campaign.contribution', {
        url: '/:cuuid/contribution',
        abstract: true,
        template: '<div ui-view></div>'
      })
      .state('v2.assembly.aid.campaign.contribution.coid', {
        url: '/:coid',
        templateUrl: 'app/v2/partials/contribution/page.html',
        controller: 'v2.ContributionPageCtrl',
        access: {
          requiresLogin: true
        },
        ncyBreadcrumb: {
          parent: "v2.assembly.aid.campaign.cid",
          label: "{{ contributionLabel || ('Contribution' | translate) }}"
        }
      })
      .state('v2.public.assembly.auuid.campaign.contribution.couuid', {
        url: '/:couuid',
        templateUrl: 'app/v2/partials/contribution/page.html',
        controller: 'v2.ContributionPageCtrl',
        ncyBreadcrumb: {
          parent: "v2.public.assembly.auuid.campaign.cuuid.dashboard",
          label: "{{ contributionLabel || ('Contribution' | translate) }}"
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
        controller: 'v2.ProposalsCtrl',
        ncyBreadcrumb: {
          parent: "v2.home",
          label: "{{ contributionLabel || ('Contribution' | translate) }}"
        }
      })

      // PUBLIC campaign URLs
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
          label: "{{ 'Assemblies' | translate }}"
        }
      })
      .state('v2.public.assembly.auuid', {
        url: '/:auuid',
        abstract: true,
        template: '<div ui-view></div>',
        ncyBreadcrumb: {
          label: "{{ assemblyLabel || ('Assembly' | translate) }}"
        }
      })
      .state('v2.public.assembly.auuid.home', {
        url: '',
        templateUrl: 'app/v2/partials/assembly/home.html',
        controller: 'v2.AssemblyHomeCtrl',
        ncyBreadcrumb: {
          label: "{{ assemblyLabel || ('Assembly' | translate) }}"
        }
      })
      .state('v2.public.assembly.auuid.campaign', {
        url: '/campaign',
        abstract: true,
        template: '<div ui-view></div>'
      })
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
          label: "{{ campaignLabel || ('Campaign' | translate) }}"
        }
      })
      .state('v2.public.assembly.auuid.campaign.cuuid.workingGroup', {
        url: '/group',
        abstract: true,
        template: '<div ui-view></div>'
      })
      .state('v2.public.assembly.auuid.campaign.cuuid.workingGroup.guuid', {
        url: '/:guuid',
        abstract: true,
        template: '<div ui-view></div>'
      })
      .state('v2.public.assembly.auuid.campaign.cuuid.workingGroup.guuid.dashboard', {
        url: '',
        controller: 'v2.WorkingGroupDashboardCtrl',
        templateUrl: 'app/v2/partials/working-group/dashboard.html',
        access: {
          requiresLogin: true
        },
        ncyBreadcrumb: {
          parent: "v2.public.assembly.auuid.campaign.cuuid.dashboard",
          label: "{{ workingGroupLabel || ('Working Group' | translate) }}"
        }
      })
      .state('v2.public.assembly.auuid.campaign.cuuid.workingGroup.guuid.proposal', {
        url: '/proposal',
        abstract: true,
        template: '<div ui-view></div>'
      })
      .state('v2.public.assembly.auuid.campaign.cuuid.workingGroup.guuid.proposal.puuid', {
        url: '/:puuid',
        templateUrl: 'app/v2/partials/contribution/page.html',
        controller: 'v2.ContributionPageCtrl',
        access: {
          requiresLogin: true
        },
        ncyBreadcrumb: {
          parent: "v2.public.assembly.auuid.campaign.cuuid.workingGroup.guuid.dashboard",
          label: "{{ contributionLabel || ('Contribution' | translate) }}"
        }
      })
      .state('v2.public.assembly.auuid.campaign.cuuid.workingGroup.guuid.contribution', {
        url: '/contribution',
        abstract: true,
        template: '<div ui-view></div>'
      })
      .state('v2.public.assembly.auuid.campaign.cuuid.workingGroup.guuid.contribution.puuid', {
        url: '/:puuid',
        templateUrl: 'app/v2/partials/contribution/page.html',
        controller: 'v2.ContributionPageCtrl',
        access: {
          requiresLogin: true
        },
        ncyBreadcrumb: {
          parent: "v2.public.assembly.auuid.campaign.cuuid.workingGroup.guuid.dashboard",
          label: "{{ contributionLabel || ('Contribution' | translate) }}"
        }
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
    if (landingURL !== null) {
      console.log("Redirecting to site Landing Page: " + landingURL);
      $routeProvider
        .when('/', {
          // controller: 'MainCtrl',
          // templateUrl: '/app/partials/main.html'
          controller: 'v2.HomeCtrl',
          templateUrl: 'app/v2/partials/home.html',
          redirectTo: landingURL
        });
    } else {
      console.log("No Landing Page configured: " + landingURL);
      $routeProvider
        .when('/', {
          // controller: 'MainCtrl',
          // templateUrl: '/app/partials/main.html'
          controller: 'v2.HomeCtrl',
          templateUrl: 'app/v2/partials/home.html',
        });
    }

    $routeProvider.when('/v1/home', {
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
      .registerAvailableLanguageKeys(["en-US", "es-ES", "fr-FR", "de-DE", "pt-BR", "fr-CA", "es-PY"], {
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
        'pt_BR': 'pt-BR',
        'fr_CA': 'fr-CA',
        'ca': 'fr-CA',
        'es_PY': 'es-PY'
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
    'usSpinnerService', '$timeout', '$document', 'Authorization', '$translate', 'LocaleService', 'AppCivistAuth',
    '$state', '$window', '$anchorScroll'
  ];

  /**
   * The function that runs the App on the browser
   * @param $rootScope
   * @param $location
   * @param $http
   * @param localStorageService
   */
  function run($rootScope, $location, $http, localStorageService, logService, $uibModal, usSpinnerService,
    $timeout, $document, Authorization, $translate, LocaleService, AppCivistAuth, $state, $window, $anchorScroll) {

    localStorageService.set("serverBaseUrl", appCivistCoreBaseURL);
    localStorageService.set("votingApiUrl", votingApiUrl);
    localStorageService.set("etherpadServer", etherpadServerURL);
    localStorageService.set("hideLogin", hideLogin);
    localStorageService.set("forgotFormUrl", appCivistForgotFormURL);
    localStorageService.set("landingURL", landingURL);
    localStorageService.set("siteLogo", siteLogo)
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
      let user = localStorageService.get('user');

      if (next.access !== undefined) {
        authorized = Authorization.authorize(next.access.requiresLogin);

        if (authorized === Authorization.enums.LOGIN_REQUIRED) {
          if (nextParams.aid) {
            AppCivistAuth.getUUID('assembly', nextParams.aid).get().$promise.then(rsp => {
              let auuid = rsp.uuid;
              if (nextParams.cid) {
                AppCivistAuth.getUUID('campaign', nextParams.cid).get().$promise.then(rsp => {
                  let cuuid = rsp.uuid;
                  if (nextParams.gid || nextParams.pid || nextParams.coid) {
                    if (nextParams.gid) {
                      AppCivistAuth.getUUID('group', nextParams.gid).get().$promise.then(rsp => {
                        let guuid = rsp.uuid;
                        if (nextParams.pid) {
                          AppCivistAuth.getUUID('contribution', nextParams.pid).get().$promise.then(rsp => {
                            let puuid = rsp.uuid;
                            // $location.path('/v2/p/assembly/' + auuid + '/campaign/' + cuuid + '/group/' + guuid + '/contribution/' + puuid);
                            $state.go('v2.public.assembly.auuid.campaign.cuuid.workingGroup.guuid.contribution.puuid',
                              {
                                auuid: auuid, cuuid: cuuid, guuid: guuid, puuid: puuid
                              },
                              {
                                reload: true
                              });
                          });
                        } else {
                          // $location.path('/v2/p/assembly/' + auuid + '/campaign/' + cuuid + '/group/' + guuid);
                          $state.go('v2.public.assembly.auuid.campaign.cuuid.workingGroup.guuid.dashboard',
                            {
                              auuid: auuid, cuuid: cuuid, guuid: guuid
                            },
                            {
                              reload: true
                            });
                        }
                      });
                    } else if (nextParams.pid || nextParams.coid) {
                      AppCivistAuth.getUUID('contribution', nextParams.pid ? nextParams.pid : nextParams.coid).get().$promise.then(rsp => {
                        let puuid = rsp.uuid;
                        //$location.path('/v2/p/assembly/' + auuid + '/campaign/' + cuuid + '/contribution/' + puuid);
                        $state.go('v2.public.assembly.auuid.campaign.contribution.couuid',
                          {
                            auuid: auuid, cuuid: cuuid, couuid: puuid
                          },
                          {
                            reload: true
                          });
                      });
                    }
                  } else {
                    // $location.path('/v2/p/assembly/' + auuid + '/campaign/' + cuuid);
                    $state.go('v2.public.assembly.auuid.campaign.cuuid.dashboard',
                      {
                        auuid: auuid, cuuid: cuuid
                      },
                      {
                        reload: true
                      });
                  }
                });
              } else {
                // $location.path('/v2/p/assembly/' + auuid);
                $state.go('v2.public.assembly.auuid.home',
                  {
                    auuid: auuid
                  },
                  {
                    reload: true
                  });
              }
            });
          }
        } else if (authorized === Authorization.enums.NOT_AUTHORIZED) {
          $location.path('/').replace();
        }
      } else {
        if (user) {
          if (nextParams.auuid) {
            AppCivistAuth.getID('assembly', nextParams.auuid).get().$promise.then(rsp => {
              let aid = rsp.id;
              if (nextParams.cuuid) {
                AppCivistAuth.getID('campaign', nextParams.cuuid).get().$promise.then(rsp => {
                  let cid = rsp.id;
                  if (nextParams.guuid || nextParams.puuid || nextParams.couuid) {
                    if (nextParams.guiid) {
                      AppCivistAuth.getID('group', nextParams.guuid).get().$promise.then(rsp => {
                        let gid = rsp.id;
                        if (nextParams.puuid || nextParams.couuid) {
                          AppCivistAuth.getID('contribution', nextParams.puuid ? nextParams.puuid : nextParams.couuid).get().$promise.then(rsp => {
                            let pid = rsp.id;
                            $state.go('v2.assembly.aid.campaign.workingGroup.contribution.coid', {aid:aid, cid:cid, gid:gid, coid:pid}, {reload:true});
                          });
                        } else {
                          $state.go('v2.assembly.aid.campaign.workingGroup.gid', {aid:aid, cid:cid, gid:gid}, {reload:true});
                        }
                      });
                    } else if (nextParams.puuid || nextParams.couuid) {
                      AppCivistAuth.getID('contribution', nextParams.puuid ? nextParams.puuid : nextParams.couuid).get().$promise.then(rsp => {
                        let pid = rsp.id;
                        $state.go('v2.assembly.aid.campaign.contribution.coid', {aid:aid, cid:cid, coid:pid}, {reload:true});
                      });
                    }
                  } else {
                    $state.go('v2.assembly.aid.campaign.cid', {aid: aid, cid: cid}, {reload:true});
                  }
                });
              } else {
                $state.go('v2.assembly.aid.home', {aid: aid}, {reload:true});
              }
            });
          }
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

    $rootScope.$on("$stateChangeSuccess", function (event, currentState, previousState) {
      $window.scrollTo(0, 0);
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
      "www.appcivist.org", "testapp.appcivist.org", "mimove-apps.paris.inria.fr",
        "ourmoneyourvoice.appcivist.org"];
    if (hostname === possibleHosts[0]) {
      return urls.local;
    } else if (hostname === possibleHosts[1] || hostname === possibleHosts[4] || hostname === possibleHosts[6] || hostname === possibleHosts[7]) {
      return urls.production;
    } else if (hostname === possibleHosts[2] || hostname === possibleHosts[5] || hostname === possibleHosts[8]) {
      return urls.testing;
    } else if (hostname === possibleHosts[9]) {
      return urls.mimove;
    } else if (hostname === possibleHosts[10]) {
      return urls.production_louisville;
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
