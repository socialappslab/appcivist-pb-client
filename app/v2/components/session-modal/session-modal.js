(function () {
  'use strict';

  /**
   * @name session-modal
   * @memberof components
   *
   * @description
   *  Component that renders the notifications widget inside topbar.
   *
   * @example
   *
   *  <session-modal></session-modal>
   */
  appCivistApp
    .component('sessionModal', {
      selector: 'sessionModal',
      controller: SessionModalCtrl,
      controllerAs: 'vm',
      templateUrl: '/app/v2/components/session-modal/session-modal.html'
    });

  Ctrl.$inject = [
    '$scope', 'loginService', 'AppCivistAuth'
  ];

  function SessionModalCtrl($scope, LoginService, AppCivistAuth) {
    
    function signup() {
      if ($scope.isAnonymous) {
        if (!$scope.user.email || !$scope.user.password) {
          Notify.show('Email and password are required', 'error');
          return;
        }
        var rsp = AppCivistAuth.signUp().save($scope.user);
        rsp.$promise.then(loginSuccess, loginError);
      } else {
        console.log("CLICKED!");
      }
    }

  }
}());