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
        view: '@',
        campaign: '='
      },
      templateUrl: '/app/v2/partials/directives/contribution-feedback.html',
      link: function (scope, element, attrs) {
        var user = localStorageService.get('user');
        // Read user contribution feedback
        scope.isAnonymous = true;
        scope.isCardView = scope.view === 'card';
        scope.moderationSuccess = moderationSuccess.bind(scope);
        scope.showModerationForm = showModerationForm.bind(scope);
        scope.checkCampaignConfigs = checkCampaignConfigs.bind(scope);
        scope.loadUserFeedback = function (aid, cid, coid) {
          let rsp = Contributions.authUserFeedback(aid,cid,coid).get().$promise;
          rsp.then(
            data => scope.userFeedback = data,
            error => scope.userFeedback = { 'up': false, 'down': false, 'fav': false, 'flag': false }
          );
        }

        if (scope.campaign && scope.campaign.configs) {
          scope.checkCampaignConfigs();
        } else {
          scope.$watchCollection('scope.campaign.configs', checkCampaignConfigs)
        }

        scope.assembly = localStorageService.get('currentAssembly');
        if (scope.campaign) {
          scope.campaign = localStorageService.get('currentCampaign');
        }

        if (user) {
          scope.isAssemblyCoordinator = Memberships.isAssemblyCoordinator(scope.assembly.assemblyId);
          scope.isMemberOfAssembly = Memberships.isMember('assembly', scope.assembly.assemblyId);
          scope.isAnonymous = false;
          scope.loadUserFeedback(scope.assembly.assemblyId, scope.campaign.campaignId, scope.contribution.contributionId);
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
              Notify.show(error.statusMessage, 'error');
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

        function checkCampaignConfigs() {
          if (this) {
            this.campaignConfigs = this.campaign.configs;
            let showCommentCountConf = this.campaignConfigs['appcivist.campaign.contribution.toolbar.comment-count'];
            let showUpVoteConf = this.campaignConfigs['appcivist.campaign.contribution.toolbar.up-vote'];
            let showDownVoteConf = this.campaignConfigs['appcivist.campaign.contribution.toolbar.down-vote'];
            console.log('showCommentCountConf = ',showCommentCountConf);
            console.log('showUpVoteConf = ',showUpVoteConf);
            console.log('showDownVoteConf = ',showDownVoteConf);
            this.showCommentCount = showCommentCountConf ? showCommentCountConf.toLowerCase()  === 'false' ? false : true : true;
            this.showUpVote = showUpVoteConf ? showUpVoteConf.toLowerCase()  === 'false' ? false : true : true;
            this.showDownVote = showDownVoteConf ? showDownVoteConf.toLowerCase()  === 'false' ? false : true : true;
          }
        }
      }
    };
  }
}());
