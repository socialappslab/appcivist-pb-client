(function() {
  'use strict';

  appCivistApp
    .directive('contributionProposalForm', ContributionProposalForm);

  ContributionProposalForm.$inject = [
    'WorkingGroups', 'localStorageService', 'Notify', 'Memberships', 'Campaigns',
    'Assemblies', 'Contributions', '$http', 'FileUploader', 'Space', '$q', '$timeout',
    '$filter', '$state'
  ];

  function ContributionProposalForm(WorkingGroups, localStorageService, Notify, Memberships,
    Campaigns, Assemblies, Contributions, $http, FileUploader, Space, $q, $timeout,
    $filter, $state) {

    FormCtrl.$inject = ['$scope'];

    return {
      restrict: 'E',
      scope: {
        campaign: '=?',

        // associates the given group with the contribution
        group: '=?',

        //supported values:  PROPOSAL | IDEA
        type: '@',

        // handler called when contribution creation has succeeded. 
        // The function gets as a parameter the created contribution. An example of onSuccess callback is
        // function onSuccessCallback(contribution) { ... }
        onSuccess: '&',

        contribution: '<',

        // edit | create, default value is create
        mode: '@',

        // campaign or current component configs
        configs: '=?',

        // logged in user, null if is anonymous
        user: '='
      },
      templateUrl: '/app/v2/partials/directives/contribution-proposal-form.html',
      controllerAs: 'vm',
      controller: FormCtrl
    };


    function FormCtrl($scope) {
      this.init = init.bind(this);
      this.initEdit = initEdit.bind(this);
      this.initCreate = initCreate.bind(this);
      this.verifyMembership = verifyMembership.bind(this);
      this.loadWorkingGroups = loadWorkingGroups.bind(this);
      this.loadThemes = loadThemes.bind(this);
      this.submit = submit.bind(this);
      this.loadAuthors = loadAuthors.bind(this);
      this.selectGroup = selectGroup.bind(this);
      this.updateNonMember = updateNonMember.bind(this);
      this.disableAll = disableAll.bind(this);
      this.importContribution = importContribution.bind(this);
      this.contributionSubmit = contributionSubmit.bind(this);
      this.flattenContribution = flattenContribution.bind(this);
      this.getEditorOptions = getEditorOptions.bind(this);
      this.createAttachmentResource = createAttachmentResource.bind(this);
      this.submitAttachment = submitAttachment.bind(this);
      this.deleteAttachment = deleteAttachment.bind(this);
      this.loadFields = loadFields.bind(this);
      this.loadValues = loadValues.bind(this);
      this.loadCustomFields = loadCustomFields.bind(this);
      this.loadCampaign = loadCampaign.bind(this);
      this.saveFieldsValues = saveFieldsValues.bind(this);

      this.assembly = localStorageService.get('currentAssembly');
      this.mode = $scope.mode || 'create';
      this.isEdit = this.mode === 'edit';
      this.isCreate = this.mode === 'create';
      this.addFile = false;
      this.type = $scope.type;
      this.onSuccess = $scope.onSuccess;
      this.contribution = $scope.contribution;
      this.campaign = $scope.campaign;
      this.group = $scope.group;
      this.configs = $scope.configs;

      if (this.mode === 'create') {
        this.initCreate()
      } else {
        this.initEdit();
      }

      function initEdit() {
        var vm = this;

        if (!$scope.contribution) {
          $scope.$watch('contribution', function(newVal) {
            if (newVal) {
              vm.contribution = newVal;
              vm.init();
            }
          });
        } else {
          this.init();
        }
      }

      function initCreate() {
        var vm = this;

        if (!$scope.campaign) {
          $scope.$watch('campaign', function(newVal) {
            if (newVal) {
              vm.campaign = newVal;
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
          sourceCode: '',
          attachments: [],
          location: {},
          status: 'NEW'
        };

        this.contribution.location = this.contribution.location || {};
        this.contribution.addedThemes = [];
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
        this.values = {};
        this.tinymceOptions = this.getEditorOptions();
        if (this.user) this.verifyMembership();
        this.hiddenFieldsMap = {};
        let hiddenFields = typeof this.configs === "string" ? JSON.parse(this.configs) : this.configs || [];
        hiddenFields.forEach(hf => this.hiddenFieldsMap[hf] = true);

        if (this.isCreate) {
          this.loadWorkingGroups();
          this.loadCustomFields();
        } else if (this.isEdit) {
          this.loadCampaign(this.contribution.campaignIds[0]).then(response => this.loadCustomFields());
        }
        var self = this;
        // setup listener for upload field
        $scope.$watchCollection('vm.file', function(file) {
          if (file.csv) {
            self.disableAll();
          }
        });
      }


      function getEditorOptions() {
        var vm = this;
        return {
          height: 400,
          max_chars: 200,
          plugins: [
          'advlist autolink lists link image charmap print preview anchor',
          'searchreplace visualblocks code fullscreen',
          'insertdatetime media table contextmenu paste imagetools'
        ],
          toolbar: 'insertfile undo redo | styleselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image',
          images_upload_credentials: true,
          image_advtab: true,
          image_title: true,
          statusbar: false,
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
       * Load available working groups for current assembly. If a group
       * is passed as an attribute, we set that as the working group for the
       * contribution.
       */
      function loadWorkingGroups() {
        if (this.group) {
          this.disableGroupSelection = true;
          this.selectedGroup = this.group;
          this.groups = [this.group];
          this.selectGroup();
        } else {
          let wgs = localStorageService.get('myWorkingGroups') || [];
          let currentCampaign = localStorageService.get('currentCampaign');
          let campaignID = currentCampaign.campaignId;
          let groups = wgs ? wgs.filter(
            function(wg) {
              return wg && wg.campaigns && wg.campaigns[0] === campaignID || !wg.campaigns;
            }) : wgs;
          let topicWgs = localStorageService.get('topicsWorkingGroups');
          if (topicWgs) {
            groups = groups.concat(topicWgs);
          }

          let otherWgs = localStorageService.get('otherWorkingGroups');
          if (otherWgs) {
            groups = groups.concat(otherWgs);
          }

          this.groups = groups;
        }
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
        return Campaigns.themes(this.assembly.assemblyId, campaignId).then(themes => $filter('filter')(themes, { title: query }));
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
       * This method is responsible for loading the list of authors. It simply loads the members of
       * the current assembly.
       *
       * @param {string} query - current search query
       */
      function loadAuthors(query) {
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
              return $filter('filter')(self.assemblyMembers, { name: query });
            },
            function(error) {
              Notify.show('Error while trying to fetch assembly members from the server', 'error');
            }
          );
        } else {
          return $filter('filter')(self.assemblyMembers, { name: query });
        }
      }

      /**
       * Sends the contribution to the backend.
       */
      function submit() {
        if (this.file.csv) {
          this.importContribution();
        } else {
          if (this.isEdit) {
            this.flattenContribution();
          }
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
       * Upload the given file to the server. Also, attachs it to
       * the current contribution.
       */
      function submitAttachment() {
        var vm = this;
        var fd = new FormData();
        fd.append('file', this.newAttachment.file);
        $http.post(FileUploader.uploadEndpoint(), fd, {
          headers: {
            'Content-Type': undefined
          },
          transformRequest: angular.identity,
        }).then(function(response) {
          vm.createAttachmentResource(response.data.url);
        }, function(error) {
          Notify.show('Error while uploading file to the server', 'error');
        });
      }

      /**
       * After the file has been uploaded, we should relate it with the contribution.
       *
       * @param {string} url - The uploaded file's url.
       */
      function createAttachmentResource(url) {
        var vm = this;
        var attachment = Contributions.newAttachmentObject({ url: url, name: this.newAttachment.name });
        if (!this.contribution.attachments) {
          this.contribution.attachments = [];
        }
        this.contribution.attachments.push(attachment);
        this.addFile = false;
        this.newAttachment.name = "";
        this.newAttachment.file = undefined;
      }

      /**
       * Creates a new contribution.
       */
      function contributionSubmit() {
        var vm = this;
        if ($scope.contributionForm.$invalid) {
          Notify.show('The form is invalid: you must fill all required values', 'error');
          return;
        }
        let rsp;

        if (this.mode === 'create') {
          rsp = Contributions.contributionInResourceSpace(this.campaign.resourceSpaceId).save(this.contribution).$promise.then(
            contribution => this.saveFieldsValues(contribution.resourceSpaceId).then(response => contribution),
            error => Notify.show('Error while trying to save the contribution', 'error')
          );
        } else if (this.mode === 'edit') {
          rsp = $q.all([
          Contributions.contribution(this.assembly.assemblyId, this.contribution.contributionId).update(this.contribution).$promise,
          this.saveFieldsValues(this.contribution.resourceSpaceId),
        ]);
        } else {
          console.warn('Only create or edit are accepted mode in contribution form');
          return;
        }

        rsp.then(
          data => {
            Notify.show('Contribution saved', 'success');

            if (angular.isFunction(vm.onSuccess)) {
              vm.onSuccess({ contribution: data });
            }
          },
          error => Notify.show('Error while trying to save the contribution', 'error')
        );
      }

      /**
       * handles nonmember-author-form directive's on-change event.
       */
      function updateNonMember(author) {
        this.contribution.nonMemberAuthor = author;
      }

      /**
       * In edit mode, we copy the given contribution and remove the properties that
       * the PUT service does not need.
       */
      function flattenContribution() {
        var contribution = _.clone(this.contribution);
        delete contribution.themes;
        delete contribution.forum;
        delete contribution.attachments;
        delete contribution.stats;
        delete contribution.campaignIds;
        delete contribution.associatedMilestones;
        delete contribution.workingGroupAuthors;
        delete contribution.extendedTextPad;
        this.contribution = contribution;
      }

      function deleteAttachment(item) {
        var index = this.contribution.attachments.indexOf(item)
        this.contribution.attachments.splice(index, 1);
      }

      /**
       * Loads contribution's custom fields.
       *
       * @param {number} sid - resource space ID
       */
      function loadFields(sid) {
        let rsp = Space.fields(sid).query().$promise;
        return rsp.then(
          fields => fields,
          error => {
            Notify.show('Error while trying to get fields from resource space', 'error');
          }
        );
      }

      /**
       * Loads contribution's custom fields values.
       *
       * @param {number} sid - resource space ID
       */
      function loadValues(sid) {
        let rsp = Space.fieldValue(sid).query().$promise;
        return rsp.then(
          fieldsValues => {
            fieldsValues.forEach(v => this.values[v.customFieldDefinition.customFieldDefinitionId] = v);
          },
          error => {
            Notify.show('Error while trying to get field values from resource space', 'error');
          }
        );
      }

      /**
       * Updates custom field values.
       *
       * @param {number} sid - resource space ID
       */
      function saveFieldsValues(sid) {
        let rsp;
        let payload = {
          customFieldValues: []
        };

        angular.forEach(this.values, value => payload.customFieldValues.push(value));
        if (this.mode === 'create') {
          rsp = Space.fieldsValues(sid).save(payload).$promise;
        } else {
          rsp = Space.fieldsValues(sid).update(payload).$promise;
        }
        return rsp;
      }

      /**
       * Loads the campaign from the server.
       *
       * @param {number} cid - campaign ID.
       */
      function loadCampaign(cid) {
        let vm = this;
        let rsp = Campaigns.campaign(this.assembly.assemblyId, cid).get().$promise;
        return rsp.then(
          campaign => {
            vm.campaign = campaign;
            return campaign
          },
          error => Notify.show('Error while trying to get campaign from server', 'error')
        );
      }


      function loadCustomFields() {
        let currentComponent = localStorageService.get('currentCampaign.currentComponent');
        this.currentComponent = currentComponent;
        this.campaignResourceSpaceId = this.campaign.resourceSpaceId;
        this.componentResourceSpaceId = currentComponent.resourceSpaceId;
        // TODO: sometimes the fields do not appear. Need to find out why.

        this.loadFields(this.campaign.resourceSpaceId).then(fields => {
          $timeout(() => {
            this.campaignFields = fields;
            $scope.$digest();
          });
        });
        this.loadFields(this.currentComponent.resourceSpaceId).then(fields => {
          $timeout(() => {
            this.componentFields = fields;
            $scope.$digest();
          });
        });

        if (this.isEdit) {
          this.loadValues(this.contribution.resourceSpaceId);
        }
      }
    }
  }
}());