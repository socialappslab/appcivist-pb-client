(function() {
  'use strict';

  appCivistApp
    .directive('nonmemberAuthorForm', NonmemberAuthorForm);

  function NonmemberAuthorForm() {
    return {
      restrict: 'E',
      scope: {
        onChange: '&',
        disabled: '='
      },
      templateUrl: '/app/v2/partials/directives/nonmember-author-form.html',
      link: function(scope, element, attrs) {
        scope.$watchCollection('author', function(author) {
          scope.onChange({ author: author });
        });
      }
    }
  }
}());