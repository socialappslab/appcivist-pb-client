(function () {
  'use strict';

  /**
   * @name breadcrumb
   * @memberof components
   *
   * @description
   *  Component that renders breadcrumbs.
   *
   * @example
   *
   *  <breadcrumb></breadcrumb>
   */
  appCivistApp
    .component('breadcrumb', {
      selector: 'breadcrumb',
      bindings: {
      },
      controller: BreadcrumbCtrl,
      controllerAs: 'vm',
      templateUrl: '/app/v2/components/breadcrumb/breadcrumb.html'
    });

  BreadcrumbCtrl.$inject = [
  ];

  function BreadcrumbCtrl() {
    }
}());