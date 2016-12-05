(function() {
'use strict';

appCivistApp
  .directive('memberCard',  MemberCard);

MemberCard.$inject = [
  'localStorageService', 'AppCivistAuth', '$state'
];

function MemberCard(localStorageService, AppCivistAuth, $state) {

  function redirect() {
    localStorageService.clearAll();
    $state.go('v2.login', null, {reload: true}).then(function() {
      location.reload();
    });
  }

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

      scope.$watch('user', function(newVal) {
        if(newVal){
          scope.currentUser = newVal;
        }
      });

      if(!scope.user){
        scope.currentUser = localStorageService.get('user');
      }

      scope.signout = function() {
		    var rsp = AppCivistAuth.signOut().save();
        rsp.$promise.then(redirect, redirect);
      };
    }
  };
}
}());
