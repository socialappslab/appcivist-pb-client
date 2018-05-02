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
      $scope.ldapAvailable = false;
      $scope.ldapOn = false;
      $scope.loginProvider = null;
      $scope.assemblyConfig = [];
      if ($state.params.domain) {
        $scope.domain = $state.params.domain;
        var rsp = Assemblies.assemblyByShortName($scope.domain).get();
        rsp.$promise.then(function(data) {
          $scope.assembly = data;
          localStorageService.set('domain', data);
          Space.configsByUUID(data.resourcesResourceSpaceUUID).get().$promise.then((spd) => {
            $scope.ldapAvailable = spd['appcivist.assembly.authentication.ldap'].toLowerCase() == 'true';
          })
        });
      }
    }

    function login() {
      window.Pace.restart();
      if (!$scope.user.email || !$scope.user.password) {
        Notify.show('Email and password are required', 'error');
        return;
      }
      if ($scope.ldapOn){
        $scope.user.username = $scope.user.email;
        $scope.loginProvider = 'ldap';
        var rsp = AppCivistAuth.signIn($scope.loginProvider, $scope.assembly.uuid).save($scope.user);
      } else {
        var rsp = AppCivistAuth.signIn().save($scope.user);
      }
      rsp.$promise.then(loginSuccess, loginError);
    }

    function loginSuccess(user) {
      localStorageService.set('sessionKey', user.sessionKey);
      localStorageService.set('authenticated', true);
      localStorageService.set('user', user);
      $scope.user = user;
      if ($scope.user && $scope.user.language) {
        $translate.use($scope.user.language);
      }
      user.assembly = $scope.assembly ? $scope.assembly : null;
      loginService.loadAuthenticatedUserMemberships(user).then(function () {
        var ongoingCampaigns = localStorageService.get('ongoingCampaigns');
        var assembly = localStorageService.get('currentAssembly');

        var rsp = Space.configs(assembly.resourcesResourceSpaceId).get();
        rsp.$promise.then(function(data){
          $scope.assemblyConfig = data;
          window.Pace.stop();
          if ($scope.assemblyConfig
              && $scope.assemblyConfig['appcivist.assembly.instance.enable-homepage']
              && $scope.assemblyConfig['appcivist.assembly.instance.enable-homepage'] === 'TRUE') {
            $state.go('v2.assembly.aid.home', { aid: assembly.assemblyId }, { reload: true });
          } else {
            let campaign = ongoingCampaigns ? ongoingCampaigns[0] : null
            $state.go('v2.assembly.aid.campaign.cid', { aid: assembly.assemblyId, cid: campaign.campaignId }, { reload: true });
          }

        }, function(error) {
            window.Pace.stop();
            Notify.show(error.statusMessage, 'error');
        });
      });
    }

    function loginError(error) {
      window.Pace.stop();
      console.log(error);
      var msg = 'Error while trying to authenticate to the server';

      if (error && error.data && error.data.statusMessage) {
        msg = error.data.statusMessage;
      }
      Notify.show(msg, 'error');
    }
  }
} ());
