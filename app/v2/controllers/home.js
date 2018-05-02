(function () {
  'use strict';

  angular
    .module('appCivistApp')
    .controller('v2.HomeCtrl', HomeCtrl);

  HomeCtrl.$inject = [
    '$scope', 'localStorageService', 'Notify', 'AppCivistAuth',
    '$state', '$filter', 'loginService', '$translate', 'Assemblies', '$rootScope'
  ];

  function HomeCtrl($scope, localStorageService, Notify, AppCivistAuth,
    $state, $filter, loginService, $translate, Assemblies, $rootScope) {

    activate();

    function activate() {
      // if (!$rootScope.ui || ($rootScope.ui && !$rootScope.ui.v2)) {
      //   $rootScope.ui = {
      //     v2: true
      //   }
      //   console.log("Forced version 2 in home controller");
      // }
      $scope.user = {};
      $scope.login = login;
      $scope.isHomePage = true;
      $scope.instanceSpotlight = [
        {
          name: "City of Vallejo",
          purpose: "Participatory Budgeting",
          location: "Vallejo, CA, USA",
          url:"https://pb.appcivist.org/#/v2/p/assembly/0bc7bea3-f253-4824-a9c8-bfedf8998daf/campaign/3de5a9f3-232d-4527-83b6-c850aeaf7388"}
        ,
        {
          name: "City of Dieppe",
          purpose: "Participatory Budgeting",
          location: "Dieppe, Canada",
          url:"https://pb.appcivist.org/#/v2/p/assembly/f5c3bba8-c3dd-40e1-b891-0add8a446615/campaign/0b1e72a2-df31-44f4-ac26-bcef4c667671"
        }
      ];

      if ($state.params.domain) {
        $scope.domain = $state.params.domain;
        var rsp = Assemblies.assemblyByShortName($scope.domain).get();
        rsp.$promise.then(function (data) {
          $scope.assembly = data;
          if($scope.assembly && $scope.assembly.lang && !$scope.user) {
            $translate.use($scope.assembly.lang);
            moment.locale($scope.assembly.lang);
          }
          localStorageService.set('domain', data);
        });
      }
    }

    function login() {
      if (!$scope.user.email || !$scope.user.password) {
        Notify.show('Email and password are required', 'error');
        return;
      }
      var rsp = AppCivistAuth.signIn().save($scope.user);
      rsp.$promise.then(loginSuccess, loginError);
    }

    function loginSuccess(user) {
      localStorageService.set('sessionKey', user.sessionKey);
      localStorageService.set('authenticated', true);
      localStorageService.set('user', user);
      // todo
      if ($scope.user && $scope.user.language) {
        $translate.use($scope.user.language);
      }
      loginService.loadAuthenticatedUserMemberships(user).then(function () {
        var ongoingCampaigns = localStorageService.get('ongoingCampaigns');
        var assembly = localStorageService.get('currentAssembly');
        $state.go('v2.assembly.aid.campaign.cid', { aid: assembly.assemblyId, cid: ongoingCampaigns[0].campaignId }, { reload: true });
      });
    }

    function loginError(error) {
      var msg = 'Error while trying to authenticate to the server';

      if (error && error.data && error.data.statusMessage) {
        msg = error.data.statusMessage;
      }
      Notify.show(msg, 'error');
    }
  }
}());
