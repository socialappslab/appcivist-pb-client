(function () {
  'use strict';

  /**
   * @name votingModal
   * @memberof components
   *
   * @description
   *  Component that renders main votingModal.
   *
   * @example
   *
   *  <voting-modal></voting-modal>
   */
  appCivistApp
    .component('votingModal', {
      selector: 'votingModal',
      transclude: true,
      bindings: {
        modalId: '@',
        title: '@',
        open: '=',
        startVoting: '='
      },
      controller: CampaignVotingModalCtrl,
      controllerAs: 'vm',
      templateUrl: '/app/v2/components/campaign-voting-modal/campaign-voting-modal.html'
    });

    CampaignVotingModalCtrl.$inject = [
      '$scope', '$timeout'
  ];

  function CampaignVotingModalCtrl($scope,$timeout) {
    this.$postLink = () => {
      if (this.open) {
        $timeout(() => angular.element('#'+this.modalId).modal({show:true}))
      }
    };
  }

}());