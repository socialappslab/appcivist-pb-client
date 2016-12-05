(function () {
  'use strict';

  appCivistApp
    .directive('proposalNew', ProposalNew);

  ProposalNew.$inject = [];

  function ProposalNew() {

    return {
      restrict: 'E',
      scope: {
        campaign: '=',
        close: '&'
      },
      templateUrl: '/app/v2/partials/directives/proposal-new.html',
      link: function(scope, element, attrs) {
        scope.init = init.bind(scope);

        scope.$watch('campaign', function (newVal) {
          if (newVal) {
            scope.init();
          }
        });
      }
    };

    function init() {
      console.log('LITO!');
    }
  }
} ());
