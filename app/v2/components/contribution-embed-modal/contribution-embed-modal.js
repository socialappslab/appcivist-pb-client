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
        contributionId: '='
      },
      controller: ContributionEmbedModal,
      controllerAs: 'vm',
      templateUrl: '/app/v2/components/contribution-embed-modal/contribution-embed-modal.html'
    });

    ContributionEmbedModal.$inject = [
      '$scope', 'Notify', 'Etherpad'
    ];

  function ContributionEmbedModal($scope, Notify, Etherpad) {

    this.$onInit = () => {
      this.newDocUrl = "";
    }

    this.embedPadGdoc = () => {
      if (this.newDocUrl != "") {
        //$scope.startSpinner();
        let url = this.newDocUrl;
        let regex = /\b\/edit/i;
        let match = url.match(regex);
        if (match != null) {
          url = url.substr(0, match.index);
        }
        let payload = {}
        if (this.format == 'gdoc') payload = { gdocLink: url };
        else payload = { etherpadServerUrl: url };
        Etherpad.embedDocument(this.assemblyId, this.campaignId, this.contributionId, this.format, payload).then(
          response => {
            if (this.format == 'etherpad') {
              $scope.loadReadOnlyEtherpadHTML();
            } else {
              angular.element(window).open(url, 'embed_readonly');
            }
            Notify.show('Document embedded successfully', 'success');
            //$scope.stopSpinner();
          },
          error => Notify.show('Error while trying to embed the document', 'error')
        )
      } else {
        Notify.show('Error while trying to embed the document', 'error');
      }
    }

  }
}());
