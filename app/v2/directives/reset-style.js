(function() {
'use strict';

/**
 * Directive that reset all styles related to UI v1 version.
 */
appCivistApp
  .directive('resetStyle',  ResetStyle);

ResetStyle.$inject = ['$rootScope'];

function ResetStyle($rootScope) {

  return {
    restrict: 'E',
    link: function postLink(scope, element, attrs) {
      if($rootScope.ui.v2){
        $('head style').detach();
        $('head link[rel=stylesheet]').detach();
      }
    }
  };
}
}());
