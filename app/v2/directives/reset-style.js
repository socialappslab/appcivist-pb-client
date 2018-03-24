(function() {
  'use strict';

  /**
   * Directive that reset all styles based on the base URL.
   */
  appCivistApp
    .directive('resetStyle', ResetStyle);

  ResetStyle.$inject = ['$rootScope'];

  function ResetStyle($rootScope) {

    function reset() {
      var v2 = false;
      if (location.hash.includes('/v2/')) {
        v2 = true;
        $('head link[data-version=v1]').detach();
        $('head link[href*=\'vendor.css\']').detach();
        $('head link[href*=\'app.css\']').detach();
      } else if (location.hash === '#/' || location.hash === '/' || location.hash === '') {
        //v2 = true;
        $('head link[data-version=v1]').detach();
        $('head link[href*=\'vendor.css\']').detach();
        $('head link[href*=\'app.css\']').detach();
      } else {
        $('head link[data-version=v2]').detach();
        $('head link[href*=\'v2\']').detach();
      }
      $rootScope.ui = {
        v2: v2
      };
      console.log("Version 2 loaded = "+v2);
    }

    return {
      restrict: 'E',
      link: function postLink(scope, element, attrs) {
        $rootScope.$on('$locationChangeStart', reset);
        $rootScope.$on('$stateChangeStart', reset);
      }
    };
  }
}());
