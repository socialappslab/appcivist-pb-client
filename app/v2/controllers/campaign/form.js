(function () {
  'use strict';

  angular
    .module('appCivistApp')
    .controller('v2.CampaignFormCtrl', CampaignFormCtrl);


  CampaignFormCtrl.$inject = ['$state'];

  function CampaignFormCtrl($state) {
    if ($state.is('v2.campaign.new')) {
      $state.go('v2.campaign.new.description');
    }
  }
} ());
