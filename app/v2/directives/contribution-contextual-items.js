(function() {
  'use strict';

  appCivistApp
    .directive('contributionContextualItems', contributionContextualItems);

  contributionContextualItems.$inject = [
    'Contributions', 'Campaigns', 'localStorageService', 'Memberships', '$window', 'Notify', '$compile', 'Notifications'
  ];

  function contributionContextualItems(Contributions, Campaigns, localStorageService, Memberships, $window, Notify, $compile, Notifications) {

    function setupMembershipInfo(scope) {
      var hasRol = Memberships.hasRol;
      var groupMembershipsHash = localStorageService.get('groupMembershipsHash');
      var assemblyMembershipsHash = localStorageService.get('assemblyMembershipsHash');
      var groupRoles = groupMembershipsHash[scope.group ? scope.group.groupId : scope.group];
      scope.userIsWorkingGroupCoordinator = groupRoles != undefined ? hasRol(groupRoles, "COORDINATOR") : false;
      var assemblyRoles = assemblyMembershipsHash[scope.assemblyId];
      scope.userIsAssemblyCoordinator = assemblyRoles != undefined ? hasRol(assemblyRoles, "COORDINATOR") : false;

      if (scope.contribution.type === 'PROPOSAL') {
        scope.userIsAuthor = verifyAuthorshipUser(scope.contribution, scope.user);
        scope.userCanEdit = scope.userIsAuthor || scope.userIsAssemblyCoordinator || scope.userIsWorkingGroupCoordinator;
      } else if (scope.contribution.type === 'NOTE') {
        scope.userCanEdit = true;
        scope.userIsAuthor = verifyAuthorshipUser(scope.contribution, scope.user);
      } else {
        scope.userCanEdit = scope.userIsAuthor = verifyAuthorshipUser(scope.contribution, scope.user);
      }
      // if the group type is topic, allow authors edition
      if (scope.isTopicGroup) {
        scope.userCanEdit = scope.userIsAuthor;
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
        contribution: '=',
        isProposalIdeaStage: '=',
        isHover: '=',
        isTopicGroup: '='
      },
      templateUrl: '/app/v2/partials/directives/contribution-contextual-items.html',
      link: function(scope, element, attrs) {

        if (!scope.contribution) {
          scope.$watch('contribution', function(newVal) {
            if (newVal) {
              init();
            }
          });
        } else {
          init();
        }

        function init() {
          scope.cm = { isHover: false };
          scope.user = localStorageService.get('user');
          scope.isAnonymous = !scope.user;
          scope.modals = {};
          scope.openModal = openModal.bind(scope);
          scope.closeModal = closeModal.bind(scope);
          scope.onEditContributionSuccess = onEditContributionSuccess.bind(scope);
          scope.contributionStatus = scope.contribution.status;

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
              scope.campaignId = localStorageService.get('currentCampaign').campaignId;
              setupMembershipInfo(scope);
            }
          }
          scope.myObject = {};
          scope.myObject.refreshMenu = function() {
            scope.showActionMenu = !scope.showActionMenu;
          };

          // Read user contribution feedback
          if (scope.userFeedback === undefined || scope.userFeedback === null) {
            scope.userFeedback = { 'up': false, 'down': false, 'fav': false, 'flag': false };
          }

          // Feedback update
          scope.myObject.updateFeedback = function(value) {
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
            var feedback = Contributions.userFeedback(scope.assemblyId, scope.campaignId, scope.contribution.contributionId).update(scope.userFeedback);
            feedback.$promise.then(
              function(newStats) {
                scope.contribution.stats = newStats;
              },
              function(error) {
                Notify.show('Error when updating user feedback', 'error');
              }
            );
          };

          //change redirection
          scope.myObject.softRemoval = function() {
            let res = Contributions.contributionSoftRemoval(scope.assemblyId, scope.contribution.contributionId).update(scope.contribution);
            res.$promise.then(
              function(data) {
                $window.location.reload();
              },
              function(error) {
                Notify.show('Error while publishing proposal', 'error');
              }
            );
          }

          scope.myObject.publish = function() {
            var rsp = Contributions.publishProposal(scope.assemblyId, scope.group.groupId, scope.contribution.contributionId).update();
            rsp.$promise.then(
              function() {
                $window.location.reload();
              },
              function() {
                Notify.show('Error while publishing proposal', 'error');
              }
            )
          }

          scope.myObject.exclude = function() {
            Contributions.excludeContribution(scope.assemblyId, scope.contribution.contributionId).update(scope.contribution);
            $window.location.reload();
          }

          //find endpoint
          scope.myObject.assignToWG = function() {
            //Contributions.assignContributionToWG(scope.assemblyId, scope.contribution.contributionId, scope.wg).update(scope.contribution);
            $window.location.reload();
          }

          scope.myObject.seeHistory = function() {
            scope.vexInstance = vex.open({
              className: "vex-theme-plain",
              unsafeContent: $compile(document.querySelector('.history-modal').innerHTML)(scope)[0]
            });
          }

          scope.myObject.subscribe = function() {
            var query = { "origin": scope.contribution.uuid, "eventName": "NEW_CONTRIBUTION_PROPOSAL", "endPointType": "email" };
            var subscription = Notifications.subscribe().save(query).$promise;
            subscription.then(
              function() {
                Notify.show('Subscribed successfully', 'success');
              },
              function() {
                Notify.show('Error while trying to communicate with the server', 'error');
              }
            );
          }
        }
      }
    };

    function openModal(id) {
      this.modals[id] = true;
    }

    function closeModal(id) {
      this.modals[id] = false;
    }

    function onEditContributionSuccess() {
      this.closeModal('contributionEditModal');
      $window.location.reload();
    }
  }
}());
