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
    'Contributions', 'localStorageService', 'Memberships', 'Notify', '$scope'
  ];
  var servs = {};

  function ContributionFeedbackFormCtrl(Contributions, localStorageService, Memberships, Notify, $scope) {
    var vm = this;
    servs.Memberships = Memberships;
    servs.Contributions = Contributions;
    servs.Notify = Notify;
    this.selectGroup = selectGroup.bind(this);
    this.loadGroups = loadGroups.bind(this);
    this.loadTypes = loadTypes.bind(this);
    this.verifyMembership = verifyMembership.bind(this);
    this.selectType = selectType.bind(this);
    this.submit = submit.bind(this);

    this.$onInit = function() {
      vm.feedback = {
        need: 1,
        benefit: 1,
        feasibility: 1,
        textualFeedback: '',
        status: 'PRIVATE',
        type: 'MEMBER'
      };
      vm.assembly = localStorageService.get('currentAssembly');
      vm.sliderOptions = {
        floor: 1,
        ceil: 4,
        showTicksValues: true
      };
      vm.tinymceOptions = {
        // plugins: 'link image code',
        // toolbar: 'undo redo | bold italic | alignleft aligncenter alignright | code',
        height: 400,
        plugins: [
          'advlist autolink lists link image charmap print preview anchor',
          'searchreplace visualblocks code fullscreen',
          'insertdatetime media table contextmenu paste imagetools'
        ],
        toolbar: 'insertfile undo redo | styleselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image'
      };
      vm.loadGroups();
      vm.verifyMembership();
      vm.loadTypes();
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
  }

  function verifyMembership() {
    this.userIsCoordinator = servs.Memberships.rolIn('assembly', this.assembly.assemblyId, 'COORDINATOR');

    if (this.proposalGroup) {
      this.userIsWGCoordinator = servs.Memberships.rolIn('group', this.proposalGroup.groupId, 'COORDINATOR');
    }
  }

  function submit() {
    var vm = this;
    var feedback = servs.Contributions.userFeedback(this.assembly.assemblyId, this.contribution.contributionId).update(this.feedback);
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
}());