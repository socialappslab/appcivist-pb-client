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
        label: '<'
      },
      controller: BreadcrumbCtrl,
      controllerAs: 'vm',
      templateUrl: '/app/v2/components/breadcrumb/breadcrumb.html'
    });

  BreadcrumbCtrl.$inject = [
    '$state', '$scope'
  ];

  function BreadcrumbCtrl($state, $scope) {
    $scope.$watch('vm.label', newLabel => {
      if (!newLabel) {
        return;
      }
      $state.current.ncyBreadcrumb.label = newLabel;
      var element = angular.element($('#breadcrumbLastLabel'));
      element.html($state.current.ncyBreadcrumb.label);
    });
  }
}());