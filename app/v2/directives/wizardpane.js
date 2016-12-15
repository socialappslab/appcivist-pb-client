(function () {
  'use strict';

  angular
    .module('appCivistApp')
    .directive('wizardPane', wizardPane);

  wizardPane.$inject = ['$state'];

  function wizardPane($state) {
    var directive = {
      required: '^^wizard',
      restrict: 'E',
      scope: {
        title: '@',
        number: '@',
        activeIf: '@',
        disabledIf: '=',
        state: '@',
      },
      templateUrl: '/app/v2/partials/directives/wizardpane.html',
      controller: controllerFunc,
      controllerAs: 'vm',
      bindToController: true
    };

    return directive;
  }

  controllerFunc.$inject = ['$state'];

  function controllerFunc($state) {
    var vm = this;

    vm.isActive = function (estado) {
      return $state.includes(estado);
    };

    vm.go = function (dest) {
      if (vm.disabledIf) {
        return;
      }
      $state.go(dest);
    };
  }
} ());
