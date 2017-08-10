(function () {
  'use strict';

  /**
   * An ng-model-like directive for input[type=file]
   */
  appCivistApp
    .directive('fileread', fileread);

  function fileread() {
    return {
      scope: {
        // TODO: update each usage of this directive. We should not have fileread as a scope property.
        fileread: '=',
        onFileRead: '&?'
      },
      link: function (scope, element, attributes) {
        element.bind('change', function (changeEvent) {
          scope.$apply(function () {
            scope.fileread = changeEvent.target.files[0];

            if (angular.isFunction(scope.onFileRead)) {
              scope.onFileRead({ $file: scope.fileread });
            }
          });
        });

        // scope.$on('$destroy', function () {
        //   element.unbind('change');
        // });
      }
    }
  }
}())