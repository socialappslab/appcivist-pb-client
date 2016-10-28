(function() {
'use strict';

appCivistApp
  .directive('navigationBar',  NavigationBar);

NavigationBar.$inject = [
  'localStorageService', 'Memberships', 'Campaigns', 'FlashService'
];

function NavigationBar(localStorageService, Memberships, Campaigns, FlashService) {
  
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

  return {
    restrict: 'AE',
    templateUrl: '/app/v2/partials/directives/navigation-bar.html',
    link: function postLink(scope, element, attrs) {
      scope.user = localStorageService.get('user');
      loadWorkingGroups(scope);
      loadAllCampaigns(scope);
    }
  };
}
}());
