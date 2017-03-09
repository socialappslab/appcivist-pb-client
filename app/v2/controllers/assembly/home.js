(function() {
  'use strict';

  angular
    .module('appCivistApp')
    .controller('v2.AssemblyHomeCtrl', AssemblyHomeCtrl);

  AssemblyHomeCtrl.$inject = [
    '$state', '$scope', 'loginService', 'localStorageService', 'Campaigns', 'Utils', 'WorkingGroups',
    'Notify', 'Space', '$stateParams', 'Assemblies', 'AppCivistAuth'
  ];

  function AssemblyHomeCtrl($state, $scope, loginService, localStorageService, Campaigns, Utils,
    WorkingGroups, Notify, Space, $stateParams, Assemblies, AppCivistAuth) {

    $scope.fetchCampaigns = fetchCampaigns.bind($scope);
    $scope.fetchWorkingGroups = fetchWorkingGroups.bind($scope);
    $scope.fetchOrganizations = fetchOrganizations.bind($scope);
    $scope.fetchResources = fetchResources.bind($scope);
    $scope.showGroups = showGroups.bind($scope);
    $scope.fetchAssembly = fetchAssembly.bind($scope);
    $scope.fetchConfigs = fetchConfigs.bind($scope);
    $scope.signout = signout.bind($scope);

    activate();


    function activate() {
      $scope.user = localStorageService.get('user');
      $scope.userIsAuthenticated = loginService.userIsAuthenticated();
      let assembly = localStorageService.get('currentAssembly');

      if (Utils.isUUID($stateParams.aid)) {
        $scope.isAnonymous = true;
        $scope.assemblyId = $stateParams.aid;
      } else {
        $scope.assemblyId = parseInt($stateParams.aid);
      }
      $scope.fetchAssembly($scope.assemblyId);
      $scope.fetchCampaigns();
    }

    function fetchCampaigns() {
      let rsp;

      if (this.isAnonymous) {
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

          this.pastCampaigns = campaigns.filter(c => {
            const endDate = Utils.parseDateToLocal(c.endDate);

            if (!endDate) {
              return false;
            }
            return moment().isAfter(endDate);
          });

          angular.forEach(this.ongoings, c => this.fetchWorkingGroups(this.assemblyId, c));
          angular.forEach(this.pastCampaigns, c => this.fetchWorkingGroups(this.assemblyId, c));
        },
        error => {
          Notify.show('Error while trying to fetch campaigns from the server', 'error');
        }
      )
    }

    function fetchAssembly(aid) {
      let rsp;

      if (this.isAnonymous) {
        rsp = Assemblies.assemblyByUUID(aid).get().$promise;
      } else {
        rsp = Assemblies.assembly(aid).get().$promise;
      }

      rsp.then(
        assembly => {
          this.assembly = assembly;
          this.fetchOrganizations(assembly);
          this.fetchResources(assembly);
          this.fetchConfigs(assembly);
        },

        error => {
          Notify.show('Error while trying to fetch assembly information from the server', 'error');
        }
      )
    }

    function fetchWorkingGroups(assemblyId, campaign) {
      let rsp;

      if (this.isAnonymous) {
        rsp = WorkingGroups.workingGroupsInCampaignByUUID(campaign.uuid).query().$promise;
      } else {
        rsp = WorkingGroups.workingGroupsInCampaign(assemblyId, campaign.campaignId).query().$promise;
      }
      rsp.then(
        groups => {
          campaign.groups = groups;
        },
        error => {
          Notify.show('Error while trying to fetch working groups from the server', 'error');
        }
      );
    }

    function fetchOrganizations(assembly) {
      let rsp = Space.organizations(this.assembly.resourcesResourceSpaceId).query().$promise;
      rsp.then(
        organizations => {
          this.organizations = organizations;
        },
        error => {
          Notify.show('Error while trying to fetch assembly organizations from the server', 'error');
        }
      );
    }

    function fetchResources(assembly) {
      let rsp = Space.resources(this.assembly.resourcesResourceSpaceId).query().$promise;
      rsp.then(
        resources => {
          this.resources = resources;
        },
        error => {
          Notify.show('Error while trying to fetch assembly resources from the server', 'error');
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

      if (this.isAnonymous) {
        rsp = Space.configsByUUID(assembly.resourcesResourceSpaceUUID).get().$promise;
      } else {
        rsp = Space.configs(assembly.resourcesResourceSpaceId).get().$promise;
      }
      rsp.then(
        configs => {
          this.usersCanSignUp = configs['appcivist.assembly.disable-new-memberships'] === 'true';
        },
        error => {
          Notify.show('Error while trying to fetch assembly configurations from the server', 'error');
        }
      );
    }

    function signout() {
      let rsp = AppCivistAuth.signOut().save();
      rsp.$promise.then(redirect, redirect);
    }

    function redirect() {
      localStorageService.clearAll();
      $state.go('v2.login', null, { reload: true }).then(function() {
        location.reload();
      });
    }
  }

}());