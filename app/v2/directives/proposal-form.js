(function() {
  'use strict';

  appCivistApp
    .directive('proposalForm', ProposalForm);

  ProposalForm.$inject = [
    'WorkingGroups', 'localStorageService', 'Notify', 'Memberships', 'Campaigns',
    'Assemblies', 'Contributions'
  ];

  function ProposalForm(WorkingGroups, localStorageService, Notify, Memberships,
    Campaigns, Assemblies, Contributions) {
    return {
      restrict: 'E',
      scope: {
        campaign: '=',
        close: '&'
      },
      templateUrl: '/app/v2/partials/directives/proposal-form.html',
      link: function(scope, element, attrs) {
        scope.init = init.bind(scope);
        scope.verifyMembership = verifyMembership.bind(scope);
        scope.loadWorkingGroups = loadWorkingGroups.bind(scope);
        scope.loadThemes = loadThemes.bind(scope);
        scope.submit = submit.bind(scope);
        scope.loadAuthors = loadAuthors.bind(scope);
        scope.selectGroup = selectGroup.bind(scope);
        scope.proposal = {};
        scope.assembly = localStorageService.get('currentAssembly');

        if (!scope.campaign) {
          scope.$watch('campaign', function(newVal) {
            if (newVal) {
              scope.init();
            }
          });
        } else {
          scope.init();
        }
      }
    };

    function init() {
      this.proposal = {
        type: 'PROPOSAL',
        title: '',
        text: '',
        workingGroupAuthors: [],
        authors: [],
        existingThemes: [],
        sourceCode: ''
      }
      this.themesOptions = {
        textField: 'title',
        idField: 'themeId'
      };
      this.authorsOptions = {
        idField: 'userId',
        textField: 'name'
      };
      this.isAuthorsDisabled = true;
      this.assembly = localStorageService.get('currentAssembly');
      this.verifyMembership();
      this.loadWorkingGroups();
    }


    /**
     * Load available working groups for current assembly
     */
    function loadWorkingGroups() {
      var self = this;
      var rsp = WorkingGroups.workingGroupsInCampaign(this.assembly.assemblyId, this.campaign.campaignId).query().$promise;
      rsp.then(
        function(groups) {
          self.groups = groups;
        },
        function() {
          Notify.show('Error while trying to fetch working groups from the server', 'error');
        }
      );
    }

    /**
     * Validates current user's memberships information.
     */
    function verifyMembership() {
      this.userIsAssemblyCoordinator = Memberships.rolIn('assembly', this.assembly.assemblyId, 'COORDINATOR');
    }

    function loadThemes(query) {
      if (!this.campaign) {
        return;
      }
      return Campaigns.themes(this.assembly.assemblyId, this.campaign.campaignId);
    }

    /**
     * Called whenever currently selected working group changes
     */
    function selectGroup() {
      if (this.selectedGroup) {
        this.proposal.workingGroupAuthors = [this.selectedGroup];
        this.isAuthorsDisabled = false;
      }
    }

    /**
     * This method is responsible for loading the list of authors. It joins the assembly 
     * members list and the currently selected working group members list.
     */
    function loadAuthors() {
      /**
       * listado in-memory de los miembors del WG seleccionado + los miembros del current assembly
       */
      var self = this;
      var rsp;

      if (!self.assemblyMembers) {
        rsp = Assemblies.assemblyMembers(self.assembly.assemblyId).query().$promise;
        return rsp.then(
          function(data) {
            self.assemblyMembers = _.filter(data, function(d) {
              return d.status === 'ACCEPTED';
            }).map(function(d) {
              return d.user;
            });
            return self.loadAuthors();
          },
          function(error) {
            Notify.show('Error while trying to fetch assembly members from the server', 'error');
          }
        );
      }
      rsp = WorkingGroups.workingGroupMembers(self.assembly.assemblyId, self.selectedGroup.groupId, 'ACCEPTED').query().$promise;
      return rsp.then(
        function(data) {
          var groupMembers = _.map(data, function(d) {
            return d.user;
          });
          return groupMembers.concat(self.assemblyMembers);
        },
        function(error) {
          Notify.show('Error while trying to fetch working group members from the server', 'error');
        }
      );
    }

    /**
     * Sends the proposal to the backend.
     */
    function submit() {

      if (this.contributionForm.$invalid) {
        return;
      }
      var rsp = Contributions.contributionInResourceSpace(this.campaign.resourceSpaceId).save(this.proposal).$promise;
      rsp.then(
        function(data) {
          console.log('SAVED', data);
        },
        function(error) {
          Notify.show('Error while trying to save the contribution', 'error');
        }
      )
    }
  }
}());