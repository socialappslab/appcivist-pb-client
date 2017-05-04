(function() {
  'use strict';

  angular
    .module('appCivistApp')
    .controller('v2.WorkingGroupDashboardCtrl', WorkingGroupDashboardCtrl);


  WorkingGroupDashboardCtrl.$inject = [
    '$scope', 'Campaigns', 'WorkingGroups', '$stateParams', 'Assemblies', 'Contributions', '$filter',
    'localStorageService', 'Notify', 'Memberships', 'Space', '$translate', '$rootScope'
  ];

  function WorkingGroupDashboardCtrl($scope, Campaigns, WorkingGroups, $stateParams, Assemblies, Contributions,
    $filter, localStorageService, Notify, Memberships, Space, $translate, $rootScope) {
    $scope.activeTab = "Public";
    $scope.changeActiveTab = function(tab) {
      if (tab == 1) {
        $scope.activeTab = "Members";
      } else {
        $scope.activeTab = "Public";
      }
    }

    activate();

    function activate() {
      console.log("workingGroupDashboard");
      ModalMixin.init($scope);
      $scope.membersCommentCounter = { value: 0 };
      $scope.publicCommentCounter = { value: 0 };
      $scope.pageSize = 16;
      $scope.type = 'proposal';
      $scope.showPagination = false;
      $scope.isTopicGroup = false;
      $scope.sorting = 'date_desc';
      // if the param is uuid then it is an anonymous user
      $scope.isAnonymous = false;
      $scope.isCoordinator = false;
      // TODO: read the following from configurations in the campaign/component
      $scope.newProposalsEnabled = true;
      $scope.newIdeasEnabled = false;
      var pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (pattern.test($stateParams.gid)) {
        $scope.groupID = $stateParams.gid;
        $scope.isAnonymous = true;
        $scope.fromURL = 'v2/group/' + $scope.groupID;
        $scope.isCoordinator = Memberships.isWorkingGroupCoordinator($scope.groupID);
        loadWorkingGroup();
      } else {
        $scope.assemblyID = ($stateParams.aid) ? parseInt($stateParams.aid) : 0;
        $scope.groupID = ($stateParams.gid) ? parseInt($stateParams.gid) : 0;
        $scope.user = localStorageService.get('user');
        $scope.fromURL = 'v2/assembly/' + $scope.assemblyID + '/group/' + $scope.groupID;
        $scope.isCoordinator = Memberships.isAssemblyCoordinator($scope.assemblyID);
        loadAssembly();

        loadCampaign();
      }

      if (!$scope.isAnonymous) {
        $scope.activeTab = "Members";
      }
      $scope.activitiesLimit = 4;
      $scope.membersLimit = 5;
      $scope.ideasSectionExpanded = false;
      $scope.toggleIdeasSection = toggleIdeasSection.bind($scope);
      $scope.doSearch = doSearch.bind($scope);
      $scope.loadThemes = loadThemes.bind($scope);
      $scope.toggleAllMembers = toggleAllMembers.bind($scope);
      $scope.closeAndReload = closeAndReload.bind($scope);



      $scope.contributionTypeIsSupported = function(type) {
        return Campaigns.isContributionTypeSupported(type, $scope);
      }
    }

    function loadAssembly() {
      var rsp = Assemblies.assembly($scope.assemblyID).get();
      rsp.$promise.then(function(data) {
        $scope.assembly = data;
        verifyMembership();
      });
    }

    function verifyMembership() {
      $scope.userIsMember = Memberships.isMember('group', $scope.groupID);
      loadWorkingGroup();
    }

    function loadWorkingGroup() {
      var res;

      if ($scope.isAnonymous) {
        res = WorkingGroups.workingGroupByUUID($scope.groupID).get();
      } else {
        res = WorkingGroups.workingGroup($scope.assemblyID, $scope.groupID).get();
      }
      res.$promise.then(
        function(data) {
          $scope.wg = data;
          $scope.wg.rsID = data.resourcesResourceSpaceId;
          $scope.wg.rsUUID = data.resourcesResourceSpaceUUId;
          $scope.wg.frsUUID = data.forumResourceSpaceUUId;
          $scope.isTopicGroup = data.isTopic;

          if ($scope.isTopicGroup) {
            // if group is topic, then is OPEN to every assembly member.
            $scope.userIsMember = true;
          }
          loadMembers(data);
          loadProposals(data);
          loadIdeas(data);

          if ($scope.isAnonymous) {
            $scope.spaceID = data.resourcesResourceSpaceUUId;
          } else {
            $scope.forumSpaceID = data.forumResourceSpaceId;
            $scope.spaceID = data.resourcesResourceSpaceId;
            loadPublicCommentCount($scope.forumSpaceID);
            loadMembersCommentCount($scope.spaceID);
          }

          $scope.showPagination = true;
          loadLatestActivities(data);
        },
        function(error) {
          Notify.show('Error occured trying to initialize the working group: ' + JSON.stringify(error), 'error');
        }
      );
    }

    function loadMembers(group) {
      var aid = group.assemblyId;
      var gid = group.groupId;
      var res;

      if ($scope.isAnonymous) {
        $scope.members = group.members
          .filter(function(m) {
            return m.status === 'ACCEPTED';
          });
      } else {
        res = WorkingGroups.workingGroupMembers($scope.assemblyID, gid, 'ALL').query();
        res.$promise.then(
          function(data) {
            $scope.members = data;
          },
          function(error) {
            Notify.show('Error occured while trying to load working group members', 'error');
          }
        );
      }
    }

    function loadProposals(group) {
      Space.getContributions(group, 'PROPOSAL', $scope.isAnonymous).then(
        function(data) {
          $scope.proposals = data.list;
        },
        function(error) {
          Notify.show('Error occurred while trying to load working group proposals', 'error');
        }
      );
    }

    function loadIdeas(group) {
      Space.getContributions(group, 'IDEA', $scope.isAnonymous).then(
        function(data) {
          $scope.ideas = data.list;
        },
        function(error) {
          Notify.show('Error occured while trying to load working group ideas', 'error');
        }
      );
    }

    function loadPublicCommentCount(sid) {
      var res;
      res = Space.getCommentCount(sid).get();
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

    // TODO: just show the latest contributions until notifications API is ready
    function loadLatestActivities(group) {
      var rsp = Space.getContributions(group, 'PROPOSAL', $scope.isAnonymous);
      rsp.then(
        function(data) {
          $scope.activities = data.list;
        },
        function(error) {
          Notify.show('Error loading working group activities from server', 'error');
        }
      );
    }

    function toggleIdeasSection() {
      $scope.ideasSectionExpanded = !$scope.ideasSectionExpanded;
      $rootScope.$broadcast('eqResize', true);
    }

    function toggleAllMembers() {
      if ($scope.membersLimit <= 5) {
        $scope.membersLimit = $scope.members ? $scope.members.length : 10; // TODO: instead of 10, use lenght of member list
      } else {
        $scope.membersLimit = 5;
      }
    }

    /**
     * Space.doSearch wrapper.
     * @param {object} filters
     */
    function doSearch(filters) {
      this.ideasSectionExpanded = filters.mode === 'idea';
      var self = this;
      var rsp = Space.doSearch(this.wg, this.isAnonymous, filters);

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

    function loadThemes(query) {
      if (!this.wg) {
        return;
      }
      return this.wg.themes;
    }

    function prependPinnedContributions(data) {
      if (data && data.length > 0) {
        for (var i = 0; i < data.length; i++) {
          $scope.proposals.unshift(data[i]);
        }
      }
    }

    function nonPinnedContributions(error) {
      console.log("No pinned contributions");
    }

    function loadCampaign() {
      $scope.campaign = localStorageService.get("currentCampaign");
      $scope.campaignID = $scope.campaign.campaignId;
      $scope.campaign.rsID = $scope.campaign.resourceSpaceId;

      if ($scope.campaign && $scope.campaign.rsID) {
        var rsp = Campaigns.getConfiguration($scope.campaign.rsID).get();
        rsp.$promise.then(function(data) {
          $scope.campaignConfigs = data;
        }, function(error) {
          Notify.show('Error while trying to fetch campaign config', 'error');
        });
      }
    }

    function closeAndReload() {
      this.$broadcast('pagination:reloadCurrentPage');
      this.closeModal('proposalFormModal');
    }
  }
}());