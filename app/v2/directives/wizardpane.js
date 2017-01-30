(function() {
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

    /**
     * Check if given state is active
     * 
     * @param {string} state - relative or full state name
     */
    vm.isActive = function(state) {
      return state.startsWith('.') ? $state.is($state.get('^').name + state) : $state.is(state);
    };

    vm.go = function(dest) {
      if (vm.disabledIf) {
        return;
      }
      $state.go('^' + dest);
    };
  }
}());