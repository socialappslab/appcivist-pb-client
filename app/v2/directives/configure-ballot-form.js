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
   * <configure-ballot-form close="vm.closeModal('configureBallotForm')"></configure-ballot-form>
   */
  appCivistApp
    .component('configureBallotForm', {
      selector: 'configureBallotForm',
      bindings: {
        close: '&?'
      },
      controller: FormCtrl,
      controllerAs: 'vm',
      templateUrl: '/app/v2/partials/directives/configure-ballot-form.html'
    });

  FormCtrl.$inject = [
    'Notify', 'Components', 'Ballot'
  ];

  function FormCtrl(Notify, Components, Ballot) {
    var vm = this;
    Object.assign(this, { Notify: Notify, Ballot: Ballot });

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
    this.selectedConfigs = this.configs.filter(function(c) { return c.dependsOfValue === vm.model.selected.value });
  }

  /**
   * Submits the form
   */
  function submit() {
    var now = moment();
    var dateFormat = 'YYYY-MM-DD hh:mm:ss';

    var data = {
      ballot: {
        'starts_at': now.format(dateFormat),
        'ends_at': now.add(1, 'M').format(dateFormat),
        'notes': 'ballot notes',
        'instructions': 'ballot instructions'
      },
      'ballot_configurations': [],
      'ballot_registration_fields': [{
        'name': 'Name',
        'description': 'Enter a name or an identifier',
        'expected_value': 'String'
      }]
    };
    var vm = this;
    // set default values for ballot configurations
    angular.forEach(vm.selectedConfigs, function(config) {
      data['ballot_configurations'].push({
        key: config.key,
        value: config.value
      });
    });
    // ballot password
    var ballotPassword = _.find(vm.configs, { key: 'component.voting.ballot.password' });
    data.password = ballotPassword.value;
    data.ballot['voting_system_type'] = this.model.selected.value;
    // override default ballot configuration values
    angular.forEach(this.model.configurations, function(value, configPosition) {
      var config = _.find(vm.selectedConfigs, { position: parseInt(configPosition) });
      var ballotConfig = _.find(data['ballot_configurations'], { key: config.key });
      ballotConfig.value = value;
    });

    var rsp = this.Ballot.create(data).$promise;
    rsp.then(
      function(response) {
        vm.Notify.show('Voting ballot created successfully', 'success');

        if (angular.isFunction(vm.close)) {
          vm.close();
        }
      },
      function(error) {
        vm.Notify.show(error.data.error, 'error');
      }
    );
  }
}())