(function () {
  'use strict';

  /**
   * Directive that displays up/down feedback buttons.
   */
  appCivistApp
    .directive('contributionFeedback', ContributionFeedback);

  ContributionFeedback.$inject = [
    'Contributions', 'localStorageService', 'Memberships', '$compile', 'Notify', '$rootScope'
  ];

  function ContributionFeedback(Contributions, localStorageService, Memberships, $compile, Notify, $rootScope) {
    return {
      restrict: 'E',
      scope: {
        contribution: '=',
        // true | false, indicates that we should display delete button.
        withDelete: '@',
        // true | false, indicates that we should display flag button.
        withFlag: '@',
        // the target view. Current options: card.
        view: '@'
      },
      templateUrl: '/app/v2/partials/directives/contribution-feedback.html',
      link: function (scope, element, attrs) {
        var user = localStorageService.get('user');
        // Read user contribution feedback
        scope.userFeedback = { 'up': false, 'down': false, 'fav': false, 'flag': false };
        scope.isAnonymous = true;
        scope.isCardView = scope.view === 'card';
        scope.moderationSuccess = moderationSuccess.bind(scope);
        scope.showModerationForm = showModerationForm.bind(scope);

        if (user) {
          scope.assembly = localStorageService.get('currentAssembly');
          scope.campaign = localStorageService.get('currentCampaign');
          scope.isAssemblyCoordinator = Memberships.isAssemblyCoordinator(scope.assembly.assemblyId);
          scope.isMemberOfAssembly = Memberships.isMember('assembly', scope.assembly.assemblyId);
          scope.isAnonymous = false;
        }
        scope.contribution.totalComments = scope.contribution.commentCount + scope.contribution.forumCommentCount;

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

          scope.userFeedback.type = 'MEMBER';
          scope.userFeedback.status = 'PUBLIC';

          var feedback = Contributions.userFeedback(scope.assembly.assemblyId, scope.campaign.campaignId, scope.contribution.contributionId).update(scope.userFeedback);
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

        /**
         * Displays the moderation form.
         *
         * @param {string} context - delete | flag
         */
        function showModerationForm(context) {
          this.moderationContext = context;
          this.vexInstance = vex.open({
            className: "vex-theme-plain",
            unsafeContent: $compile(document.getElementById('moderationForm').innerHTML)(scope)[0]
          });
        }

        function moderationSuccess() {
          this.vexInstance.close();
          $rootScope.$emit('refreshList', 'refresh');
        }
      }
    };
  }
}());