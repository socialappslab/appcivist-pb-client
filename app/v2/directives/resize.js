(function () {
  'use strict';

  /**
   * Directive that listen for document.resize event.
   */
  appCivistApp
    .directive('resize', resize);

  resize.$inject = ['$timeout'];

  function resize($timeout) {

    return {
      restrict: 'A',
      link: function (scope, element, attrs) {
        window.addEventListener('resize', onResize);

        // if we receive a eqResize event, we emmit a native resize event
        scope.$on('eqResize', function () {
          var e = new Event('resize');
          window.dispatchEvent(e);
        });
      }
    };

    function onResize() {
      if (document.querySelector('.container__proposals')) {
        EqualHeights('.container__proposals .heading__working_group');
        EqualHeights('.container__proposals .heading--headline');
        EqualHeights('.container__proposals .title_block');
        EqualHeights('.container__proposals .card__header');
        EqualHeights('.container__proposals .card__body .excerpt');
        EqualHeights('.container__proposals .card__body');
      }

      if (document.querySelector('.container__ideas')) {
        //EqualHeights('.container__ideas .card__header .heading--headline');
        //EqualHeights('.container__ideas .card__header');
      }
    }

    /**
     * Added from pattern library appcivist_ui_core.js
     * Fixes some issues with contribution cards
     */
    function EqualHeights(selector) {
      var elms = document.querySelectorAll(selector);
      var len = elms.length;
      var tallest = 0;
      var elm, elmHeight, x;

      for (x = 0; x < len; x++) {
        elm = elms[x];
        elmHeight = elm.offsetHeight;
        tallest = (elmHeight > tallest) ? elmHeight : tallest;
      }

      for (x = 0; x < len; x++) {
        elms[x].style.height = tallest + 'px';
      }
    }
  }
} ());
