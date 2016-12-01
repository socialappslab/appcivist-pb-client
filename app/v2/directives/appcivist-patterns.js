(function() {
'use strict';

/**
 * Directive that initialize appcivist-patterns JS helpers.
 */
appCivistApp
  .directive('appcivistPatterns',  AppcivistPatterns);

AppcivistPatterns.$inject = ['$timeout'];

function AppcivistPatterns($timeout) {

  function init() {
    $timeout(function() {
      appcvui.initialize();
    });
  }

  return {
    restrict: 'E',
    link: function() {
      init();
    }
  };
}
}());
