(function() {
'use strict';

appCivistApp
  .directive('proposalCard',  ProposalCard);

ProposalCard.$inject = [];

function ProposalCard() {

  return {
    restrict: 'E',
    scope: {
      proposal: '=',
    },
    templateUrl: '/app/v2/partials/directives/proposal-card.html',
    link: function postLink(scope, element, attrs) {
    }
  };
}
}());
