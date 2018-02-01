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
        contribution: '=',
        vexInstance: '='
      },
      templateUrl: '/app/v2/partials/directives/history-modal.html',
      link: function postLink(scope, element, attrs) {
        scope.currentUser = localStorageService.get('user');

        if (scope.currentUser) {
          var currentAssembly = localStorageService.get('currentAssembly');
          scope.assemblyID = currentAssembly != null ? currentAssembly.assemblyId : 1;
        }

        scope.signout = function() {
          var rsp = AppCivistAuth.signOut().save();
          rsp.$promise.then(redirect, redirect);
        };

        var getResourceSpace = function(resourceSpaceId) {
          return Space.getSpace(resourceSpaceId).get();
        }

        scope.vm = {};
        scope.$watch('vexInstance', function(newValue, oldValue) {
          if (newValue) {
            var rsp;
            if (scope.currentUser) {
              rsp = Contributions.contributionHistory(scope.assemblyID, scope.contribution.contributionId).query().$promise;
            } else {
              rsp = Contributions.contributionHistoryByUUID(scope.contribution.uuid);
            }
            rsp.then(
              function(response) {

                _.forEach(response, function(element) {
                  if (element.changes) {
                    _.forEach(element.changes.associationChanges, function (change) {
                      change.resource = getResourceSpace(change.resourceSpaceId);
                    });
                  }
                });

                scope.vm.historyElements = response;
              },
              function(error) {
                Notify.show(error.statusMessage, 'error');
              }
            );
          }
        });
      }
    };
  }
}());
