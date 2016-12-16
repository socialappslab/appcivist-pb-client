(function () {
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
      var v1MiniSelector = 'head link[href*=\'app.v1-mini.css\']';
      var v1Mini = $(v1MiniSelector);

      if (location.hash.includes('/v2/')) {
        v2 = true;
        $('head link[data-version=v1]').detach();
        $('head link[href*=\'vendor.css\']').detach();
        $('head link[href*=\'app.css\']').detach();
      } else {
        $('head link[data-version=v2]').detach();
        $('head link[href*=\'v2\']').detach();
      }

      if (location.hash.includes('campaign/new')) {
        if (!$(v1MiniSelector).lenght) {
          // ADD v1-mini style
          var el = $('head link[data-version=v2]').first();
          el.before(v1Mini);
        }
      } else {
        // REMOVE v1-mini style
        v1Mini = v1Mini.detach();
      }
      $rootScope.ui = {
        v2: v2
      };
    }

    return {
      restrict: 'E',
      link: function postLink(scope, element, attrs) {
        $rootScope.$on('$locationChangeStart', reset);
        $rootScope.$on('$stateChangeStart', reset);
      }
    };
  }
} ());
