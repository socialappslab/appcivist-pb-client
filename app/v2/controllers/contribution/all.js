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
      $scope.title = 'Proposals'
    } else if ($stateParams.type == 'idea') {
      $scope.title = 'Ideas'
    } else {
      $window.location = "/";
    }
    $scope.type = $stateParams.type;
    // if the param is uuid then is an anonymous user, use endpoints with uuid
    var pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    // TODO make endpoints for assembly by UUID and wGroup by UUID
    if (pattern.test($stateParams.pid) === true) {
      console.log('Valid UUIDs');
      // TODO
    } else {
      console.log('Not valid UUIDs');
      $scope.spaceID = ($stateParams.sid) ? parseInt($stateParams.sid) : 0;
      $scope.user = localStorageService.get('user');
      loadContributions($scope.spaceID);

      Space.getSpace($scope.spaceID).get().$promise.then(
          function (space) {
              $scope.seeAllType = space.type.replace('_', ' ');
              $scope.seeAllTitle = space.name;
          },
          function (error) {
              console.log("Error when updating user feedback");
          }
      );
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
  function loadContributions(sid) {
    // TODO: pass type argument when issue is solved
    var rsp = Contributions.contributionInResourceSpace(sid).query();
    rsp.$promise.then(
      function (data) {
        var contributions = $filter('filter')(data, {type: $scope.type.toUpperCase()});

        if(!$scope.contributions){
          $scope.contributions = [];
        }
        $scope.contributions = contributions;
      },
      function (error) {
        FlashService.Error('Error loading proposals from server');
      }
    );
  }

}
}());
