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
        onSuccess: '&'
      },
      templateUrl: '/app/v2/partials/directives/contribution-form.html',
      link: function(scope, element, attrs) {
        scope.init = init.bind(scope);
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
        scope.getEditorOptions = getEditorOptions.bind(scope);
        scope.contribution = {};
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
      this.file = {};
      this.contribution = {
        type: this.type,
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
      this.isProposal = this.type === 'PROPOSAL';
      this.isIdea = this.type === 'IDEA';
      this.isAuthorsDisabled = this.isProposal;
      this.assembly = localStorageService.get('currentAssembly');
      this.tinymceOptions = this.getEditorOptions();
      this.verifyMembership();
      this.loadWorkingGroups();
      var self = this;
      // setup listener for upload field
      this.$watchCollection('file', function(file) {
        if (file.csv) {
          self.disableAll();
        }
      });
    }


    function getEditorOptions() {
      var vm = this;
      return {
        height: 400,
        plugins: [
          'advlist autolink lists link image charmap print preview anchor',
          'searchreplace visualblocks code fullscreen',
          'insertdatetime media table contextmenu paste imagetools'
        ],
        toolbar: 'insertfile undo redo | styleselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image',
        images_upload_credentials: true,
        image_advtab: true,
        image_title: true,
        automatic_uploads: true,
        file_picker_types: 'image',
        imagetools_cors_hosts: ['s3-us-west-1.amazonaws.com'],
        images_upload_handler: function(blobInfo, success, failure) {
          var xhr, formData;
          xhr = new XMLHttpRequest();
          xhr.withCredentials = true;
          xhr.open('POST', servs.FileUploader.uploadEndpoint());
          xhr.onload = function() {
            var json;

            if (xhr.status != 200) {
              failure('HTTP Error: ' + xhr.status);
              return;
            }
            json = JSON.parse(xhr.responseText);

            if (!json || typeof json.url != 'string') {
              failure('Invalid JSON: ' + xhr.responseText);
              return;
            }
            success(json.url);
          };
          formData = new FormData();
          console.log('blob info', blobInfo);
          formData.append('file', blobInfo.blob());
          xhr.send(formData);
        },
        file_picker_callback: function(cb, value, meta) {
          var input = document.createElement('input');
          input.setAttribute('type', 'file');
          input.setAttribute('accept', 'image/*');
          $(input).bind('change', function() {
            var file = this.files[0];
            var id = 'blobid' + (new Date()).getTime();
            var blobCache = tinymce.activeEditor.editorUpload.blobCache;
            var blobInfo = blobCache.create(id, file);
            blobCache.add(blobInfo);
            cb(blobInfo.blobUri(), { title: file.name });
          });
          input.click();
          vm.on('$destroy', function() {
            $(input).unbind('change');
          });
        }
      };
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
      if (!this.campaign) {
        return;
      }
      return Campaigns.themes(this.assembly.assemblyId, this.campaign.campaignId);
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
      if (this.contributionForm.$invalid) {
        return;
      }
      var rsp = Contributions.contributionInResourceSpace(this.campaign.resourceSpaceId).save(this.contribution).$promise;
      rsp.then(
        function(data) {
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
     * handles nonmember-author-form directive's on-change event.
     */
    function updateNonMember(author) {
      this.contribution.nonMemberAuthor = author;
    }
  }
}());
