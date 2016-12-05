(function () {
  'use strict';

  angular
    .module('appCivistApp')
    .controller('v2.CampaignDashboardCtrl', CampaignDashboardCtrl);


  CampaignDashboardCtrl.$inject = [
    '$scope', 'Campaigns', '$stateParams', 'Assemblies', 'Contributions', '$filter',
    'localStorageService', 'FlashService', 'Memberships', 'Space'
  ];

  function CampaignDashboardCtrl($scope, Campaigns, $stateParams, Assemblies, Contributions,
    $filter, localStorageService, FlashService, Memberships, Space) {

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
      $scope.modals =  {
        proposalNew: false
      };
      $scope.isModalOpened = isModalOpened.bind($scope);
      $scope.toggleModal = toggleModal.bind($scope);
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
        $scope.campaign.rsID = data.resourceSpaceId;
        $scope.campaign.rsUUID = data.resourceSpaceUUId;

        if (!$scope.isAnonymous) {
          $scope.spaceID = data.resourceSpaceId;
        } else {
          $scope.spaceID = data.resourceSpaceUUId;
        }
        var currentComponent = Campaigns.getCurrentComponent(data.components);
        setIdeasSectionVisibility(currentComponent);

        // get proposals
        Space.getContributions($scope.campaign, 'PROPOSAL', $scope.isAnonymous).then(function (response) {
          $scope.proposals = response;

          if (!$scope.proposals) {
            $scope.proposals = [];
          }
        });

        // get ideas
        Space.getContributions($scope.campaign, 'IDEA', $scope.isAnonymous).then(function (response) {
          $scope.ideas = response;

          if (!$scope.ideas) {
            $scope.ideas = [];
          }
        });

        // get discussions
        Space.getContributions($scope.campaign, 'DISCUSSION', $scope.isAnonymous).then(function (response) {
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

    function loadThemes(query) {
      if (!$scope.campaign) {
        return;
      }
      return $scope.campaign.themes;
    }

    /**
     * Space.doSearch wrapper.
     * @param {object} filters
     */
    function doSearch(filters) {
      Space.doSearch(this.campaign, this.isAnonymous, filters);
    }

    /**
     * helper that checks if modal is opened
     *
     * @param {string} id - modal ID
     */
    function isModalOpened(id) {
      return this.modals[id];
    }

    /**
     * helper that toggles modal visibility
     *
     * @param {string} id - modal ID
     */
    function toggleModal(id) {
      this.modals[id] = !this.modals[id];
    }
  }
} ());
