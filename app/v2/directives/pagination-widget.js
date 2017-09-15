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

  paginationWidget.$inject = ['$state', 'Contributions', 'Notify', 'Space'];

  function paginationWidget($state, Contributions, Notify, Space) {
    var directive = {
      restrict: 'E',
      scope: {
        pageSize: '=',
        space: '=',
        resource: '=',
        type: '=',
        isAnonymous: '=',
        isCoordinator: '=',
        isTopicGroup: '=',
        campaign: '=',
        components: '=',
        filters: '=',
        showVotingButtons: '='
      },
      templateUrl: '/app/v2/partials/directives/pagination-widget.html',
      link: function(scope) {
        scope.pagination = {
          current: 1
        };
        scope.paginationTop = {};
        scope.paginationBottom = {};
        scope.getResultsPage = getResultsPage.bind(scope);
        scope.pageChanged = pageChanged.bind(scope);
        scope.paginationVisible = paginationVisible.bind(scope);

        if (!scope.space) {
          scope.$watch('space', value => {
            if (!value) {
              return;
            }
            scope.getResultsPage(1);
          });
        } else {
          scope.getResultsPage(1);
        }

        scope.$on('pagination:reloadCurrentPage', () => {
          scope.getResultsPage(scope.pagination.current);
        });

        scope.$watchCollection('filters', value => {
          scope.getResultsPage(scope.pagination.current);
        });


        function pageChanged(newPage) {
          this.getResultsPage(newPage);
        }

        function getResultsPage(pageNumber) {
          if (!scope.space) {
            return;
          }
          let target = {};
          scope.filters.page = pageNumber - 1;

          if (scope.isAnonymous) {
            target.rsUUID = scope.space;
          } else {
            target.rsID = scope.space;
          }

          if (scope.filters) {
            Space.doSearch(target, scope.isAnonymous, scope.filters).then(
              data => {
                let contributions = data.list || [];
                scope.contributions = contributions;
                scope.totalContributions = data.total;
                scope.pagination.current = pageNumber;
              }
            );
          }
        }

        function paginationVisible(pag, visible) {
          if (this.paginationTop.visible) {
            this.paginationBottom.style = { display: 'none' };
            return;
          }
          pag.visible = visible;
          pag.style = visible ? {} : { display: 'none' };
        }
      }
    };
    return directive;
  }
}());
