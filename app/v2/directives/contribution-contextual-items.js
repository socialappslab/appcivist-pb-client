(function () {
  'use strict';

  /**
   * @name contribution-contextual-items
   * @memberof directives
   *
   * @description
   *  Component that renders contribution cards' contextual menu items.
   *
   * @example
   *
   *  <contribution-contextual-items
   *      contribution="contribution"
   *      is-hover="cm.isHover"
   *      is-topic-group="isTopicGroup">
   *  </contribution-contextual-items>
   */
  appCivistApp
    .component('contributionContextualItems', {
      selector: 'contributionContextualItems',
      bindings: {
        contribution: '=',
        isProposalIdeaStage: '=',
        isHover: '=',
        isTopicGroup: '='
      },
      controller: FormCtrl,
      controllerAs: 'vm',
      templateUrl: '/app/v2/partials/directives/contribution-contextual-items.html'
    });

  FormCtrl.$inject = [
    'Contributions', 'Campaigns', 'localStorageService', 'Memberships', '$window', 'Notify',
    '$compile', 'Notifications', '$scope'
  ];

  function FormCtrl(Contributions, Campaigns, localStorageService, Memberships, $window, Notify,
    $compile, Notifications, $scope) {

    this.setupMembershipInfo = setupMembershipInfo.bind(this);
    this.setContributionType = setContributionType.bind(this);
    this.toggleContextualMenu = toggleContextualMenu.bind(this);
    this.verifyAuthorshipUser = verifyAuthorshipUser.bind(this);
    this.init = init.bind(this);
    this.refreshMenu = refreshMenu.bind(this);
    this.updateFeedback = updateFeedback.bind(this);
    this.softRemoval = softRemoval.bind(this);
    this.publish = publish.bind(this);
    this.exclude = exclude.bind(this);
    this.assignToWG = assignToWG.bind(this);
    this.seeHistory = seeHistory.bind(this);
    this.subscribe = subscribe.bind(this);
    this.showModerationForm = showModerationForm.bind(this);
    this.moderationSuccess = moderationSuccess.bind(this);
    this.setupMembershipInfo = setupMembershipInfo.bind(this);
    this.openModal = openModal.bind(this);
    this.closeModal = closeModal.bind(this);
    this.onEditContributionSuccess = onEditContributionSuccess.bind(this);


    this.$onInit = () => {
      if (!this.contribution) {
        $scope.$watch('vm.contribution', (newVal) => {
          if (newVal) {
            this.init();
          }
        });
      } else {
        this.init();
      }
    };

    $scope.$on('ContributionPage:CurrentComponentReady',
      (evt, data) => {
        $scope.vm.isProposalIdeaStage = data;
      }
    );

    $scope.$on('ContributionPage:SeeHistory',
      (evt, data) => {
        $scope.vm.seeHistory();
      }
    );

    function init() {
      this.vm = {};
      this.cm = { isHover: false };
      this.user = localStorageService.get('user');
      this.isAnonymous = !this.user;
      this.modals = {};
      this.contributionStatus = this.contribution.status;

      this.setContributionType();

      var workingGroupAuthors = this.contribution.workingGroupAuthors;
      var workingGroupAuthorsLength = workingGroupAuthors ? workingGroupAuthors.length : 0;
      this.group = workingGroupAuthorsLength ? workingGroupAuthors[0] : 0;
      this.notAssigned = true;

      if (this.group) {
        this.notAssigned = false;
      }

      if (!this.isAnonymous) {
        this.groupId = workingGroupAuthorsLength ? this.contribution.workingGroupAuthors[0].groupId : 0;
        this.assemblyId = localStorageService.get('currentAssembly').assemblyId;
        this.campaignId = localStorageService.get('currentCampaign').campaignId;
        this.setupMembershipInfo();
      }

      // Read user contribution feedback
      if (this.userFeedback === undefined || this.userFeedback === null) {
        this.userFeedback = { 'up': false, 'down': false, 'fav': false, 'flag': false };
      }
    }

    function refreshMenu() {
      this.showActionMenu = !this.showActionMenu;
    };

    // Feedback update
    function updateFeedback(value) {
      if (value === 'up') {
        this.userFeedback.up = true;
        this.userFeedback.down = false;
      } else if (value === 'down') {
        this.userFeedback.up = false;
        this.userFeedback.down = true;
      } else if (value === 'fav') {
        this.userFeedback.fav = true;
      } else if (value === 'flag') {
        this.userFeedback.flag = true;
      } else if (value === undefined) {
        if (this.userFeedback.up == this.userFeedback.down) {
          this.userFeedback.up = true;
          this.userFeedback.down = false;
        } else {
          this.userFeedback.up = !this.userFeedback.up;
          this.userFeedback.down = !this.userFeedback.down;
        }
      }
      var feedback = Contributions.userFeedback(this.assemblyId, this.campaignId, this.contribution.contributionId).update(this.userFeedback);
      feedback.$promise.then(
        newStats => this.contribution.stats = newStats,
        error => Notify.show('Error when updating user feedback', 'error')
      );
    };

    //change redirection
    function softRemoval() {
      let res = Contributions.contributionSoftRemoval(this.assemblyId, this.contribution.contributionId).update(this.contribution);
      res.$promise.then(
        data => $window.location.reload(),
        error => Notify.show('Error while publishing proposal', 'error')
      );
    }

    function publish() {
      var rsp = Contributions.publishProposal(this.assemblyId, this.group.groupId, this.contribution.contributionId).update();
      rsp.$promise.then(
        () => $window.location.reload(),
        () => Notify.show('Error while publishing proposal', 'error')
      )
    }

    function exclude() {
      Contributions.excludeContribution(this.assemblyId, this.contribution.contributionId).update(this.contribution);
      $window.location.reload();
    }

    //find endpoint
    function assignToWG() {
      $window.location.reload();
    }

    function seeHistory() {
      this.vexInstance = vex.open({
        className: "vex-theme-plain",
        unsafeContent: $compile(document.querySelector('.history-modal').innerHTML)($scope)[0]
      });
    }

    function subscribe() {
      var query = { "origin": this.contribution.uuid, "eventName": "NEW_CONTRIBUTION_PROPOSAL", "endPointType": "email" };
      var subscription = Notifications.subscribe().save(query).$promise;
      subscription.then(
        function () {
          Notify.show('Subscribed successfully', 'success');
        },
        function () {
          Notify.show('Error while trying to communicate with the server', 'error');
        }
      );
    }

    /**
     * Displays the moderation form.
     *
     * @param {string} context - delete | flag
     */
    function showModerationForm(context) {
      this.moderationContext = context;
      this.vexInstance = vex.open({
        className: "vex-theme-plain",
        unsafeContent: $compile(document.getElementById('contributionModerationForm').innerHTML)($scope)[0]
      });
    };

    function moderationSuccess() {
      this.vexInstance.close();
    };


    function setupMembershipInfo() {
      var hasRol = Memberships.hasRol;
      var groupMembershipsHash = localStorageService.get('groupMembershipsHash');
      var assemblyMembershipsHash = localStorageService.get('assemblyMembershipsHash');
      var groupRoles = groupMembershipsHash[this.group ? this.group.groupId : this.group];
      this.userIsWorkingGroupCoordinator = groupRoles != undefined ? hasRol(groupRoles, "COORDINATOR") : false;
      var assemblyRoles = assemblyMembershipsHash[this.assemblyId];
      this.userIsAssemblyCoordinator = assemblyRoles != undefined ? hasRol(assemblyRoles, "COORDINATOR") : false;

      if (this.contribution.type === 'PROPOSAL') {
        this.userIsAuthor = this.verifyAuthorshipUser(this.contribution, this.user);
        this.userCanEdit = this.userIsAuthor || this.userIsAssemblyCoordinator || this.userIsWorkingGroupCoordinator;
      } else if (this.contribution.type === 'NOTE') {
        this.userCanEdit = true;
        this.userIsAuthor = this.verifyAuthorshipUser(this.contribution, this.user);
      } else {
        this.userCanEdit = this.userIsAuthor = this.verifyAuthorshipUser(this.contribution, this.user);
      }
      // if the group type is topic, allow authors edition
      if (this.isTopicGroup) {
        this.userCanEdit = this.userIsAuthor;
      }
    }

    function setContributionType() {
      this.isProposal = this.contribution.type === 'PROPOSAL';
      this.isIdea = this.contribution.type === 'IDEA';
    }

    function toggleContextualMenu() {
      this.showContextualMenu = !this.showContextualMenu;
    }

    function verifyAuthorshipUser(contribution, user) {
      var authors = contribution.authors;
      if (authors && authors.length > 0) {
        for (var i = 0; i < authors.length; i++) {
          if (user.userId === authors[i].userId) {
            return true;
          }
        }
      }
      return false;
    }

    function openModal(id) {
      this.modals[id] = true;
    }

    function closeModal(id) {
      this.modals[id] = false;
    }

    function onEditContributionSuccess() {
      this.closeModal('contributionEditModal');
      $window.location.reload();
    }
  }
}());
