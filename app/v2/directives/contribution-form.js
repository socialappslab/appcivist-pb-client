(function() {
  'use strict';

  appCivistApp
    .directive('contributionForm', ContributionForm);

  ContributionForm.$inject = [
    'WorkingGroups', 'localStorageService', 'Notify', 'Memberships', 'Campaigns',
    'Assemblies', 'Contributions', '$http'
  ];

  function ContributionForm(WorkingGroups, localStorageService, Notify, Memberships,
    Campaigns, Assemblies, Contributions, $http) {
    return {
      restrict: 'E',
      scope: {
        campaign: '=',
        //supported values:  PROPOSAL | IDEA
        type: '@',
        // handler called when contribution creation has succeeded
        onSuccess: '&',
        contribution: '<',
        // edit | create, default value is create
        mode: '@'
      },
      templateUrl: '/app/v2/partials/directives/contribution-form.html',
      link: function(scope, element, attrs) {
        scope.init = init.bind(scope);
        scope.initEdit = initEdit.bind(scope);
        scope.initCreate = initCreate.bind(scope);
        scope.mode = scope.mode || 'create';
        scope.verifyMembership = verifyMembership.bind(scope);
        scope.loadWorkingGroups = loadWorkingGroups.bind(scope);
        scope.loadThemes = loadThemes.bind(scope);
        scope.submit = submit.bind(scope);
        scope.loadAuthors = loadAuthors.bind(scope);
        scope.selectGroup = selectGroup.bind(scope);
        scope.updateNonMember = updateNonMember.bind(scope);
        scope.disableAll = disableAll.bind(scope);
        scope.importContribution = importContribution.bind(scope);
        scope.contributionSubmit = contributionSubmit.bind(scope);
        scope.flattenContribution = flattenContribution.bind(scope);
        scope.assembly = localStorageService.get('currentAssembly');
        scope.isEdit = scope.mode === 'edit';
        scope.isCreate = scope.mode === 'create';

        if (scope.mode === 'create') {
          scope.initCreate()
        } else {
          scope.initEdit();
        }
      }
    };

    function initEdit() {
      var vm = this;
      if (!this.contribution) {
        this.$watch('contribution', function(newVal) {
          if (newVal) {
            vm.init();
          }
        });
      } else {
        this.init();
      }
    }

    function initCreate() {
      var vm = this;
      if (!this.campaign) {
        this.$watch('campaign', function(newVal) {
          if (newVal) {
            vm.init();
          }
        });
      } else {
        this.init();
      }
    }

    function init() {
      this.file = {};
      this.contribution = this.contribution || {
        type: this.type,
        title: '',
        text: '',
        workingGroupAuthors: [],
        authors: [],
        existingThemes: [],
        sourceCode: ''
      };

      if (this.isEdit) {
        this.flattenContribution();
      }
      this.actionLabel = this.isCreate ? 'Add' : 'Edit';

      this.themesOptions = {
        textField: 'title',
        idField: 'themeId'
      };
      this.authorsOptions = {
        idField: 'userId',
        textField: 'name'
      };
      this.isProposal = this.contribution.type === 'PROPOSAL';
      this.isIdea = this.contribution.type === 'IDEA';
      this.isAuthorsDisabled = this.isProposal;
      this.assembly = localStorageService.get('currentAssembly');
      this.verifyMembership();
      if (this.isCreate) {
        this.loadWorkingGroups();
      }
      var self = this;
      // setup listener for upload field
      this.$watchCollection('file', function(file) {
        if (file.csv) {
          self.disableAll();
        }
      });
    }

    /**
     * Disable all field in the form.
     */
    function disableAll() {
      this.disabled = true;
      this.isAuthorsDisabled = true;
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
      var campaignId;

      if (this.isCreate) {
        campaignId = this.campaign.campaignId;
      } else {
        campaignId = this.contribution.campaignIds[0];
      }
      return Campaigns.themes(this.assembly.assemblyId, campaignId);
    }

    /**
     * Called whenever currently selected working group changes
     */
    function selectGroup() {
      if (this.selectedGroup && this.isProposal) {
        this.contribution.workingGroupAuthors = [this.selectedGroup];
        this.isAuthorsDisabled = false;
      }
    }

    /**
     * This method is responsible for loading the list of authors. It joins the assembly 
     * members list and the currently selected working group members list, when contribution
     * type is PROPOSAL. Otherwise it returns the members of the assembly.
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

            if (self.isProposal) {
              return self.loadAuthors();
            } else {
              return self.assemblyMembers;
            }
          },
          function(error) {
            Notify.show('Error while trying to fetch assembly members from the server', 'error');
          }
        );
      }
      if (this.isProposal) {
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
    }

    /**
     * Sends the contribution to the backend.
     */
    function submit() {
      if (this.file.csv) {
        this.importContribution();
      } else {
        this.contributionSubmit();
      }
    }

    /**
     * Upload csv file.
     */
    function importContribution() {
      var self = this;
      var url = localStorageService.get('serverBaseUrl');
      url += '/assembly/{aid}/campaign/{cid}/contribution/import';
      url = url.replace('{aid}', this.assembly.assemblyId);
      url = url.replace('{cid}', this.campaign.campaignId);
      var fd = new FormData();
      fd.append('file', this.file.csv);
      fd.append('type', this.type);
      $http.post(url, fd, {
        headers: {
          'Content-Type': undefined
        },
        transformRequest: angular.identity
      }).then(
        function(response) {
          Notify.show('Contribution created', 'success');

          if (angular.isFunction(self.onSuccess)) {
            self.onSuccess();
          }
        },
        function(error) {
          Notify.show('Error while trying to save the contribution', 'error');
        }
      );
    }

    /**
     * Creates a new contribution.
     */
    function contributionSubmit() {
      var vm = this;
      if (this.contributionForm.$invalid) {
        return;
      }
      var rsp;

      if (this.mode === 'create') {
        rsp = Contributions.contributionInResourceSpace(this.campaign.resourceSpaceId).save(this.contribution).$promise;
      } else if (this.mode === 'edit') {
        rsp = Contributions.contribution(this.assembly.assemblyId, this.contribution.contributionId).update(this.contribution).$promise;
      } else {
        console.warn('Only create or edit are accepted mode in contribution form');
        return;
      }
      rsp.then(
        function(data) {
          Notify.show('Contribution saved', 'success');

          if (angular.isFunction(vm.onSuccess)) {
            vm.onSuccess();
          }
        },
        function(error) {
          Notify.show('Error while trying to save the contribution', 'error');
        }
      );
    }

    /**
     * handles nonmember-author-form directive's on-change event.
     */
    function updateNonMember(author) {
      this.contribution.nonMemberAuthor = author;
    }

    /**
     * In edit mode, we copy the given contribution a remove the properties that 
     * the PUT service does not need.
     */
    function flattenContribution() {
      var contribution = _.clone(this.contribution);
      contribution.existingThemes = contribution.existingThemes || [];
      delete contribution.themes;
      delete contribution.forum;
      delete contribution.attachments;
      delete contribution.stats;
      delete contribution.associatedMilestones;
      this.contribution = contribution;
    }
  }
}());