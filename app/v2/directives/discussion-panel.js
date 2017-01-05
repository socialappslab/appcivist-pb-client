(function () {
  'use strict';

  appCivistApp
    .directive('discussionPanel', DiscussionPanel);

  DiscussionPanel.$inject = [
    'localStorageService', '$anchorScroll', '$location', 'Contributions', 'Notify', '$filter',
    'Space', 'Memberships', '$stateParams', 'RECAPTCHA_KEY'
  ];

  function DiscussionPanel(localStorageService, $anchorScroll, $location, Contributions,
    Notify, $filter, Space, Memberships, $stateParams) {

    return {
      restrict: 'E',
      scope: {
        spaceId: '=',
        endpointId: '=',
        endpoint: '@',
        sectionTitle: '@',
        publicBoard: '@'
      },
      templateUrl: '/app/v2/partials/directives/discussion-panel.html',
      link: function (scope, element, attrs) {
        scope.$watch('spaceId', function (val) {
          if (val) {
            activate();
          }
        });

        function activate() {
          scope.vm = {};
          scope.user = localStorageService.get('user');
          scope.isAnonymous = !scope.user;
          scope.validateCaptchaResponse = validateCaptchaResponse.bind(scope);

          if (scope.user) {
            var hasRol = Memberships.hasRol;
            var assembly = localStorageService.get('currentAssembly');
            scope.assemblyId = assembly.assemblyId;
            var groupMembershipsHash = localStorageService.get('groupMembershipsHash');
            var assemblyMembershipsHash = localStorageService.get('assemblyMembershipsHash');
            var assemblyRols = assemblyMembershipsHash[assembly.assemblyId];
            scope.isCoordinator = assemblyRols != undefined ? hasRol(assemblyRols, 'COORDINATOR') : false;

            if (!scope.isCoordinator) {
              var groupId = $stateParams.gid ? parseInt($stateParams.gid) : 0;
              var groupRols = groupMembershipsHash[groupId];
              scope.isCoordinator = groupRols != undefined ? hasRol(groupRols, 'COORDINATOR') : false;
            }
          } else {
            scope.$watch('vm.recaptchaResponse', function (response) {
              if (response) {
                validateCaptchaResponse(scope.vm);
              }
            });
          }
          loadDiscussions(scope, scope.spaceId);
          scope.newDiscussion = initContribution('DISCUSSION');
          scope.newComment = initContribution('COMMENT');
          // make discussion reply form visible
          scope.writeReply = function (discussion) {
            discussion.showReplyForm = true;
            $location.hash('comment-field-' + discussion.uuid);
            $anchorScroll();
            $('#discussion-field-' + discussion.uuid).focus();
          };

          scope.formatDate = function (date) {
            return moment(date, 'YYYY-MM-DD HH:mm').local().format('LLL');
          };

          scope.startConversation = function () {
            $location.hash('discussion-field');
            $anchorScroll();
            $('#discussion-field').focus();
          };

          scope.createNewDiscussion = function () {
            var sid = (scope.user && !scope.publicBoard) ? scope.spaceId : scope.endpointId;
            saveContribution(scope, sid, scope.newDiscussion, scope.endpoint);
          };

          scope.createNewComment = function (discussion) {
            var sid = (scope.user && !scope.publicBoard) ? discussion.resourceSpaceId : discussion.uuid;
            saveContribution(scope, sid, scope.newComment, 'contribution');
          };

          scope.delete = function (contribution) {
            var rsp = Contributions.contributionSoftRemoval(scope.assemblyId, contribution.contributionId).update().$promise;
            rsp.then(
              function () {
                Notify.show('Comment removed');
                loadDiscussions(scope, scope.spaceId);
              },
              function () {
                Notify.show('Error while trying to remove comment', 'error');
              }
            )
          }
        }
      }
    };

    function initContribution(type) {
      var c = Contributions.defaultNewContribution();
      c.type = type;
      return c;
    }

    function loadDiscussions(scope, sid) {
      var query = { type: 'DISCUSSION' };
      var rsp;
      if (!scope.user || scope.publicBoard) {
        rsp = Contributions.contributionInResourceSpaceByUUID(sid).get(query);
      } else {
        rsp = Contributions.contributionInResourceSpace(sid).get(query);
      }
      rsp.$promise.then(
        function (data) {
          scope.discussions = data.list;
          loadComments(scope, data.list);
        },
        function (error) {
          Notify.show('Error loading discussions from server', 'error');
        }
      );
      return rsp.$promise;
    }

    /**
     * Load the associated comments of each discussion element.
     *
     * @param {object} scope
     * @param {object[]} discussions
     */
    function loadComments(scope, discussions) {
      angular.forEach(discussions, function (d) {
        d.rsUUID = d.resourceSpaceUUID;
        d.rsID = d.resourceSpaceId;
        Space.getContributions(d, 'comment', (!scope.user || scope.publicBoard), {}).then(
          function (comments) {
            d.comments = comments.list;
          }
        );
      });
    }

    function saveContribution(scope, sid, newContribution, endpoint) {
      newContribution.title = newContribution.text;

      if (!newContribution.title) {
        return;
      }
      var rsp;
      if (!scope.user || scope.publicBoard) {
        rsp = Contributions.createAnomymousContribution(endpoint, sid);
      } else {
        rsp = Contributions.contributionInResourceSpace(sid);
      }
      rsp.save(newContribution).$promise.then(function (saved) {
        if (newContribution.type === 'DISCUSSION') {
          scope.newDiscussion = initContribution('DISCUSSION');
        } else if (newContribution.type === 'COMMENT') {
          scope.newComment = initContribution('COMMENT');
        }
        loadDiscussions(scope, scope.spaceId);
      });
    }

    /**
     * Verify that user response is correct.
     *
     * @param {object} target - element with recaptchaResponse and recaptchaResponseOK properties.
     */
    function validateCaptchaResponse(target) {
      // TODO
      target.recaptchaResponseOK = true;
    }
  }
} ());
