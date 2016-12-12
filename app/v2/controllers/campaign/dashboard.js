(function () {
  'use strict';

  angular
    .module('appCivistApp')
    .controller('v2.CampaignDashboardCtrl', CampaignDashboardCtrl);


  CampaignDashboardCtrl.$inject = [
    '$scope', 'Campaigns', '$stateParams', 'Assemblies', 'Contributions', '$filter',
    'localStorageService', 'Notify', 'Memberships', 'Space', '$translate', '$rootScope',
    'WorkingGroups'
  ];

  function CampaignDashboardCtrl($scope, Campaigns, $stateParams, Assemblies, Contributions,
    $filter, localStorageService, Notify, Memberships, Space, $translate, $rootScope,
    WorkingGroups) {

    activate();

    function activate() {
      // Example http://localhost:8000/#/v2/assembly/8/campaign/56c08723-0758-4319-8dee-b752cf8004e6
      var pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      $scope.isAnonymous = false;
      $scope.ideasSectionExpanded = false;

      if ($stateParams.cuuid && pattern.test($stateParams.cuuid)) {
        $scope.campaignID = $stateParams.cuuid;
        $scope.isAnonymous = true;
      } else {
        $scope.assemblyID = ($stateParams.aid) ? parseInt($stateParams.aid) : 0;
        $scope.campaignID = ($stateParams.cid) ? parseInt($stateParams.cid) : 0;
        $scope.user = localStorageService.get('user');
        if ($scope.user && $scope.user.language) {
          $translate.use($scope.user.language);
        }
      }
      $scope.showResourcesSection = false;
      $scope.toggleResourcesSection = toggleResourcesSection;
      $scope.toggleIdeasSection = toggleIdeasSection;
      $scope.doSearch = doSearch.bind($scope);
      $scope.loadThemes = loadThemes.bind($scope);
      $scope.loadGroups = loadGroups.bind($scope);
      loadCampaigns();

      if(!$scope.isAnonymous) {
        loadAssembly();
        loadCampaignResources();
      }

      $scope.myObject = {};
      $scope.myObject.refreshMenu = function () {
        $scope.myObject.showActionMenu = !$scope.myObject.showActionMenu;
      };
      $scope.modals = {
        proposalNew: false
      };
      $scope.isModalOpened = isModalOpened.bind($scope);
      $scope.toggleModal = toggleModal.bind($scope);
    }

    function loadAssembly() {
      $scope.assembly = localStorageService.get('currentAssembly');
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

        // We are reading the components twice,
        // - in the campaign-timeline directive
        // - here
        // TODO: find a way of reading it just once
        // (can we defer the rendering of the campaign-timeline directive until this part of the code is run)
        var res;
        if (!$scope.isAnonymous) {
          res = Campaigns.components($scope.assemblyID, $scope.campaignID, false, null, null);
        } else {
          res = Campaigns.componentsByCampaignUUID($scope.campaignID).query();
        }
        res.then(function (data) {
          var currentComponent = Campaigns.getCurrentComponent(data);
          setIdeasSectionVisibility(currentComponent);
          $scope.components = data;
        }, defaultErrorCallback);

        // get proposals
        Space.getContributions($scope.campaign, 'PROPOSAL', $scope.isAnonymous).then(function (response) {
          $scope.proposals = response;

          if (!$scope.proposals) {
            $scope.proposals = [];
          }

          // get ideas
          Space.getContributions($scope.campaign, 'IDEA', $scope.isAnonymous).then(function (response) {
            $scope.ideas = response;

            if (!$scope.ideas) {
              $scope.ideas = [];
            }
          }, defaultErrorCallback);

          // get discussions
          Space.getContributions($scope.campaign, 'DISCUSSION', $scope.isAnonymous).then(function (response) {
            $scope.discussions = response;

            if (!$scope.discussions) {
              $scope.discussions = [];
            }
          }, defaultErrorCallback);
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
          Notify.show('Error loading campaign resources from server', 'error');
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
      return Campaigns.themes($scope.assemblyID, $scope.campaignID, $scope.isAnonymous, $scope.campaignID, {});
    }

    function loadGroups(query) {
      if (!$scope.campaign) {
        return;
      }
      return WorkingGroups.workingGroupsInCampaign($scope.assemblyID, $scope.campaignID).query().$promise;
    }

    /**
     * Space.doSearch wrapper.
     * @param {object} filters
     */
    function doSearch(filters) {
      // only send themes and groups as an array of IDs
      var self = this;
      var rsp = Space.doSearch(this.campaign, this.isAnonymous, filters);

      if(!rsp) {
        return;
      }
      rsp.then(function(data) {
        if(filters.mode === 'proposal') {
          self.proposals = data;
        }else if(filters.mode === 'idea') {
          self.ideas = data;
        }
      });
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

    function defaultErrorCallback (error) {
      Notify.show('Error loading data from server', 'error');
    }
  }
} ());
