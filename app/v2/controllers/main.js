(function() {
'use strict';

angular
  .module('appCivistApp')
  .controller('v2.MainCtrl', MainCtrl);

MainCtrl.$inject = [
  '$scope', 'localStorageService', 'Memberships', 'Campaigns', 'FlashService',
  '$rootScope', 'loginService'
];

function MainCtrl($scope, localStorageService, Memberships, Campaigns, FlashService,
                  $rootScope, loginService) {

  activate();

  function activate() {
    $rootScope.ui = {
      v2: true
    };
    $scope.user = localStorageService.get('user');
    $scope.userIsAuthenticated = loginService.userIsAuthenticated();
    $scope.isLoginPage = location.hash.includes('v2/login');
    $scope.showSmallMenu = false;
    $scope.nav = {isActive: false};

    if ($scope.userIsAuthenticated) {
      $scope.currentAssembly = localStorageService.get('currentAssembly');
      loadUserData($scope);
    }
    $scope.updateSmallMenu = updateSmallMenu;
    $scope.toggleNavigation = toggleNavigation;
  }

  function loadUserData(scope) {
    scope.myWorkingGroups = localStorageService.get('myWorkingGroups');
    scope.ongoingCampaigns = localStorageService.get('ongoingCampaigns');
    scope.assemblies = localStorageService.get('assemblies') || [];

    if(!scope.myWorkingGroups || !scope.ongoingCampaigns) {
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
}
}());
