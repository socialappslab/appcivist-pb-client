(function () {
  'use strict';

  appCivistApp
    .directive('contributionContextualItems', contributionContextualItems);

  contributionContextualItems.$inject = [
    'Contributions', 'Campaigns', 'localStorageService', 'Memberships', '$window', 'Notify'
  ];

  function contributionContextualItems(Contributions, Campaigns, localStorageService, Memberships, $window, Notify) {

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
      //scope.userIsAuthor = Contributions.verifyAuthorship(scope.user, scope.contribution);

      // TODO: do not ask the server for membership and authorship here, store this information and get it
      // on loading at the beginning
      scope.userIsAuthor = true;
      scope.userCanEdit = true;
      scope.userIsAssemblyCoordinator = true;
      scope.userIsWorkingGroupCoordinator = true;
      //var authorship = Contributions.verifyGroupAuthorship(scope.user, scope.contribution, scope.group).get();
      //authorship.$promise.then(function (response) {
      //  scope.userCanEdit = response.responseStatus === 'OK';
      //  scope.userIsAuthor = scope.userCanEdit;
      //});
      //
      //var rsp = Memberships.membershipInAssembly(scope.assemblyId, scope.user.userId).get();
      //rsp.$promise.then(function (data) {
      //  scope.userIsAssemblyCoordinator = hasRole(data.roles, 'COORDINATOR');
      //});
      //
      //rsp = Memberships.membershipInGroup(scope.groupId, scope.user.userId).get();
      //rsp.$promise.then(function (data) {
      //  scope.userIsWorkingGroupCoordinator = hasRole(data.roles, 'COORDINATOR');
      //});
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
        contribution: '='
      },
      templateUrl: '/app/v2/partials/directives/contribution-contextual-items.html',
      link: function (scope, element, attrs) {

        scope.$watch('contribution', function (newVal) {
          if (newVal) {
            init();
          }
        });

        function init() {
          scope.cm = { isHover: false };
          scope.user = localStorageService.get('user');
          scope.isAnonymous = !scope.user;
          setContributionType(scope);

          if (!scope.isIdea) {
            var workingGroupAuthors = scope.contribution.workingGroupAuthors;
            var workingGroupAuthorsLength = workingGroupAuthors ? workingGroupAuthors.length : 0;
            scope.group = workingGroupAuthorsLength ? workingGroupAuthors[0] : 0;
            scope.notAssigned = true;

            if(scope.group){
              scope.notAssigned = false;
            }

            if (!scope.isAnonymous) {
              scope.groupId = workingGroupAuthorsLength ? scope.contribution.workingGroupAuthors[0].groupId : 0;
              scope.assemblyId = localStorageService.get('currentAssembly').assemblyId;
              setupMembershipInfo(scope);
            }
          }
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
            var feedback = Contributions.userFeedback(scope.assemblyId, scope.contribution.contributionId).update(scope.userFeedback);
            feedback.$promise.then(
              function (newStats) {
                scope.contribution.stats = newStats;
              },
              function (error) {
                Notify.show('Error when updating user feedback', 'error');
              }
            );
          };

          //change redirection
          scope.myObject.softRemoval = function () {
            Contributions.contributionSoftRemoval(scope.assemblyId, scope.contribution.contributionId).update(scope.contribution);
            $window.location.reload();
          }

          scope.myObject.publish = function () {
            var rsp = Contributions.publishProposal(scope.assemblyId, scope.group.groupId, scope.contribution.contributionId).update();
            rsp.$promise.then(
              function(){
                $window.location.reload();
              },
              function() {
                Notify.show('Error while publishing proposal', 'error');
              }
            )
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
      }
    };
  }
} ());
