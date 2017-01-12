(function() {
  'use strict';

  appCivistApp
    .directive('historyModal', HistoryModal);

  HistoryModal.$inject = [
    'localStorageService', 'AppCivistAuth', '$state', 'Contributions', 'Space'
  ];

  function HistoryModal(localStorageService, AppCivistAuth, $state, Contributions, Space) {

    function redirect() {
      localStorageService.clearAll();
      $state.go('v2.login', null, { reload: true }).then(function() {
        location.reload();
      });
    }

    return {
      restrict: 'E',
      scope: {
        user: '=',
        contribution: '=',
        vexInstance: '='
      },
      templateUrl: '/app/v2/partials/directives/history-modal.html',
      link: function postLink(scope, element, attrs) {
        scope.currentUser = scope.user;

        scope.$watch('user', function(newVal) {
          if (newVal) {
            scope.currentUser = newVal;
          }
        });

        if (!scope.user) {
          scope.currentUser = localStorageService.get('user');
        }

        scope.signout = function() {
          var rsp = AppCivistAuth.signOut().save();
          rsp.$promise.then(redirect, redirect);
        };

        var currentAssembly = localStorageService.get('currentAssembly');
        scope.assemblyID = currentAssembly != null ? currentAssembly.assemblyId : 1;

        var getResourceSpace = function(resourceSpaceId) {
          return Space.getSpace(resourceSpaceId).get();
        }

        scope.vm = {};
        scope.$watch('vexInstance', function(newValue, oldValue) {
          if (newValue) {
            var rsp = Contributions.contributionHistory(scope.assemblyID, scope.contribution.contributionId).query();
            rsp.$promise.then(function(response) {

              _.forEach(response, function(element) {
                _.forEach(element.changes.associationChanges, function(change) {
                  change.resource = getResourceSpace(change.resourceSpaceId);
                });
              });

              scope.vm.historyElements = response;
            });
          }
        });
      }
    };
  }
}());