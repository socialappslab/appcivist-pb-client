(function() {
'use strict';

appCivistApp
  .directive('ideaCard',  IdeaCard);

IdeaCard.$inject = ['Contributions'];

function IdeaCard(Contributions) {
  
  function setupMembershipInfo(scope) {
    scope.userIsAuthor = Contributions.verifyAuthorship(scope.user, scope.idea);

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
      idea: '=',
      campaign: '=',
      wg: '='
    },
    templateUrl: '/app/v2/partials/directives/idea-card.html',
    link: function postLink(scope, element, attrs) {
      //the service GET contribution of type IDEA doesn't return workingGroupAuthors
      if (scope.campaign) {
        scope.assemblyId = scope.campaign.assemblies[0];
        scope.groupId = scope.campaign.groupId;
      } else if (scope.wg) {
        scope.assemblyId = scope.wg.assemblies[0];
        scope.groupId = scope.wg.groupId;
      }
      scope.group = scope.wg;
      
      if(scope.group) {
        scope.assemblyId = scope.group.assemblies[0];
        setupMembershipInfo(scope);
      }
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
          var feedback = Contributions.userFeedback(scope.assemblyId, scope.idea.contributionId).update(scope.userFeedback);
          feedback.$promise.then(
              function (newStats) {
                  scope.idea.stats = newStats;
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
