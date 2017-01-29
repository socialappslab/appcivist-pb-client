(function () {
  'use strict';

  angular
    .module('appCivistApp')
    .controller('v2.WgroupFormWizardCtrl', WgroupFormWizardCtrl);

  WgroupFormWizardCtrl.$inject = ['$state', '$stateParams', '$scope'];

  function WgroupFormWizardCtrl($state, $stateParams, $scope) {

    if ($state.is('v2.assembly.aid.campaign.workingGroup.new')) {
      $state.go('v2.assembly.aid.campaign.workingGroup.new.description', {aid: $stateParams.aid, cid: $stateParams.cid});
    }

    if ($state.is('v2.assembly.aid.campaign.workingGroup.gid.edit')) {
      $state.go('v2.assembly.aid.campaign.workingGroup.gid.edit.description', {aid: $stateParams.aid, cid: $stateParams.cid, gid: $stateParams.gid});
    }

    if($stateParams.gid) {
      $scope.isEdit = true;
    }

  }
} ());
