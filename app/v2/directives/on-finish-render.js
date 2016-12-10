(function () {
  'use strict';

/**
 * Helper that allows us to pass a custom event name that gets
 * fired right after a ng-repeat directive finish iterating.
 */
  appCivistApp
    .directive('onFinishRender', onFinishRender);

  onFinishRender.$inject = ['$rootScope', '$timeout'];

  function onFinishRender($rootScope, $timeout) {
    return {
      restrict: 'A',
      link: function (scope, element, attr) {
        if (scope.$last === true) {
          $timeout(function () {
            $rootScope.$broadcast(attr.onFinishRender);
          });
        }
      }
    }
  }

} ())
