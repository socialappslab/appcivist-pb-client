(function () {
  'use strict';

  angular
    .module('appCivistApp')
    .controller('v2.CampaignFormWizardCtrl', CampaignFormWizardCtrl);

  CampaignFormWizardCtrl.$inject = ['$state', '$stateParams', '$scope'];

  function CampaignFormWizardCtrl($state, $stateParams, $scope) {

    if ($state.is('v2.assembly.aid.campaign.new')) {
      $state.go('v2.assembly.aid.campaign.new.description', {aid: $stateParams.aid});
    }

    if ($state.is('v2.assembly.aid.campaign.edit')) {
      $state.go('v2.assembly.aid.campaign.edit.description', {aid: $stateParams.aid, cid: $stateParams.cid});
    }

    if($stateParams.cid) {
      $scope.isEdit = true;
    }
  }
} ());
