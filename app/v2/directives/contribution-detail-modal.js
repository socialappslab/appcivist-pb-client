(function() {
'use strict';

appCivistApp
  .directive('contributionDetailModal',  contributionDetailModal);

contributionDetailModal.$inject = [
  'localStorageService', 'AppCivistAuth', '$state', 'Contributions', 'Space'
];

function contributionDetailModal(localStorageService, AppCivistAuth, $state, Contributions, Space) {

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
      contribution: '='
    },
    templateUrl: '/app/v2/partials/directives/contribution-detail-modal.html',
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
