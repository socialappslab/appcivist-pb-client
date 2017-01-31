(function() {
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
        withFlag: '@'
      },
      templateUrl: '/app/v2/partials/directives/contribution-feedback.html',
      link: function(scope, element, attrs) {
        var user = localStorageService.get('user');
        // Read user contribution feedback
        scope.userFeedback = { 'up': false, 'down': false, 'fav': false, 'flag': false };

        if (user) {
          scope.assembly = localStorageService.get('currentAssembly');
          scope.isAssemblyCoordinator = Memberships.isAssemblyCoordinator(scope.assembly.assemblyId);
          scope.isMemberOfAssembly = Memberships.isMember('assembly', scope.assembly.assemblyId);
        }
        scope.showModerationForm = showModerationForm.bind(scope);
        scope.submitModerationForm = submitModerationForm.bind(scope);
        scope.submitDelete = submitDelete.bind(scope);
        scope.submitFlag = submitFlag.bind(scope);
        scope.moderationReasons = [
          'It\'s spam',
          'Violates the assembly commenting policy',
          'It is disrespectful towards other people',
          'Attacks others personally',
          'Other'
        ];

        // Feedback update
        scope.updateFeedback = function(value) {
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

          scope.userFeedback.type='MEMBER';
          scope.userFeedback.status='PUBLIC';

          var feedback = Contributions.userFeedback(scope.assembly.assemblyId, scope.contribution.contributionId).update(scope.userFeedback);
          feedback.$promise.then(
            function(newStats) {
              scope.contribution.stats = newStats;
              scope.contribution.informalScore = Contributions.getInformalScore(scope.contribution);
            },
            function(error) {
              Notify.show('Error when updating user feedback', 'error');
            }
          );
        };
      },
    };

    /**
     * Displays the moderation form.
     *
     * @param {string} context - delete | flag
     */
    function showModerationForm(context) {
      this.moderationContext = context;
      this.vexInstance = vex.open({
        unsafeContent: $compile(document.getElementById('moderationForm').innerHTML)(this)[0]
      });
    }

    /**
     * DELETE or FLAG comment
     */
    function submitModerationForm() {
      if (this.contribution.moderationComment === 'Other') {
        this.contribution.moderationComment = this.contribution.moderationCommentOther;
        delete this.contribution.moderationCommentOther;
      }

      switch (this.moderationContext) {
        case 'delete':
          this.submitDelete();
          break;
        case 'flag':
          this.submitFlag();
          break;
      }
    }

    /**
     * Removes the contribution.
     */
    function submitDelete() {
      var self = this;
      Contributions.moderate(this.assembly.assemblyId, this.contribution).then(
        function() {
          Notify.show('Operation succeeded', 'success');
          self.vexInstance.close();
          $rootScope.$emit('refreshList', 'refresh');
        },
        function() {
          Notify.show('Error while trying to communicate with the server', 'error');
        }
      );
    }

    /**
     * Flags the contribution.
     */
    function submitFlag() {
      var self = this;
      var payload = {
        flag: true,
        textualFeedback: this.contribution.moderationComment
      };
      var feedback = Contributions.userFeedback(this.assembly.assemblyId, this.contribution.contributionId).update(payload);
      feedback.$promise.then(
        function(newStats) {
          self.contribution.stats = newStats;
          self.vexInstance.close();
          Notify.show('Operation succeeded', 'success');
        },
        function() {
          Notify.show('Error when updating user feedback', 'error');
        }
      );
    }
  }
}());
