(function() {
  'use strict';

  angular
    .module('appCivistApp')
    .controller('v2.CampaignDashboardCtrl', CampaignDashboardCtrl);


  CampaignDashboardCtrl.$inject = [
    '$scope', 'Campaigns', '$stateParams', 'Assemblies', 'Contributions', '$filter',
    'localStorageService', 'Notify', 'Memberships', 'Space', '$translate', '$rootScope',
    'WorkingGroups', '$compile'
  ];

  function CampaignDashboardCtrl($scope, Campaigns, $stateParams, Assemblies, Contributions,
    $filter, localStorageService, Notify, Memberships, Space, $translate, $rootScope,
    WorkingGroups, $compile) {

    $scope.activeTab = "Public";
    $scope.changeActiveTab = function(tab) {
      if (tab == 1)
        $scope.activeTab = "Members";
      else
        $scope.activeTab = "Public";
    }

    activate();

    function activate() {
      // Example http://localhost:8000/#/v2/assembly/8/campaign/56c08723-0758-4319-8dee-b752cf8004e6
      var pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      $scope.isAnonymous = false;
      $scope.userIsMember = false;
      $scope.ideasSectionExpanded = false;
      // TODO: read the following from configurations in the campaign/component
      $scope.newProposalsEnabled = true;
      $scope.newIdeasEnabled = true;

      if ($stateParams.cuuid && pattern.test($stateParams.cuuid)) {
        $scope.campaignID = $stateParams.cuuid;
        $scope.isAnonymous = true;
        $scope.fromURL = 'v2/campaign/' + $scope.campaignID;
      } else {
        $scope.assemblyID = ($stateParams.aid) ? parseInt($stateParams.aid) : 0;
        $scope.campaignID = ($stateParams.cid) ? parseInt($stateParams.cid) : 0;
        $scope.user = localStorageService.get('user');
        $scope.fromURL = 'v2/assembly/' + $scope.assemblyID + '/campaign/' + $scope.campaignID;

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
      $scope.openModal = openModal.bind($scope);
      $scope.closeModal = closeModal.bind($scope);
      loadCampaigns();

      if (!$scope.isAnonymous) {
        $scope.activeTab = "Members";
        loadAssembly();
        loadCampaignResources();
      }
      $scope.myObject = {};
      $scope.myObject.refreshMenu = function() {
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
      verifyMembership($scope.assembly);
    }

    function verifyMembership(assembly) {
      $scope.userIsMember = Memberships.rolIn('assembly', assembly.assemblyId, 'MEMBER');
    }

    function loadCampaigns() {
      var res;
      if ($scope.isAnonymous) {
        res = Campaigns.campaignByUUID($scope.campaignID).get();
      } else {
        res = Campaigns.campaign($scope.assemblyID, $scope.campaignID).get();
      }

      res.$promise.then(function(data) {
        $scope.campaign = data;
        $scope.campaign.rsID = data.resourceSpaceId; //must be always id
        $scope.campaign.rsUUID = data.resourceSpaceUUId;
        $scope.campaign.frsUUID = data.forumResourceSpaceUUId;
        $scope.campaign.forumSpaceID = data.forumResourceSpaceId;
        $scope.spaceID = $scope.isAnonymous ? data.resourceSpaceUUId : data.resourceSpaceId;

        localStorageService.set("currentCampaign",$scope.campaign);
        // We are reading the components twice,
        // - in the campaign-timeline directive
        // - here
        // TODO: find a way of reading it just once
        // (can we defer the rendering of the campaign-timeline directive until this part of the code is run)
        var res;
        if (!$scope.isAnonymous) {
          res = Campaigns.components($scope.assemblyID, $scope.campaignID, false, null, null);
        } else {
          res = Campaigns.componentsByCampaignUUID($scope.campaignID).query().$promise;

        }
        res.then(function(data) {
          var currentComponent = Campaigns.getCurrentComponent(data);
          setIdeasSectionVisibility(currentComponent);
          $scope.components = data;
        }, defaultErrorCallback);

        // get proposals
        Space.getContributions($scope.campaign, 'PROPOSAL', $scope.isAnonymous).then(function(response) {
          $scope.proposals = response.list;

          if (!$scope.proposals) {
            $scope.proposals = [];
          }

          // get ideas
          Space.getContributions($scope.campaign, 'IDEA', $scope.isAnonymous).then(function(response) {
            $scope.ideas = response.list;

            if (!$scope.ideas) {
              $scope.ideas = [];
            }
          }, defaultErrorCallback);
        });
      });
    }

    function setIdeasSectionVisibility(component) {
      console.log(component);
      var key = component.key.toUpperCase();
      // TODO PROPOSAL MAKING doesnt exist in components table anymore, change for PROPOSAL ?
      $scope.isIdeasSectionVisible = (key === 'PROPOSAL MAKING' || key === 'IDEAS');
      $scope.newProposalsEnabled = (key === 'PROPOSALS' || key === 'IDEAS');
      $scope.newIdeasEnabled = (key === 'PROPOSALS' || key === 'IDEAS');
    }

    function loadCampaignResources() {
      var rsp = Campaigns.resources($scope.assemblyID, $scope.campaignID).query();
      rsp.$promise.then(
        function(resources) {
          $scope.campaignResources = resources;
        },
        function(error) {
          Notify.show('Error loading campaign resources from server', 'error');
        }
      );
    }

    function toggleResourcesSection() {
      $scope.showResourcesSection = !$scope.showResourcesSection;
    }

    function toggleIdeasSection() {
      $scope.ideasSectionExpanded = !$scope.ideasSectionExpanded;
      $rootScope.$broadcast('eqResize', true);
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
      this.ideasSectionExpanded = filters.mode === 'idea';
      var self = this;
      var rsp = Space.doSearch(this.campaign, this.isAnonymous, filters);

      if (!rsp) {
        return;
      }
      rsp.then(function(data) {
        if (filters.mode === 'proposal') {
          self.proposals = data ? data.list : [];
        } else if (filters.mode === 'idea') {
          self.ideas = data ? data.list : [];
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

    function defaultErrorCallback(error) {
      Notify.show('Error loading data from server', 'error');
    }

    /**
     * Open a modal using vex library
     */
    function openModal(id) {
      var self = this;
      this.vexInstance = vex.open({
        className:"vex-theme-plain",
        unsafeContent: $compile(document.getElementById(id).innerHTML)(self)[0]
      });
    }

    /**
     * Closes the currently open modal.
     */
    function closeModal() {
      this.vexInstance.close();
    }
  }
}());
