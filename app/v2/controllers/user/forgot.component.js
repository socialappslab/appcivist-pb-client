(function() {
  'use strict';

  const selector = 'userPasswordForgot';

  appCivistApp.component(selector, {
    templateUrl: 'app/v2/partials/user/forgot.html',
    selector,
    controller: ForgotCtrl,
    controllerAs: 'vm'
  });


  ForgotCtrl.$inject = ['$scope', 'AppCivistAuth', 'Notify'];

  function ForgotCtrl($scope, AppCivistAuth, Notify) {
    this.submit = submit.bind(this);

    this.$onInit = () => {
      this.model = {};
      this.submitted = false;
      this.done = false;
    };

    function submit() {
      this.submitted = true;

      if ($scope.form.$invalid) {
        return;
      }
      AppCivistAuth.forgot(this.model.email).then(
        response => this.done = true,
        error => Notify.show('Error while trying to communicate with the server', 'error')
      );
    }
  }
}());