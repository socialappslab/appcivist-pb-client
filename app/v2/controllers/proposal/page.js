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
    $scope.assemblyID = ($stateParams.aid) ? parseInt($stateParams.aid) : 0;
    $scope.groupID = ($stateParams.gid) ? parseInt($stateParams.gid) : 0;
    $scope.proposalID = ($stateParams.pid) ? parseInt($stateParams.pid) : 0;
    $scope.user = localStorageService.get('user');
    loadProposal($scope.assemblyID, $scope.proposalID);
  }

  function loadProposal(aid, pid) {
    var rsp = Contributions.contribution(aid, pid).get();
    rsp.$promise.then(
      function (data) {
        $scope.proposal = data;
        $scope.group = data.workingGroupAuthors[0];
        $scope.campaignID = data.campaignIds[0];
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
