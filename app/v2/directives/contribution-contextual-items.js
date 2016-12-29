(function () {
  'use strict';

  appCivistApp
    .directive('contributionContextualItems', contributionContextualItems);

  contributionContextualItems.$inject = [
    'Contributions', 'Campaigns', 'localStorageService', 'Memberships', '$window', 'Notify', '$compile'
  ];

  function contributionContextualItems(Contributions, Campaigns, localStorageService, Memberships, $window, Notify, $compile) {

    function setupMembershipInfo(scope) {
      var hasRol = Memberships.hasRol;
      var groupMembershipsHash = localStorageService.get('groupMembershipsHash');
      var assemblyMembershipsHash = localStorageService.get('assemblyMembershipsHash');
      var groupRoles = groupMembershipsHash[scope.group ? scope.group.groupId : scope.group];
      scope.userIsWorkingGroupCoordinator = groupRoles != undefined ? hasRol(groupRoles, "COORDINATOR") : false;
      console.log("User is coordinator of group " + scope.group + " = " + scope.userIsWorkingGroupCoordinator);
      var assemblyRoles = assemblyMembershipsHash[scope.assemblyId];
      scope.userIsAssemblyCoordinator = assemblyRoles != undefined ? hasRol(assemblyRoles, "COORDINATOR") : false;
      console.log("User is coordinator of assembly " + scope.assemblyId + " = " + scope.userIsAssemblyCoordinator);

      if (scope.contribution.type === 'PROPOSAL') {
        scope.userCanEdit = scope.userIsAuthor = groupRoles != undefined;
        console.log("User can edit Proposal " + scope.contribution.contributionId + " = " + scope.userCanEdit);
        console.log("User is author of Proposal " + scope.contribution.contributionId + " = " + scope.userIsAuthor);
      } else if (scope.contribution.type === 'NOTE') {
        scope.userCanEdit = true;
        scope.userIsAuthor = verifyAuthorshipUser(scope.contribution, scope.user);
        console.log("User can edit NOTE " + scope.contribution.contributionId + " = " + scope.userCanEdit);
        console.log("User is author of NOTE " + scope.contribution.contributionId + " = " + scope.userIsAuthor);
      } else {
        scope.userCanEdit = scope.userIsAuthor = verifyAuthorshipUser(scope.contribution, scope.user);
        console.log("User can edit Idea " + scope.contribution.contributionId + " = " + scope.userCanEdit);
        console.log("User is author of Idea " + scope.contribution.contributionId + " = " + scope.userIsAuthor);
      }
    }

    function setContributionType(scope) {
      scope.isProposal = scope.contribution.type === 'PROPOSAL';
      scope.isIdea = scope.contribution.type === 'IDEA';
    }

    function toggleContextualMenu() {
      this.showContextualMenu = !this.showContextualMenu;
    }

    function verifyAuthorshipUser(contribution, user) {
      var authors = contribution.authors;
      if (authors && authors.length > 0) {
        for (var i = 0; i < authors.length; i++) {
          if (user.userId === authors[i].userId) {
            return true;
          }
        }
      }
      return false;
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

            if (scope.group) {
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
              function () {
                $window.location.reload();
              },
              function () {
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

          scope.myObject.seeHistory = function () {
            scope.vexInstance = vex.open({
              unsafeContent: $compile(document.querySelector('.history-modal').innerHTML)(scope)[0]
            });
          }

        }
      }
    };
  }
} ());
