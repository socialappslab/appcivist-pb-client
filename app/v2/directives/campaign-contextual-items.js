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
        currentComponentType: '='
      },
      controller: FormCtrl,
      controllerAs: 'vm',
      templateUrl: '/app/v2/partials/directives/campaign-contextual-items.html'
    });

  FormCtrl.$inject = [
    'Campaigns', 'localStorageService', 'Memberships', '$window', 'Notifications', 'Notify', '$state', '$scope'
  ];

  function FormCtrl(Campaigns, localStorageService, Memberships, $window, Notifications, Notify, $state, $scope) {
    this.init = init.bind(this);
    this.refreshMenu = refreshMenu.bind(this);
    this.subscribe = subscribe.bind(this);
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
        this.showIdeasImport = this.currentComponentType === 'idea';
        this.showProposalImport = this.currentComponentType === 'proposal';
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
          Notify.show('Error while trying to communicate with the server', 'error');
        }
      );
    }

    function edit() {
      $state.go('v2.assembly.aid.campaign.edit', { aid: this.assemblyId, cid: this.campaign.campaignId });
    }
  }
}());