(function() {
  'use strict';

  /**
   * @name paginationWidget
   * @memberof directives
   * 
   * @description
   * 
   * Implements a pagination widget for contributions. The widget also setup a listener for the event
   * <i>pagination:reloadCurrentPage</i> in order to reload the current page.
   * 
   *
   * @example 
   * 
   * <pagination-widget page-size="pageSize" space="spaceID" resource="contribution" type="type" is-anonymous="isAnonymous"
   *                    is-coordinator="isCoordinator" sorting="sorting" ng-if="showPagination"></pagination-widget>
   * 
   */
  angular
    .module('appCivistApp')
    .directive('paginationWidget', paginationWidget);

  paginationWidget.$inject = ['$state', 'Contributions', 'Notify'];

  function paginationWidget($state, Contributions, Notify) {
    var directive = {
      restrict: 'E',
      scope: {
        pageSize: '=',
        space: '=',
        resource: '=',
        type: '=',
        isAnonymous: '=',
        isCoordinator: '=',
        sorting: '=',
        isTopicGroup: '=',
        campaign: '=',
        components: '='
      },
      templateUrl: '/app/v2/partials/directives/pagination-widget.html',
      link: function postLink(scope) {
        var vm = this;

        scope.$watch('sorting', function(newValue, oldValue) {
          if (!newValue || angular.equals(newValue, oldValue)) {
            return;
          }
          getResultsPage(1);
        });

        scope.$on('pagination:reloadCurrentPage', () => {
          getResultsPage(scope.pagination.current);
        });

        getResultsPage(1);
        scope.pagination = {
          current: 1
        };

        scope.pageChanged = function(newPage) {
          getResultsPage(newPage);
        };

        function getResultsPage(pageNumber) {
          var rsp;
          var query = { type: scope.type.toUpperCase(), 'sorting': scope.sorting };

          if (scope.isAnonymous) {
            rsp = Contributions.contributionInResourceSpaceByUUID(scope.space, pageNumber, scope.pageSize).get(query);
          } else {
            rsp = Contributions.contributionInResourceSpace(scope.space, pageNumber, scope.pageSize).get(query);
          }
          rsp.$promise.then(
            function(data) {
              var contributions = data.list;

              if (!contributions) {
                contributions = [];
              }
              scope.contributions = contributions;
              scope.totalContributions = data.total; //get from response
              scope.pagination.current = pageNumber;
            },
            function(error) {
              Notify.show('Error loading proposals from server', 'error');
            }
          );
        }

        scope.paginationTop = {};
        scope.paginationBottom = {};

        scope.paginationVisible = function(pag, visible) {
          if (scope.paginationTop.visible) {
            scope.paginationBottom.style = { display: 'none' };
            return;
          }
          pag.visible = visible;
          pag.style = visible ? {} : { display: 'none' };
        };

      }
    };
    return directive;
  }
}());