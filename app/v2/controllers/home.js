(function () {
  'use strict';

  angular
    .module('appCivistApp')
    .controller('v2.HomeCtrl', HomeCtrl);

  HomeCtrl.$inject = [
    '$scope', 'localStorageService', 'Notify', 'AppCivistAuth',
    '$state', '$filter', 'loginService', '$translate', 'Assemblies'
  ];

  function HomeCtrl($scope, localStorageService, Notify, AppCivistAuth,
    $state, $filter, loginService, $translate, Assemblies) {

    activate();

    function activate() {
      $scope.user = {};
      $scope.login = login;
      $scope.isHomePage = true;

      if ($state.params.domain) {
        $scope.domain = $state.params.domain;
        var rsp = Assemblies.assemblyByShortName($scope.domain).get();
        rsp.$promise.then(function (data) {
          $scope.assembly = data;
          if($scopa.assembly && $scope.assembly.lang && !$scope.user) {
            $translate.use($scope.assembly.lang);
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
