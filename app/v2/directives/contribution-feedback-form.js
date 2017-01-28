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
        close: '&'
      },
      templateUrl: '/app/v2/partials/directives/contribution-feedback-form.html',
      controller: ContributionFeedbackFormCtrl,
      controllerAs: 'vm'
    });

  ContributionFeedbackFormCtrl.$inject = [
    'Contributions', 'localStorageService', 'Memberships', 'Notify', '$scope', 'FileUploader'
  ];
  var servs = {};

  function ContributionFeedbackFormCtrl(Contributions, localStorageService, Memberships, Notify,
    $scope, FileUploader) {
    var vm = this;
    servs.Memberships = Memberships;
    servs.Contributions = Contributions;
    servs.Notify = Notify;
    servs.FileUploader = FileUploader;
    this.selectGroup = selectGroup.bind(this);
    this.loadGroups = loadGroups.bind(this);
    this.loadTypes = loadTypes.bind(this);
    this.verifyMembership = verifyMembership.bind(this);
    this.selectType = selectType.bind(this);
    this.submit = submit.bind(this);
    this.getEditorOptions = getEditorOptions.bind(this);
    this.loadFeedback = loadFeedback.bind(this);

    this.$onInit = function() {
      vm.feedback = {
        need: 0,
        benefit: 0,
        feasibility: 0,
        textualFeedback: '',
        status: 'PRIVATE',
        type: 'MEMBER'
      };
      vm.assembly = localStorageService.get('currentAssembly');
      vm.sliderOptions = {
        floor: 0,
        ceil: 4,
        showTicksValues: true
      };
      vm.tinymceOptions = vm.getEditorOptions();
      vm.loadGroups();
      vm.verifyMembership();
      vm.loadTypes();
      vm.loadFeedback();
    };
  }

  /**
   * working group ng-change handler.
   */
  function selectGroup() {
    if (this.selectedGroup) {
      this.feedback.workingGroupId = this.selectedGroup.groupId;
    }
  }

  /**
   * type ng-change handler.
   */
  function selectType() {
    if (this.selectedType) {
      this.feedback.type = this.selectedType.value;
    }
  }

  /**
   * Responsible for loading the working groups this form needs.
   */
  function loadGroups() {
    var wgAuthors = this.contribution.workingGroupAuthors;

    if (wgAuthors && wgAuthors.length) {
      this.proposalGroup = wgAuthors[0];
      this.userIsMember = servs.Memberships.rolIn('group', this.proposalGroup.groupId, 'MEMBER');

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
    var types = [
      { value: 'MEMBER', text: 'Member feedback' },
      { value: 'WORKING_GROUP', text: 'Working group official feedback' }
    ];

    if (this.userIsCoordinator) {
      types.push({ value: 'TECHNICAL_ASSESSMENT', text: 'Technical feedback' });
    }
    this.types = types;
    this.selectedType = types[0];
  }

  function verifyMembership() {
    this.userIsCoordinator = servs.Memberships.rolIn('assembly', this.assembly.assemblyId, 'COORDINATOR');

    if (this.proposalGroup) {
      this.userIsWGCoordinator = servs.Memberships.rolIn('group', this.proposalGroup.groupId, 'COORDINATOR');
    }
  }

  function submit() {
    var vm = this;
    var payload = _.clone(this.feedback);
    ['need', 'benefit', 'feasibility'].forEach(function(score) {
      if (payload[score] === 0) {
        delete payload[score];
      }
    })
    var feedback = servs.Contributions.userFeedback(this.assembly.assemblyId, this.contribution.contributionId).update(payload);
    feedback.$promise.then(
      function(newStats) {
        vm.contribution.stats = newStats;
        vm.close();
        servs.Notify.show('Operation succeeded', 'success');
      },
      function() {
        servs.Notify.show('Error while updating user feedback', 'error');
      }
    );
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
   * Load the user's feedback if there is any.
   */
  function loadFeedback() {
    var rsp = servs.Contributions.userFeedback(this.assembly.assemblyId, this.contribution.contributionId).query().$promise;
    rsp.then(
      function(feedbacks) {
        // TODO: assign to vm.feedback
        console.log('feedbacks', feedbacks);
      },
      function() {
        servs.Notify.show('Error while get user feedback from the server', 'error');
      })
  }
}());