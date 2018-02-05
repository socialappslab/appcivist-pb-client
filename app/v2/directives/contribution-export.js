(function () {
    'use strict';

    /**
     * @name contribution-export
     * @memberof directives
     *
     * @description
     *  Component that renders a contribution export.
     *
     * @example
     *
     *  <contribution-export></contribution-export>
     */
    appCivistApp
      .component('contributionExport', {
        selector: 'contributionExport',
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

          // handler called when import has succeeded.
          // An example of onSuccess callback is
          // function onSuccessCallback() { ... }
          onImportSuccess: '&',

          // in edit mode, the contribution to edit.
          contribution: '<',

          // edit | create, default value is create
          mode: '@',

          // campaign or current component configs
          configs: '=?',
        },
        controller: ExportCtrl,
        controllerAs: 'vm',
        templateUrl: '/app/v2/partials/directives/contribution-export.html'
      });

    ExportCtrl.$inject = [
      'WorkingGroups', 'localStorageService', 'Notify', 'Memberships', 'Campaigns',
      'Assemblies', 'Contributions', '$http', 'FileUploader', 'Space', '$q', '$timeout',
      '$filter', '$state', '$scope', '$stateParams', 'Captcha', '$attrs', '$translate'
    ];

    function ExportCtrl(WorkingGroups, localStorageService, Notify, Memberships,
      Campaigns, Assemblies, Contributions, $http, FileUploader, Space, $q, $timeout,
      $filter, $state, $scope, $stateParams, Captcha, $attrs, $translate) {
      this.init = init.bind(this);
      this.loadCampaign = loadCampaign.bind(this);
      this.exportContribution = exportContribution.bind(this);

      this.exportFormat = 'CSV';
      this.fields = []
      this.customFields = []
      this.includeDoc = false;
      this.docExportFormat = 'PDF';

      this.$onInit = () => {
        this.init();
      };

      function init() {
        this.importOnlyForm = $attrs.importOnly !== undefined;
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
          authors: [],
          existingThemes: [],
          officialThemes: [],
          emergentThemes: [],
          sourceCode: '',
          attachments: [],
          location: {},
          status: this.isIdea ? 'PUBLISHED' : 'DRAFT',
          cover: {}
        };

        // TODO we should move the anonymous site to include the path of the assembly
        this.isAnonymous = false;
        if ($stateParams.cuuid && pattern.test($stateParams.cuuid)) {
          this.isAnonymous = true;
          this.campaignUUID = $stateParams.cuuid;
        } else {
          this.assembly = localStorageService.get('currentAssembly');
          this.user = localStorageService.get('user');
          this.contribution.authors.push(this.user);
          this.recaptchaResponseOK = true;
        }
        
        this.loadCampaign(this.contribution.campaignIds[0]);
        
        var self = this;
      }

      function exportContribution() {
        let sid = this.campaign.resourceSpaceId;
        let coid = this.contribution.contributionId;
        let pub = false;
        if ($stateParams.cuuid) {
          sid = this.campaign.resurceSpaceUUID;
          coid = this.contribution.uuid;
          pub = true;
        }
        let rsp = Contributions.contributionInResouceSpaceExport(sid, coid, this.exportFormat, this.fields,
          this.customFields, this.selectedContributions,
          this.includeDoc, this.docExportFormat, pub)
            .getText().$promise.then(
              returned => {
                Notify.show(returned.content, 'success')
               if (angular.isFunction(this.onSuccess)) {
                  this.onSuccess();
                }
              },
              error => {
                Notify.show(error.statusMessage, 'error')
              }
            )
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

    }
  }());
