(function() {
'use strict';

/**
 * Directive that reset all styles related to UI v1 version.
 */
appCivistApp
  .directive('resetStyle',  ResetStyle);

ResetStyle.$inject = ['$rootScope'];

function ResetStyle($rootScope) {
  
  function reset() {
    if(location.hash.includes('/v2/')){
      $('head style').detach();
      $('head link[rel=stylesheet]').detach();
    }
  }

  return {
    restrict: 'E',
    link: function postLink(scope, element, attrs) {
      $rootScope.$on('$locationChangeStart', function(next, current) {
        reset();
      });
    }
  };
}
}());
