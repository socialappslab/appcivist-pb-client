(function () {
  'use strict';

  /**
   * @name modal
   * @memberof directives
   * 
   * @description
   * 
   * Very simple modal directive.
   *
   * @example 
   * 
   * <modal title="Title" open-if="isModalOpened" close="closeModal('ID')" template-id="ID"></modal>
   *
   * <script id="ID" type="text/ng-template">
   *  // modal body
   * </script>
   */
  appCivistApp.directive('modal', modal);

  modal.$inject = ['$timeout', '$compile'];

  function modal($timeout, $compile) {
    return {
      restrict: 'E',
      scope: {
        title: '@',
        close: '&',
        openIf: '=',
        templateId: '@',
        // if specified, the modal directive generates a reference to the generated modal instance. 
        // for example, importFormModal generates the reference $importFormModal in the parent scope.
        modalInstanceReference: '@'
      },
      templateUrl: '/app/v2/partials/directives/modal.html',
      link: function (scope, element, attrs) {
        var vexInstance;
        vex.defaultOptions.className = 'vex-theme-plain';

        scope.$watch('openIf', function (open) {
          if (vexInstance) {
            vexInstance.close();
          }

          if (!open) {
            return;
          }
          var html = document.getElementById(scope.templateId).innerHTML;
          // TODO: here we need to destroy the scope when closing the modal, otherwise watchers don't disappear
          vexInstance = vex.open({
            className: "vex-theme-plain",
            unsafeContent: $compile(html)(scope.$parent)[0],
            afterClose: function () {
              if (angular.isFunction(scope.close)) {
                scope.$apply(function () {
                  scope.close();
                });
              }
            }
          });

          if (scope.modalInstanceReference) {
            scope.$parent['$' + scope.modalInstanceReference] = vexInstance;
          }
        });
      }
    };
  }
}());