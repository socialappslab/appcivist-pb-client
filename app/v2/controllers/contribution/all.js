(function () {
  'use strict';

  angular
    .module('appCivistApp')
    .controller('v2.ProposalsCtrl', ProposalsCtrl);


  ProposalsCtrl.$inject = [
    '$scope', 'WorkingGroups', '$stateParams', 'Assemblies', 'Contributions',
    'localStorageService', 'Space', '$window', 'Notify', '$translate', '$location',
    'Campaigns'
  ];

  function ProposalsCtrl($scope, WorkingGroups, $stateParams, Assemblies, Contributions,
    localStorageService, Space, $window, Notify, $translate, $location, Campaigns) {

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
      $scope.fromURL = $stateParams.from;
      $scope.Notify = Notify;
      $scope.showErrorAndRedirect = showErrorAndRedirect.bind($scope);
      $scope.validateFromURL = validateFromURL.bind($scope);
      // if the param is uuid then is an anonymous user, use endpoints with uuid
      var pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (pattern.test($stateParams.sid) === true) {
        $scope.spaceID = $stateParams.sid;
        $scope.isAnonymous = true;
      } else {
        $scope.spaceID = ($stateParams.sid) ? parseInt($stateParams.sid) : 0;
        $scope.user = localStorageService.get('user');
        $scope.validateFromURL($scope.fromURL, $scope.spaceID);

        if ($scope.user && $scope.user.language) {
          $translate.use($scope.user.language);
        }
      }
      //loadContributions($scope);
      loadSpace($scope);
      /*$scope.paginationTop = {};
      $scope.paginationBottom = {};

      $scope.paginationVisible = function (pag, visible) {
        if ($scope.paginationTop.visible) {
          $scope.paginationBottom.style = { display: 'none' };
          return;
        }
        pag.visible = visible;
        pag.style = visible ? {} : { display: 'none' };
      };*/
    }


    function loadSpace(scope) {
      var rsp;

      if (scope.isAnonymous) {
        rsp = Space.getSpaceByUUID(scope.spaceID).get();
      } else {
        rsp = Space.getSpace($scope.spaceID).get();
      }
      rsp.$promise.then(
        function (space) {
          scope.seeAllType = space.type.replace('_', ' ');
          scope.seeAllTitle = space.name;
        },
        function (error) {
          Notify.show('Error when updating user feedback', 'error');
        }
      );
    }


    /**
     * Validates that fromURL is correct.
     *
     * @param {string} url - The URL to validate.
     * @param {number} sid - Space ID.
     *  Posible options: v2/assembly/:aid/group/:gid or v2/assembly/:aid/campaign/:cid
     */
    function validateFromURL(url, sid) {
      var parts = url.split('/');
      var self = this;

      if (parts.length !== 5) {
        $location.path('/');
        return;
      }
      var refID = parseInt(parts[4]);
      var ref = parts[3];
      var assembly = localStorageService.get('currentAssembly');
      var rsp;

      if (ref === 'campaign') {
        rsp = Campaigns.campaign(assembly.assemblyId, refID).get().$promise;
        rsp.then(
          function (campaign) {

            if (campaign.resourceSpaceId !== sid) {
              $window.location = '/';
            }
          },
          self.showErrorAndRedirect
        );
      } else if (ref === 'group') {
        rsp = WorkingGroups.workingGroup(assembly.assemblyId, refID).get().$promise;
        rsp.then(
          function (group) {
            if (group.resourcesResourceSpaceId !== sid) {
              $window.location = '/';
              return;
            }
          },
          self.showErrorAndRedirect
        );
      } else {
        $window.location = '/';
      }
    }
  }

  /**
   * default callback error handler
   */
  function showErrorAndRedirect() {
    this.Notify.show('Error while trying to communicate with the server', 'error');
    $window.location = '/';
  }
} ());
