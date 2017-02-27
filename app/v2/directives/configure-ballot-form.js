(function() {
  'use strict';

  /** 
   * @name contribution-ballot-form
   * @memberof directives
   * 
   * @description
   *  Component that renders a ballot configuration form.
   * 
   * @example
   * 
   * <configure-ballot-form></configure-ballot-form>
   */
  appCivistApp
    .component('configureBallotForm', {
      selector: 'configureBallotForm',
      bindings: {

      },
      controller: FormCtrl,
      controllerAs: 'vm',
      templateUrl: '/app/v2/partials/directives/configure-ballot-form.html'
    });

  FormCtrl.$inject = [
    'Notify', 'Components'
  ];

  function FormCtrl(Notify, Components) {
    var vm = this;

    this.$onInit = function() {
      vm.model = {
        configurations: {}
      };
      vm.configs = Components.defaultProposalComponents()
        .filter(function(cmp) { return cmp.key === 'Voting' })
        .map(function(cmp) { return cmp.configs; })[0];

      vm.votingSystems = vm.configs.filter(function(cfg) { return cfg.key === 'component.voting.system' })
        .map(function(cfg) { return cfg.options })[0];
    };
    this.onSelect = onSelect.bind(this);
    this.submit = submit.bind(this);
  }

  /**
   * Handles votintg system on-select form event.
   */
  function onSelect() {
    var vm = this;
    this.selectedConfigs = this.configs.filter(function(c) { console.log(c); return c.dependsOfValue === vm.model.selected.value });
  }

  /**
   * Submits the form
   */
  function submit() {
    // TODO: implement creation logic
    console.log(this.model);
  }
}())