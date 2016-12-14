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
        window.addEventListener('resize', onResize.bind(scope));
        var transitionEvent = whichTransitionEvent();

        // if we receive a eqResize event, we emmit a native resize event
        scope.$on('eqResize', function (event, animated) {
          /* delay resize if there is a transition going on */
          if (animated) {
            document.addEventListener(transitionEvent, emmitResize);
          } else {
            emmitResize();
          }
        });

        scope.$on('eqResizeEnd', function (event) {
          document.removeEventListener(transitionEvent, emmitResize)
        });
      }
    };


    /* From Modernizr */
    function whichTransitionEvent() {
      var t;
      var el = document.createElement('fakeelement');
      var transitions = {
        'transition': 'transitionend',
        'OTransition': 'oTransitionEnd',
        'MozTransition': 'transitionend',
        'WebkitTransition': 'webkitTransitionEnd'
      }

      for (t in transitions) {
        if (el.style[t] !== undefined) {
          return transitions[t];
        }
      }
    }

    function emmitResize() {
      var e = new Event('resize');
      window.dispatchEvent(e);
    }

    function onResize() {
      if (document.querySelector('.container__proposals')) {
        EqualHeights('.container__proposals .heading__working_group');
        EqualHeights('.container__proposals .heading--headline');
        EqualHeights('.container__proposals .title_block');
        EqualHeights('.container__proposals .card__header');
        EqualHeights('.container__proposals .card__body .excerpt');
        EqualHeights('.container__proposals .card__body');
      }
      this.$broadcast('eqResizeEnd');
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
