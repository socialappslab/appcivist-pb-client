(function() {
'use strict';

/**
 * Defines a filtering widget for contributions.
 */
appCivistApp
  .directive('contributionFilter',  ContributionFilter);

ContributionFilter.$inject = ['Contributions'];

function ContributionFilter(Contributions) {
  
  var directive = {
    restrict: 'E',
    scope: {
      list: '=',
      type: '@',
      spaceId: '@'
    },
    templateUrl: '/app/v2/partials/directives/contribution-filter.html',
    link: link
  };
  return directive;

  function link(scope, element, attrs) {
    scope.filters = {
      type: scope.type
    };
    scope.sortBy = sortBy.bind(scope);
  }

  function sortBy(type) {
    this.filters.sort = type;
    search(this);
  }

  function search(scope) {
    var rsp = Contributions.contributionInResourceSpace(scope.spaceId).query(scope.filters);
    rsp.$promise.then(
      function(data) {
        scope.list = data;
      },
      function(error) {
        console.log(error);
      }
    );
  }
}
}());
