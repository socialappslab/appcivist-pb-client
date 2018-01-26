(function() {
  'use strict';

  /**
   * @name nonmember-author-form
   * @memberof directives
   *
   * @description
   *  Component that renders a contribution form.
   *
   * @example
   *
   *  <nonmember-author-form on-change="change(author)" disabled="false"></nonmember-author-form>
   */

  appCivistApp.component('nonmemberAuthorForm', {
    selector: 'nonmemberAuthorForm',
    bindings: {
      onChange: '&',
      disabled: '=',

      // Optional object to use as source. Also, values will be updated in this object, making
      // onChange callback unnecessary.
      author: '=?',
      isMember: '='
    },
    controller: Form,
    controllerAs: 'vm',
    templateUrl: '/app/v2/partials/directives/nonmember-author-form.html'
  });


  Form.$inject = ['Space', '$scope', 'localStorageService', '$stateParams'];

  function Form(Space, $scope, localStorageService, $stateParams) {
    this.loadCustomFields = loadCustomFields.bind(this);
    var pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    this.isAnonymous = $stateParams.cuuid && pattern.test($stateParams.cuuid);
    this.$onInit = () => {
      this.loadCustomFields();

      if (!this.author) {
        this.author = {};
        $scope.$watchCollection('vm.author', author => {
          this.onChange({ author: author });
        });
      }
      this.author.customFieldValues = {};
    };


    function loadCustomFields() {
      let campaign = localStorageService.get('currentCampaign');
      let rsp = this.isAnonymous ?
                    Space.fieldsPublic(campaign.resourceSpaceUUID).query().$promise
                      : Space.fields(campaign.resourceSpaceId).query().$promise;

      rsp.then(
        fields => {
          this.campaignFields = fields.filter(f => f.entityType === 'NON_MEMBER_AUTHOR');
        },
        error => {
          Notify.show(error.statusMessage, 'error');
        }
      );
    }
  }
}());
