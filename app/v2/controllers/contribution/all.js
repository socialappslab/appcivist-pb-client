(function() {
'use strict';

angular
  .module('appCivistApp')
  .controller('v2.ProposalsCtrl', ProposalsCtrl);


ProposalsCtrl.$inject = [
  '$scope', 'WorkingGroups', '$stateParams', 'Assemblies', 'Contributions', '$filter',
  'localStorageService', 'FlashService', '$rootScope', 'Space', '$window'
];

function ProposalsCtrl($scope, WorkingGroups, $stateParams, Assemblies, Contributions,
                          $filter, localStorageService, FlashService, $rootScope, Space, $window) {

  activate();

  function activate() {
    if ($stateParams.type == 'proposal') {
      $scope.title = 'Proposals';
    } else if ($stateParams.type == 'idea') {
      $scope.title = 'Ideas';
    } else {
      $window.location = '/';
    }
    $scope.type = $stateParams.type;
    $scope.isAnonymous = false;
    // if the param is uuid then is an anonymous user, use endpoints with uuid
    var pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (pattern.test($stateParams.sid) === true) {
      $scope.spaceID = $stateParams.sid;
      $scope.isAnonymous = true;
    } else {
      $scope.spaceID = ($stateParams.sid) ? parseInt($stateParams.sid) : 0;
      $scope.user = localStorageService.get('user');
    }
    loadContributions($scope);
    loadSpace($scope);
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
  function loadContributions(scope) {
    var rsp;
    var query = {type: scope.type.toUpperCase()};
    
    if(scope.isAnonymous) {
      rsp = Contributions.contributionInResourceSpaceByUUID(scope.spaceID).query(query);
    }else{
      rsp = Contributions.contributionInResourceSpace(scope.spaceID).query(query);
    }
    rsp.$promise.then(
      function (data) {
        var contributions = data;

        if(!contributions){
          contributions = [];
        }
        $scope.contributions = contributions;
      },
      function (error) {
        FlashService.Error('Error loading proposals from server');
      }
    );
  }

  function loadSpace(scope) {
    var rsp;
    
    if(scope.isAnonymous) {
      rsp = Space.getSpaceByUUID(scope.spaceID).get();
    }else{
      rsp = Space.getSpace($scope.spaceID).get();
    }
    rsp.$promise.then(
      function (space) {
        scope.seeAllType = space.type.replace('_', ' ');
        scope.seeAllTitle = space.name;
      },
      function (error) {
        console.log('Error when updating user feedback');
      }
    );
  }

}
}());
