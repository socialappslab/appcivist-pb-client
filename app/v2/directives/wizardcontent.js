(function () {
  'use strict';

  angular
    .module('appCivistApp')
    .directive('wizardContent', wizardContent);

  function wizardContent() {
    var directive = {
      restrict: 'E',
      transclude: true,
      scope: {},
      templateUrl: '/app/v2/partials/directives/wizardcontent.html',
      link: linkFunc,
    };

    return directive;
  }

  function linkFunc(scope, element, attrs) {
  }
} ());
