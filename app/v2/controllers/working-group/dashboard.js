(function () {
  'use strict';

  angular
    .module('appCivistApp')
    .controller('v2.WorkingGroupDashboardCtrl', WorkingGroupDashboardCtrl);


  WorkingGroupDashboardCtrl.$inject = [
    '$scope', 'WorkingGroups', '$stateParams', 'Assemblies', 'Contributions', '$filter',
    'localStorageService', 'FlashService', 'Memberships', 'Space', '$translate'
  ];

  function WorkingGroupDashboardCtrl($scope, WorkingGroups, $stateParams, Assemblies, Contributions,
    $filter, localStorageService, FlashService, Memberships, Space, $translate) {

    activate();

    function activate() {
      // if the param is uuid then it is an anonymous user
      $scope.isAnonymous = false;
      // TODO: read the following from configurations in the campaign/component
      $scope.newProposalsEnabled = false;
      $scope.newIdeasEnabled = false;
      var pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (pattern.test($stateParams.gid)) {
        $scope.groupID = $stateParams.gid;
        $scope.isAnonymous = true;
        loadWorkingGroup();
      } else {
        $scope.assemblyID = ($stateParams.aid) ? parseInt($stateParams.aid) : 0;
        $scope.groupID = ($stateParams.gid) ? parseInt($stateParams.gid) : 0;
        $scope.user = localStorageService.get('user');
        if ($scope.user && $scope.user.language)
          $translate.use($scope.user.language);
        loadAssembly();
      }
      $scope.activitiesLimit = 4;
      $scope.membersLimit = 5;
      $scope.ideasSectionExpanded = false;
      $scope.toggleIdeasSection = toggleIdeasSection.bind($scope);
      $scope.doSearch = doSearch.bind($scope);
      $scope.loadThemes = loadThemes.bind($scope);
      $scope.toggleAllMembers = toggleAllMembers.bind($scope);
    }

    function loadAssembly() {
      var rsp = Assemblies.assembly($scope.assemblyID).get();
      rsp.$promise.then(function (data) {
        $scope.assembly = data;
        verifyMembership();
      });
    }

    function verifyMembership() {

      if ($scope.assemblyID >= 0 && $scope.groupID >= 0) {
        var rsp = Memberships.membershipInGroup($scope.groupID, $scope.user.userId).get();
        rsp.$promise.then(userIsMemberSuccess, userIsMemberError);
      }
    }

    function userIsMemberSuccess(data) {
      $scope.membership = data;
      $scope.userIsMember = $scope.membership.status === "ACCEPTED";

      if ($scope.userIsMember) {
        loadWorkingGroup();
      } else {
        $scope.userIsMember = false;
        // TODO: anonymous working group page
      }
    }

    function userIsMemberError(error) {
      $scope.userIsMember = false;
      if (error.data && error.data.responseStatus &&
        (error.data.responseStatus === "NODATA" || error.data.responseStatus === "UNAUTHORIZED")) {
        // TODO: show anonymous working group page
      } else {
        $scope.stopSpinner();
        FlashService.Error("An error occured while verifying your membership to the assembly: " + JSON.stringify(error))
      }
    }

    function loadWorkingGroup() {
      var res;

      if ($scope.isAnonymous) {
        res = WorkingGroups.workingGroupByUUID($scope.groupID).get();
      } else {
        res = WorkingGroups.workingGroup($scope.assemblyID, $scope.groupID).get();
      }
      res.$promise.then(
        function (data) {
          $scope.wg = data;
          $scope.wg.rsID = data.resourcesResourceSpaceId;
          $scope.wg.rsUUID = data.resourceSpaceUUId;
          loadMembers(data);
          loadProposals(data);
          loadIdeas(data);

          if ($scope.isAnonymous) {
            // TODO
          } else {
            $scope.spaceID = data.forumResourceSpaceId;
          }
          loadLatestActivities(data);
        },
        function (error) {
          FlashService.Error('Error occured trying to initialize the working group: ' + JSON.stringify(error));
        }
      );
    }

    function loadMembers(group) {
      var aid = group.assemblyId;
      var gid = group.groupId;
      var res;

      if ($scope.isAnonymous) {
        // TODO
        res = WorkingGroups.workingGroupMembers(aid, gid, 'ALL').query();
      } else {
        res = WorkingGroups.workingGroupMembers($scope.assemblyID, gid, 'ALL').query();
      }

      res.$promise.then(
        function (data) {
          $scope.members = data;
        },
        function (error) {
          FlashService.Error('Error occured while trying to load working group members');
        }
      );
    }

    function loadProposals(group) {
      Space.getContributions(group, 'PROPOSAL', $scope.isAnonymous).then(
        function (data) {
          $scope.proposals = data;
        },
        function (error) {
          FlashService.Error('Error occurred while trying to load working group proposals');
        }
      );
    }

    function loadIdeas(group) {
      Space.getContributions(group, 'IDEA', $scope.isAnonymous).then(
        function (data) {
          $scope.ideas = data;
        },
        function (error) {
          FlashService.Error('Error occured while trying to load working group ideas');
        }
      );
    }

    // TODO: just show the latest contributions until notifications API is ready
    function loadLatestActivities(group) {
      var rsp = Space.getContributions(group, 'PROPOSAL', $scope.isAnonymous);
      rsp.then(
        function (data) {
          $scope.activities = data;
        },
        function (error) {
          FlashService.Error('Error loading working group activities from server');
        }
      );
    }

    function toggleIdeasSection() {
      $scope.ideasSectionExpanded = !$scope.ideasSectionExpanded;
    }

    function toggleAllMembers() {
      if ($scope.membersLimit <= 5) {
        $scope.membersLimit = $scope.members ? $scope.members.length : 10;  // TODO: instead of 10, use lenght of member list
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
      rsp.then(function (data) {
        if (filters.mode === 'proposal') {
          self.proposals = data;
        } else if (filters.mode === 'idea') {
          self.ideas = data;
        }
      });
    }

    function loadThemes(query) {
      if (!this.wg) {
        return;
      }
      return this.wg.themes;
    }

    function prependPinnedContributions (data) {
      if (data && data.length>0) {
        for (var i = 0; i<data.length; i++) {
          $scope.proposals.unshift(data[i]);
        }
      }
    }

    function nonPinnedContributions (error) {
      console.log("No pinned contributions");
    }
  }
} ());
