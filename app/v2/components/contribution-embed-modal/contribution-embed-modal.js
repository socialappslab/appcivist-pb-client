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
        let url = this.newDocUrl;
        let regex = /\b\/edit/i;
        let match = url.match(regex);
        if (match != null) {
          url = url.substr(0, match.index);
        }
        let payload = {
          url: url
        }
        Etherpad.embedDocument(this.assemblyId, this.campaignId, this.contributionId, this.format, payload).then(
          response => {
            console.log(response)
          },
          error => Notify.show('Error while trying to embed the document', 'error')
        )
      } else {
        Notify.show('Error while trying to embed the document', 'error');
      }
    }

  }
}());
