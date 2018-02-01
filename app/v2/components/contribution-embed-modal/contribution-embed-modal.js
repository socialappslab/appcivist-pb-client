'use strict';

(function () {
  'use strict';

  /**
   * @name contributionEmbedModal
   * @memberof components
   *
   * @description
   *  Component that renders main contributionEmbedModal.
   *
   * @example
   *
   *  <contribution-embed-modal></contribution-embed-modal>
   */
  appCivistApp
    .component('contributionEmbedModal', {
      selector: 'contributionEmbedModal',
      bindings: {
        format: '@',
        assemblyId: '=',
        campaignId: '=',
        contributionId: '=',
        resources: '='
      },
      controller: ContributionEmbedModal,
      controllerAs: 'vm',
      templateUrl: '/app/v2/components/contribution-embed-modal/contribution-embed-modal.html'
    });

    ContributionEmbedModal.$inject = [
      '$scope', 'Notify', 'Etherpad', '$window'
    ];

  function ContributionEmbedModal($scope, Notify, Etherpad, $window) {

    this.$onInit = () => {
      this.newDocUrl = "";
    }

    $scope.$on("ToContributionEmbedModal:CampaignResourcesReady", (event, data) => {
      $scope.resources = data.resources;
    });

    this.embedPadGdoc = () => {
      if ((this.format === "gdoc" && this.newDocUrl != "")||(this.format!=="gdoc")) {
        let url = this.newDocUrl;
        let regex = /\b\/edit/i;
        let match = url.match(regex);
        if (match != null) {
          url = url.substr(0, match.index);
        }
        let payload = {
          "gdocLink": url,
          "etherpadServerUrl": url,
          "etherpadServerApiKey": this.etherpadApiKey
        }/*
        if (this.format == 'gdoc') payload = { gdocLink: url };
        else payload = { etherpadServerUrl: url };*/
        Etherpad.embedDocument(this.assemblyId, this.campaignId, this.contributionId, this.format, payload).then(
          response => {
            Notify.show('Document embedded successfully', 'success');
            angular.element("#"+this.format+"EmbedModal").modal("hide");
            $window.location.reload();
            //$scope.stopSpinner();
          },
          error => Notify.show(error.statusMessage, 'error')
        )
      } else {
        Notify.show('Error while trying to embed the document', 'error');
      }
    }

    this.isTemplate = (resource) => {
      return resource.isTemplate;
    }

    this.gDocCopyUrl = (docUrl) => {
      let url = docUrl;
      let regex = /\b\/edit/i;
      let match = url.match(regex);
      if (match != null) {
        url = url.substr(0, match.index)+"/copy";
      } else {
        url = url+"/copy";
      }
      return url;
    }
  }
}());
