(function() {
'use strict';

appCivistApp
  .directive('memberCard',  MemberCard);

MemberCard.$inject = ['localStorageService'];

function MemberCard(localStorageService) {

  return {
    restrict: 'E',
    scope: {
      user: '=',
      actionBar: '='
    },
    templateUrl: '/app/v2/partials/directives/member-card.html',
    link: function postLink(scope, element, attrs) {
      scope.currentUser = scope.user;

      if(!scope.user){
        scope.currentUser = localStorageService.get('user');
      }
    }
  };
}
}());
