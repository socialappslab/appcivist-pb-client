(function() {
  'use strict';

  angular
    .module('appCivistApp')
    .controller('v2.MainCtrl', MainCtrl);

  MainCtrl.$inject = [
    '$scope', 'localStorageService', 'Memberships', 'Campaigns', 'Notify',
    '$rootScope', 'loginService', '$translate', '$state', '$stateParams',
    'WorkingGroups', 'Assemblies', 'AppCivistAuth', 'Space', 'LocaleService'
  ];

  function MainCtrl($scope, localStorageService, Memberships, Campaigns, Notify,
    $rootScope, loginService, $translate, $state, $stateParams, WorkingGroups, Assemblies,
                    AppCivistAuth, Space, LocaleService) {


    var env = {};

    // Import variables if present (from env.js)
    if(window){
      Object.assign(env, window.__env);
      console.log("Using window.__env in main.js");
    }

    $scope.isCampaignActive = isCampaignActive.bind($scope);
    $scope.isGroupActive = isGroupActive.bind($scope);
    $scope.fetchGroups = fetchGroups.bind($scope);
    $scope.fetchAnonymousGroups = fetchAnonymousGroups.bind($scope);
    $scope.needToRefresh = needToRefresh.bind($scope);
    $scope.signout = signout.bind($scope);
    $scope.loadSigninModal = loadSigninModal.bind($scope);
    $scope.loadSignupModal = loadSignupModal.bind($scope);
    $scope.setSessionModalIsSignIn = setSessionModalIsSignIn .bind($scope);
    $scope.setSessionModalIsSignUp = setSessionModalIsSignUp .bind($scope);
    $scope.redirect = redirect.bind($scope);
    activate();

    function activate() {
      $scope.user = localStorageService.get('user');
      $rootScope.$on('Main::UserWasUpdated', event => {
        $scope.user = localStorageService.get('user');
      })

      if ($scope.user && $scope.user.language) {
        $translate.use($scope.user.language);
        moment.locale($scope.user.language);
        LocaleService.setLocale($scope.user.language);
      }
      $scope.userIsAuthenticated = loginService.userIsAuthenticated();
      $scope.isLoginPage = $state.is('v2.login') || $state.is('v2.login2');
      $scope.isHomePage = $state.is('v2.homepage');
      $scope.isAssemblyHome = $state.is('v2.assembly.aid.home') || $state.is('v2.assembly.aid.fallbackHome') || $state.is('v2.public.assembly.auuid.home');
      $scope.showSmallMenu = false;
      $scope.nav = { isActive: false };
      $scope.groupsAreShown = false;
      $scope.campaignId = $state.params.cid ? parseInt($state.params.cid) : 0;

      if ($scope.userIsAuthenticated) {
        $scope.currentAssembly = localStorageService.get('currentAssembly');
        var rsp = Space.configsByUUID($scope.currentAssembly.resourcesResourceSpaceUUID).get();
        rsp.$promise.then(
          configs => {
            $scope.assemblyConfigs = configs;
            $scope.signupsEnabled = configs["appcivist.assembly.disable-new-memberships"] === "false";
          }
        );


        if ($state.params && $state.params.cid) {
          $scope.currentCampaignId = parseInt($state.params.cid);
        }
        loadUserData($scope);
      } else if ($state.params && $state.params.cuuid) {
        $scope.isAnonymous = true;
        $scope.isLoginPage = false;
        $scope.currentCampaignUuid = $state.params.cuuid;
        $scope.currentAssemblyUuid = $state.params.auuid;
        // load all the puboic working group of the campaign
        fetchAnonymousGroups($scope);
        fetchAnonymousAssembly($scope);
      }
      $scope.updateSmallMenu = updateSmallMenu;
      $scope.toggleNavigation = toggleNavigation;
      $scope.goToLogin = goToLogin;
      $rootScope.$on('$stateChangeSuccess', stateChangeHandler.bind($scope));

      if ($scope.userIsAuthenticated && $scope.currentAssembly) {
        var assemblyRols = Memberships.assemblyRols($scope.currentAssembly.assemblyId);
        if (assemblyRols) {
          $scope.isAssemblyCoordinator = Memberships.rolIn('assembly', $scope.currentAssembly.assemblyId, 'COORDINATOR');
        } else {
          loginService.loadAuthenticatedUserMemberships().then(function() {
            $scope.isAssemblyCoordinator = Memberships.rolIn('assembly', $scope.currentAssembly.assemblyId, 'COORDINATOR');
          });
        }
      }
      // TODO: read the following from the instance main assembly settings in the server
      $scope.creationPatternsEnabled = false;
      $scope.$on("SessionModal:setSessionModalIsSignIn",$scope.setSessionModalIsSignIn);
      $scope.$on("SessionModal:setSessionModalIsSignUp",$scope.setSessionModalIsSignUp);
      $scope.siteLogo = env.siteLogo;
      console.log("Using siteLogo = "+$scope.siteLogo);
    }

    function setSessionModalIsSignIn () {
      $scope.sessionModalIsSignIn = true;
    }

    function setSessionModalIsSignUp () {
      $scope.sessionModalIsSignIn = false;
    }

    function redirect() {
      let currentAssembly = localStorageService.get('currentAssembly');
      let auuid = currentAssembly.uuid;
      if ($state.params.cid) {
        let currentCampaign = localStorageService.get('currentCampaign');
        let cuuid = currentCampaign.uuid;
        if ($state.params.coid) {
          let currentContribution = localStorageService.get('currentContribution');
          let couuid = currentContribution.uuid;
          localStorageService.clearAll();
          $state.go("v2.public.assembly.auuid.campaign.contribution.couuid",
            {auuid: auuid, cuuid: cuuid, couuid: couuid});
        } else if ($state.params.gid) {
          let currentGroup = localStorageService.get('currentWorkingGroup');
          let guuid = null;
          if (currentGroup != null && currentGroup != undefined)
            guuid = currentGroup.uuid;
          if ($state.params.pid) {
            let currentContribution = localStorageService.get('currentContribution');
            let puuid = currentContribution.uuid;
            if ((currentGroup === null || currentGroup === undefined) && $state.params.gid ) {
              guuid = currentContribution.workingGroupAuthors ? currentContribution.workingGroupAuthors[0].uuid : null;
            }
            localStorageService.clearAll();
            $state.go("v2.public.assembly.auuid.campaign.cuuid.workingGroup.guuid.proposal.puuid",
              {auuid: auuid, cuuid: cuuid, guuid: guuid, puuid: puuid},
              {reload: true});
          } else {
            localStorageService.clearAll();
            $state.go("v2.public.assembly.auuid.campaign.cuuid.workingGroup.guuid.dashboard",
            {auuid: auuid, cuuid: cuuid, guuid: guuid},
            {reload: true});
          }
        } else {
          localStorageService.clearAll();
          $state.go("v2.public.assembly.auuid.campaign.cuuid.dashboard",
            {auuid: auuid, cuuid: cuuid},
            {reload: true});
        }
        location.reload();
      } else  {
//        $state.go("v2.public.assembly.auuid.home", {auuid: auuid}, {reload: 'v2.public.assembly.auuid.home'});
        window.history.back();
        let serverUrl = localStorageService.get('serverBaseUrl');
        localStorageService.clearAll();
        localStorageService.set('serverBaseUrl', serverUrl);
      }
    }

    function signout () {
      var rsp = AppCivistAuth.signOut().save();
      rsp.$promise.then(redirect, redirect);
    }

    function loadSigninModal () {
      $scope.sessionModalIsSignIn = true;
      $('#sessionModal').modal('show');
    }

    function loadSignupModal () {
      $scope.sessionModalIsSignIn = false;
      $('#sessionModal').modal('show');
    }

    /**
     *
     * @param {Object} scope -  component scope
     */
    function loadUserData(scope) {
      let myWorkingGroups = localStorageService.get('myWorkingGroups');
      let topicsWorkingGroups = localStorageService.get('topicsWorkingGroups');

      if (scope.needToRefresh(myWorkingGroups)) {
        Assemblies.setCurrentAssembly(parseInt($state.params.aid)).then(response => {
          scope.ongoingCampaigns = localStorageService.get('ongoingCampaigns');
          var current = scope.ongoingCampaigns ? scope.ongoingCampaigns.filter(c => { return c.campaignId == $scope.currentCampaignId }) : undefined;
          $scope.currentCampaignUuid = current ? current.length > 0 ? current[0].uuid : '' : '';
          scope.assemblies = localStorageService.get('assemblies') || [];
          scope.fetchGroups().then(response => {
            scope.topicsWorkingGroups = localStorageService.get('topicsWorkingGroups');
          });
        });
      } else {
        scope.ongoingCampaigns = localStorageService.get('ongoingCampaigns');
        var current = scope.ongoingCampaigns ? scope.ongoingCampaigns.filter(c => { return c.campaignId == $scope.currentCampaignId }) : undefined;
        $scope.currentCampaignUuid = current ? current.length > 0 ? current[0].uuid : '' : '';
        scope.assemblies = localStorageService.get('assemblies') || [];
        scope.myWorkingGroups = localStorageService.get('myWorkingGroups');
        scope.topicsWorkingGroups = localStorageService.get('topicsWorkingGroups');
        scope.fetchGroups(scope);
      }
    }

    /**
     *
     * @param {Object} scope -  component scope
     */
    function fetchAnonymousGroups(scope) {
      let rsp = WorkingGroups.workingGroupsInCampaignByUUID(scope.currentCampaignUuid).query().$promise;
      return rsp.then(
        groups => {
          localStorageService.set('otherWorkingGroups', groups);
          scope.otherWorkingGroups = groups;
          return groups;
        }
      );
    }


    function fetchAnonymousAssembly(scope) {
      let rsp = Assemblies.assemblyByUUID(scope.currentAssemblyUuid).get().$promise;
      return rsp.then(
        assembly => {
          scope.anonymousAssembly = assembly;
          localStorageService.set('anonymousAssembly',assembly);
          rsp = Space.configsByUUID(assembly.resourcesResourceSpaceUUID).get();
          rsp.$promise.then(
            configs => {
              scope.assemblyConfigs = configs;
              $scope.signupsEnabled = configs["appcivist.assembly.disable-new-memberships"] === "false";
            }
          );
          return assembly;
        }
      );
    }

    function updateSmallMenu() {
      $scope.showSmallMenu = !$scope.showSmallMenu;
    }

    function toggleNavigation() {
      $scope.nav.isActive = !$scope.nav.isActive;
    }

    function goToLogin() {
      $scope.isLoginPage = true;
      let currentCampaign = localStorageService.get('currentCampaign');
      let domain = currentCampaign.assemblyShortname ? currentCampaign.assemblyShortname[0] : null;
      $scope.loadSigninModal();
      // if(!domain) {
      //   $state.go('v2.login')
      // } else {
      //   $state.go('v2.login2', { domain:domain }, { reload:true });
      // }
    }

    function stateChangeHandler(event) {
      // Check state variables
      this.nav.isActive = false;
      this.isLoginPage = $state.is('v2.login') || $state.is('v2.login2');
      this.isHomePage = $state.is('v2.homepage');
      this.isAssemblyHome = $state.is('v2.assembly.aid.home') || $state.is('v2.assembly.aid.fallbackHome') || $state.is('v2.public.assembly.auuid.home');

      this.userIsAuthenticated = loginService.userIsAuthenticated();
      this.userIsAuthenticated = this.userIsAuthenticated === null ? false : this.userIsAuthenticated;

      // TODO: with the new menu, we no longer need to refresh user data, so review this to remove unrelevant parts
      // Check variables related to the campaign
      if ($state.params && $state.params.cid) {
        $scope.currentCampaignId = parseInt($state.params.cid);
        var ongoing = localStorageService.get('ongoingCampaigns');
        var current = ongoing.filter(c => { return c.campaignId == $scope.currentCampaignId });
        $scope.currentCampaignUuid = current && current[0] && current[0].uuid ? current[0].uuid : "";
        if (!$scope.currentCampaignUuid) {
          let currentCampaign = localStorageService.get('currentCampaign');
          $scope.currentCampaignUuid = currentCampaign && currentCampaign.uuid ? currentCampaign.uuid : "";
        }
      }

      // Check variables related to the current assembly
      if (this.userIsAuthenticated) {
        if (!this.currentAssembly) {
          this.currentAssembly = localStorageService.get("currentAssembly");
        }
      } else {
        if (!this.anonymousAssembly) {
          this.currentAssemblyUuid = $state.params.auuid;
          this.anonymousAssembly = localStorageService.get("anonymousAssembly");
          if (!this.anonymousAssembly) {
            fetchAnonymousAssembly(this);
          }
        }
      }
      // Load data for the campaign dashboard that is relevant to the header an footer
      if (this.isCampaignDashboard) {
        loadUserData($scope);
      }
    }

    /**
     * Checks if the given campaign dashboard is opened.
     *
     * @param {Object} campaign
     */
    function isCampaignActive(campaign) {
      let assembly = localStorageService.get('currentAssembly');
      let state = $state.is('v2.assembly.aid.campaign.cid', {
        aid: assembly.assemblyId,
        cid: campaign.campaignId
      });
      let campaignOnPath = $state.params ? $state.params.cid === campaign.campaignId +"" : false;
      return  state || campaignOnPath;
    }

    /**
     * Checks if the given group dashboard is opened.
     *
     * @param {Object} group
     */
    function isGroupActive(group) {
      let assembly = localStorageService.get('currentAssembly');
      return $state.is('v2.assembly.aid.campaign.workingGroup.gid', {
        aid: assembly.assemblyId,
        gid: group.groupId,
        cid: this.campaignId
      });
    }


    /**
     * Loads the working group associated with the current campaign.
     */
    function fetchGroups(scope) {
      let vm = this;
      let assembly = localStorageService.get('currentAssembly');
      let membershipsInGroups = localStorageService.get('membershipsInGroups');
      let rsp = WorkingGroups.workingGroupsInCampaign(assembly.assemblyId, this.currentCampaignId).query().$promise;
      return rsp.then(
        groups => {
          vm.myWorkingGroups = groups.filter(g => _.find(membershipsInGroups, m => m.workingGroup.groupId === g.groupId));
          localStorageService.set('myWorkingGroups', vm.myWorkingGroups.filter(g => g.isTopic === false));
          vm.otherWorkingGroups = groups.filter(g => !_.find(membershipsInGroups, m => m.workingGroup.groupId === g.groupId));
          localStorageService.set('otherWorkingGroups', vm.otherWorkingGroups);
          vm.topicsWorkingGroups = groups.filter(g => g.isTopic === true);
          localStorageService.set('topicsWorkingGroups', vm.topicsWorkingGroups);
          scope.myWorkingGroups = vm.myWorkingGroups;
          scope.otherWorkingGroups = vm.otherWorkingGroups;
          scope.topicsWorkingGroups = vm.topicsWorkingGroups;
          return groups;
        }
      );
    }

    /**
     * Based on the given working groups, checks if user data should be refreshed. This
     * refreshing only happens when we move from one campaign to another or after we create
     * a new WG.
     *
     * @param {Object[]} workingGroups
     */
    function needToRefresh(workingGroups) {

      if ($state.is('v2.assembly.aid.campaign.cid')) {
        if (workingGroups) {
          const campaignId = parseInt($state.params.cid);
          workingGroups.forEach((group, index) => { // See arrow functions
            if (group.campaigns) {
              return group.campaigns[0] !== campaignId;
            }
          });
        }
      }
      return false;
    }
  }
}());
