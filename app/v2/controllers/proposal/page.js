(function() {
'use strict';

angular
  .module('appCivistApp')
  .controller('v2.ProposalPageCtrl', ProposalPageCtrl);


ProposalPageCtrl.$inject = [
  '$scope', 'WorkingGroups', '$stateParams', 'Assemblies', 'Contributions', '$filter',
  'localStorageService', 'FlashService', 'Memberships', 'Etherpad'
];

function ProposalPageCtrl($scope, WorkingGroups, $stateParams, Assemblies, Contributions,
                          $filter, localStorageService, FlashService, Memberships,
                          Etherpad) {

  activate();

  function activate() {

    // if the param is uuid then is an anonymous user, use endpoints with uuid
    // Example http://localhost:8000/#/v2/assembly/7/group/5/proposal/56c08723-0758-4319-8dee-b752cf8004e6
    var pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    // TODO make endpoints for assembly by UUID and wGroup by UUID
    //if (pattern.test($stateParams.aid) === true && pattern.test($stateParams.gid) === true && pattern.test($stateParams.pid) === true) {
    if (pattern.test($stateParams.pid) === true) {
      console.log('Valid UUIDs');
      $scope.proposalID = $stateParams.pid;
    } else {
      console.log('Not valid UUIDs');
      $scope.assemblyID = ($stateParams.aid) ? parseInt($stateParams.aid) : 0;
      $scope.groupID = ($stateParams.gid) ? parseInt($stateParams.gid) : 0;
      $scope.proposalID = ($stateParams.pid) ? parseInt($stateParams.pid) : 0;
      $scope.user = localStorageService.get('user');
      loadProposal($scope.assemblyID, $scope.proposalID);
    }

    $scope.showActionMenu = true;
    $scope.myObject = {};
    $scope.myObject.refreshMenu = function() {
        if ($scope.showActionMenu == false)
          $scope.showActionMenu = true;
        else
          $scope.showActionMenu = false;
    }
    // Read user contribution feedback
    $scope.userFeedback = $scope.userFeedback != null ?
        $scope.userFeedback : {"up":false, "down":false, "fav": false, "flag": false};
  }

  // Feedback update
  $scope.updateFeedback = function (value) {
      //console.log(value);
      if (value === "up") {
          $scope.userFeedback.up = true;
          $scope.userFeedback.down = false;
      } else if (value === "down") {
          $scope.userFeedback.up = false;
          $scope.userFeedback.down = true;
      } else if (value === "fav") {
          $scope.userFeedback.fav = true;
      } else if (value === "flag") {
          $scope.userFeedback.flag = true;
      }

      //var stats = $scope.contribution.stats;
      var feedback = Contributions.userFeedback($scope.assemblyID, $scope.proposalID).update($scope.userFeedback);
      feedback.$promise.then(
          function (newStats) {
              $scope.proposal.stats = newStats;
          },
          function (error) {
              console.log("Error when updating user feedback");
          }
      );
  };

  function loadProposal(aid, pid) {
    var rsp = Contributions.contribution(aid, pid).get();
    rsp.$promise.then(
      function (data) {
        $scope.proposal = data;

        var workingGroupAuthors = data.workingGroupAuthors;
        var workingGroupAuthorsLength = workingGroupAuthors ? workingGroupAuthors.length : 0;
        $scope.group = workingGroupAuthorsLength ? data.workingGroupAuthors[0] : null;

        var campaignIds = data.campaignIds;
        var campaignIdsLength = campaignIds ? campaignIds.length : 0;
        $scope.campaignID = campaignIdsLength ? data.campaignIds[0] : 0;
        $scope.etherpadReadOnlyUrl = Etherpad.embedUrl(data.extendedTextPad.readOnlyPadId);
        verifyAuthorship($scope.proposal);
        loadRelatedContributions($scope.group.resourcesResourceSpaceId);
      },
      function (error) {
        FlashService.Error('Error occured when trying to load proposal: ' + JSON.stringify(error));
      }
    );
  }

  function verifyAuthorship (proposal) {
    // Check Authorship
    // 1. Check if user is in the list of authors
    $scope.userIsAuthor = Contributions.verifyAuthorship($scope.user, proposal);

    // 2. If is not in the list of authorships, check if the user is member of one of the responsible groups
    if(!$scope.userIsAuthor && $scope.group && $scope.group.groupId) {
      var authorship = Contributions.verifyGroupAuthorship($scope.user, proposal, $scope.group).get();
      authorship.$promise.then(function(response){
        $scope.userIsAuthor = response.responseStatus === 'OK';

        if($scope.userIsAuthor) {
          loadEtherpadWriteUrl(proposal);
        }
      });
    }
  }

  function loadEtherpadWriteUrl(proposal) {
    if(proposal.extendedTextPad) {
      var etherpadRes = Etherpad.getReadWriteUrl($scope.assemblyID, proposal.contributionId).get();
      etherpadRes.$promise.then(function(pad){
        $scope.etherpadReadWriteUrl = Etherpad.embedUrl(pad.padId);
      });
    }
  }

  function loadRelatedContributions(resourceSpaceId) {
    var rsp = Contributions.contributionInResourceSpace(resourceSpaceId).query();
    rsp.$promise.then(
      function (data) {
        var related = [];
        angular.forEach(data, function(r) {
          if(r.contributionId === $scope.proposalID){
            return;
          }

          if(r.type === 'PROPOSAL' || r.type === 'IDEA'){
            r.assemblyId = r.workingGroupAuthors[0].assemblies[0];
            r.groupId = r.workingGroupAuthors[0].groupId;
            related.push(r);
          }
          $scope.relatedContributions = related;
        });
      },
      function (error) {
        FlashService.Error('Error loading contributions from server');
      }
    );
  }
}
}());
