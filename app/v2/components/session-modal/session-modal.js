(function () {
  'use strict';

  /**
   * @name session-modal
   * @memberof components
   *
   * @description
   *  Component that renders the notifications widget inside topbar.
   *
   * @example
   *
   *  <session-modal></session-modal>
   */
  appCivistApp
    .component('sessionModal', {
      selector: 'sessionModal',
      controller: SessionModalCtrl,
      controllerAs: 'vm',
      templateUrl: '/app/v2/components/session-modal/session-modal.html',
      bindings: {
        assembly: '<'
      }
    });

    SessionModalCtrl.$inject = [
    '$scope', 'loginService', 'AppCivistAuth', 'Notify'
  ];

  function SessionModalCtrl($scope, LoginService, AppCivistAuth, Notify) {
    
    this.$onInit = () => {
      this.user = {}
    }

    this.signup = () => {
      window.Pace.restart();
      console.log(this.user);
      if (this.isAnonymous || this.isAnonymous === undefined) {
        if (!this.user.email || !this.user.password) {
          Notify.show('Email and password are required', 'error');
          window.Pace.stop();
          return;
        }
        var rsp = AppCivistAuth.signUp().save(this.user);
        rsp.$promise.then(signupSuccess, signupError);
      } else {
        console.log("CLICK");
      }
    }

    this.signupSuccess = (user) => {
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
            Notify.show('Error while trying to fetch assembly config', 'error');
        });
      });
    }

    this.signupError = () => {
      window.Pace.stop();
      console.log(error);
      var msg = 'Error while trying to authenticate to the server';

      if (error && error.data && error.data.statusMessage) {
        msg = error.data.statusMessage;
      }
      Notify.show(msg, 'error');
    }

  }
}());