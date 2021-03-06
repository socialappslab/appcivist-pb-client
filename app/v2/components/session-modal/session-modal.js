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
      '$scope', 'loginService', 'AppCivistAuth', 'Notify', 'localStorageService', '$translate', 'Space', '$state', '$stateParams', 'LocaleService', '$rootScope', 'Assemblies', '$window', 'Utils', 'Memberships'
  ];

  function SessionModalCtrl($scope, loginService, AppCivistAuth, Notify, localStorageService, $translate, Space, $state, $stateParams, LocaleService, $rootScope, Assemblies, $window, Utils, Memberships) {

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

      this.ldapOn = false;
      this.forgotPasswordUrl = null;
      this.signUpUrl = null;
      this.signUpTitle = null;
      this.registrationTitle = null;
      this.usernamePlaceholder = null;
      this.passwordPlaceholder = null;
/*
      this.loginProvider = null;
      this.assembly = this.assembly ? this.assembly : localStorageService.get('currentAssembly');
      if (!this.assembly)
        this.assembly = this.assembly ? this.assembly : localStorageService.get('anonymousAssembly');
*/
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

      this.user = localStorageService.get('user');
      this.userIsAuthenticated = loginService.userIsAuthenticated();

      if (!this.userIsAuthenticated || Utils.isUUID($stateParams.aid)) {
        this.isAnonymous = true;
        if (!$stateParams.auuid) {
          this.assemblyId = $stateParams.aid;
        } else {
          this.assemblyId = $stateParams.auuid;
        }
      } else {
        if (this.user && this.user.language) {
          $translate.use(this.user.language);
        }
        this.assemblyId = parseInt($stateParams.aid);
        this.userIsMember = Memberships.isMember("assembly",this.assemblyId);
      }

      this.fetchAssembly(this.assemblyId);

    }

    this.readConfig = () => {
      Space.configsByUUID(this.assembly.resourcesResourceSpaceUUID).get().$promise.then((data) => {
        this.ldapOn = data['appcivist.assembly.authentication.ldap'] ? data['appcivist.assembly.authentication.ldap'].toLowerCase() === 'true' : false;
        this.forgotPasswordUrl = data['appcivist.assembly.authentication.forgot-url'];
        this.signUpUrl = data['appcivist.assembly.authentication.signup-url'];
        this.signUpTitle = data['appcivist.assembly.authentication.signup-title'];
        this.registrationTitle = data['appcivist.assembly.authentication.registration-title'];
        this.usernamePlaceholder = data['appcivist.assembly.authentication.username-placeholder'];
        this.passwordPlaceholder = data['appcivist.assembly.authentication.password-placeholder'];
        this.passwordRepeatPlaceholder = data['appcivist.assembly.authentication.password-repeat-placeholder'];
      });
    }

    this.fetchAssembly = (aid) => {
      let rsp;

      if (this.isAnonymous) {
        if (Utils.isUUID(aid)) {
          rsp = Assemblies.assemblyByUUID(aid).get().$promise;
        } else if (isNaN(aid)) {
          rsp = Assemblies.assemblyByShortName(aid).get().$promise;
        } else {
          this.unauthorizedAccess = true;
        }
      } else {
        if (isNaN($stateParams.aid)) {
          rsp = Assemblies.assemblyByShortName($stateParams.aid).get().$promise;
          this.shortname = $stateParams.aid;
        } else {
          rsp = Assemblies.assembly(aid).get().$promise;
        }
      }

      if (!this.unauthorizedAccess) {
        rsp.then(
          assembly => {
            self.assembly = assembly;
            if (self.isAnonymous) {
              if (self.assembly && self.assembly.lang) {
                $translate.use(self.assembly.lang);
                localStorageService.set('anonymousAssembly',self.assembly);
              }
              self.assemblyId = self.assembly.uuid;
            } else {
              localStorageService.set('currentAssembly',self.assembly);
              self.assemblyId = self.assembly.assemblyId ? self.assembly.assemblyId : self.assembly.uuid;
              self.readAssemblyByShortname = self.assembly.assemblyId ? false : true;
            }
            self.shortname = self.assembly.shortname;

            self.readConfig();
          },

          error => {
            Notify.show(error.statusMessage, 'error');
          }
        )
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
            console.log(this.loginProvider);
            console.log(this.auuid);
            console.log(this.assembly);
            var rsp = AppCivistAuth.signIn(this.loginProvider, this.assembly.uuid).save(this.user);
          } else {
            var rsp = AppCivistAuth.signIn().save(this.user);
          }
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
      console.log(user);
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
      Notify.show(error ? error.data ? error.data.statusMessage : error.statusMessage ? error.statusMessage : error.message ? error.message : '' : '', 'error');
    }

    this.toggleShowLogin = () => {
      if (this.showLogin===undefined) {
        this.showLogin = false;
      }

      if (this.showLogin == false) {
        this.showLogin = true;
      } else {
        if (this.signUpUrl) {
          $window.open(this.signUpUrl, '_blank');
        } else {
          this.showLogin = false;
        }
      }
    }

    this.redirectToForgotPassword = () => {
      if (this.forgotPasswordUrl) {
        $window.open(this.forgotPasswordUrl, '_blank');
      } else {
        // #/v2/user/password/forgot
        $('#sessionModal').modal('hide');
        $('body').removeClass('modal-open');
        $('.modal-backdrop').remove()
        $state.go('v2.user.password.forgot', {}, { reload: true });
      }
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
