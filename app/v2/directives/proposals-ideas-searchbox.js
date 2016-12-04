(function () {
  'use strict';

  appCivistApp
    .directive('proposalsIdeasSearchbox', ProposalsIdeasSearchbox);

  ProposalsIdeasSearchbox.$inject = ['Campaigns', 'localStorageService', 'Modal'];

  function ProposalsIdeasSearchbox(Campaigns, localStorageService, Modal) {

    return {
      restrict: 'E',
      scope: {
        // Function (mode, filtersSpec)
        searchHandler: '&',
        loadThemes: '&'
      },
      templateUrl: '/app/v2/partials/directives/proposals-ideas-searchbox.html',
      link: function postLink(scope, element, attrs) {
        scope.vm = {
          query: ''
        }
        scope.filters = {
          searchText: '',
          themes: [],
          // date_asc | date_desc | popularity | random
          sorting: 'date_asc',
          mode: 'proposals'
        };
        scope.searchMode = searchMode.bind(scope);
        scope.$watch('filters.searchText', searchTextObserver.bind(scope));
        scope.$watch('vm.query', queryTextObserver.bind(scope));
        scope.selectedThemes = [];
        scope.isCategoriesModalOpened = false;
        scope.isSuggestionListVisible = false;
        scope.select = select.bind(scope);
        scope.remove = remove.bind(scope);
        scope.toggleModal = toggleModal.bind(scope);
        scope.addSelectedThemes = addSelectedThemes.bind(scope);
        scope.removeThemeFilter = removeThemeFilter.bind(scope);
        scope.setSorting = setSorting.bind(scope);
        scope.sortingIs = sortingIs.bind(scope);
        scope.doSearch = doSearch.bind(scope);
      }
    };

    /**
     * Set the current searchmode of the search textbox.
     *
     * @param {string} mode - proposals | groups | ideas
     */
    function searchMode(mode, event) {
      event.preventDefault();

      if (this.filters.mode === mode) {
        return;
      }
      this.filters.mode = mode;

      if (this.filters.searchText.trim().length > 0) {
        this.doSearch();
      }
    }

    /**
     * Observes changes to searchText textbox.
     *
     * @param {string} newVal
     */
    function searchTextObserver(newVal) {
      var text = newVal.trim();

      if (text.length >= 4) {
        this.doSearch();
      }

      if (text.length === 0) {
        this.doSearch();
      }
    }

    /**
     * Observes changes to query textbox.
     *
     * @param {string} newVal
     */
    function queryTextObserver(newVal) {
      var text = newVal.trim();
      var self = this;
      self.isSuggestionListVisible = text.length > 0;

      if (!self.isSuggestionListVisible) {
        return;
      }
      var rsp = self.loadThemes({ query: text });

      if (angular.isFunction(rsp.then)) {
        rsp.then(function (themes) {
          self.themes = themes;
        })
      } else {
        self.themes = rsp;
      }
    }

    /**
     * Add a theme to the list of selected themes.
     *
     * @param {object} theme
     */
    function select(theme) {
      this.selectedThemes.push(theme);
      this.vm.query = '';
    }

    function remove(theme, event) {
      event.preventDefault();
      _.remove(this.selectedThemes, { themeId: theme.themeId });
    }

    /**
     * toggle current modal visibility.
     * @param {string} id
     */
    function toggleModal(id) {
      switch (id) {
        case 'categoriesModal':
          this.isCategoriesModalOpened = !this.isCategoriesModalOpened;
          break;
      }
    }

    /**
     * Add current selected themes to the filters object.
     *
     * @param {Object[]} selected
     */
    function addSelectedThemes(selected) {
      var themes = this.filters.themes.concat(selected);
      this.filters.themes = _.uniqBy(themes, function (e) {
        return e.themeId;
      });
      this.toggleModal('categoriesModal');
      this.doSearch();
    }

    /**
     * Remove theme from filters.themes array.
     *
     * @param {object} theme
     * @param {object} event
     */
    function removeThemeFilter(theme, event) {
      event.preventDefault();
      _.remove(this.filters.themes, { themeId: theme.themeId });
      this.doSearch();
    }

    /**
     * add sorting to filters object.
     *
     * @param {string} sort - date | random | popularity
     */
    function setSorting(sort) {
      if (sort === 'date') {
        // just toggle date sort direction
        this.filters.sorting = this.filters.sorting === 'date_asc' ? 'date_desc' : 'date_asc';
      } else {
        this.filters.sorting = sort;
      }
      this.doSearch();
    }

    /**
     * Check current sorting filter.
     *
     * @param {string} sort
     */
    function sortingIs(sort) {
      if (sort === 'date') {
        return this.filters.sorting === 'date_asc' || this.filters.sorting === 'date_desc';
      }
      return this.filters.sorting === sort;
    }

    /**
     * call search handler with current filters spec.
     */
    function doSearch() {
      this.searchHandler({ filters: this.filters });
    }
  }
} ());
