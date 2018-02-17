(function () {
  'use strict';


  /**
   * @name campaign-contextual-items
   * @memberof directives
   *
   * @description
   *  Component that renders campaign' contextual menu items.
   *
   * @example
   *
   *  <campaign-contextual-items campaign="campaign"></campaign-contextual-items>
   */
  appCivistApp
    .component('campaignContextualItems', {
      selector: 'campaignContextualItems',
      bindings: {
        // {object}
        campaign: '=',

        // {string} proposal | idea
        currentComponentType: '=',
        contributions: '=',
        filters: '='
      },
      controller: FormCtrl,
      controllerAs: 'vm',
      templateUrl: '/app/v2/partials/directives/campaign-contextual-items.html'
    });

  FormCtrl.$inject = [
    'Campaigns', 'localStorageService', 'Memberships', '$window', 'Notifications', 'Notify', '$state',
    '$scope', 'Space'
  ];

  function FormCtrl(Campaigns, localStorageService, Memberships, $window, Notifications, Notify, $state,
    $scope, Space) {

    this.init = init.bind(this);
    this.refreshMenu = refreshMenu.bind(this);
    this.subscribe = subscribe.bind(this);
    this.downloadAuthorInfo = downloadAuthorInfo.bind(this);
    this.edit = edit.bind(this);

    ModalMixin.init(this);

    $scope.$watch('vm.campaign', (campaign) => {
      if (campaign) {
        this.init();
      }
    });

    function init() {
      this.user = localStorageService.get('user');
      this.isAnonymous = !this.user;
      this.modals = {};

      if (!this.isAnonymous) {
        this.assemblyId = localStorageService.get('currentAssembly').assemblyId;
        this.userIsAssemblyCoordinator = Memberships.rolIn('assembly', this.assemblyId, 'COORDINATOR');
        this.showProposalImport = this.currentComponentType && this.currentComponentType.toLowerCase() === 'proposal'
          || this.currentComponentType && this.currentComponentType.toLowerCase() === 'proposals';
        // If prosposals can be imported, so to ideas as they can be used to create proposals
        this.showIdeasImport = this.showProposalImport || (this.currentComponentType && this.currentComponentType.toLowerCase() === 'idea'
          || this.currentComponentType && this.currentComponentType.toLowerCase() === 'ideas');
      }
    }

    function refreshMenu() {
      this.showActionMenu = !this.showActionMenu;
    };

    function subscribe() {
      var query = { 'origin': this.campaign.uuid, 'eventName': 'NEW_CAMPAIGN', 'endPointType': 'email' };
      var subscription = Notifications.subscribe().save(query).$promise.then(
        function () {
          Notify.show('Subscribed successfully', 'success');
        },
        function () {
          Notify.show(error.statusMessage, 'error');
        }
      );
    }

    function edit() {
      localStorageService.set('newCampaign',this.campaign);
      $state.go('v2.assembly.aid.campaign.edit', { aid: this.assemblyId, cid: this.campaign.campaignId });
    }

    /**
     * This functions is called when Coordinators clicks on "Download Author Information". It calls
     * the backend to get a CSV with the list of nonmember authors.
     */
    function downloadAuthorInfo() {
      let rsp = Space.getNonMemberAuthors(this.campaign.resourceSpaceId);

      rsp.then(
        response => {
          let anchor = angular.element('<a/>');
          let now = new Date();
          anchor.css({ display: 'none' });
          angular.element(document.body).append(anchor);

          anchor.attr({
            href: 'data:attachment/csv;charset=utf-8,' + encodeURI(response.data),
            target: '_blank',
            download: 'nonmember-authors-' + now.getTime() + '.csv'
          })[0].click();
          anchor.remove();
        },
        error => Notify.show(error.statusMessage, 'error')
      );
    }
  }
}());
