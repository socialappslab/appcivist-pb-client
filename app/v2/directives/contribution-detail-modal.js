(function() {
  'use strict';

  appCivistApp
    .directive('contributionDetailModal', contributionDetailModal);

  contributionDetailModal.$inject = [
    'localStorageService', 'AppCivistAuth', '$state', 'Contributions', 'Space', '$translate'
  ];

  function contributionDetailModal(localStorageService, AppCivistAuth, $state, Contributions, Space, $translate) {

    function redirect() {
      localStorageService.clearAll();
      $state.go('v2.login', null, { reload: true }).then(function() {
        location.reload();
      });
    }

    return {
      restrict: 'E',
      scope: {
        contribution: '='
      },
      templateUrl: '/app/v2/partials/directives/contribution-detail-modal.html',
      link: function postLink(scope, element, attrs) {
        scope.currentUser = localStorageService.get('user');
        scope.signout = function() {
          var rsp = AppCivistAuth.signOut().save();
          rsp.$promise.then(redirect, redirect);
        };

        activate();

        function activate() {
          scope.activeTab = 'Public';
          scope.changeActiveTab = function(tab) {
            if (tab == 1) {
              scope.activeTab = 'Members';
            } else {
              scope.activeTab = 'Public';
            }
          }
          scope.userIsMember = false;
          scope.user = localStorageService.get('user');
          if (scope.user && scope.user.language) {
            $translate.use(scope.user.language);
            scope.userIsMember = true;
          }

          scope.contributionID = scope.contribution.contributionId;

        }
      }
    };
  }
}());