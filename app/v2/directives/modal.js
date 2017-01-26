(function() {
  'use strict';

  /**
   * Very simple modal directive.
   * 
   * Usage:
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
        templateId: '@'
      },
      templateUrl: '/app/v2/partials/directives/modal.html',
      link: function(scope, element, attrs) {

        scope.$watch('openIf', function(open) {
          if (!open) {
            return;
          }
          var html = document.getElementById(scope.templateId).innerHTML;
          vex.open({
            unsafeContent: $compile(html)(scope.$parent)[0],
            afterClose: function() {
              if (angular.isFunction(scope.close)) {
                scope.close();
              }
            }
          });

        });
      }
    };
  }
}());