(function () {
  'use strict';

  appCivistApp
    .directive('discussionPanel', DiscussionPanel);

  DiscussionPanel.$inject = [
    'localStorageService', '$anchorScroll', '$location', 'Contributions', 'Notify', '$filter',
    'Space'
  ];

  function DiscussionPanel(localStorageService, $anchorScroll, $location, Contributions,
    Notify, $filter, Space) {

    function initContribution(type) {
      var c = Contributions.defaultNewContribution();
      c.type = type;
      return c;
    }

    function loadDiscussions(scope, sid) {
      var query = { type: 'DISCUSSION' };
      var rsp;

      if (!scope.user) {
        rsp = Contributions.contributionInResourceSpaceByUUID(sid).query(query);
      } else {
        rsp = Contributions.contributionInResourceSpace(sid).query(query);
      }
      rsp.$promise.then(
        function (data) {
          scope.discussions = data;
          loadComments(scope, data);
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
        Space.getContributions(d, 'comment', !scope.user, {}).then(
          function (comments) {
            d.comments = comments;
          }
        );
      });
    }

    function saveContribution(scope, sid, newContribution, endpoint) {
      newContribution.title = newContribution.text;
      var rsp;
      if (!scope.user) {
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

    return {
      restrict: 'E',
      scope: {
        spaceId: '=',
        endpointId: '=',
        endpoint: '@'
      },
      templateUrl: '/app/v2/partials/directives/discussion-panel.html',
      link: function postLink(scope, element, attrs) {
        scope.$watch('spaceId', function (val) {
          if (val) {
            activate();
          }
        });

        function activate() {
          scope.user = localStorageService.get('user');
          loadDiscussions(scope, scope.spaceId);
          scope.newDiscussion = initContribution('DISCUSSION');
          scope.newComment = initContribution('COMMENT');
          // make discussion reply form visible
          scope.writeReply = function (discussion) {
            discussion.showReplyForm = true;
            $location.hash('comment-field-' + discussion.resourceSpaceId);
            $anchorScroll();
            $('#discussion-field-' + discussion.resourceSpaceId).focus();
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
            var sid = scope.user ? scope.spaceId : scope.endpointId;
            saveContribution(scope, sid, scope.newDiscussion, scope.endpoint);
          };

          scope.createNewComment = function (discussion) {
            var sid = scope.user ? discussion.resourceSpaceId : discussion.uuid;
            saveContribution(scope, sid, scope.newComment, 'contribution');
          };
        }
      }
    };
  }
} ());
