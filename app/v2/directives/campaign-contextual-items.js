(function() {
  'use strict';

  appCivistApp
    .directive('campaignContextualItems', campaignContextualItems);

  campaignContextualItems.$inject = [
    'Campaigns', 'localStorageService', 'Memberships', '$window', 'Notifications', 'Notify'
  ];

  function campaignContextualItems(Campaigns, localStorageService, Memberships, $window, Notifications, Notify) {

    function hasRole(roles, roleName) {
      var result = false;

      angular.forEach(roles, function(role) {
        if (role.name === roleName) {
          result = true;
        }
      });
      return result;
    }

    function setupMembershipInfo(scope) {
      var rsp = Memberships.membershipInAssembly(scope.assemblyId, scope.user.userId).get();
      rsp.$promise.then(function(data) {
        // TODO ASK THIS ONCE SOMEWHERE ELSE AND STORE IN LOCAL STORAGE
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
      link: function(scope, element, attrs) {

        scope.$watch('campaign', function(newVal) {
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
          scope.myObject.refreshMenu = function() {
            scope.showActionMenu = !scope.showActionMenu;
          };
          // TODO: add logic for menu items
          // TODO: 1. Edit Campaign
          // Todo: 2. Add Resource to campaign

          scope.myObject.subscribe = function() {
            var query = { "origin": scope.campaign.uuid, "eventName": "NEW_CAMPAIGN", "endPointType": "email" };
            var subscription = Notifications.subscribe().save(query).$promise.then(
              function() {
                Notify.show('Subscribed successfully', 'success');
              },
              function() {
                Notify.show('Error while trying to communicate with the server', 'error');
              }
            );
          }
        }
      }
    };
  }
}());