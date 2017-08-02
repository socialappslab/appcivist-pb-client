(function() {
  'use strict';

  angular
    .module('appCivistApp')
    .controller('v2.MainCtrl', MainCtrl);

  MainCtrl.$inject = [
    '$scope', 'localStorageService', 'Memberships', 'Campaigns', 'Notify',
    '$rootScope', 'loginService', '$translate', '$state', '$stateParams',
    'WorkingGroups', 'Assemblies'
  ];

  function MainCtrl($scope, localStorageService, Memberships, Campaigns, Notify,
    $rootScope, loginService, $translate, $state, $stateParams, WorkingGroups, Assemblies) {

    $scope.isCampaignActive = isCampaignActive.bind($scope);
    $scope.isGroupActive = isGroupActive.bind($scope);
    $scope.fetchGroups = fetchGroups.bind($scope);
    $scope.fetchAnonymousGroups = fetchAnonymousGroups.bind($scope);
    $scope.needToRefresh = needToRefresh.bind($scope);
    activate();

    function activate() {
      $scope.user = localStorageService.get('user');

      if ($scope.user && $scope.user.language) {
        $translate.use($scope.user.language);
      }
      $scope.userIsAuthenticated = loginService.userIsAuthenticated();
      $scope.isLoginPage = $state.is('v2.login') || $state.is('v2.login2');
      $scope.isHomePage = $state.is('v2.homepage');
      $scope.isAssemblyHome = $state.is('v2.assembly.aid.home') || $state.is('v2.assembly.aid.fallbackHome');
      $scope.showSmallMenu = false;
      $scope.nav = { isActive: false };
      $scope.groupsAreShown = false;
      $scope.campaignId = $state.params.cid ? parseInt($state.params.cid) : 0;

      if ($scope.userIsAuthenticated) {
        $scope.currentAssembly = localStorageService.get('currentAssembly');
        if ($state.params && $state.params.cid) {
          $scope.currentCampaignId = parseInt($state.params.cid);
        }
        loadUserData($scope);
      } else if ($state.params && $state.params.cuuid) {
        $scope.isAnonymous = true;
        $scope.isLoginPage = false;
        $scope.currentCampaignUuid = $state.params.cuuid;
        // load all the puboic working group of the campaign
        fetchAnonymousGroups($scope);
      }
      $scope.updateSmallMenu = updateSmallMenu;
      $scope.toggleNavigation = toggleNavigation;
      $scope.goToLogin = goToLogin;
      $rootScope.$on('$stateChangeSuccess', stateChangeHandler.bind($scope));

      if ($scope.currentAssembly) {
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
          var current = scope.ongoingCampaigns.filter(c => { return c.campaignId == $scope.currentCampaignId });
          $scope.currentCampaignUuid = current.length > 0 ? current[0].uuid : '';
          scope.assemblies = localStorageService.get('assemblies') || [];
          scope.fetchGroups().then(response => {
            scope.topicsWorkingGroups = localStorageService.get('topicsWorkingGroups');
          });
        });
      } else {
        scope.ongoingCampaigns = localStorageService.get('ongoingCampaigns');
        var current = scope.ongoingCampaigns.filter(c => { return c.campaignId == $scope.currentCampaignId });
        $scope.currentCampaignUuid = current.length > 0 ? current[0].uuid : '';
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
      if(!domain) {
        $state.go('v2.login')
      } else {
        $state.go('v2.login2', { domain:domain }, { reload:true });
      }
    }

    function stateChangeHandler(event) {
      this.nav.isActive = false;
      this.isLoginPage = $state.is('v2.login') || $state.is('v2.login2');
      this.isHomePage = $state.is('v2.homepage');
      this.isAssemblyHome = $state.is('v2.assembly.aid.home') || $state.is('v2.assembly.aid.fallbackHome');

      this.userIsAuthenticated = loginService.userIsAuthenticated();
      this.userIsAuthenticated = this.userIsAuthenticated === null ? false : this.userIsAuthenticated;

      if ($state.params && $state.params.cid) {
        $scope.currentCampaignId = parseInt($state.params.cid);
        var ongoing = localStorageService.get('ongoingCampaigns');
        var current = ongoing.filter(c => { return c.campaignId == $scope.currentCampaignId });
        $scope.currentCampaignUuid = current[0].uuid;
      }
      var isCampaignDashboard = $state.is('v2.assembly.aid.campaign.cid');

      if (isCampaignDashboard) {
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
      return $state.is('v2.assembly.aid.campaign.workingGroup.gid.dashboard', {
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
     * refreshing only happens when we move from one campaign to another.
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
