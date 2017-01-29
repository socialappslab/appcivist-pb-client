(function() {
  'use strict';

  appCivistApp
    .directive('wgroupContextualItems', wgroupContextualItems);

  wgroupContextualItems.$inject = [
    'Campaigns', 'localStorageService', 'Memberships', '$window', 'Notifications', 'Notify', '$state'
  ];

  function wgroupContextualItems(Campaigns, localStorageService, Memberships, $window, Notifications, Notify, $state) {

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
        wgroup: '='
      },
      templateUrl: '/app/v2/partials/directives/wgroup-contextual-items.html',
      link: function(scope, element, attrs) {

        scope.$watch('wgroup', function(newVal) {
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
          // TODO: 1. Edit WGroup
          // Todo: 2. Add Resource to wgroup

          scope.myObject.subscribe = function() {
            var query = { "origin": scope.wgroup.uuid, "eventName": "NEW_WORKING_GROUP", "endPointType": "email" };
            var subscription = Notifications.subscribe().save(query);
            subscription.$promise.then(
              function() {
                Notify.show('Subscribed successfully', 'success');
              },
              function() {
                Notify.show('Error while trying to communicate with the server', 'error');
              }
            );
          }

          scope.myObject.edit = function() {
            // TODO how to recover the campaign, for now we read the first one
            $state.go("v2.assembly.aid.campaign.workingGroup.gid.edit", { aid: scope.assemblyId, cid: scope.wgroup.campaigns[0], gid: scope.wgroup.groupId});
          }
        }
      }
    };
  }
}());
