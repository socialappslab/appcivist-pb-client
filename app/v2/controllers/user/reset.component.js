(function() {
  'use strict';

  const selector = 'userPasswordReset';

  appCivistApp.component(selector, {
    templateUrl: 'app/v2/partials/user/reset.html',
    selector,
    controller: ResetCtrl,
    controllerAs: 'vm'
  });


  ResetCtrl.$inject = ['$scope', 'AppCivistAuth', 'Notify', '$stateParams', '$state'];

  function ResetCtrl($scope, AppCivistAuth, Notify, $stateParams, $state) {
    this.submit = submit.bind(this);

    this.$onInit = () => {
      if (!$stateParams.token) {
        $state.go('v2.login');
        return;
      }
      this.model = {};
      this.submitted = false;
      this.done = false;
    };

    function submit() {
      this.submitted = true;
      this.model.token = $stateParams.token;

      if ($scope.form.$invalid || this.model.password !== this.model.repeatPassword) {
        return;
      }
      AppCivistAuth.reset(this.model).then(
        response => this.done = true,
        error => Notify.show('Error while trying to communicate with the server', 'error')
      );
    }
  }
}());