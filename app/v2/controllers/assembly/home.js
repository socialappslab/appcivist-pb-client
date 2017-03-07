(function() {
  'use strict';

  angular
    .module('appCivistApp')
    .controller('v2.AssemblyHomeCtrl', AssemblyHomeCtrl);

  AssemblyHomeCtrl.$inject = [
    '$state', '$scope', 'loginService', 'localStorageService', 'Campaigns', 'Utils', 'WorkingGroups',
    'Notify', 'Space'
  ];

  function AssemblyHomeCtrl($state, $scope, loginService, localStorageService, Campaigns, Utils,
    WorkingGroups, Notify, Space) {

    $scope.fetchCampaigns = fetchCampaigns.bind($scope);
    $scope.fetchWorkingGroups = fetchWorkingGroups.bind($scope);
    $scope.fetchOrganizations = fetchOrganizations.bind($scope);
    $scope.fetchResources = fetchResources.bind($scope);

    activate();


    function activate() {
      $scope.user = localStorageService.get('user');
      $scope.userIsAuthenticated = loginService.userIsAuthenticated();
      $scope.assembly = localStorageService.get('currentAssembly');
      $scope.groupsMap = {};
      $scope.fetchCampaigns();
      $scope.fetchOrganizations();
      $scope.fetchResources();
    }

    function fetchCampaigns() {
      let rsp = Campaigns.campaignsInAssembly(this.assembly.assemblyId).query().$promise;
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

          angular.forEach(this.ongoings, c => this.fetchWorkingGroups(this.assembly.assemblyId, c.campaignId));
          angular.forEach(this.pastCampaigns, c => this.fetchWorkingGroups(this.assembly.assemblyId, c.campaignId));
        },
        error => {
          Notify.show('Error while trying to fetch campaigns from the server', 'error');
        }
      )
    }

    function fetchWorkingGroups(assemblyId, campaignId) {
      let rsp = WorkingGroups.workingGroupsInCampaign(assemblyId, campaignId).query().$promise;
      rsp.then(
        groups => {
          this.groupsMap[campaignId] = groups;
        },
        error => {
          Notify.show('Error while trying to fetch working groups from the server', 'error');
        }
      );
    }

    function fetchOrganizations() {
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

    function fetchResources() {
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
  }
}());