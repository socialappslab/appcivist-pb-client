(function() {
'use strict';

appCivistApp
  .directive('activityCard',  ActivityCard);

ActivityCard.$inject = [];

function ActivityCard() {

  return {
    restrict: 'E',
    scope: {
      activity: '=',
    },
    templateUrl: '/app/v2/partials/directives/activity-card.html',
    link: function postLink(scope, element, attrs) {
      scope.formatDate = function(date){
        return moment(date, 'YYYY-MM-DD HH:mm').local().format('LL');
      };
    }
  };
}
}());
