(function() {
  'use strict';

  appCivistApp
    .directive('wgroupContextualItems', wgroupContextualItems);

  wgroupContextualItems.$inject = [
    'Campaigns', 'localStorageService', 'Memberships', '$window', 'Notifications', 'Notify', '$state'
  ];

  function wgroupContextualItems(Campaigns, localStorageService, Memberships, $window, Notifications, Notify, $state) {

    function setupMembershipInfo(scope) {
      scope.userIsAssemblyCoordinator = Memberships.rolIn('assembly', scope.assemblyId, 'COORDINATOR');
      scope.userIsGroupCoordinator = Memberships.rolIn('group', scope.wgroup.groupId, 'COORDINATOR');
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
          scope.vm = {};
          ModalMixin.init(scope.vm);

          if (!scope.isAnonymous) {
            scope.assemblyId = localStorageService.get('currentAssembly').assemblyId;
            setupMembershipInfo(scope);
          }

          scope.vm.refreshMenu = function() {
            scope.showActionMenu = !scope.showActionMenu;
          };
          // TODO: add logic for menu items
          // TODO: 1. Edit WGroup
          // Todo: 2. Add Resource to wgroup

          scope.vm.subscribe = function() {
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

          scope.vm.edit = function() {
            $state.go('v2.assembly.aid.campaign.workingGroup.gid.edit', { aid: scope.assemblyId, cid: $state.params.cid, gid: scope.wgroup.groupId });
          }

          scope.vm.onEditVotingSuccess = function() {
            this.closeModal('configureBallotForm');
            $window.location.reload();
          }
        }
      }
    };
  }
}());