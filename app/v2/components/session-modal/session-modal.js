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
        assembly: '<',
        showLogin: '='
      }
    });

    SessionModalCtrl.$inject = [
      '$scope', 'loginService', 'AppCivistAuth', 'Notify', 'localStorageService', '$translate', 'Space', '$state', '$stateParams', 'LocaleService', '$rootScope', 'Assemblies'
  ];

  function SessionModalCtrl($scope, loginService, AppCivistAuth, Notify, localStorageService, $translate, Space, $state, $stateParams, LocaleService, $rootScope, Assemblies) {

    this.$onInit = () => {
      this.user = {}
      this.assembly = this.assembly ? this.assembly : localStorageService.get('currentAssembly');
      this.assembly = this.assembly ? this.assembly : localStorageService.get('anonymousAssembly');

    }

    this.signup = () => {
      window.Pace.restart();
      if (!this.showLogin) {
        this.user.existingAssembly = {};
        if (typeof $stateParams.aid === "number") {
          this.user.existingAssembly.assemblyId = $stateParams.aid;
        } else {
          this.user.existingAssembly.shortname = $stateParams.aid;
        }

        this.user.existingAssembly.uuid = $stateParams.auuid;
        this.user.lang = LocaleService.getLocale();
      }
      if (this.isAnonymous || this.isAnonymous === undefined) {
        if (!this.user.email || !this.user.password) {
          Notify.show('Email and password are required', 'error');
          window.Pace.stop();
          return;
        }
        if (this.showLogin) {
          var rsp = AppCivistAuth.signIn().save(this.user);
          rsp.$promise.then(this.signupSuccess, this.signupError);
        } else {
          var rsp = AppCivistAuth.signUp().save(this.user);
          rsp.$promise.then(this.signupSuccess, this.signupError);
        }
      }
    }

    this.signupSuccess = (user) => {
      localStorageService.set('sessionKey', user.sessionKey);
      localStorageService.set('authenticated', true);
      localStorageService.set('user', user);
      this.user = user;
      if (this.user && this.user.language) {
        $translate.use(this.user.language);
      }
      user.assembly = this.assembly ? this.assembly : null;
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
          // $('#sessionModal').modal('hide');
          $('#sessionModal').modal('hide');
          $('body').removeClass('modal-open');
          $('.modal-backdrop').remove();
        }, function(error) {
            window.Pace.stop();
            Notify.show('Error while trying to fetch assembly config', 'error');
        });
      });
    }

    this.signupError = (error) => {
      window.Pace.stop();
      console.log(error);
      var msg = 'Error while trying to authenticate to the server';

      if (error && error.data && error.data.statusMessage) {
        msg = error.data.statusMessage;
      }
      Notify.show(msg, 'error');
    }

    this.toggleShowLogin = () => {
      if (this.showLogin===undefined) {
        this.showLogin = false;
      }
      this.showLogin = !this.showLogin;
    }

    this.redirectToForgotPassword = () => {
      // #/v2/user/password/forgot
      $('#sessionModal').modal('hide');
      $('body').removeClass('modal-open');
      $('.modal-backdrop').remove()
      $state.go('v2.user.password.forgot', {}, { reload: true });
    }
  }
}());
