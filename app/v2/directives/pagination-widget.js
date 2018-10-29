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

  paginationWidget.$inject = ['$state', 'Contributions', 'Notify', 'Space', '$rootScope', 'usSpinnerService', 'localStorageService', '$translate'];

  function paginationWidget($state, Contributions, Notify, Space, $rootScope, usSpinnerService, localStorageService, $translate) {
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
        scope.inferrType = inferrType.bind(scope);
        scope.prepareTranslations = prepareTranslations.bind(scope);
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

        function inferrType () {
          return this.components[0].type;
        }

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
            filters.createdByOnly = true;
            filters.status = "PUBLISHED, DRAFT, PUBLIC_DRAFT, INBALLOT, SELECTED, NEW, EXCLUDED, MERGED_PRIVATE_DRAFT, FORKED_PRIVATE_DRAFT, MERGED_PUBLIC_DRAFT, FORKED_PUBLIC_DRAFT, FORKED_PUBLISHED"; // if getting own contributions, bring all statuses
          }
          if (filters.mode === 'draftProposals' || filters.mode === 'draftIdeas') {
            filters.status = "DRAFT, PUBLIC_DRAFT, MERGED_PRIVATE_DRAFT, FORKED_PRIVATE_DRAFT";
          }
          if (filters.mode === 'sharedProposals' || filters.mode === 'sharedIdeas') {
            filters.excludeCreated = localStorageService.get('user').userId;
            filters.by_author = localStorageService.get('user').userId;
            filters.status = "PUBLISHED, DRAFT, PUBLIC_DRAFT, INBALLOT, SELECTED, NEW, EXCLUDED, MERGED_PRIVATE_DRAFT, FORKED_PRIVATE_DRAFT"; // if getting own contributions, bring all statuses
          }
          if (filters.mode === 'archivedProposals' || filters.mode === 'archivedIdeas') {
            filters.status = "ARCHIVED";
          }
          if (filters.mode === 'excludedProposals' || filters.mode === 'excludedIdeas') {
            filters.status = "EXCLUDED";
          }
          if (filters.mode === 'mergedProposals' || filters.mode === 'mergedIdeas') {
            filters.status = "MERGED_PUBLIC_DRAFT";
          }
          if (filters.mode === 'forkedProposals' || filters.mode === 'forkedIdeas') {
            filters.status = "FORKED_PUBLIC_DRAFT";
          }
          if (filters.mode==='forkedProposalsPublished' || filters.mode === 'forkedIdeasPublished') {
            filters.status = "FORKED_PUBLISHED"
          }

          this.prepareTranslations(filters);
          $rootScope.$on('$translateChangeSuccess', () => {
            scope.prepareTranslations(filters)
          });

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

        function prepareTranslations(filters) {
          let contributionPrototype = {};

          if (filters.mode && filters.mode.toLowerCase().includes("proposal")) {
            contributionPrototype.type="proposal";
            $translate(contributionPrototype.type).then(
              translation => {
                contributionPrototype.type = translation;
              }
            );
          }

          if (filters.status
            && (filters.status.toLowerCase().includes("public")
              || filters.status.toLowerCase().includes("published"))) {
            contributionPrototype.status="public_status";
            $translate(contributionPrototype.status).then(
              translation => {
                contributionPrototype.status = translation;
              }
            );
          } else if (filters.status && filters.status && filters.status.toLowerCase().includes("draft")) {
            contributionPrototype.status="draft_status";
            $translate(contributionPrototype.status).then(
              translation => {
                contributionPrototype.status = translation;
              }
            );
          } else {
            contributionPrototype.status=filters.status ? filters.status : "public_status";
            $translate(contributionPrototype.status).then(
              translation => {
                contributionPrototype.status = translation;
              }
            );
          }

          scope.contributionPrototype = contributionPrototype;
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
