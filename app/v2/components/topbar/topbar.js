(function () {
  'use strict';

  /**
   * @name topbar
   * @memberof components
   *
   * @description
   *  Component that renders main topbar.
   *
   * @example
   *
   *  <topbar></topbar>
   */
  appCivistApp
    .component('topbar', {
      selector: 'topbar',
      bindings: {
      },
      controller: TopbarCtrl,
      controllerAs: 'vm',
      templateUrl: '/app/v2/components/topbar/topbar.html'
    });

  TopbarCtrl.$inject = [
  ];

  function TopbarCtrl() {
    }
}());