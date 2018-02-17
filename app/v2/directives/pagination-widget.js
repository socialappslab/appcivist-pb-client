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
   * <pagination-widget page-size="pageSize" space="spaceID" resource="contribution" is-anonymous="isAnonymous"
   *                    is-coordinator="isCoordinator" sorting="sorting" ng-if="showPagination"></pagination-widget>
   *
   */
  angular
    .module('appCivistApp')
    .directive('paginationWidget', paginationWidget);

  paginationWidget.$inject = ['$state', 'Contributions', 'Notify', 'Space', '$rootScope', 'usSpinnerService', 'localStorageService'];

  function paginationWidget($state, Contributions, Notify, Space, $rootScope, usSpinnerService, localStorageService) {
    var directive = {
      restrict: 'E',
      scope: {
        pageSize: '=',
        space: '=',
        resource: '=',
        isAnonymous: '=',
        isCoordinator: '=',
        isTopicGroup: '=',
        campaign: '=',
        components: '=',
        filters: '=',
        showVotingButtons: '=',
        ballotPaper: '=',
        ballotTokens: '=',
        selected: '='
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
        scope.startSpinner = startSpinner.bind(scope);
        scope.stopSpinner = stopSpinner.bind(scope);
        scope.spinnerActive = true;
        scope.spinnerOptions = {
          radius:10,
          width:4,
          length: 10,
          top: '75%',
          left: '50%',
          zIndex: 1
        };
        scope.selectedContributions = [];

        scope.$on('pagination:reloadCurrentPage', () => {
          scope.getResultsPage(scope.pagination.current);
        });

        scope.$on('pagination:fireDoSearch', () => {
          scope.getResultsPage(1);
        });

        scope.onCardSelected = function(card) {
          alert(card);
        }

        scope.$on('pagination:fireDoSearchFromGroup', () => {
          scope.getResultsPage(1);
        });
        console.log('Pagination-Widget:Link => DECLARED => pagination:fireDoSearchFromGroup');

        $rootScope.$broadcast('dashboard:paginationWidgetListenersAreReady');
        console.log('Pagination-Widget:Link => BROADCASTED => dashboard:paginationWidgetListenersAreReady');

        function startSpinner () {
          this.spinnerActive = true;
          usSpinnerService.spin('contributions-page');
        }

        function stopSpinner () {
          usSpinnerService.stop('contributions-page');
          this.spinnerActive = false;
        }

        function pageChanged(newPage, oldPage) {
          if(oldPage && newPage && newPage!==oldPage) {
            this.getResultsPage(newPage);
          }
        }

        function getResultsPage(pageNumber) {
          this.startSpinner();
          if (!scope.space) {
            return;
          }
          let target = {};
          var filters = _.cloneDeep(scope.filters);

          filters.page = pageNumber - 1;

          if (scope.isAnonymous) {
            target.rsUUID = scope.space;
          } else {
            target.rsID = scope.space;
          }

          if (filters.mode === 'myProposals' || filters.mode === 'myIdeas') {
            filters.by_author = localStorageService.get('user').userId;
          }

          if (filters) {
            Space.doSearch(target, scope.isAnonymous, filters).then(
              data => {
                let contributions = data ? data.list || [] : [];
                scope.contributions = contributions;
                scope.totalContributions = data ? data.total : 0;
                scope.pagination.current = pageNumber;
                scope.stopSpinner();
              });
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
