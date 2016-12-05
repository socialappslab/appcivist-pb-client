(function () {
  'use strict';

  appCivistApp
    .directive('campaignContextualItems', campaignContextualItems);

  campaignContextualItems.$inject = [
    'Campaigns', 'localStorageService', 'Memberships', '$window'
  ];

  function campaignContextualItems(Campaigns, localStorageService, Memberships, $window) {

    function hasRole(roles, roleName) {
      var result = false;

      angular.forEach(roles, function (role) {
        if (role.name === roleName) {
          result = true;
        }
      });
      return result;
    }

    function setupMembershipInfo(scope) {
      var rsp = Memberships.membershipInAssembly(scope.assemblyId, scope.user.userId).get();
      rsp.$promise.then(function (data) {
        scope.userIsAssemblyCoordinator = hasRole(data.roles, 'COORDINATOR');
      });
    }

    function toggleContextualMenu() {
      this.showContextualMenu = !this.showContextualMenu;
    }

    return {
      restrict: 'E',
      scope: {
        campaign: '='
      },
      templateUrl: '/app/v2/partials/directives/campaign-contextual-items.html',
      link: function (scope, element, attrs) {

        scope.$watch('campaign', function (newVal) {
          if (newVal) {
            init();
          }
        });

        function init() {
          scope.cm = { isHover: false };
          scope.user = localStorageService.get('user');
          scope.isAnonymous = !scope.user;
          if (!scope.isAnonymous) {
            scope.assemblyId = localStorageService.get('currentAssembly').assemblyId;
            setupMembershipInfo(scope);
          }

          scope.myObject = {};
          scope.myObject.refreshMenu = function () {
            scope.showActionMenu = !scope.showActionMenu;
          };
          // TODO: add logic for menu items
          // TODO: 1. Edit Campaign
          // Todo: 2. Add Resource to campaign
        }
      }
    };
  }
} ());
