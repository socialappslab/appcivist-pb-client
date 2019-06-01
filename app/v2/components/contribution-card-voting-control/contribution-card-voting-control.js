'use strict';

(function () {
  'use strict';

  /**
   * @name contributionCardVotingControl
   * @memberof components
   *
   * @description
   *  Component that renders breadcrumbs.
   *
   * @example
   *
   *  <contribution-card-voting-control></contribution-card-voting-control>
   */

  appCivistApp.component('contributionCardVotingControl', {
    selector: 'votingControl',
    bindings: {
      type: '@',
      ballotPaper: '=',
      contribution: '=',
      ballotTokens: '='

    },
    controller: contributionCardVotingControlCtrl,
    controllerAs: 'vm',
    templateUrl: '/app/v2/components/contribution-card-voting-control/contribution-card-voting-control.html'
  });

  contributionCardVotingControlCtrl.$inject = ['$scope'];

  function contributionCardVotingControlCtrl($scope) {
    this.activate = activate.bind(this);
    this.updateVote = updateVote.bind(this);
    this.voteValue = 0;
    /**
     * Initialization method.
     */
    this.$onInit = () => {
      $scope.$watch('vm.ballotPaper', ballotPaper => {
        if (!ballotPaper) {
          return;
        }
        this.activate();
      });
    };

    function activate() {
      if (this.ballotPaper) {
        this.ballot = this.ballotPaper.ballot; // the voting ballot, which holds voting configs
        this.voteRecord = this.ballotPaper.vote; // the ballot paper, which holds the votes of the user
        this.ballotPaperFinished = this.voteRecord && this.voteRecord.status > 0; // the user has finished voting
        this.candidatesIndex = this.ballot ? this.ballot.candidatesIndex : null; // map of [:contribution_uuid] => pos. of candidate in candidates array
        this.candidates = this.ballot ? this.ballot.candidates : []; // candidates array, which holds the candidateId for each candidate
        this.votesIndex = this.voteRecord ? this.voteRecord.votesIndex : null; // map of [:candidateId] => pos. of vote in votes array
        if(!this.votesIndex) {
          this.voteRecord.votesIndex = {};
          this.votesIndex = this.voteRecord.votesIndex; // map of [:candidateId] => pos. of vote in votes array
        }
        this.votes = this.voteRecord ? this.voteRecord.votes : []; // array of votes, which contains the value for each vote
        this.contributionUuid = this.contribution ? this.contribution.uuid : null; // contribution uuid for locating the candidate
        this.candidateIndex = this.candidatesIndex && this.contributionUuid ? this.candidatesIndex[this.contributionUuid] : null; // individual candidate index
        this.candidate = this.candidateIndex >= 0 ? this.candidates[this.candidateIndex] : null; // candidate object
        this.candidateId = this.candidate ? this.candidate.id : null; // candidate id
        this.voteIndex = this.votesIndex && this.candidateId ? this.votesIndex[this.candidateId] : null; // individual vote index
        this.vote = this.voteIndex >= 0 ? this.votes[this.voteIndex] : null; // vote object
        if (!this.vote && this.candidateId !== null && this.candidateId !== undefined) {
          this.vote = {
            "candidate_id": this.candidateId,
            "value": this.ballot.voting_system_type === "PLURALITY" ? "" : 0
          }
          this.votesIndex[this.candidateId] = this.votes.length;
          this.voteRecord.votes.push(this.vote);
        }
        this.voteValue = this.vote ? parseInt(this.vote.value) : 0; // vote value
        this.maxTokens = this.ballot ? parseInt(this.ballot.votes_limit) : 0;
      }
    }
  }


  function updateVote() {
    if (this.voteValue===null || this.voteValue === undefined
      || this.voteValue === "null" || this.voteValue === "undefined") {
      this.voteValue = 0;
    }

    let oldValue = this.vote.value;
    if (oldValue === null || oldValue === undefined
      || oldValue  === "null" || oldValue === "undefined") {
      oldValue = 0;
    }

    let diff = this.voteValue - oldValue;
    let updatedRemainder = this.ballotTokens ? this.ballotTokens.points-diff : 0;
    if((diff>0 && updatedRemainder >= 0) || (diff<0 && updatedRemainder <= this.maxTokens)) {
      this.vote.value = this.voteValue+"";
      this.ballotTokens.points = updatedRemainder;
    } else {
      this.voteValue = parseInt(this.vote.value);
    }
  }
})();
