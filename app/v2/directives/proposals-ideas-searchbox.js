'use strict';

(function () {
  'use strict';

  appCivistApp.directive('proposalsIdeasSearchbox', ProposalsIdeasSearchbox);

  ProposalsIdeasSearchbox.$inject = ['Campaigns', 'localStorageService'];

  function ProposalsIdeasSearchbox(Campaigns, localStorageService) {

    return {
      restrict: 'E',
      scope: {
        // @Deprecated Function (mode, filtersSpec)
        searchHandler: '&',
        loadThemes: '&',
        loadGroups: '&?',
        isAnonymous: '=',
        campaignConfig: '=',
        campaignContributionTypes: '@',
        // @Deprecated false | true. If true, the widget will call the searchHandler. Otherwise, generated filters
        // and sorting will be updated without calling the backend
        dryRun: '@',
        // the current component of the campaign
        currentComponent: '=',
        // currentComponent.type was not working in the watcher, so I added this variable to make sure it works
        filters: '=',
        isCoordinator: '='

      },
      templateUrl: '/app/v2/partials/directives/proposals-ideas-searchbox.html',
      link: function (scope, element, attrs) {
        if (!scope.filters) {
          scope.filters = {
            searchText: '',
            themes: [],
            groups: [],
            // date_asc | date_desc | popularity | random | most_commented | most_commented_public | most_commented_members
            sorting: 'random',
            pageSize: 12
          };
        }
        scope.vm = {
          selectedThemes: [],
          selectedGroups: []
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
        scope.setMode = setMode.bind(scope);
        scope.getDefaultMode = getDefaultMode.bind(scope);
        scope.updateFilters = updateFilters.bind(scope);

        scope.$watch('filters.searchText', searchTextObserver.bind(scope));
        scope.$on('filters:updateFilters', scope.updateFilters);
        console.log('Filters:Link => DECLARED => filters:updateFilters');
      }
    };

    function updateFilters(evt, newFilters) {
      this.filters = newFilters;
      this.doSearch();
    }

    /**
     * Set the current searchmode of the search textbox.
     *
     * @param {string} mode - proposal | idea | myProposals | myIdeas | sharedProposals | sharedIdeas
     */
    function searchMode(mode, event) {
      if (event) {
        event.preventDefault();
      }

      if (this.filters.mode === mode) {
        if (mode !== this.getDefaultMode()) {
          this.setMode();
        }
        return;
      }

      if (mode === 'none') {
        return;
      }

      this.filters.mode = mode;
      this.doSearch();
    }

    /**
     * Observes changes to searchText textbox.
     *
     * @param {string} newVal
     */
    function searchTextObserver(newVal) {
      if(newVal === null || newVal === undefined) {
        return;
      }

      let text = newVal.trim();

      // doSearch 2
      if (text.length >= 4) {
        console.log("filters.doSearch 2 (textObserver >=4): "+JSON.stringify(this.filters));
        this.doSearch();
      }

      if (text.length === 0 && this.filters && this.filters.mode) {
        console.log("filters.doSearch 3 (textObserver === 0 && vmFilters): "+JSON.stringify(this.filters));
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
      this.filters.themes = _.uniqBy(themes, function (e) {
        return e.themeId;
      });
      this.filters.groups = _.uniqBy(groups, function (e) {
        return e.groupId;
      });
      this.toggleModal('categoriesModal');
      console.log("filters.doSearch 4 (add Selected): "+JSON.stringify(this.filters));
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
      console.log("filters.doSearch 5 (removeThemeFilter): "+JSON.stringify(this.filters));
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
      console.log("filters.doSearch 6 (removeGroupFilter): "+JSON.stringify(this.filters));
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
     * call search handler with current filters spec. If dryRun is true, just update generatedFilters.
     */
    function doSearch() {
      var filters = _.cloneDeep(this.filters);
      if (filters.mode === 'myProposals') {
        filters.mode = 'proposal';
        this.vm.canFilterByGroup = this.loadGroups;
        var user = localStorageService.get('user');
        filters.by_author = user.userId;
        filters.createdByOnly = true;
        filters.status = "PUBLISHED, DRAFT, PUBLIC_DRAFT, INBALLOT, SELECTED, NEW, EXCLUDED, FORKED_PRIVATE_DRAFT, MERGED_PRIVATE_DRAFT, FORKED_PUBLIC_DRAFT, FORKED_PUBLISHED, MERGED_PUBLIC_DRAFT"; // when asking for own proposals, bring everything
      }
      if (filters.mode === 'myIdeas') {
        filters.mode = 'idea';
        this.vm.canFilterByGroup = this.loadGroups && filters.mode != 'idea';
        var _user = localStorageService.get('user');
        filters.by_author = _user.userId;
        filters.status = "PUBLISHED, DRAFT, PUBLIC_DRAFT, INBALLOT, SELECTED, NEW, EXCLUDED, FORKED_PRIVATE_DRAFT, MERGED_PRIVATE_DRAFT, FORKED_PUBLIC_DRAFT, FORKED_PUBLISHED, MERGED_PUBLIC_DRAFT"; // when asking for own proposals, bring everything
      }
      if (filters.mode === 'draftProposals') {
        filters.mode = 'proposal';
        this.vm.canFilterByGroup = this.loadGroups;
        filters.status = "DRAFT, PUBLIC_DRAFT, FORKED_PRIVATE_DRAFT, MERGED_PRIVATE_DRAFT";
      }
      if (filters.mode === 'draftIdeas') {
        filters.mode = 'idea';
        this.vm.canFilterByGroup = this.loadGroups && filters.mode != 'idea';
        filters.status = "DRAFT, PUBLIC_DRAFT, FORKED_PRIVATE_DRAFT, MERGED_PRIVATE_DRAFT";
      }
      if (filters.mode === 'sharedProposals') {
        filters.mode = 'proposal';
        this.vm.canFilterByGroup = this.loadGroups;
        var user = localStorageService.get('user');
        filters.shared_with = user.userId;
        filters.status = "PUBLISHED, DRAFT, PUBLIC_DRAFT, INBALLOT, SELECTED, NEW, EXCLUDED, FORKED_PRIVATE_DRAFT, MERGED_PRIVATE_DRAFT, FORKED_PUBLIC_DRAFT, FORKED_PUBLISHED, MERGED_PUBLIC_DRAFT"; // when asking for own proposals, bring everything
      }
      if (filters.mode === 'mergedProposals') {
        filters.mode = 'proposal';
        this.vm.canFilterByGroup = this.loadGroups;
        filters.status = "MERGED_PRIVATE_DRAFT, MERGED_PUBLIC_DRAFT";
      }
      if (filters.mode === 'mergedIdeas') {
        filters.mode = 'idea';
        this.vm.canFilterByGroup = this.loadGroups;
        filters.status = "MERGED_PUBLIC_DRAFT";
      }
      if (filters.mode === 'forkedProposals') {
        filters.mode = 'proposal';
        this.vm.canFilterByGroup = this.loadGroups;
        filters.status = "FORKED_PUBLIC_DRAFT, FORKED_PUBLISHED";
      }
      if (filters.mode === 'forkedIdeas') {
        filters.mode = 'idea';
        this.vm.canFilterByGroup = this.loadGroups;
        filters.status = "FORKED_PUBLIC_DRAFT, FORKED_PUBLISHED";
      }
      if (filters.mode === 'archivedProposals') {
        filters.mode = 'proposal';
        this.vm.canFilterByGroup = this.loadGroups;
        filters.status = "ARCHIVED";
      }
      if (filters.mode === 'archivedIdeas') {
        filters.mode = 'idea';
        this.vm.canFilterByGroup = this.loadGroups;
        filters.status = "ARCHIVED";
      }
      if (filters.mode === 'excludedProposals') {
        filters.mode = 'proposal';
        this.vm.canFilterByGroup = this.loadGroups;
        filters.status = "EXCLUDED";
      }
      if (filters.mode === 'excludedIdeas') {
        filters.mode = 'idea';
        this.vm.canFilterByGroup = this.loadGroups;
        filters.status = "EXCLUDED";
      }
      // if (this.dryRun === 'true') {
      //   this.generatedFilters = filters;
      // } else {
      //   this.searchHandler({ filters: filters });
      // }
      this.$emit('dashboard:fireDoSearch');
    }

    /**
     * Sets filter mode based on currentComponent.
     *
     * @private
     */
    function setMode() {
      var mode = this.getDefaultMode();
      this.vm.canFilterByGroup = this.loadGroups && mode !== 'idea';
      this.searchMode(mode);
    }


    /**
     * Get the current search mode based on the current component.
     *
     * @private
     * @returns {string} current filter mode
     */
    function getDefaultMode() {
      var mode = 'proposal';

      if (this && this.filters && this.filters.mode) {
        mode = this.filters.mode;
      }
      return mode;
    }
  }
})();
//# sourceMappingURL=proposals-ideas-searchbox.js.map
