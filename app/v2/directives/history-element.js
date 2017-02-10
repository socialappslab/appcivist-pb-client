(function() {
'use strict';

appCivistApp
  .directive('historyChange',  HistoryChange);

HistoryChange.$inject = [
  'localStorageService', 'AppCivistAuth', '$state', 'Space'
];

function HistoryChange(localStorageService, AppCivistAuth, $state, Space) {

  return {
    restrict: 'E',
    scope: {
      historyElement: '=',
      contribution: '='
    },
    templateUrl: '/app/v2/partials/directives/history-element.html',
    link: function postLink(scope, element, attrs) {

      scope.currentUser = localStorageService.get('user');

      if (scope.currentUser) {
        scope.currentAssembly = localStorageService.get('currentAssembly');
      }

      scope.getDayMonth = function (date) {
        date = date.replace("PM","");
        date = date.replace("GMT","");
        return moment(new Date(date)).format("MMMM D");
      }

      scope.getYear = function (date) {
        date = date.replace("PM","");
        date = date.replace("GMT","");
        return moment(new Date(date)).format("YYYY");
      }


    }
  };
}
}());
