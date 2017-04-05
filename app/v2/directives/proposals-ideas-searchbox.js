(function() {
  'use strict';

  appCivistApp
    .directive('proposalsIdeasSearchbox', ProposalsIdeasSearchbox);

  ProposalsIdeasSearchbox.$inject = ['Campaigns', 'localStorageService'];

  function ProposalsIdeasSearchbox(Campaigns, localStorageService) {

    return {
      restrict: 'E',
      scope: {
        // Function (mode, filtersSpec)
        searchHandler: '&',
        loadThemes: '&',
        loadGroups: '&?',
        isAnonymous: '=',
        campaignConfig: '=',
        campaignContributionTypes: '@',
        sorting: '='
      },
      templateUrl: '/app/v2/partials/directives/proposals-ideas-searchbox.html',
      link: function(scope, element, attrs) {
        scope.filters = {
          searchText: '',
          themes: [],
          groups: [],
          // date_asc | date_desc | popularity | random | most_commented | most_commented_public | most_commented_members
          sorting: 'date_asc',
          mode: 'proposal'
        };
        scope.vm = {
          selectedThemes: [],
          selectedGroups: [],
          canFilterByGroup: !!scope.loadGroups
        };
        scope.themesOptions = {
          textField: 'title',
          idField: 'themeId'
        };
        scope.groupsOptions = {
          textField: 'name',
          idField: 'groupId'
        };
        scope.searchMode = searchMode.bind(scope);
        scope.$watch('filters.searchText', searchTextObserver.bind(scope));
        scope.selectedThemes = [];
        scope.isCategoriesModalOpened = false;
        scope.isSuggestionListVisible = false;
        scope.toggleModal = toggleModal.bind(scope);
        scope.setSorting = setSorting.bind(scope);
        scope.sortingIs = sortingIs.bind(scope);
        scope.doSearch = doSearch.bind(scope);
        scope.addSelected = addSelected.bind(scope);
        scope.removeThemeFilter = removeThemeFilter.bind(scope);
        scope.removeGroupFilter = removeGroupFilter.bind(scope);
      }
    };

    /**
     * Set the current searchmode of the search textbox.
     *
     * @param {string} mode - PROPOSAL | IDEA
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
     * Add current selected themes/groups to the filters object.
     *
     */
    function addSelected() {
      var themes = this.filters.themes.concat(this.vm.selectedThemes);
      var groups = this.filters.groups.concat(this.vm.selectedGroups);
      this.filters.themes = _.uniqBy(themes, function(e) {
        return e.themeId;
      });
      this.filters.groups = _.uniqBy(groups, function(e) {
        return e.groupId;
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
      var toRemove = { themeId: theme.themeId };
      _.remove(this.filters.themes, toRemove);
      _.remove(this.vm.selectedThemes, toRemove);
      this.doSearch();
    }

    /**
     * Remove group from filters.groups array.
     *
     * @param {object} group
     * @param {object} event
     */
    function removeGroupFilter(group, event) {
      event.preventDefault();
      var toRemove = { groupId: group.groupId };
      _.remove(this.filters.groups, toRemove);
      _.remove(this.vm.selectedGroups, toRemove);
      this.doSearch();
    }

    /**
     * add sorting to filters object.
     *
     * @param {string} sort - date | random | popularity | most_commented | most_commented_public | most_commented_members
     */
    function setSorting(sort) {
      if (sort === 'date') {
        // just toggle date sort direction
        this.filters.sorting = this.filters.sorting === 'date_asc' ? 'date_desc' : 'date_asc';
      } else if (sort === 'popularity') {
        this.filters.sorting = this.filters.sorting === 'popularity_asc' ? 'popularity_desc' : 'popularity_asc';
      } else if (sort === 'most_commented') {
        this.filters.sorting = this.filters.sorting === 'most_commented_asc' ? 'most_commented_desc' : 'most_commented_asc';
      } else if (sort === 'most_commented_public') {
        this.filters.sorting = this.filters.sorting === 'most_commented_public_asc' ? 'most_commented_public_desc' : 'most_commented_public_asc';
      } else if (sort === 'most_commented_members') {
        this.filters.sorting = this.filters.sorting === 'most_commented_members_asc' ? 'most_commented_members_desc' : 'most_commented_members_asc';
      } else {
        this.filters.sorting = sort;
      }
      this.sorting = this.filters.sorting;
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
      } else if (sort === 'popularity') {
        return this.filters.sorting === 'popularity_asc' || this.filters.sorting === 'popularity_desc';
      } else if (sort === 'most_commented') {
        return this.filters.sorting === 'most_commented_asc' || this.filters.sorting === 'most_commented_desc';
      } else if (sort === 'most_commented_public') {
        return this.filters.sorting === 'most_commented_public_asc' || this.filters.sorting === 'most_commented_public_desc';
      } else if (sort === 'most_commented_members') {
        return this.filters.sorting === 'most_commented_members_asc' || this.filters.sorting === 'most_commented_members_desc';
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
}());