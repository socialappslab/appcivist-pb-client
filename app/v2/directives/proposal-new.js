(function () {
  'use strict';

  appCivistApp
    .directive('proposalNew', ProposalNew);

  ProposalNew.$inject = ['WorkingGroups', 'localStorageService', 'Notify'];

  function ProposalNew(WorkingGroups, localStorageService, Notify) {

    return {
      restrict: 'E',
      scope: {
        campaign: '=',
        close: '&'
      },
      templateUrl: '/app/v2/partials/directives/proposal-new.html',
      link: function (scope, element, attrs) {
        scope.init = init.bind(scope);
        scope.loadWorkingGroups = loadWorkingGroups.bind(scope);
        scope.proposal = {};
        scope.assembly = localStorageService.get('currentAssembly');

        scope.$watch('campaign', function (newVal) {
          if (newVal) {
            scope.init();
          }
        });
      }
    };

    function init() {
      this.proposal = {
        title: '',
        summary: '',
        workingGroupAuthors: [],
        authors: [],
        existingThemes: [],
        sourceCode: ''
      }
      this.loadWorkingGroups();
    }



    /**
     * Load available working groups for current assembly
     */
    function loadWorkingGroups() {
      var self = this;
      //var rsp = WorkingGroups.workingGroups(this.assembly.assemblyId).query().$promise;
      var rsp = WorkingGroups.workingGroupsInCampaign(this.assembly.assemblyId, this.campaign.campaignId).query().$promise;
      rsp.then(
        function (groups) {
          self.groups = groups;
        },
        function () {
          Notify.show('Error while trying to fetch working groups from the server', 'error');
        }
      );
    }
  }
} ());
