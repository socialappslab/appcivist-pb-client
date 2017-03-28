(function () {
  'use strict';

  angular
    .module('appCivistApp')
    .controller('v2.LoginCtrl', LoginCtrl);

  LoginCtrl.$inject = [
    '$scope', 'localStorageService', 'Notify', 'AppCivistAuth',
    '$state', '$filter', 'loginService', '$translate', 'Assemblies', 'Space'
  ];

  function LoginCtrl($scope, localStorageService, Notify, AppCivistAuth,
    $state, $filter, loginService, $translate, Assemblies, Space) {

    activate();

    function activate() {
      $scope.user = {};
      $scope.login = login;
      $scope.isLoginPage = true;
      $scope.assemblyConfig = [];
      if ($state.params.domain) {
        $scope.domain = $state.params.domain;
        var rsp = Assemblies.assemblyByShortName($scope.domain).get();
        rsp.$promise.then(function(data) {
          $scope.assembly = data;
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

        var rsp = Space.configs(assembly.resourcesResourceSpaceId).get();
        rsp.$promise.then(function(data){
          $scope.assemblyConfig = data;

          if ($scope.assemblyConfig['appcivist.assembly.instance.enable-homepage'] === 'TRUE') {
            $state.go('v2.assembly.aid.home', { aid: assembly.assemblyId }, { reload: true });
          } else {
            $state.go('v2.assembly.aid.campaign.cid', { aid: assembly.assemblyId, cid: ongoingCampaigns[0].campaignId }, { reload: true });
          }
          
        }, function(error) {
            Notify.show('Error while trying to fetch assembly config', 'error');
        });
        
      });
    }

    function loginError(error) {
      console.log(error);
      var msg = 'Error while trying to authenticate to the server';

      if (error && error.data && error.data.statusMessage) {
        msg = error.data.statusMessage;
      }
      Notify.show(msg, 'error');
    }
  }
} ());
