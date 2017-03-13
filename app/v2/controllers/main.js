(function() {
  'use strict';

  angular
    .module('appCivistApp')
    .controller('v2.MainCtrl', MainCtrl);

  MainCtrl.$inject = [
    '$scope', 'localStorageService', 'Memberships', 'Campaigns', 'Notify',
    '$rootScope', 'loginService', '$translate', '$state', '$stateParams',
    'WorkingGroups'
  ];

  function MainCtrl($scope, localStorageService, Memberships, Campaigns, Notify,
    $rootScope, loginService, $translate, $state, $stateParams, WorkingGroups) {

    activate();

    function activate() {
      $scope.user = localStorageService.get('user');

      if ($scope.user && $scope.user.language) {
        $translate.use($scope.user.language);
      }
      $scope.userIsAuthenticated = loginService.userIsAuthenticated();
      $scope.isLoginPage = $state.is('v2.login') || $state.is('v2.login2');
      $scope.isHomePage = $state.is('v2.homepage');
      $scope.isAssemblyHome = $state.is('v2.assembly.aid.home');
      $scope.showSmallMenu = false;
      $scope.nav = { isActive: false };

      if ($scope.userIsAuthenticated) {
        $scope.currentAssembly = localStorageService.get('currentAssembly');
        loadUserData($scope);

        if ($state.params && $state.params.cid) {
          $scope.currentCampaignId = parseInt($state.params.cid);
        }
      } else {
        if ($stateParams.cuuid && pattern.test($stateParams.cuuid)) {
          $scope.isAnonymous = true;
          $scope.isLoginPage = false;
        }
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
      $scope.isCampaignActive = isCampaignActive.bind($scope);
      $scope.isGroupActive = isGroupActive.bind($scope);
      $scope.fetchGroups = fetchGroups.bind($scope);
    }

    function loadUserData(scope) {
      scope.myWorkingGroups = localStorageService.get('myWorkingGroups');
      scope.ongoingCampaigns = localStorageService.get('ongoingCampaigns');
      scope.assemblies = localStorageService.get('assemblies') || [];

      if (scope.myWorkingGroups == undefined || scope.ongoingCampaigns == undefined) {
        // TODO: Probably better to use here the new Assemblies.setCurrentAssembly method.
        loginService.loadAuthenticatedUserMemberships($scope.user).then(function() {
          location.reload();
        });
      }
    }

    function updateSmallMenu() {
      $scope.showSmallMenu = !$scope.showSmallMenu;
    }

    function toggleNavigation() {
      $scope.nav.isActive = !$scope.nav.isActive;
    }

    function goToLogin() {
      $scope.isLoginPage = true;
      $state.go('v2.login');
    }

    function stateChangeHandler(event) {
      this.nav.isActive = false;
      this.isLoginPage = $state.is('v2.login') || $state.is('v2.login2');
      this.isHomePage = $state.is('v2.homepage');
      this.isAssemblyHome = $state.is('v2.assembly.aid.home');

      this.userIsAuthenticated = loginService.userIsAuthenticated();
      this.userIsAuthenticated = this.userIsAuthenticated === null ? false : this.userIsAuthenticated;

      if ($state.params && $state.params.cid) {
        $scope.currentCampaignId = parseInt($state.params.cid);
      }
      var isCampaignDashboard = $state.is('v2.assembly.aid.campaign.cid');
      if (isCampaignDashboard) {
        loadUserData(this);
        this.fetchGroups();
      }
    }

    /**
     * Checks if the given campaign dashboard is opened.
     * 
     * @param {Object} campaign
     */
    function isCampaignActive(campaign) {
      let assembly = localStorageService.get('currentAssembly');
      return $state.is('v2.assembly.aid.campaign.cid', {
        aid: assembly.assemblyId,
        cid: campaign.campaignId
      });
    }

    /**
     * Checks if the given group dashboard is opened.
     * 
     * @param {Object} group
     */
    function isGroupActive(group) {
      let assembly = localStorageService.get('currentAssembly');
      return $state.is('v2.assembly.aid.group.gid.item', {
        aid: assembly.assemblyId,
        gid: group.groupId
      });
    }


    /**
     * Loads the working group associated with the current campaign.
     */
    function fetchGroups() {
      let vm = this;
      let assembly = localStorageService.get('currentAssembly');
      let membershipsInGroups = localStorageService.get('membershipsInGroups');
      let rsp = WorkingGroups.workingGroupsInCampaign(assembly.assemblyId, this.currentCampaignId).query().$promise;
      rsp.then(
        groups => {
          vm.myWorkingGroups = groups.filter(g => _.find(membershipsInGroups, m => m.workingGroup.groupId === g.groupId));
        }
      );
    }
  }
}());