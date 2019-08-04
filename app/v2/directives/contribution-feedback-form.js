(function() {
  'use strict';

  /**
   * Component that displays contribution feedback form.
   */
  appCivistApp
    .component('contributionFeedbackForm', {
      selector: 'contributionFeedbackForm',
      bindings: {
        /**
         * @param {object} contribution - The contribution object
         */
        contribution: '=',
        onlyFeedback: '=',
        onSuccess: '&'
      },
      templateUrl: '/app/v2/partials/directives/contribution-feedback-form.html',
      controller: ContributionFeedbackFormCtrl,
      controllerAs: 'vm'
    });

  ContributionFeedbackFormCtrl.$inject = [
    'Contributions', 'localStorageService', 'Memberships', 'Notify', '$scope', 'FileUploader',
    'RECAPTCHA_KEY', 'Captcha', 'Space', '$timeout'
  ];

  function ContributionFeedbackFormCtrl(Contributions, localStorageService, Memberships, Notify,
    $scope, FileUploader, RECAPTCHA_KEY, Captcha, Space, $timeout) {
    var vm = this;
    this.selectGroup = selectGroup.bind(this);
    this.loadGroups = loadGroups.bind(this);
    this.loadTypes = loadTypes.bind(this);
    this.verifyMembership = verifyMembership.bind(this);
    this.selectType = selectType.bind(this);
    this.submit = submit.bind(this);
    this.getEditorOptions = getEditorOptions.bind(this);
    this.loadFeedback = loadFeedback.bind(this);
    this.loadEmptyFeedback = loadEmptyFeedback.bind(this);
    this.validateCaptchaResponse = validateCaptchaResponse.bind(this);
    this.setCaptchaResponse = setCaptchaResponse.bind(this);
    this.updateNonMember = updateNonMember.bind(this);
    this.loadCustomFields = loadCustomFields.bind(this);
    this.loadFields = loadFields.bind(this);
    this.hideFields = hideFields.bind(this);
    this.saveFieldsValues = saveFieldsValues.bind(this);
    this.loadValues = loadValues.bind(this);
    this.hiddenFieldsMap = {};
    this.recaptchaResponse = {};
    this.values = {};

    this.$onInit = function() {
      vm.isAnonymous = !vm.contribution.contributionId;
      vm.feedback = vm.loadEmptyFeedback();
      vm.recaptchaResponseOK = false;

      vm.userIsMember = !vm.isAnonymous;

      if (!vm.isAnonymous) {
        vm.assembly = localStorageService.get('currentAssembly');
      } else {
        vm.assembly = {};
      }
      vm.campaign = localStorageService.get('currentCampaign');
      vm.hideFields(vm.campaign);
      vm.allowFeedback();

      vm.sliderOptions = {
        floor: 0,
        ceil: 4,
        showTicksValues: true
      };
      vm.tinymceOptions = vm.getEditorOptions();

      if (this.onlyFeedback) {
        this.feedback = this.onlyFeedback;
      } else {
        if (!vm.isAnonymous) {
          vm.verifyMembership();
          vm.loadFeedback();
        } else {
          vm.userIsCoordinator = false;
          vm.userIsWGCoordinator = false;
        }
        vm.loadGroups();
        vm.loadTypes();
        vm.loadCustomFields();

        $scope.$watch('vm.isEdit', isEdit => {
          if (isEdit) {
            vm.loadValues(this.contribution.resourceSpaceId);
          }
        });
      }
    };

    /** Reuturn a default empty feedback */
    function loadEmptyFeedback() {
      var feedback = {
        need: 0,
        benefit: 0,
        feasibility: 0,
        textualFeedback: '',
        status: 'PRIVATE',
        type: 'MEMBER'
      };

      if (this.isAnonymous) {
        feedback.type = "TECHNICAL_ASSESSMENT";
        feedback.nonMemberAuthor = {};
      }
      return feedback;
    }
    /**
     * working group ng-change handler.
     */
    function selectGroup() {
      if (this.selectedGroup) {
        if (!this.isAnonymous) {
          this.feedback.workingGroupId = this.selectedGroup.groupId;
          this.loadFeedback();
        } else {
          this.feedback.workingGroupUuid = this.selectedGroup.uuid;
        }
      } else {
        delete this.feedback.workingGroupId;
      }
    }

    /**
     * type ng-change handler.
     */
    function selectType() {
      if (this.selectedType) {
        if (!this.isAnonymous) {
          this.feedback.type = this.selectedType.value;
        } else {
          this.feedback.type = "TECHNICAL_ASSESSMENT";
        }
      }
    }

    /**
     * Responsible for loading the working groups this form needs.
     */
    function loadGroups() {
      var wgAuthors = this.contribution.workingGroupAuthors;

      if (wgAuthors && wgAuthors.length) {
        this.proposalGroup = wgAuthors[0];
        if (!this.isAnonymous) {
          this.userIsMember = Memberships.rolIn('group', this.proposalGroup.groupId, 'MEMBER');
        }

        if (this.userIsMember) {
          // the user giving feedback is a member of the proposal's working group
          // in this case, we directly assign groupId to the feedback object.
          this.feedback.workingGroupId = this.proposalGroup.groupId;
        } else {
          this.groups = wgAuthors;
        }
      }
    }

    function loadTypes() {
      let types = [];
      types.push({ value: 'TECHNICAL_ASSESSMENT', text: 'Technical feedback' });
      this.types = types;
      this.selectedType = types[0];
    }

    function verifyMembership() {
      this.userIsCoordinator = Memberships.rolIn('assembly', this.assembly.assemblyId, 'COORDINATOR');

      if (this.proposalGroup) {
        this.userIsWGCoordinator = Memberships.rolIn('group', this.proposalGroup.groupId, 'COORDINATOR');
      }
    }

    function submit() {
      var vm = this;
      var payload = _.clone(this.feedback);
      ['need', 'benefit', 'feasibility'].forEach(function(score) {
        if (payload[score] === 0) {
          delete payload[score];
        }
      });
      delete payload.id;

      if (this.isAnonymous) {
        var feedback = Contributions.userFeedbackAnonymous(this.campaign.uuid, this.contribution.uuid).update(payload);
      } else {
        var feedback = Contributions.userFeedback(this.assembly.assemblyId, this.campaign.campaignId, this.contribution.contributionId).update(payload);
      }

      feedback.$promise.then(
        newStats => {
          if (!this.isAnonymous) {
            // currently, field values are for authenticated users only.
            this.saveFieldsValues(this.contribution.resourceSpaceId).then(
              response => successCallback(newStats),
              error => Notify.show(error.statusMessage, 'error')
            );
          } else {
            successCallback(newStats);
          }
        },
        function() {
          Notify.show('Error while updating user feedback', 'error');
        }
      );

      function successCallback(newStats) {
        vm.contribution.stats = newStats;
        vm.onSuccess();
        $translate('Changed saved').then(
          successMsg => {
             Notify.show(successMsg, 'success');
          }
        );
        //Notify.show('Operation succeeded', 'success');
      }
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
        statusbar: false,
        automatic_uploads: true,
        file_picker_types: 'image',
        imagetools_cors_hosts: ['s3-us-west-1.amazonaws.com'],
        images_upload_handler: function(blobInfo, success, failure) {
          var xhr, formData;
          xhr = new XMLHttpRequest();
          xhr.withCredentials = true;
          xhr.open('POST', FileUploader.uploadEndpoint());
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
     * Load the user's feedback if there is any.
     */
    function loadFeedback() {
      if (this.feedback.workingGroupId) {
        var rsp = Contributions.userFeedbackWithGroupId(this.assembly.assemblyId,
            this.feedback.workingGroupId, this.contribution.contributionId)
          .query({ type: this.feedback.type }).$promise;
      } else {
        var rsp = Contributions.userFeedbackNoCampaignId(this.assembly.assemblyId, this.contribution.contributionId)
          .query({ type: this.feedback.type }).$promise;
      }
      var vm = this;
      rsp.then(
        function(feedbacks) {
          if (feedbacks && feedbacks.length > 0) {
            vm.feedback = feedbacks[0];
            vm.isEdit = true;
          } else if (vm.feedback) {
            var selectedType = vm.feedback.type;
            var selectedWorkingGroupId = vm.feedback.workingGroupId;
            vm.feedback = vm.loadEmptyFeedback();
            vm.feedback.type = selectedType ? selectedType : vm.feedback.type;
            vm.feedback.workingGroupId = selectedWorkingGroupId ? selectedWorkingGroupId : vm.feedback.workingGroupId;
          } else {
            vm.feedback = vm.loadEmptyFeedback();
          }
        },
        function() {
          Notify.show('Error while get user feedback from the server', 'error');
        })
    }

    /**
     * handles nonmember-author-form directive's on-change event.
     */
    function updateNonMember(author) {
      this.feedback.nonMemberAuthor = author;
    }

    /**
     * Recaptcha on-success handler. This is used in comment form.
     *
     * @param {object} discussion - the discussion associated with the comment form.
     * @param {string} response - the hashed recaptcha response.
     */
    function setCaptchaResponse(vm, response) {
      vm.recaptchaResponse = response;
      vm.validateCaptchaResponse(vm);
    }

    /**
     * Verify that user response is correct.
     *
     * @param {object} target - element with recaptchaResponse and recaptchaResponseOK properties.
     */
    function validateCaptchaResponse(vm) {
      Captcha.verify(vm.recaptchaResponse).then(
        function(response) {
          vm.recaptchaResponseOK = response && response.success;
        },
        function(response) {
          vm.recaptchaResponseOK = false;
          var msg = response.data ? response.data.statusMessage : response.statusText;
          Notify.show('Error while validating captcha response: ' + msg, 'error');
        }
      );
    }

    /**
     * Loads contribution's custom fields. We only consider fields of type CONTRIBUTION_FEEDBACK.
     *
     * @param {number} sid - resource space ID
     */
    function loadFields(sid) {
      let rsp = Space.fields(sid).query().$promise;
      return rsp.then(
        fields => fields.filter(f => f.entityType === 'CONTRIBUTION_FEEDBACK'),
        error => {
          Notify.show(error.statusMessage, 'error');
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
          Notify.show(error.statusMessage, 'error');
        }
      );
    }

    function loadCustomFields() {
      let currentComponent = localStorageService.get('currentCampaign.currentComponent');
      this.currentComponent = currentComponent;
      this.campaignResourceSpaceId = this.campaign.resourceSpaceId;
      this.componentResourceSpaceId = currentComponent.resourceSpaceId;

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
    }

    /**
     * If the given campaign has appcivisti.campaign.feedback.hidden-fields, hide them.
     *
     * @param {Object} campaign
     */
    function hideFields(campaign) {
      if (!campaign.configs) {
        return;
      }
      let hiddenFields = campaign.configs.filter(c => c.key === 'appcivist.campaign.feedback.hidden-fields').map(c => c.value);

      if (hiddenFields.length === 0) {
        return;
      }
      hiddenFields = JSON.parse(hiddenFields[0]);
      hiddenFields.forEach(hf => this.hiddenFieldsMap[hf] = true);
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

      if (this.isEdit) {
        rsp = Space.fieldsValues(sid).update(payload).$promise;
      } else {
        rsp = Space.fieldsValues(sid).save(payload).$promise;
      }
      return rsp;
    }
  }
}());
