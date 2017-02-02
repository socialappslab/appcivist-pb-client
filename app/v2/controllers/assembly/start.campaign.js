(function() {
  'use strict';

  angular
    .module('appCivistApp')
    .controller('v2.StartCampaignCtrl', StartCampaignCtrl);

  StartCampaignCtrl.$inject = ['$state', 'localStorageService'];

  function StartCampaignCtrl($state, localStorageService) {
    this.start = start.bind(this);
    this.assembly = localStorageService.get('currentAssembly');



    /**
     * Redirects the user to the create campaign page.
     */
    function start() {
      $state.go('v2.assembly.aid.campaign.new', { aid: this.assembly.assemblyId });
    }
  }
}());