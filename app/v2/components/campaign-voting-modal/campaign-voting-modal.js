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
        startVoting: '=',
        isAnonymous: '=',
        ballotPaper: '=',
        ballotUuid: '=',
        ballotPaperSignature: '=',
        ballotPassword: '=',
        createBallotSuccess: '&'
      },
      controller: CampaignVotingModalCtrl,
      controllerAs: 'vm',
      templateUrl: '/app/v2/components/campaign-voting-modal/campaign-voting-modal.html'
    });

    CampaignVotingModalCtrl.$inject = [
      '$scope', '$timeout', 'Voting'
    ];

  function CampaignVotingModalCtrl($scope,$timeout, Voting) {
    this.$postLink = () => {
      $timeout(() => {
        if (this.open) {
            console.log(angular.element('#'+this.modalId));
            angular.element('#'+this.modalId).modal({show:true});
        }
      }, 2000)
    }

    this.createBallotPaper = createBallotPaper.bind(this);

    function createBallotPaper () {
      let vote = {
        "vote": {
          "signature": this.ballotPaperSignature
        },
        "password": this.ballotPassword
      };

      console.log("Creating ballot paper with "+vote);
      let rsp = Voting.ballotPaper(this.ballotUuid).create(vote);
      rsp.$promise.then(
        (data) => {
          this.createBallotSuccess({signature: data.vote.signature});
      },
        (error) => {
        console.log("Error on creating ballot paper: "+JSON.stringify(error));
      } );
    }
  }
}());
