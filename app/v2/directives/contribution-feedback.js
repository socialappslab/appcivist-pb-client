(function () {
  'use strict';

  /**
   * Directive that displays up/down feedback buttons.
   */
  appCivistApp
    .directive('contributionFeedback', ContributionFeedback);

  ContributionFeedback.$inject = [
    'Contributions', 'localStorageService'
  ];

  function ContributionFeedback(Contributions, localStorageService) {
    return {
      restrict: 'E',
      scope: {
        contribution: '='
      },
      templateUrl: '/app/v2/partials/directives/contribution-feedback.html',
      link: function (scope, element, attrs) {
        // Read user contribution feedback
        scope.userFeedback = { 'up': false, 'down': false, 'fav': false, 'flag': false };
        var assembly = localStorageService.get('currentAssembly');
        var user = localStorageService.get('user');

        // Feedback update
        scope.updateFeedback = function (value) {
          if (!user) {
            return;
          }

          if (value === 'up') {
            scope.userFeedback.up = true;
            scope.userFeedback.down = false;
          } else if (value === 'down') {
            scope.userFeedback.up = false;
            scope.userFeedback.down = true;
          } else if (value === 'fav') {
            scope.userFeedback.fav = true;
          } else if (value === 'flag') {
            scope.userFeedback.flag = true;
          } else if (value === undefined) {
            if (scope.userFeedback.up == scope.userFeedback.down) {
              scope.userFeedback.up = true;
              scope.userFeedback.down = false;
            } else {
              scope.userFeedback.up = !scope.userFeedback.up;
              scope.userFeedback.down = !scope.userFeedback.down;
            }
          }

          var feedback = Contributions.userFeedback(assembly.assemblyId, scope.contribution.contributionId).update(scope.userFeedback);
          feedback.$promise.then(
            function (newStats) {
              scope.contribution.stats = newStats;
              scope.contribution.informalScore = Contributions.getInformalScore(scope.contribution);
            },
            function (error) {
              Notify.show('Error when updating user feedback', 'error');
            }
          );
        };
      }
    };
  }
} ());