(function() {
'use strict';

appCivistApp
  .directive('ideaCard',  IdeaCard);

IdeaCard.$inject = [];

function IdeaCard() {

  return {
    restrict: 'E',
    scope: {
      idea: '=',
    },
    templateUrl: '/app/v2/partials/directives/idea-card.html',
    link: function postLink(scope, element, attrs) {
    }
  };
}
}());
