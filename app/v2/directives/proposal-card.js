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
      scope.assemblyId = scope.proposal.workingGroupAuthors[0].assemblies[0];
      scope.groupId = scope.proposal.workingGroupAuthors[0].groupId;
    }
  };
}
}());
