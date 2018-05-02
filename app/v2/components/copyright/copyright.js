(function () {
  'use strict';

  /**
   * @name copyright
   * @memberof components
   *
   * @description
   *  Component that renders copyright information.
   *
   * @example
   *
   *  <copyright></copyright>
   */
  appCivistApp
    .component('copyright', {
      selector: 'copyright',
      bindings: {
        mode: '@'
      },
      controller: CopyrightCtrl,
      controllerAs: 'vm',
      templateUrl: '/app/v2/components/copyright/copyright.html'
    });

  CopyrightCtrl.$inject = [

  ];

  function CopyrightCtrl() {
  }
}());
