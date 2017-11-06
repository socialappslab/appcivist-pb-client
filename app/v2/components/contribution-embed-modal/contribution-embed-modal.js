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
   *  <voting-modal></voting-modal>
   */
  appCivistApp
    .component('contributionEmbedModal', {
      selector: 'contributionEmbedModal',
      transclude: true,
      bindings: {
        format: '<'
      },
      controller: ContributionEmbedModal,
      controllerAs: 'vm',
      templateUrl: '/app/v2/components/contribution-embed-modal/contribution-embed-modal.html'
    });

    ContributionEmbedModal.$inject = [
      '$scope', 'Notify', 'Etherpad'
    ];

  function ContributionEmbedModal($scope,Notify, Etherpad) {

    this.embedPadGdoc = () => {
      if ($scope.newDocUrl != "") {
        let url = $scope.newDocUrl;
        let regex = /\b\/edit/i;
        let match = url.match(regex);
        if (match != null) {
          url = url.substr(0, match.index);
        }
        let payload = {
          url: url
        }
        Etherpad.embedDocument($scope.assemblyID, $scope.campaignID, $scope.proposalID, format, payload).then(
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
