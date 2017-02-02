(function () {
  'use strict';

  angular
    .module('appCivistApp')
    .controller('v2.AssemblyFormWizardCtrl', AssemblyFormWizardCtrl);

  AssemblyFormWizardCtrl.$inject = ['$state', '$stateParams', '$scope'];

  function AssemblyFormWizardCtrl($state, $stateParams, $scope) {
    if ($state.is('v2.assembly.new')) {
      $state.go('v2.assembly.new.description');
    }

    if ($state.is('v2.assembly.aid.edit')) {
      $state.go('v2.assembly.aid.edit.description', {aid: $stateParams.aid});
    }

    if ($state.is('v2.assembly.aid.assembly')) {
      $state.go('v2.assembly.aid.assembly.description', {aid: $stateParams.aid});
    }

    if($stateParams.aid) {
      if ($state.is('v2.assembly.aid.assembly') || $state.is('v2.assembly.aid.edit')) {
        $scope.isEdit = true;
      } else {
        $scope.isEdit = false;
      }
    }

  }
} ());
