(function() {
'use strict';

appCivistApp
  .directive('memberCard',  MemberCard);

MemberCard.$inject = [
  'localStorageService', 'loginService', 'logService'
];

function MemberCard(localStorageService, loginService, logService) {

  return {
    restrict: 'E',
    scope: {
      user: '=',
      actionBar: '=',
      commentsSection: '='
    },
    templateUrl: '/app/v2/partials/directives/member-card.html',
    link: function postLink(scope, element, attrs) {
      scope.currentUser = scope.user;

      if(!scope.user){
        scope.currentUser = localStorageService.get('user');
      }

      scope.signout = function() {
        loginService.signOut(scope.currentUser.email, scope, logService.logAction("LOGOUT"));
      };
    }
  };
}
}());
