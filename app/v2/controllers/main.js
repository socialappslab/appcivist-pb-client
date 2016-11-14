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
      loadWorkingGroups($scope);
      loadAllCampaigns($scope);
    }
  }

  function loadWorkingGroups(scope) {
    var rsp = Memberships.workingGroups(scope.user.userId).query();
    rsp.$promise.then(
      function (data) {
        var workingGroups = [];
        angular.forEach(data, function(d) {

          if (d.membershipType === 'GROUP') {
            workingGroups.push(d.workingGroup);
          }
        });
        scope.workingGroups = workingGroups;
      },
      function (error) {
        FlashService.Error('Error loading user\'s working groups from server');
      }
    );
  }

  function loadAllCampaigns(scope) {
    var rsp = Campaigns.campaigns(scope.user.uuid, 'all').query();
    rsp.$promise.then(
      function(data) {
        scope.myCampaigns = data;
      },
      function (error) {
        FlashService.Error('Error loading user\'s campaigns from server');
      }
    );
  }
}
}());
