'use strict';

(function() {
  'use strict';

  angular.module('appCivistApp').controller('v2.CampaignDashboardCtrl', CampaignDashboardCtrl);

  CampaignDashboardCtrl.$inject = [
    '$scope', 'Campaigns', '$stateParams', 'Assemblies', 'Contributions', '$filter', 'localStorageService',
    'Notify', 'Memberships', 'Space', '$translate', '$rootScope', 'WorkingGroups', '$compile'
  ];

  function CampaignDashboardCtrl($scope, Campaigns, $stateParams, Assemblies, Contributions, $filter,
    localStorageService, Notify, Memberships, Space, $translate, $rootScope, WorkingGroups, $compile) {

    $scope.activeTab = "Public";
    $scope.changeActiveTab = function(tab) {
      if (tab == 1) $scope.activeTab = "Members";
      else $scope.activeTab = "Public";
    };

    activate();

    function activate() {
      // Example http://localhost:8000/#/v2/assembly/8/campaign/56c08723-0758-4319-8dee-b752cf8004e6
      var pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      $scope.isAnonymous = false;
      $scope.isCoordinator = false;
      $scope.userIsMember = false;
      $scope.ideasSectionExpanded = false;
      // TODO: read the following from configurations in the campaign/component
      $scope.newProposalsEnabled = true;
      $scope.newIdeasEnabled = true;

      $scope.pageSize = 16;
      $scope.type = 'proposal';
      $scope.showPagination = false;
      $scope.sorting = "date_desc";

      $scope.membersCommentCounter = { value: 0 };
      $scope.publicCommentCounter = { value: 0 };

      // TODO: add pagination to Ideas
      //$scope.pageSizeIdea = 16;
      //$scope.typeIdea ='idea';
      //$scope.showPaginationIdea = false;
      //$scope.sortingIdea = "date_desc";

      if ($stateParams.cuuid && pattern.test($stateParams.cuuid)) {
        $scope.campaignID = $stateParams.cuuid;
        $scope.isAnonymous = true;
        $scope.fromURL = 'v2/campaign/' + $scope.campaignID;
      } else {
        $scope.assemblyID = $stateParams.aid ? parseInt($stateParams.aid) : 0;
        $scope.campaignID = $stateParams.cid ? parseInt($stateParams.cid) : 0;
        $scope.isCoordinator = Memberships.isAssemblyCoordinator($scope.assemblyID);
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
      $scope.showAssemblyLogo = showAssemblyLogo.bind($scope);

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
      $scope.contributionTypeIsSupported = function(type) {
        return Campaigns.isContributionTypeSupported(type, $scope);
      };
    }

    function loadAssembly() {
      $scope.assembly = localStorageService.get('currentAssembly');
      verifyMembership($scope.assembly);
    }

    function loadAssemblyPublicProfile() {
      var assemblyShortname = $stateParams.shortname; // for the future move of paths in which everything will be preceded by the assembly shortname
      if (assemblyShortname) {
        var rsp = Assemblies.assemblyByShortName(assemblyShortname).get();
        rsp.$promise.then(function(assembly) {
          $scopoe.assembly = assembly;
        }, function(error) {
          Notify.show('Error while loading public profile of assembly with shortname', 'error');
        });
      } else {
        var assemblyUUID = $scope.campaign ? $scope.campaign.assemblies ? $scope.campaign.assemblies[0] : null : null;
        if (assemblyUUID) {
          var rsp = Assemblies.assemblyByUUID(assemblyUUID).get();
          rsp.$promise.then(function(assembly) {
            $scope.assembly = assembly;
          }, function(error) {
            Notify.show('Error while loading public profile of assembly by its Universal ID', 'error');
          });
        }
      }
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
        $scope.forumSpaceID = $scope.campaign.forumSpaceID ? $scope.campaign.forumSpaceID : $scope.campaign.frsUUID;
        $scope.showPagination = true;
        localStorageService.set("currentCampaign", $scope.campaign);
        loadPublicCommentCount($scope.forumSpaceID);
        // We are reading the components twice,
        // - in the campaign-timeline directive
        // - here
        // TODO: find a way of reading it just once
        // (can we defer the rendering of the campaign-timeline directive until this part of the code is run)
        var res;
        if (!$scope.isAnonymous) {
          res = Campaigns.components($scope.assemblyID, $scope.campaignID, false, null, null);
          loadMembersCommentCount($scope.spaceID);
        } else {
          res = Campaigns.componentsByCampaignUUID($scope.campaignID).query().$promise;
        }
        res.then(function(data) {
          if ($scope.isAnonymous) {
            loadAssemblyPublicProfile();
          }
          var currentComponent = Campaigns.getCurrentComponent(data);
          setIdeasSectionVisibility(currentComponent);
          $scope.components = data;
          localStorageService.set('currentCampaign.components', data);
          localStorageService.set('currentCampaign.currentComponent', currentComponent);
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

        if ($scope.campaign) {
          var rsp = $scope.isAnonymous ? Campaigns.getConfigurationPublic($scope.campaign.rsUUID).get() : Campaigns.getConfiguration($scope.campaign.rsID).get();
          rsp.$promise.then(function(data) {
            $scope.campaignConfigs = data;
          }, function(error) {
            Notify.show('Error while trying to fetch campaign config', 'error');
          });
        }
      });
    }

    function loadPublicCommentCount(sid) {
      var res;

      if ($scope.isAnonymous) {
        res = Space.getCommentCountPublic(sid).get();
      } else {
        res = Space.getCommentCount(sid).get();
      }

      res.$promise.then(
        function(data) {
          $scope.publicCommentCounter.value = data.counter;
        },
        function(error) {
          Notify.show('Error occurred while trying to load working group proposals', 'error');
        }
      );
    }

    function loadMembersCommentCount(sid) {
      var res;
      res = Space.getCommentCount(sid).get();
      res.$promise.then(
        function(data) {
          $scope.membersCommentCounter.value = data.counter;
        },
        function(error) {
          Notify.show('Error occurred while trying to load working group proposals', 'error');
        }
      );
    }

    function setIdeasSectionVisibility(component) {
      var key = component ? component.type ? component.type.toUpperCase() : "" : ""; // In old implementation, it was key, changed to type
      // TODO PROPOSAL MAKING doesnt exist in components table anymore, change for PROPOSAL ?
      $scope.isIdeasSectionVisible = key === 'PROPOSAL MAKING' || key === 'IDEAS';
      $scope.newProposalsEnabled = key === 'PROPOSALS' || key === 'IDEAS';
      $scope.newIdeasEnabled = key === 'PROPOSALS' || key === 'IDEAS';
      $scope.currentComponent = component.type.toUpperCase();
    }

    function loadCampaignResources() {
      var rsp = Campaigns.resources($scope.assemblyID, $scope.campaignID).query();
      rsp.$promise.then(function(resources) {
        $scope.campaignResources = resources;
      }, function(error) {
        Notify.show('Error loading campaign resources from server', 'error');
      });
    }

    function showAssemblyLogo() {
      var show = Campaigns.showAssemblyLogo($scope);
      return show;
    }

    function toggleResourcesSection() {
      $scope.showResourcesSection = !$scope.showResourcesSection;
    }

    function toggleIdeasSection() {
      $scope.ideasSectionExpanded = !$scope.ideasSectionExpanded;
      // TODO: add pagination to ideas $scope.showPaginationIdea = !$scope.showPaginationIdea;
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
      this.currentFilters = filters;
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
        className: "vex-theme-plain",
        unsafeContent: $compile(document.getElementById(id).innerHTML)(self)[0]
      });
    }

    /**
     * Closes the currently open modal.
     */
    function closeModal() {
      this.$broadcast('pagination:reloadCurrentPage');
      this.vexInstance.close();
    }
  }
})();