(function() {
'use strict';

appCivistApp
  .directive('discussionPanel',  DiscussionPanel);

DiscussionPanel.$inject = [];

function DiscussionPanel() {

  return {
    restrict: 'E',
    scope: {
      discussions: '=',
    },
    templateUrl: '/app/v2/partials/directives/discussion-panel.html',
    link: function postLink(scope, element, attrs) {
      // make discussion reply form visible
      scope.writeReply = function(discussion) {
        discussion.showReplyForm = true;
      };
      
      scope.formatDate = function(date){
        return moment(date, 'YYYY-MM-DD HH:mm').local().format('LLL');
      };
    }
  };
}
}());
