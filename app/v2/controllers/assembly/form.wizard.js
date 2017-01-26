(function () {
  'use strict';

  angular
    .module('appCivistApp')
    .controller('v2.AssemblyFormWizardCtrl', AssemblyFormWizardCtrl);


  AssemblyFormWizardCtrl.$inject = ['$state', '$stateParams', '$scope'];

  function AssemblyFormWizardCtrl($state, $stateParams, $scope) {
    if ($state.is('v2.assembly.new')) {
      $state.go('v2.assembly.new.step1');
    }

    if ($state.is('v2.assembly.aid.edit')) {
      $state.go('v2.assembly.aid.edit.step1', {aid: $stateParams.aid});
    }

    if($stateParams.aid) {
      $scope.isEdit = true;
    }
  }
} ());
