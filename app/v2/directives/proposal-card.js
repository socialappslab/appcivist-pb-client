(function() {
'use strict';

appCivistApp
  .directive('proposalCard',  ProposalCard);

ProposalCard.$inject = ['Contributions', 'Campaigns'];

function ProposalCard(Contributions, Campaigns) {

  return {
    restrict: 'E',
    scope: {
      proposal: '=',
      showVotingButtons: '=',
      campaignId: '='
    },
    templateUrl: '/app/v2/partials/directives/proposal-card.html',
    link: function postLink(scope, element, attrs) {
      //console.log(scope.proposal);
      scope.assemblyId = scope.proposal.workingGroupAuthors[0].assemblies[0];
      scope.groupId = scope.proposal.workingGroupAuthors[0].groupId;

      // Verify the status of the campaign and show or not show the voting buttons
      var campaign = Campaigns.campaign(scope.assemblyId, scope.campaignId).get();
      campaign.$promise.then(function(data) {
        var currentComponent = Campaigns.getCurrentComponent(data.components);
        if (currentComponent.key === 'Voting') {
          scope.showVotingButtons = true;
        }
      });

      scope.showActionMenu = true;
      scope.myObject = {};
      scope.myObject.refreshMenu = function() {
          if (scope.showActionMenu == false)
            scope.showActionMenu = true;
          else
            scope.showActionMenu = false;
      }

      // Read user contribution feedback
      scope.userFeedback = scope.userFeedback != null ?
          scope.userFeedback : {"up":false, "down":false, "fav": false, "flag": false};

      // Feedback update
      scope.updateFeedback = function (value) {
          //console.log(value);
          if (value === "up") {
              scope.userFeedback.up = true;
              scope.userFeedback.down = false;
          } else if (value === "down") {
              scope.userFeedback.up = false;
              scope.userFeedback.down = true;
          } else if (value === "fav") {
              scope.userFeedback.fav = true;
          } else if (value === "flag") {
              scope.userFeedback.flag = true;
          }

          //var stats = scope.contribution.stats;
          var feedback = Contributions.userFeedback(scope.assemblyId, scope.proposal.contributionId).update(scope.userFeedback);
          feedback.$promise.then(
              function (newStats) {
                  scope.proposal.stats = newStats;
              },
              function (error) {
                  console.log("Error when updating user feedback");
              }
          );
      };

    }
  };
}
}());
