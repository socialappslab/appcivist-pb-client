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
  appCivistApp
    .component('contributionCardVotingControl', {
      selector: 'votingControl',
      bindings: {
        type: '@'
      },
      controller: contributionCardVotingControlCtrl,
      controllerAs: 'vm',
      templateUrl: '/app/v2/components/contribution-card-voting-control/contribution-card-voting-control.html'
    });

  contributionCardVotingControlCtrl.$inject = [
  ];

  function contributionCardVotingControlCtrl() {
  }
}());