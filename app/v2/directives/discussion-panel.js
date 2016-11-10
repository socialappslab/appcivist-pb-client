(function() {
'use strict';

appCivistApp
  .directive('discussionPanel',  DiscussionPanel);

DiscussionPanel.$inject = [
  'localStorageService', '$anchorScroll', '$location', 'Contributions', 'FlashService', '$filter'
];

function DiscussionPanel(localStorageService, $anchorScroll, $location, Contributions, FlashService, $filter) {

  function newContribution(type){
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
        scope.newDiscussion = newContribution('DISCUSSION');
        // make discussion reply form visible
        scope.writeReply = function(discussion) {
          discussion.showReplyForm = true;
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
          scope.newDiscussion.title = scope.newDiscussion.text;
          var rsp = Contributions.contributionInResourceSpace(scope.spaceId);
          rsp.save(scope.newDiscussion).$promise.then(function(saved) {
            scope.newDiscussion = newContribution('DISCUSSION');
            loadDiscussions(scope, scope.spaceId);
          });
        };
      }
    }
  };
}
}());
