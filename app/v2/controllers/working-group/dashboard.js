(function() {
'use strict';

angular
  .module('appCivistApp')
  .controller('v2.WorkingGroupDashboardCtrl', WorkingGroupDashboardCtrl);


WorkingGroupDashboardCtrl.$inject = [
  '$scope', 'WorkingGroups', '$stateParams', 'Assemblies', 'Contributions', '$filter',
  'localStorageService', 'FlashService', 'Memberships'
];

function WorkingGroupDashboardCtrl($scope, WorkingGroups, $stateParams, Assemblies, Contributions,
                               $filter, localStorageService, FlashService, Memberships) {

  activate();

  function activate() {

    // if the param is uuid then it is an anonymous user
    // Example http://localhost:8000/#/v2/assembly/7/group/56c08723-0758-4319-8dee-b752cf8004e6
    var pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    // TODO make endpoint for assembly by UUID
    //if (pattern.test($stateParams.aid) === true && pattern.test($stateParams.gid) === true) {
    if (pattern.test($stateParams.gid) === true) {
      console.log('Valid UUIDs');
      $scope.groupID = $stateParams.gid;
    } else {
      console.log('Not valid UUIDs');
      $scope.assemblyID = ($stateParams.aid) ? parseInt($stateParams.aid) : 0;
      $scope.groupID = ($stateParams.gid) ? parseInt($stateParams.gid) : 0;
      $scope.user = localStorageService.get('user');
      loadAssembly();
      verifyMembership();
    }
  }

  function loadAssembly() {
    var rsp = Assemblies.assembly($scope.assemblyID).get();
    rsp.$promise.then(function(data) {
      $scope.assembly = data;
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
        (error.data.responseStatus === "NODATA" || error.data.responseStatus === "UNAUTHORIZED")){
      // TODO: show anonymous working group page
    } else {
      $scope.stopSpinner();
      FlashService.Error("An error occured while verifying your membership to the assembly: "+JSON.stringify(error))
    }
  }

  function loadWorkingGroup() {
    var res = WorkingGroups.workingGroup($scope.assemblyID, $scope.groupID).get();
    res.$promise.then(
      function (data) {
        $scope.wg = data;
        loadMembers($scope.assemblyID, $scope.groupID);
        loadProposals($scope.assemblyID, $scope.groupID);
        loadIdeas($scope.assemblyID, $scope.groupID);
        $scope.spaceID = data.forumResourceSpaceId;
        loadLatestActivities(data.resourcesResourceSpaceId);
      },
      function (error) {
        FlashService.Error('Error occured trying to initialize the working group: ' + JSON.stringify(error));
      }
    );
  }

  function loadMembers(aid, gid) {
    var res = WorkingGroups.workingGroupMembers(aid, gid, 'ALL').query();
    res.$promise.then(
      function (data) {
        $scope.members = data;
      },
      function (error) {
        FlashService.Error('Error occured while trying to load working group members');
      }
    );
  }

  function loadProposals(aid, gid) {
    var res = WorkingGroups.workingGroupProposals(aid, gid).query();
    res.$promise.then(
      function (data) {
        $scope.proposals = data;
      },
      function (error) {
        FlashService.Error('Error occured while trying to load working group proposals');
      }
    );
  }

  function loadIdeas(aid, gid) {
    var res = WorkingGroups.workingGroupContributions(aid, gid).query();
    res.$promise.then(
      function (data) {
        $scope.ideas = $filter('filter')(data, {type: 'IDEA'});
      },
      function (error) {
        FlashService.Error('Error occured while trying to load working group ideals');
      }
    );
  }

  // TODO: just show the latest contributions until notifications API is ready
  function loadLatestActivities(resourceSpaceId) {
    var rsp = Contributions.contributionInResourceSpace(resourceSpaceId).query();
    rsp.$promise.then(
      function (data) {
        $scope.activities = data;
      },
      function (error) {
        FlashService.Error('Error loading working group activities from server');
      }
    );
  }
}
}());
