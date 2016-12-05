(function () {
  'use strict';

  appCivistApp
    .directive('contributionCard', ContributionCard);

  ContributionCard.$inject = ['Contributions', 'Campaigns', 'localStorageService', 'Memberships', '$window'];

  function ContributionCard(Contributions, Campaigns, localStorageService, Memberships, $window) {

    function hasRole(roles, roleName) {
      var result = false;

      angular.forEach(roles, function (role) {
        if (role.name === roleName) {
          result = true;
        }
      });
      return result;
    }

    function setupMembershipInfo(scope) {
      scope.userIsAuthor = Contributions.verifyAuthorship(scope.user, scope.contribution);

      var authorship = Contributions.verifyGroupAuthorship(scope.user, scope.contribution, scope.group).get();
      authorship.$promise.then(function (response) {
        scope.userCanEdit = response.responseStatus === 'OK';
      });

      var rsp = Memberships.membershipInAssembly(scope.assemblyId, scope.user.userId).get();
      rsp.$promise.then(function (data) {
        scope.userIsAssemblyCoordinator = hasRole(data.roles, 'COORDINATOR');
      });

      rsp = Memberships.membershipInGroup(scope.groupId, scope.user.userId).get();
      rsp.$promise.then(function (data) {
        scope.userIsWorkingGroupCoordinator = hasRole(data.roles, 'COORDINATOR');
      });
    }

    function setContributionType(scope) {
      scope.isProposal = scope.contribution.type === 'PROPOSAL';
      scope.isIdea = scope.contribution.type === 'IDEA';
    }

    function toggleContextualMenu() {
      this.showContextualMenu = !this.showContextualMenu;
    }

    return {
      restrict: 'E',
      scope: {
        contribution: '=',
        showVotingButtons: '=',
        campaign: '='
      },
      templateUrl: '/app/v2/partials/directives/contribution-card.html',
      link: function postLink(scope, element, attrs) {
        scope.cm = { isHover: false };
        scope.user = localStorageService.get('user');
        scope.isAnonymous = !scope.user;
        scope.showContextualMenu = false;
        scope.toggleContextualMenu = toggleContextualMenu.bind(scope);
        setContributionType(scope);

        if (!scope.isIdea) {
          var workingGroupAuthors = scope.contribution.workingGroupAuthors;
          var workingGroupAuthorsLength = workingGroupAuthors ? workingGroupAuthors.length : 0;
          scope.group = workingGroupAuthorsLength ? workingGroupAuthors[0] : 0;

          if (!scope.isAnonymous) {
            scope.groupId = workingGroupAuthorsLength ? scope.contribution.workingGroupAuthors[0].groupId : 0;
            scope.assemblyId = localStorageService.get('currentAssembly').assemblyId;
            setupMembershipInfo(scope);
          }
        }

        if (scope.campaign) {
          // Verify the status of the campaign and show or not show the voting buttons
          var currentComponent = Campaigns.getCurrentComponent(scope.campaign.components);
          if (currentComponent.key === 'Voting') {
            scope.showVotingButtons = true;
          }
        }
        scope.showActionMenu = false;
        scope.myObject = {};
        scope.myObject.refreshMenu = function () {
          scope.showActionMenu = !scope.showActionMenu;
        };

        // Read user contribution feedback
        if (scope.userFeedback === undefined || scope.userFeedback === null) {
          scope.userFeedback = { 'up': false, 'down': false, 'fav': false, 'flag': false };
        }

        // Feedback update
        scope.myObject.updateFeedback = function (value) {
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

          //var stats = scope.contribution.stats;
          var feedback = Contributions.userFeedback(scope.assemblyId, scope.contribution.contributionId).update(scope.userFeedback);
          feedback.$promise.then(
            function (newStats) {
              scope.contribution.stats = newStats;
            },
            function (error) {
              console.log('Error when updating user feedback');
            }
          );
        };

        //change redirection
        scope.myObject.softRemoval = function () {
          Contributions.contributionSoftRemoval(scope.assemblyId, scope.contribution.contributionId).update(scope.contribution);
          $window.location.reload();
        }

        scope.myObject.publish = function () {
          Contributions.publishContribution(scope.assemblyId, scope.contribution.contributionId).update(scope.contribution);
          $window.location.reload();
        }

        scope.myObject.exclude = function () {
          Contributions.excludeContribution(scope.assemblyId, scope.contribution.contributionId).update(scope.contribution);
          $window.location.reload();
        }

        //find endpoint
        scope.myObject.assignToWG = function () {
          //Contributions.assignContributionToWG(scope.assemblyId, scope.contribution.contributionId, scope.wg).update(scope.contribution);
          $window.location.reload();
        }

      }
    };
  }
} ());
