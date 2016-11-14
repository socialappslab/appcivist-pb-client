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
    
    if ($scope.userIsAuthenticated) {
      $scope.currentAssembly = localStorageService.get('currentAssembly');
      loadWorkingGroups($scope);
      loadAllCampaigns($scope);
    }
  }

  function loadWorkingGroups(scope) {
    scope.myWorkingGroups = localStorageService.get('myWorkingGroups');
  }

  function loadAllCampaigns(scope) {
    scope.ongoingCampaigns = localStorageService.get('ongoingCampaigns');
  }
}
}());
