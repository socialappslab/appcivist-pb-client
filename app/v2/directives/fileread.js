(function() {
  'use strict';

  /**
   * An ng-model-like directive for input[type=file]
   */
  appCivistApp
    .directive('fileread', fileread);

  function fileread() {
    return {
      scope: {
        fileread: '='
      },
      link: function(scope, element, attributes) {
        element.bind('change', function(changeEvent) {
          scope.$apply(function() {
            scope.fileread = changeEvent.target.files[0];
          });
        });

        scope.$on('$destroy', function() {
          element.unbind('change');
        });
      }
    }
  }
}())