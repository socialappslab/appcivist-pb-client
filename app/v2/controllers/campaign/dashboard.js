(function () {
  'use strict';

  angular
    .module('appCivistApp')
    .controller('v2.CampaignDashboardCtrl', CampaignDashboardCtrl);


  CampaignDashboardCtrl.$inject = [
    '$scope', 'Campaigns', '$stateParams', 'Assemblies', 'Contributions', '$filter',
    'localStorageService', 'FlashService', 'Memberships'
  ];

  function CampaignDashboardCtrl($scope, Campaigns, $stateParams, Assemblies, Contributions,
    $filter, localStorageService, FlashService, Memberships) {

    activate();

    function activate() {
      // Example http://localhost:8000/#/v2/assembly/8/campaign/56c08723-0758-4319-8dee-b752cf8004e6
      var pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      $scope.isAnonymous = false;
      $scope.ideasSectionExpanded = false;

      if ($stateParams.cuuid && pattern.test($stateParams.cuuid) === true) {
        $scope.campaignID = $stateParams.cuuid;
        $scope.isAnonymous = true;
      } else {
        $scope.assemblyID = ($stateParams.aid) ? parseInt($stateParams.aid) : 0;
        $scope.campaignID = ($stateParams.cid) ? parseInt($stateParams.cid) : 0;
        $scope.user = localStorageService.get('user');
      }
      $scope.showResourcesSection = false;
      $scope.toggleResourcesSection = toggleResourcesSection;
      $scope.toggleIdeasSection = toggleIdeasSection;
      $scope.doSearch = doSearch.bind($scope);
      $scope.loadThemes = loadThemes.bind($scope);
      loadAssembly();
      loadCampaigns();
      loadCampaignResources();

      $scope.myObject = {};
      $scope.myObject.refreshMenu = function () {
        $scope.myObject.showActionMenu = !$scope.myObject.showActionMenu;
      };
    }

    function loadAssembly() {
      var rsp = Assemblies.assembly($scope.assemblyID).get();
      rsp.$promise.then(function (data) {
        $scope.assembly = data;
      });
    }

    function loadCampaigns() {
      var res;
      if ($scope.isAnonymous) {
        res = Campaigns.campaignByUUID($scope.campaignID).get();
      } else {
        res = Campaigns.campaign($scope.assemblyID, $scope.campaignID).get();
      }

      res.$promise.then(function (data) {
        $scope.campaign = data;
        if (!$scope.isAnonymous) {
          $scope.spaceID = data.resourceSpaceId;
        } else {
          $scope.spaceID = data.resourceSpaceUUId;
        }
        var currentComponent = Campaigns.getCurrentComponent(data.components);
        setIdeasSectionVisibility(currentComponent);

        // get proposals
        getContributions($scope.campaign, 'PROPOSAL').then(function (response) {
          $scope.proposals = response;

          if (!$scope.proposals) {
            $scope.proposals = [];
          }
        });

        // get ideas
        getContributions($scope.campaign, 'IDEA').then(function (response) {
          $scope.ideas = response;

          if (!$scope.ideas) {
            $scope.ideas = [];
          }
        });

        // get discussions
        getContributions($scope.campaign, 'DISCUSSION').then(function (response) {
          $scope.discussions = response;

          if (!$scope.discussions) {
            $scope.discussions = [];
          }
        });
      });
    }

    function setIdeasSectionVisibility(component) {
      var key = component.key.toUpperCase();
      $scope.isIdeasSectionVisible = (key === 'PROPOSAL MAKING' || key === 'IDEAS');
    }

    /**
     * Get contributions from server.
     *
     * @param campaign {Campaign} the current campaign.
     * @param type {string} forum_post | comment | idea | question | issue |  proposal | note
     * @param filters {object} filters to apply
     * @return promise
     **/
    function getContributions(campaign, type, filters) {
      // Get list of contributions from server
      var rsp;

      var query = filters || {};
      query.type = type;
      query.pageSize = 16;
      console.log('GET', query);

      if ($scope.isAnonymous) {
        rsp = Contributions.contributionInResourceSpaceByUUID(campaign.resourceSpaceUUId).query(query);
      } else {
        rsp = Contributions.contributionInResourceSpace(campaign.resourceSpaceId).query(query);
      }
      rsp.$promise.then(
        function (data) {
          return data;
        },
        function (error) {
          FlashService.Error('Error loading campaign contributions from server');
        }
      );
      return rsp.$promise;
    }

    function loadCampaignResources() {
      var rsp = Campaigns.resources($scope.assemblyID, $scope.campaignID).query();
      rsp.$promise.then(
        function (resources) {
          $scope.campaignResources = resources;
        },
        function (error) {
          FlashService.Error('Error loading campaign resources from server');
        }
      );
    }

    function toggleResourcesSection() {
      $scope.showResourcesSection = !$scope.showResourcesSection;
    }

    function toggleIdeasSection() {
      $scope.ideasSectionExpanded = !$scope.ideasSectionExpanded;
    }

    /**
     * Search handler
     *
     *  @param {object} filters - filters definition
     */
    function doSearch(filters) {
      var type;
      var textSearch;
      var params = {};

      switch (filters.mode) {
        case 'proposals':
          textSearch = 'by_text';
          type = 'PROPOSAL';
          break;
        case 'groups':
          textSearch = 'by_groups';
          type = 'PROPOSAL';
          break;
        case 'ideas':
          textSearch = 'by_text';
          type = 'IDEA';
          break;
      }

      if (filters.searchText) {
        params[textSearch] = filters.searchText;
      }

      if (this.campaign) {
        params.sorting = filters.sorting;
        params.themes = filters.themes;
        getContributions(this.campaign, type, params);
      }
    }


    function loadThemes(query) {
      if (!$scope.campaign) {
        return;
      }
      return $scope.campaign.themes;
    }
  }
} ());
