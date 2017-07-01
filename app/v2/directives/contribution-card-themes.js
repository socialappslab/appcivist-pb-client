(function () {
  'use strict';

  /**
   * @name contribution-card-themes
   * @memberof directives
   *
   * @description
   *  Component that renders the list of themes in the contribution-card.
   *
   * @example
   *
   *  <contribution-card-themes themes="themes"></contribution-card-themes>
   */
  appCivistApp
    .component('contributionCardThemes', {
      selector: 'contributionCardThemes',
      bindings: {
        themes: '<'
      },
      controller: FormCtrl,
      controllerAs: 'vm',
      templateUrl: '/app/v2/partials/directives/contribution-card-themes.html'
    });

  FormCtrl.$inject = [
    '$scope', '$element', '$timeout'
  ];

  function FormCtrl($scope, $element, $timeout) {
    this.showDotsButton = true;
    // flag used to apply is-flattening class to the list of themes element.
    this.isFlattening = true;
    this.hiddenEls = [];
    this.flatThemes = flatThemes.bind(this);
    this.showHiddenElements = showHiddenElements.bind(this);

    this.$postLink = () => {
      $timeout(() => this.flatThemes());
    }

    /**
     * The list of themes in the contribution card should only be displayed in one row.
     * If there is a second row, we hide it and display a "..." element, to expand the
     * second row.
     */
    function flatThemes() {
      let ul = $element.find('ul');
      let li = $(ul).find('li').first();

      if (!li || $(li).hasClass('dots')) {
        return;
      }
      const baseOffset = $(li).offset();
      if (!baseOffset) {
        return;
      }
      const ulHeight = $(ul).outerHeight();
      const liHeight = $(li).outerHeight();
      const delta = liHeight * 2;
      this.showDotsButton = liHeight && ulHeight >= delta;
      // we check which li element is part of the second row, if there is any.
      $(ul).find('li').each((idx, el) => {
        const offset = $(el).offset();

        if (offset && offset.top > baseOffset.top && !$(el).hasClass('dots')) {
          this.hiddenEls.push($(el).detach());
        }
      });

      // we check if our dots button is in the second row, so we remove the prev element.
      if (this.showDotsButton) {
        const dotsEl = $element.find('li.dots');
        const lastEl = $(dotsEl).prev();
        const offset = $(dotsEl).offset();

        if (offset.top > baseOffset.top) {
          $(lastEl).hide();
        }
      }
      this.isFlattening = false;
    }

    function showHiddenElements() {
      let ul = $element.find('ul');
      this.hiddenEls.forEach(e => $(ul).append(e));
      $element.find('li.dots').detach();
    }
  }
}());