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

    var self = this;

    this.onStateChange = () => {
      fetchAnonymousAssembly.bind(this);
      this.auuid = $stateParams.auuid ? $stateParams.auuid : null;
      this.cuuid = $stateParams.cuuid ? $stateParams.cuuid : null;
      this.guuid = $stateParams.guuid ? $stateParams.guuid : null;
      this.puuid = $stateParams.puuid ? $stateParams.puuid : null;
      this.couuid = $stateParams.couuid ? $stateParams.couuid : null;
    }
    $rootScope.$on('$stateChangeSuccess', this.onStateChange);

    this.$onInit = () => {
      this.user = {};
      this.assemblyID = null;
      this.campaignID = null;
      this.contributionID = null;
      this.groupID = null;
      this.proposalID = null;
      this.ldapAvailable = false;
      this.ldapOn = false;
      this.loginProvider = null;
      this.assembly = this.assembly ? this.assembly : localStorageService.get('currentAssembly');
      if (!this.assembly)
        this.assembly = this.assembly ? this.assembly : localStorageService.get('anonymousAssembly');

      this.auuid = $stateParams.auuid ? $stateParams.auuid : null;
      this.cuuid = $stateParams.cuuid ? $stateParams.cuuid : null;
      this.guuid = $stateParams.guuid ? $stateParams.guuid : null;
      this.puuid = $stateParams.puuid ? $stateParams.puuid : null;
      this.couuid = $stateParams.couuid ? $stateParams.couuid : null;

      this.aid = null;
      this.cid = null;
      this.coid = null;
      this.gid = null;
      this.pid = null;

      if (this.assembly) {
        Space.configsByUUID(this.assembly.resourcesResourceSpaceUUID).get().$promise.then((data) => {
          this.ldapAvailable = data['appcivist.authentication.ldap'] == 'true';
        })
      }

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
          if (this.ldapOn) {
            this.user.username = this.user.email;
            this.loginProvider = 'ldap';
          }
          var rsp = AppCivistAuth.signIn(this.loginProvider, this.auuid).save(this.user);
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

      // load memberships and redirect to signed in page
      loginService.loadAuthenticatedUserMemberships(user).then(this.redirectToPage);
    }

    this.redirectToPage = () => {
      var campaigns = [];
      var ongoing = localStorageService.get('ongoingCampaigns');
      var upcoming = localStorageService.get('upcomingCampaigns');
      var past = localStorageService.get('pastCampaigns');

      campaigns = ongoing ? campaigns.concat(ongoing) : campaigns;
      campaigns = upcoming ? campaigns.concat(upcoming) : campaigns;
      campaigns = past ? campaigns.concat(past) : campaigns;

      var assembly = localStorageService.get('currentAssembly');
      this.assemblyID = assembly.assemblyId;
      // Determine where to redirect
      if (this.cuuid) {
        let campaign = campaigns ? campaigns.filter(c => {return c.uuid === this.cuuid}) : null;
        if (campaign && campaign.length > 0) {
          campaign = campaign[0];
          this.campaignID = campaign.campaignId;
          if (this.couuid) {
            let idres = Assemblies.id(this.assemblyID, "contribution", this.couuid).get().$promise;
            idres.then(this.redirectToContribution, this.redirectToCampaign);
          } else if (this.guuid) {
            let idres = Assemblies.id(this.assemblyID, "group", this.guuid).get().$promise;
            idres.then(this.redirectToGroupOrProposal, this.redirectToCampaign);
          } else {
            this.redirectToCampaign();
          }
        } else {
          this.redirectToAssembly(assembly, campaigns);
        }
      } else {
        this.redirectToAssembly(assembly, campaigns);
      }
      $('#sessionModal').modal('hide');
      $('body').removeClass('modal-open');
      $('.modal-backdrop').remove();
    }

    this.redirectToContribution = (data) => {
      // redirect to contribution page
      this.coid = data.newResourceId;
      $state.go('v2.assembly.aid.campaign.contribution.coid',
        {
          aid: this.assemblyID,
          cid: this.campaignID,
          coid: this.coid
        }, {reload: true});
    }

    this.redirectToCampaign = (error) => {
      $state.go('v2.assembly.aid.campaign.cid', { aid: this.assemblyID, cid: this.campaignID}, { reload: true });
    }

    this.redirectToGroupOrProposal = (data) => {
      this.groupID = data.newResourceId;
      if (this.puuid) {
        let idres = Assemblies.id(this.assemblyID, "contribution", this.puuid).get().$promise;
        idres.then(this.redirectToProposal,this.redirectToGroup);
      } else {
        this.redirectToGroup();
      }
    }

    this.redirectToGroup = () => {
      $state.go('v2.assembly.aid.campaign.workingGroup.gid', {
        aid: this.assemblyID,
        cid: this.campaignID,
        gid: this.groupID
      }, { reload: true });
    }

    this.redirectToProposal = (data) => {
      this.contributionID = data.newResourceId;
      $state.go('v2.assembly.aid.campaign.workingGroup.proposal.pid', {
        aid: this.assemblyID,
        cid: this.campaignID,
        gid: this.groupID,
        pid: this.contributionID
      }, { reload: true });
    }

    this.redirectToAssembly = (assembly, campaigns) => {
      // if no campaign UUID in the URL, then try to redirect to assembly page if its homepage is enabled
      // if the homepage is not enabled, try to redirect to the first campaign in the list
      // if now campaign exists, redirect to the homepage anyways
      var rsp = Space.configs(assembly.resourcesResourceSpaceId).get();
      rsp.$promise.then(function(data){
        $scope.assemblyConfig = data;
        window.Pace.stop();
        if ($scope.assemblyConfig
          && $scope.assemblyConfig['appcivist.assembly.instance.enable-homepage']
          && $scope.assemblyConfig['appcivist.assembly.instance.enable-homepage'] === 'TRUE') {
          $state.go('v2.assembly.aid.home', { aid: assembly.assemblyId }, { reload: true });
        } else {
          let campaign = campaigns ? campaigns[0] : null
          if (campaign)
            $state.go('v2.assembly.aid.campaign.cid', { aid: assembly.assemblyId, cid: campaign.campaignId }, { reload: true });
          else
            $state.go('v2.assembly.aid.home', { aid: assembly.assemblyId }, { reload: true });
        }
      }, function(error) {
        window.Pace.stop();
        $state.go('v2.assembly.aid.home', { aid: assembly.assemblyId }, { reload: true });
      });
    }

    this.signupError = (error) => {
      window.Pace.stop();
      console.log(error);
      var msg = 'Error while trying to authenticate to the server';

      if (error && error.data && error.data.statusMessage) {
        msg = error.data.statusMessage;
      }
      Notify.show(error ? error.data ? error.data.statusMessage : error.statusMessage ? error.statusMessage : '' : '', 'error');
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

    function fetchAnonymousAssembly() {
      let rsp = Assemblies.assemblyByUUID($state.params.auuid).get().$promise;
      rsp.then(
        assembly => {
          localStorageService.set('anonymousAssembly',assembly);
          self.assembly = assembly;
        }
      );
    }
  }
}());
