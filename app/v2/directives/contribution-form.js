(function () {
  'use strict';

  /**
   * @name contribution-form
   * @memberof directives
   *
   * @description
   *  Component that renders a contribution form.
   *
   * @example
   *
   *  <contribution-form></contribution-form>
   */
  appCivistApp
    .component('contributionForm', {
      selector: 'contributionForm',
      bindings: {
        campaign: '=?',

        // associates the given group with the contribution
        group: '=?',

        //supported values:  PROPOSAL | IDEA
        type: '@',

        // handler called when contribution creation has succeeded.
        // The function gets as a parameter the created contribution. An example of onSuccess callback is
        // function onSuccessCallback(contribution) { ... }
        onSuccess: '&',

        // in edit mode, the contribution to edit.
        contribution: '<',

        // edit | create, default value is create
        mode: '@',

        // campaign or current component configs
        configs: '=?',
      },
      controller: FormCtrl,
      controllerAs: 'vm',
      templateUrl: '/app/v2/partials/directives/contribution-form.html'
    });

  FormCtrl.$inject = [
    'WorkingGroups', 'localStorageService', 'Notify', 'Memberships', 'Campaigns',
    'Assemblies', 'Contributions', '$http', 'FileUploader', 'Space', '$q', '$timeout',
    '$filter', '$state', '$scope', '$stateParams', 'Captcha'
  ];

  function FormCtrl(WorkingGroups, localStorageService, Notify, Memberships,
    Campaigns, Assemblies, Contributions, $http, FileUploader, Space, $q, $timeout,
    $filter, $state, $scope, $stateParams, Captcha) {
    this.init = init.bind(this);
    this.initEdit = initEdit.bind(this);
    this.initCreate = initCreate.bind(this);
    this.verifyMembership = verifyMembership.bind(this);
    this.loadWorkingGroups = loadWorkingGroups.bind(this);
    this.loadThemes = loadThemes.bind(this);
    this.submit = submit.bind(this);
    this.loadAuthors = loadAuthors.bind(this);
    this.selectGroup = selectGroup.bind(this);
    this.disableAll = disableAll.bind(this);
    this.importContribution = importContribution.bind(this);
    this.contributionSubmit = contributionSubmit.bind(this);
    this.flattenContribution = flattenContribution.bind(this);
    this.getEditorOptions = getEditorOptions.bind(this);
    this.createAttachmentResource = createAttachmentResource.bind(this);
    this.uploadFile = uploadFile.bind(this);
    this.deleteAttachment = deleteAttachment.bind(this);
    this.loadFields = loadFields.bind(this);
    this.loadValues = loadValues.bind(this);
    this.loadCustomFields = loadCustomFields.bind(this);
    this.loadCampaign = loadCampaign.bind(this);
    this.saveFieldsValues = saveFieldsValues.bind(this);
    this.loadOfficialThemes = loadOfficialThemes.bind(this);
    this.loadEmergentThemes = loadEmergentThemes.bind(this);
    this.addNewAuthor = addNewAuthor.bind(this);
    this.deleteAuthor = deleteAuthor.bind(this);
    this.filterCustomFields = filterCustomFields.bind(this);
    this.setCaptchaResponse = setCaptchaResponse.bind(this);

    this.mode = this.mode || 'create';
    this.isEdit = this.mode === 'edit';
    this.isCreate = this.mode === 'create';
    this.addFile = false;
    this.isIdea = this.type === 'IDEA';
    this.isProposal = this.type === 'PROPOSAL';
    this.tmpAuthorIDCount = 0;


    this.$onInit = () => {
      if (this.mode === 'create') {
        this.initCreate()
      } else {
        this.initEdit();
      }
    };

    function initEdit() {
      var vm = this;

      if (!this.contribution) {
        $scope.$watch('vm.contribution', function (newVal) {
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

      if (!this.campaign) {
        $scope.$watch('vm.campaign', function (newVal) {
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
      // Example http://localhost:8000/#/v2/assembly/8/campaign/56c08723-0758-4319-8dee-b752cf8004e6
      var pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      this.file = {};
      this.coverPhotoStyle = {};
      this.coverPhotoSize = 2; // 2 MB
      this.contribution = this.contribution || {
        type: this.type,
        title: '',
        text: '',
        workingGroupAuthors: [],
        nonMemberAuthors: [],
        existingThemes: [],
        officialThemes: [],
        emergentThemes: [],
        sourceCode: '',
        attachments: [],
        location: {},
        status: this.isIdea ? 'PUBLISHED' : 'DRAFT',
        cover: {}
      };

      this.addNewAuthor(true);

      this.contribution.location = this.contribution.location || {};
      this.contribution.addedThemes = [];

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

      // TODO we should move the anonymous site to include the path of the assembly
      this.isAnonymous = false;
      if ($stateParams.cuuid && pattern.test($stateParams.cuuid)) {
        this.isAnonymous = true;
        this.campaignUUID = $stateParams.cuuid;
      } else {
        this.assembly = localStorageService.get('currentAssembly');
        this.user = localStorageService.get('user');
        this.recaptchaResponseOK = true;
      }
      this.values = {};
      this.tinymceOptions = this.getEditorOptions();

      if (this.user) {
        this.verifyMembership();
      }
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
      $scope.$watchCollection('vm.file', function (file) {
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
        images_upload_handler: function (blobInfo, success, failure) {
          var xhr, formData;
          xhr = new XMLHttpRequest();
          xhr.withCredentials = true;
          xhr.open('POST', FileUploader.uploadEndpoint());
          xhr.onload = function () {
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
        file_picker_callback: function (cb, value, meta) {
          var input = document.createElement('input');
          input.setAttribute('type', 'file');
          input.setAttribute('accept', 'image/*');
          $(input).bind('change', function () {
            var file = this.files[0];
            var id = 'blobid' + (new Date()).getTime();
            var blobCache = tinymce.activeEditor.editorUpload.blobCache;
            var blobInfo = blobCache.create(id, file);
            blobCache.add(blobInfo);
            cb(blobInfo.blobUri(), { title: file.name });
          });
          input.click();
          vm.$on('$destroy', function () {
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
          function (wg) {
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

    function loadOfficialThemes(query) {
      return this.loadThemes(query, 'OFFICIAL_PRE_DEFINED');
    }

    function loadEmergentThemes(query) {
      return this.loadThemes(query, 'EMERGENT');
    }

    /**
     * Gets themes from the backend.
     *
     * @param {String} query - el texto ingresado por el usuario
     * @param {String} type - el tipo de theme: OFFICIAL_PRE_DEFINED | EMERGENT
     */
    function loadThemes(query, type) {
      var campaignId;

      if (this.isCreate) {
        campaignId = this.campaign.campaignId;
      } else {
        campaignId = this.contribution.campaignIds[0];
      }

      if (this.isAnonymous) {
        campaignId = this.campaign.uuid;
        return Campaigns.themes(null, null, true, campaignId).then(themes => $filter('filter')(themes, { title: query, type }));
      } else {
        return Campaigns.themes(this.assembly.assemblyId, campaignId).then(themes => $filter('filter')(themes, { title: query, type }));
      }
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
          function (data) {
            self.assemblyMembers = _.filter(data, function (d) {
              return d.status === 'ACCEPTED';
            }).map(function (d) {
              return d.user;
            });
            return $filter('filter')(self.assemblyMembers, { name: query });
          },
          function (error) {
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
        function (response) {
          Notify.show('Contribution created', 'success');

          if (angular.isFunction(self.onSuccess)) {
            self.onSuccess();
          }
        },
        function (error) {
          Notify.show('Error while trying to save the contribution', 'error');
        }
        );
    }

    /**
     * Upload the given file to the server. Also, attachs it to
     * the current contribution.
     * 
     * @param {Object} file - The file to upload.
     * @param {string} type - cover | attachment.
     */
    function uploadFile(file, type) {
      Pace.stop();
      Pace.start();
      let fd = new FormData();
      //fd.append('file', this.newAttachment.file);
      fd.append('file', file);

      $http.post(FileUploader.uploadEndpoint(), fd, {
        headers: {
          'Content-Type': undefined
        },
        transformRequest: angular.identity,
      }).then(response => {
        Pace.stop();
        if (type === 'attachment') {
          this.createAttachmentResource(response.data.url);
        } else if (type === 'cover') {
          this.contribution.cover = {
            url: response.data.url,
            name: response.data.name
          };
          this.coverPhotoStyle = { 'background-image': `url(${this.contribution.cover.url})` };
        }
      }, function (error) {
        Pace.stop();
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
      let payload = _.cloneDeep(this.contribution);
      payload.existingThemes = payload.officialThemes;
      payload.emergentThemes.forEach(t => {

        if (angular.isNumber(t.themeId)) {
          payload.existingThemes.push(t);
        } else {
          // is a temporary ID, delete it.
          delete t.themeId;
        }
      });
      payload.emergentThemes = payload.emergentThemes.filter(t => t.themeId === undefined);
      payload.nonMemberAuthors.forEach(nma => delete nma.tmpId);
      // we save a reference to the authors list with their custom fields values.
      this.nonMemberAuthorsRef = payload.nonMemberAuthors;

      if ($scope.contributionForm.$invalid) {
        Notify.show('The form is invalid: you must fill all required values', 'error');
        return;
      }
      Pace.stop();
      Pace.start();
      let rsp;

      if (this.mode === 'create') {
        if (this.isAnonymous) {
          rsp = Contributions.contributionInResourceSpaceByUUID(this.campaign.resourceSpaceUUID).save(payload).$promise.then(
            contribution => this.saveFieldsValues(contribution).then(response => contribution),
            error => Notify.show('Error while trying to save the contribution', 'error')
          );
        } else {
          rsp = Contributions.contributionInResourceSpace(this.campaign.resourceSpaceId).save(payload).$promise.then(
            contribution => this.saveFieldsValues(contribution).then(response => contribution),
            error => Notify.show('Error while trying to save the contribution', 'error')
          );
        }
      } else if (this.mode === 'edit') {
        rsp = $q.all([
          Contributions.contribution(this.assembly.assemblyId, this.contribution.contributionId).update(payload).$promise,
          this.saveFieldsValues(this.contribution),
        ]);
      } else {
        console.warn('Only create or edit are accepted mode in contribution form');
        return;
      }

      rsp.then(
        data => {
          Pace.stop();
          Notify.show('Contribution saved', 'success');

          if (angular.isFunction(vm.onSuccess)) {
            vm.onSuccess({ contribution: data });
          }
        },
        error => {
          Pace.stop();
          Notify.show('Error while trying to save the contribution', 'error');
        }
      );
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
      let rsp = {};
      if (this.isAnonymous) {
        rsp = Space.fieldsPublic(sid).query().$promise;
      } else {
        rsp = Space.fields(sid).query().$promise;
      }

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
      let rsp = {};
      if (this.isAnonymous) {
        rsp = Space.fieldValue(sid).query().$promise;
      } else {
        rsp = Space.fieldValuePublice(sid).query().$promise;
      }
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
     * @param {Object} contribution - the created contribution.
     */
    function saveFieldsValues(contribution) {
      const sid = contribution.resourceSpaceId
      let rsp;
      let payload = {
        customFieldValues: []
      };
      angular.forEach(this.values, value => payload.customFieldValues.push(value));

      // we need to save authors custom fields too.
      contribution.nonMemberAuthors.forEach(nma => {
        let ref = _.find(this.nonMemberAuthorsRef, { email: nma.email, name: nma.name });
        _.forIn(ref.customFieldValues, cfv => {
          let value = cfv.value;
          // if it corresponds to a multiple choice field, store each selected option as a custom value.
          if (!angular.isArray(value)) {
            value = [value];
          }
          value.forEach(v => payload.customFieldValues.push({
            customFieldDefinition: cfv.customFieldDefinition,
            value: v.value,
            entityTargetType: 'NON_MEMBER_AUTHOR',
            entityTargetUuid: nma.uuid,
          }));
        });
      });

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
      if (this.isAnonymous) {
        this.campaignResourceSpaceId = this.campaign.resourceSpaceUUID;
        this.componentResourceSpaceId = currentComponent.resourceSpaceUUID;
      } else {
        this.campaignResourceSpaceId = this.campaign.resourceSpaceId;
        this.componentResourceSpaceId = currentComponent.resourceSpaceId;
      }

      this.loadFields(this.campaignResourceSpaceId).then(fields => {
        $timeout(() => {
          this.campaignFields = this.filterCustomFields(fields);
          $scope.$digest();
        });
      });
      this.loadFields(this.componentResourceSpaceId).then(fields => {
        $timeout(() => {
          this.componentFields = this.filterCustomFields(fields);
          $scope.$digest();
        });
      });

      if (this.isEdit) {
        this.loadValues(this.contribution.resourceSpaceId);
      }
    }

    /**
     * Add a new author to the list of non-member authors.
     *
     * @param {boolean} prefill - true to prefill form data with current user information
     */
    function addNewAuthor(prefill) {
      let author = {
        tmpId: `tmp-${this.tmpAuthorIDCount++}`,
        isOpen: true
      };

      if (prefill) {
        const isCoordinator = !this.isAnonymous || Memberships.isAssemblyCoordinator(this.assembly.assemblyId);
        const isModerator = !this.isAnonymous || Memberships.rolIn('assembly', this.assembly.assemblyId, 'MODERATOR');

        if (!isCoordinator && !isModerator && !this.isAnonymous) {
          let user = localStorageService.get('user');
          author.name = user.name;
          author.email = user.email;
        }
      }
      this.contribution.nonMemberAuthors.forEach(nma => nma.isOpen = false);
      this.contribution.nonMemberAuthors.push(author);
    }

    /**
     * Deletes the given author from the array of contribution authors.
     *
     * @param {Object} author
     */
    function deleteAuthor(author) {
      _.remove(this.contribution.nonMemberAuthors, { tmpId: author.tmpId });
    }

    /**
     * Filter the given custom fields array based on the contribution type.
     *
     * @param {Object[]} fields
     */
    function filterCustomFields(fields) {
      return fields.filter(f => f.entityType === 'CONTRIBUTION' &&
        f.entityFilterAttributeName === 'type' &&
        f.entityFilter === this.type);
    }


    /**
     * Recaptcha on-success handler.
     *
     * @param {string} recaptchaResponse - the hashed recaptcha response.
     */
    function setCaptchaResponse(recaptchaResponse) {
      Captcha.verify(recaptchaResponse).then(response => this.recaptchaResponseOK = response && response.success,
        response => {
          this.recaptchaResponseOK = false;
          const msg = response.data ? response.data.statusMessage : response.statusText;
          Notify.show('Error while validating captcha response: ' + msg, 'error');
        }
      );
    }
  }
}());