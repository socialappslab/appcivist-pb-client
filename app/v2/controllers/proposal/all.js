(function() {
'use strict';

angular
  .module('appCivistApp')
  .controller('v2.ProposalsCtrl', ProposalsCtrl);


ProposalsCtrl.$inject = [
  '$scope', 'WorkingGroups', '$stateParams', 'Assemblies', 'Contributions', '$filter',
  'localStorageService', 'FlashService'
];

function ProposalsCtrl($scope, WorkingGroups, $stateParams, Assemblies, Contributions,
                          $filter, localStorageService, FlashService) {

  activate();

  function activate() {

    // if the param is uuid then is an anonymous user, use endpoints with uuid
    // Example http://localhost:8000/#/v2/assembly/7/group/5/proposal/56c08723-0758-4319-8dee-b752cf8004e6
    var pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    // TODO make endpoints for assembly by UUID and wGroup by UUID
    //if (pattern.test($stateParams.aid) === true && pattern.test($stateParams.gid) === true && pattern.test($stateParams.pid) === true) {
    if (pattern.test($stateParams.pid) === true) {
      console.log('Valid UUIDs');
      // TODO:
    } else {
      console.log('Not valid UUIDs');
      $scope.spaceID = ($stateParams.sid) ? parseInt($stateParams.sid) : 0;
      $scope.user = localStorageService.get('user');
      loadProposals($scope.spaceID);
    }
    $scope.paginationTop = {};
    $scope.paginationBottom = {};
    
    $scope.paginationVisible =  function(pag, visible) {
      if($scope.paginationTop.visible) {
        $scope.paginationBottom.style = {display: 'none'};
        return;
      }
      pag.visible = visible;
      pag.style = visible ? {} : {display: 'none'};
    };
  }


  /**
   * Get contributions from server.
   *
   * @param campaign {sid} the resource space id.
   **/
  function loadProposals(sid) {
    // TODO: pass type argument when issue is solved
    var rsp = Contributions.contributionInResourceSpace(sid).query();
    rsp.$promise.then(
      function (data) {
        var proposals = $filter('filter')(data, {type: 'PROPOSAL'});

        if(!$scope.proposals){
          $scope.proposals = [];
        }
        $scope.proposals = proposals;
      },
      function (error) {
        FlashService.Error('Error loading proposals from server');
      }
    );
  }
}
}());
