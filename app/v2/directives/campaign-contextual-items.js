(function() {
  'use strict';

  appCivistApp
    .directive('campaignContextualItems', campaignContextualItems);

  campaignContextualItems.$inject = [
    'Campaigns', 'localStorageService', 'Memberships', '$window', 'Notifications', 'Notify', '$state'
  ];

  function campaignContextualItems(Campaigns, localStorageService, Memberships, $window, Notifications, Notify, $state) {

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
            scope.userIsAssemblyCoordinator = Memberships.rolIn('assembly', scope.assemblyId, 'COORDINATOR');
          }

          scope.myObject = {};
          scope.myObject.refreshMenu = function() {
            scope.showActionMenu = !scope.showActionMenu;
          };

          scope.myObject.subscribe = function() {
            var query = { 'origin': scope.campaign.uuid, 'eventName': 'NEW_CAMPAIGN', 'endPointType': 'email' };
            var subscription = Notifications.subscribe().save(query).$promise.then(
              function() {
                Notify.show('Subscribed successfully', 'success');
              },
              function() {
                Notify.show('Error while trying to communicate with the server', 'error');
              }
            );
          }

          scope.myObject.edit = function() {
            $state.go('v2.assembly.aid.campaign.edit', { aid: scope.assemblyId, cid: scope.campaign.campaignId });
          }
        }
      }
    };
  }
}());