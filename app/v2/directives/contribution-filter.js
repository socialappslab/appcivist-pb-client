(function() {
'use strict';

/**
 * Defines a filtering widget for contributions.
 */
appCivistApp
  .directive('contributionFilter',  ContributionFilter);

ContributionFilter.$inject = [];

function ContributionFilter() {
  
  return {
    restrict: 'E',
    templateUrl: '/app/v2/partials/directives/contribution-filter.html',
    link: function postLink(scope, element, attrs) {
    }
  };
}
}());
