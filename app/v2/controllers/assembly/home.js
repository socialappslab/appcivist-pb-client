(function() {
  'use strict';

  angular
    .module('appCivistApp')
    .controller('v2.AssemblyHomeCtrl', AssemblyHomeCtrl);

  AssemblyHomeCtrl.$inject = [
    '$state', '$scope', 'loginService', 'localStorageService', 'Campaigns', 'Utils', 'WorkingGroups',
    'Notify', 'Space', '$stateParams', 'Assemblies', 'AppCivistAuth', '$translate', 'Memberships', '$rootScope'
  ];

  function AssemblyHomeCtrl($state, $scope, loginService, localStorageService, Campaigns, Utils,
    WorkingGroups, Notify, Space, $stateParams, Assemblies, AppCivistAuth, $translate, Memberships, $rootScope) {

    $scope.fetchCampaigns = fetchCampaigns.bind($scope);
    $scope.fetchWorkingGroups = fetchWorkingGroups.bind($scope);
    $scope.fetchOrganizations = fetchOrganizations.bind($scope);
    $scope.fetchResources = fetchResources.bind($scope);
    $scope.showGroups = showGroups.bind($scope);
    $scope.fetchAssembly = fetchAssembly.bind($scope);
    $scope.fetchConfigs = fetchConfigs.bind($scope);
    $scope.signout = signout.bind($scope);
    $scope.redirectCampaign = redirectCampaign.bind($scope);
    $scope.userIsMember = false;
    $scope.loadSigninModal = loadSigninModal.bind($scope);
    $scope.loadSignupModal = loadSignupModal.bind($scope);
    $scope.hideSessionModal = hideSessionModal.bind($scope);

    activate();

    function activate() {
      $scope.unauthorizedAccess = false;
      $scope.user = localStorageService.get('user');
      $scope.userIsAuthenticated = loginService.userIsAuthenticated();

      if (!$scope.userIsAuthenticated || Utils.isUUID($stateParams.aid)) {
        $scope.isAnonymous = true;
        if (!$stateParams.auuid) {
          $scope.assemblyId = $stateParams.aid;
        } else {
          $scope.assemblyId = $stateParams.auuid;
        }
      } else {
        if ($scope.user && $scope.user.language) {
          $translate.use($scope.user.language);
        }
        $scope.assemblyId = parseInt($stateParams.aid);
        $scope.userIsMember = Memberships.isMember("assembly",$scope.assemblyId);
      }
      $scope.fetchAssembly($scope.assemblyId);
      $scope.shortname = "";
      $scope.readAssemblyByShortname = false;
      $scope.$on('sessionModal:closeSessionModal',$scope.hideSessionModal);
    }

    function signup() {
      if ($scope.isAnonymous) {
        if (!$scope.user.email || !$scope.user.password) {
          Notify.show('Email and password are required', 'error');
          return;
        }
        var rsp = AppCivistAuth.signUp().save($scope.user);
        rsp.$promise.then(loginSuccess, loginError);
      } else {
        console.log("CLICKED!");
      }
    }

    function fetchAssembly(aid) {
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
            this.assembly = assembly;
            if (this.isAnonymous) {
              if (this.assembly && this.assembly.lang) {
                $translate.use(this.assembly.lang);
                localStorageService.set('anonymousAssembly',this.assembly);
              }
              this.assemblyId = this.assembly.uuid;
            } else {
              localStorageService.set('currentAssembly',this.assembly);
              this.assemblyId = this.assembly.assemblyId ? this.assembly.assemblyId : this.assembly.uuid;
              this.readAssemblyByShortname = this.assembly.assemblyId ? false : true;
            }
            this.shortname = this.assembly.shortname
            this.logo = this.assembly.profile.icon;
            this.logoStyle = this.logo ?
            {
              'background-image': 'url(' + this.logo + ')'
            } : {
              'display': 'none'
            };
            this.cover = this.assembly.profile.cover;
            this.coverStyle = this.cover ?
            {
              'background-image': 'url(' + this.cover + ')',
              'background-position': 'center center',
              'background-size': 'cover'
            } : '';

            this.fetchCampaigns();
            this.fetchOrganizations(assembly);
            this.fetchResources(assembly);
            this.fetchConfigs(assembly);
            console.log(assembly);
          },

          error => {
            Notify.show(error.statusMessage, 'error');
          }
        )
      }
    }

    function fetchCampaigns() {
      let rsp;

      if (this.isAnonymous || this.readAssemblyByShortname) {
        rsp = Campaigns.campaignsInAssemblyByUUID(this.assemblyId).query().$promise;
      } else {
        rsp = Campaigns.campaignsInAssembly(this.assemblyId).query().$promise;
      }
      rsp.then(
        campaigns => {
          this.ongoings = campaigns.filter(c => {
            const startDate = Utils.parseDateToLocal(c.startDate);
            const endDate = Utils.parseDateToLocal(c.endDate);

            if (!startDate || !endDate) {
              return false;
            }
            return moment().isBetween(startDate, endDate);
          });

          localStorageService.set("ongoingCampaigns", this.ongoings);
          this.pastCampaigns = campaigns.filter(c => {
            const endDate = Utils.parseDateToLocal(c.endDate);

            if (!endDate) {
              return false;
            }
            return moment().isAfter(endDate);
          });

          localStorageService.set("pastCampaigns", this.pastCampaigns);
          
          this.upcomingCampaigns = campaigns.filter(c => {
            const startDate = Utils.parseDateToLocal(c.startDate);

            if (!startDate) {
              return false;
            }
            return moment().isBefore(startDate);
          });

          localStorageService.set("upcomingCampaigns", this.upcomingCampaigns);

          angular.forEach(this.ongoings, c => this.fetchWorkingGroups(this.assemblyId, c));
          angular.forEach(this.pastCampaigns, c => this.fetchWorkingGroups(this.assemblyId, c));
        },
        error => {
          Notify.show(error.statusMessage, 'error');
        }
      )
    }

    function fetchWorkingGroups(assemblyId, campaign) {
      let rsp;

      if (this.isAnonymous || this.readAssemblyByShortname) {
        rsp = WorkingGroups.workingGroupsInCampaignByUUID(campaign.uuid).query().$promise;
      } else {
        rsp = WorkingGroups.workingGroupsInCampaign(assemblyId, campaign.campaignId).query().$promise;
      }
      rsp.then(
        groups => {
          campaign.groups = groups;
          // TODO: find out why the Pace loader keeps showing after the whole page loaded, in the meantime, the following is a patch
          window.Pace.stop();
        },
        error => {
          // TODO: find out why the Pace loader keeps showing after the whole page loaded, in the meantime, the following is a patch
          window.Pace.stop();
          Notify.show(error.statusMessage, 'error');
        }
      );
    }

    function fetchOrganizations(assembly) {
      let rsp;
      if (this.isAnonymous || this.readAssemblyByShortname) {
        rsp = Space.organizationsByUUID(this.assembly.resourcesResourceSpaceUUID).query().$promise;
      } else {
        rsp = Space.organizations(this.assembly.resourcesResourceSpaceId).query().$promise;
      }
      rsp.then(
        organizations => {
          this.organizations = organizations;
        },
        error => {
          Notify.show(error.statusMessage, 'error');
        }
      );
    }

    function fetchResources(assembly) {
      let rsp;
      if (this.isAnonymous || this.readAssemblyByShortname) {
        rsp = Space.resourcesByUUID(this.assembly.resourcesResourceSpaceUUID).query().$promise;
      } else {
        rsp = Space.resources(this.assembly.resourcesResourceSpaceId).query().$promise;
      }
      rsp.then(
        resources => {
          this.resources = resources;
        },
        error => {
          Notify.show(error.statusMessage, 'error');
        }
      );
    }

    function showGroups(campaign, $event) {
      $event.preventDefault();
      $event.stopPropagation();
      this.selectedCampaign = campaign;
    }

    function fetchConfigs(assembly) {
      let rsp;

      if (this.isAnonymous || this.readAssemblyByShortname) {
        rsp = Space.configsByUUID(assembly.resourcesResourceSpaceUUID).get().$promise;
      } else {
        rsp = Space.configs(assembly.resourcesResourceSpaceId).get().$promise;
      }
      rsp.then(
        configs => {
          this.usersCanSignUp = configs['appcivist.assembly.disable-new-memberships'] === 'false';
        },
        error => {
          Notify.show(error.statusMessage, 'error');
        }
      );
    }

    function signout() {
      let rsp = AppCivistAuth.signOut().save();
      rsp.$promise.then(redirect, redirect);
    }

    function redirect() {
      let currentAssembly = localStorageService.get('currentAssembly');
      let auuid = currentAssembly.uuid;
      if ($state.params.cid) {
        let currentCampaign = localStorageService.get('currentCampaign');
        let cuuid = currentCampaign.uuid;
        if ($state.params.coid) {
          let currentContribution = localStorageService.get('currentContribution');
          let couuid = currentContribution.uuid;
          localStorageService.clearAll();
          $state.go("v2.public.assembly.auuid.campaign.contribution.couuid",
            {auuid: auuid, cuuid: cuuid, couuid: couuid});
        } else if ($state.params.gid) {
          let currentGroup = localStorageService.get('currentWorkingGroup');
          let guuid = currentGroup.uuid;
          if ($state.params.pid) {
            let currentContribution = localStorageService.get('currentContribution');
            let puuid = currentContribution.uuid;
            localStorageService.clearAll();
            $state.go("v2.public.assembly.auuid.campaign.cuuid.workingGroup.guuid.proposal.puuid",
              {auuid: auuid, cuuid: cuuid, guuid: guuid, puuid: puuid},
              {reload: true});
          } else {
            localStorageService.clearAll();
            $state.go("v2.public.assembly.auuid.campaign.cuuid.workingGroup.guuid.dashboard",
              {auuid: auuid, cuuid: cuuid, guuid: guuid},
              {reload: true});
          }
        } else {
          localStorageService.clearAll();
          $state.go("v2.public.assembly.auuid.campaign.cuuid.dashboard",
            {auuid: auuid, cuuid: cuuid},
            {reload: true});
        }
      } else  {
        localStorageService.clearAll();
        $state.go("v2.public.assembly.auuid.home", {auuid: auuid}, {reload: true});
      }
      location.reload();
    }

    function redirectCampaign(assembly, campaign) {
      ///#/v2/assembly/{{assembly.assemblyId}}/campaign/{{campaign.campaignId}}
      $state.go('v2.assembly.aid.campaign.cid', { aid: assembly.assemblyId, cid: campaign.campaignId }, { reload: true });
    }

    function loadSigninModal () {
      $scope.sessionModalIsSignIn = true;
      $rootScope.$broadcast("SessionModal:setSessionModalIsSignIn");
      $('#sessionModal').modal('show');
    }

    function loadSignupModal () {
      $scope.sessionModalIsSignIn = false;
      $rootScope.$broadcast("SessionModal:setSessionModalIsSignUp");
      $('#sessionModal').modal('show');
    }

    function hideSessionModal () {
      $('#sessionModal').modal('hide');
      $('body').removeClass('modal-open');
      $('.modal-backdrop').remove()
    }
  }

}());
