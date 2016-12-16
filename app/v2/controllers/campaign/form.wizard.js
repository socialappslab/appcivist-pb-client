(function () {
  'use strict';

  angular
    .module('appCivistApp')
    .controller('v2.CampaignFormWizardCtrl', CampaignFormWizardCtrl);


  CampaignFormWizardCtrl.$inject = ['$state'];

  function CampaignFormWizardCtrl($state) {
    if ($state.is('v2.campaign.new')) {
      $state.go('v2.campaign.new.description');
    }
  }
} ());
