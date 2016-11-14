(function() {
'use strict';

appCivistApp
  .directive('proposalCard',  ProposalCard);

ProposalCard.$inject = ['Contributions', 'Campaigns', 'localStorageService', 'Memberships'];

function ProposalCard(Contributions, Campaigns, localStorageService, Memberships) {

  function hasRole(roles, roleName) {
    var result = false;

    angular.forEach(roles, function(role){
      if(role.name === roleName) {
        result = true;
      }
    });
    return result;
  }

  function setupMembershipInfo(scope) {
    scope.userCanEdit = Contributions.verifyAuthorship(scope.user, scope.proposal);

    var authorship = Contributions.verifyGroupAuthorship(scope.user, scope.proposal, scope.group).get();
    authorship.$promise.then(function(response){
      scope.userCanEdit = response.responseStatus === 'OK';
    });
    
    var rsp = Memberships.membershipInAssembly(scope.assemblyId, scope.user.userId).get();
    rsp.$promise.then(function(data) {
      scope.userIsAssemblyCoordinator = hasRole(data.roles, 'COORDINATOR');  
    });
    
    rsp = Memberships.membershipInGroup(scope.groupId, scope.user.userId).get();
    rsp.$promise.then(function(data) {
      scope.userIsWorkingGroupCoordinator = hasRole(data.roles, 'COORDINATOR');
    });
  }

  return {
    restrict: 'E',
    scope: {
      proposal: '=',
      showVotingButtons: '=',
      campaignId: '='
    },
    templateUrl: '/app/v2/partials/directives/proposal-card.html',
    link: function postLink(scope, element, attrs) {
      scope.user = localStorageService.get('user');
      var workingGroupAuthors = scope.proposal.workingGroupAuthors;
      var workingGroupAuthorsLength = workingGroupAuthors ? workingGroupAuthors.length : 0;
      scope.groupId = workingGroupAuthorsLength ? scope.proposal.workingGroupAuthors[0].groupId : 0;
      scope.group = workingGroupAuthors[0];
      
      if(scope.group) {
        scope.assemblyId = scope.group.assemblies[0];
        setupMembershipInfo(scope);
      }
      // Verify the status of the campaign and show or not show the voting buttons
      var campaign = Campaigns.campaign(scope.assemblyId, scope.campaignId).get();
      campaign.$promise.then(function(data) {
        var currentComponent = Campaigns.getCurrentComponent(data.components);
        if (currentComponent.key === 'Voting') {
          scope.showVotingButtons = true;
        }
      });

      scope.showActionMenu = false;
      scope.myObject = {};
      scope.myObject.refreshMenu = function() {
        scope.showActionMenu = !scope.showActionMenu;
      };

      // Read user contribution feedback
      scope.userFeedback = scope.userFeedback !== null ?
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
