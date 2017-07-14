(function () {
  'use strict';

  /**
   * @name contribution-moderation-form
   * @memberof directives
   *
   * @description
   *  Component that renders a moderation form to flag or delete a contribution.
   *
   * @example
   *
   *  <contribution-moderation-form contribution="contribution" context="context"></contribution-moderation-form>
   */
  appCivistApp
    .component('contributionModerationForm', {
      selector: 'contributionModerationForm',
      bindings: {
        contribution: '=',
        // delete | flag
        context: '<',
        // optional callback called on success
        onSuccess: '&?',
        // optional callback called on failure
        onError: '&?'
      },
      controller: FormCtrl,
      controllerAs: 'vm',
      templateUrl: '/app/v2/partials/directives/contribution-moderation-form.html'
    });

  FormCtrl.$inject = [
    '$scope', 'Contributions', 'localStorageService', 'Notify', '$rootScope'
  ];

  function FormCtrl($scope, Contributions, localStorageService, Notify, $rootScope) {
    this.submitDelete = submitDelete.bind(this);
    this.submitFlag = submitFlag.bind(this);
    this.submitModerationForm = submitModerationForm.bind(this);

    this.$onInit = () => {
      this.moderationReasons = [
        'Spam',
        'Violates commenting rules',
        'It is disrespectful',
        'It is aggressive',
        'Other'
      ];
      this.assembly = localStorageService.get('currentAssembly');
      this.campaign = localStorageService.get('currentCampaign');
    };


    /**
     * DELETE or FLAG comment
     */
    function submitModerationForm() {
      if (this.contribution.moderationComment === 'Other') {
        this.contribution.moderationComment = this.contribution.moderationCommentOther;
        delete this.contribution.moderationCommentOther;
      }

      switch (this.context) {
        case 'delete':
          this.submitDelete();
          break;
        case 'flag':
          this.submitFlag();
          break;
      }
    }

    /**
     * Removes the contribution.
     *
     * @private
     */
    function submitDelete() {
      Contributions.moderate(this.assembly.assemblyId, this.contribution).then(
        () => {
          Notify.show('Operation succeeded', 'success');

          if (angular.isFunction(this.onSuccess)) {
            this.onSuccess();
          }
        },
        () => {
          Notify.show('Error while trying to communicate with the server', 'error');

          if (angular.isFunction(this.onError)) {
            this.onError();
          }
        }
      );
    }

    /**
     * Flags the contribution.
     *
     * @private
     */
    function submitFlag() {
      var payload = {
        flag: true,
        textualFeedback: this.contribution.moderationComment
      };
      var feedback = Contributions.userFeedback(this.assembly.assemblyId, this.campaign.campaignId, this.contribution.contributionId).update(payload);
      feedback.$promise.then(
        newStats => {
          this.contribution.stats = newStats;

          if (angular.isFunction(this.onSuccess)) {
            this.onSuccess();
          }
          Notify.show('Operation succeeded', 'success');
        },
        () => {
          Notify.show('Error when updating user feedback', 'error');

          if (angular.isFunction(this.onError)) {
            this.onError();
          }
        }
      );
    }
  }

}());
