(function () {
  'use strict';

  angular
    .module('appCivistApp')
    .directive('wizard', wizard);

  function wizard() {
    var directive = {
      restrict: 'E',
      scope: {},
      controllerAs: 'vm',
      bindToController: true,
      templateUrl: '/app/v2/partials/directives/wizard.html',
      controller: WizardController,
      transclude: true
    };
    return directive;
  }

  WizardController.$inject = ['$scope', '$timeout'];

  function WizardController($scope, $timeout) {
    var vm = this;
    vm.tabs = [];

    activate();
    vm.addTab = addTab;

    function activate() {
    }

    function addTab() {
      // TODO Agregar TAB
    }
  }
} ());
