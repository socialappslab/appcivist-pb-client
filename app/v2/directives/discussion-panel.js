(function() {
'use strict';

appCivistApp
  .directive('discussionPanel',  DiscussionPanel);

DiscussionPanel.$inject = [
  'localStorageService', '$anchorScroll', '$location', 'Contributions', 'FlashService', '$filter'
];

function DiscussionPanel(localStorageService, $anchorScroll, $location, Contributions, FlashService, $filter) {

  function initContribution(type){
    var c = Contributions.defaultNewContribution();
    c.type = type;
    return c;
  }

  function loadDiscussions(scope, sid) {
    var rsp = Contributions.contributionInResourceSpace(sid).query();
    rsp.$promise.then(
      function (data) {
        scope.discussions = $filter('filter')(data, {type: 'DISCUSSION'});
      },
      function (error) {
        FlashService.Error('Error loading discussions from server');
      }
    );
    return rsp.$promise;
  }

  function saveContribution(scope, sid, newContribution) {
    newContribution.title = newContribution.text;
    var rsp = Contributions.contributionInResourceSpace(sid);
    rsp.save(newContribution).$promise.then(function(saved) {
      if(newContribution.type === 'DISCUSSION') {
        scope.newDiscussion = initContribution('DISCUSSION');
      }else if(newContribution.type === 'COMMENT') {
        scope.newComment = initContribution('COMMENT');
      }
      loadDiscussions(scope, scope.spaceId);
    });
  }

  return {
    restrict: 'E',
    scope: {
      spaceId: '='
    },
    templateUrl: '/app/v2/partials/directives/discussion-panel.html',
    link: function postLink(scope, element, attrs) {
      scope.$watch('spaceId', function(val) {
        if(val) {
          activate();
        }
      });

      function activate() {
        loadDiscussions(scope, scope.spaceId);
        scope.newDiscussion = initContribution('DISCUSSION');
        scope.newComment = initContribution('COMMENT');
        // make discussion reply form visible
        scope.writeReply = function(discussion) {
          discussion.showReplyForm = true;
          $location.hash('comment-field-' + discussion.resourceSpaceId);
          $anchorScroll();
          $('#discussion-field-' + discussion.resourceSpaceId).focus();
        };

        scope.formatDate = function(date){
          return moment(date, 'YYYY-MM-DD HH:mm').local().format('LLL');
        };
        scope.user = localStorageService.get('user');
        
        scope.startConversation = function() {
          $location.hash('discussion-field');
          $anchorScroll();
          $('#discussion-field').focus();
        };

        scope.createNewDiscussion = function() {
          saveContribution(scope, scope.spaceId, scope.newDiscussion);
        };

        scope.createNewComment = function(discussion) {
          saveContribution(scope, discussion.resourceSpaceId, scope.newComment);
        };
      }
    }
  };
}
}());
