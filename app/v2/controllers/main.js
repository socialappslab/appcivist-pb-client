(function() {
  'use strict';

  angular
    .module('appCivistApp')
    .controller('v2.MainCtrl', MainCtrl);

  MainCtrl.$inject = [
    '$scope', 'localStorageService', 'Memberships', 'Campaigns', 'Notify',
    '$rootScope', 'loginService', '$translate', '$state', '$stateParams'
  ];

  function MainCtrl($scope, localStorageService, Memberships, Campaigns, Notify,
    $rootScope, loginService, $translate, $state, $stateParams) {

    activate();

    function activate() {
      $scope.user = localStorageService.get('user');
      if ($scope.user && $scope.user.language)
        $translate.use($scope.user.language);
      $scope.userIsAuthenticated = loginService.userIsAuthenticated();
      $scope.userIsAuthenticated = $scope.userIsAuthenticated === null ? false : $scope.userIsAuthenticated;
      $scope.isLoginPage = $state.is('v2.login') || $state.is('v2.login2');
      $scope.showSmallMenu = false;
      $scope.nav = { isActive: false };

      if ($scope.userIsAuthenticated) {
        $scope.currentAssembly = localStorageService.get('currentAssembly');
        loadUserData($scope);
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
    }

    function loadUserData(scope) {
      scope.myWorkingGroups = localStorageService.get('myWorkingGroups');
      scope.ongoingCampaigns = localStorageService.get('ongoingCampaigns');
      scope.assemblies = localStorageService.get('assemblies') || [];

      if (scope.myWorkingGroups == undefined || scope.ongoingCampaigns == undefined) {
        console.log('se vuelve a cargar todo!');
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
      this.isLoginPage = $state.is('v2.login');
      this.userIsAuthenticated = loginService.userIsAuthenticated();
      this.userIsAuthenticated = this.userIsAuthenticated === null ? false : this.userIsAuthenticated;
    }
  }
}());