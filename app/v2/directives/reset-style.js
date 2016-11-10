(function() {
'use strict';

/**
 * Directive that reset all styles related to UI v1 version.
 */
appCivistApp
  .directive('resetStyle',  ResetStyle);

ResetStyle.$inject = [];

function ResetStyle() {

  return {
    restrict: 'E',
    link: function postLink(scope, element, attrs) {
      $('head style').detach();
      $('head link[rel=stylesheet]').detach();
    }
  };
}
}());
