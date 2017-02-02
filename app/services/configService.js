appCivistApp.service('configService', function ($resource, $http, $location, localStorageService, $uibModal, AppCivistAuth,
  FlashService, $rootScope, $q, Memberships, Assemblies, $filter, $state, Notify, Campaigns) {

  this.getPrincipalAssemblyConfigs = function (configTarget) {
    return [
      {key: "appcivist.instance.assembly-network",  definition: { valueType: "Boolean" }, value: true},
      {key: "appcivist.instance.assembly-network-limit",  definition: { valueType: "Number" }, value: "1"},
      {key: "appcivist.instance.assembly-network-campaign-limit", definition: { valueType: "Number" }, value: "1"},
      {key: "appcivist.instance.assembly-network-working-group-limit", definition: { valueType: "Number" }, value: "1"},
      {key: "appcivist.instance.etherpad-base-url", definition: { valueType: "String" }, value: "http://xxx.com"},
      {key: "appcivist.instance.etherpad-api-key", definition: { valueType: "String" }, value: "hgfdsgaddhads"},
      {key: "appcivist.instance.domain", definition: { valueType: "String" }, value: "domain"},
      {key: "appcivist.instance.api-key", definition: { valueType: "String" }, value: "api-key"},
      {key: "appcivist.instance.theme", definition: { valueType: "String" }, value: "theme"}
      ]
  };

  this.getAssemblyConfigs = function (configTarget) {
    return [
      {key: "appcivist.assembly.enable-forum", definition: { valueType: "Boolean" }, value: true},
      {key: "appcivist.assembly.disable-new-memberships", definition: { valueType: "Boolean" }, value: true},
      {key: "appcivist.assembly.membership-invitation-by-members", definition: { valueType: "Boolean" }, value: true},
      {key: "appcivist.assembly.has-registration-form", definition: { valueType: "Boolean" }, value: true},
      {key: "appcivist.assembly.has-registration-form-url", definition: { valueType: "String" }, value: "DEFAULT"},
      {key: "appcivist.assembly.has-registration-form-id", definition: { valueType: "String" }, value: "DEFAULT"},
      {key: "appcivist.assembly.enable-moderator-role", definition: { valueType: "Boolean" }, value: true},
      {key: "assembly.enable.messaging", definition: {valueType: "Boolean"}, value: true},
      {key: "assembly.face-to-face.scheduling", definition: {valueType: "Boolean"}, value: true}
    ]
  };

  this.getWGroupConfigs = function (configTarget) {
    return [
      { key: "appcivist.wg.membership-invitation-by-members", definition: { valueType: "Boolean" }, value: true},
      { key: "appcivist.wg.has-registration-form", definition: { valueType: "Boolean" }, value: true},
      { key: "appcivist.wg.has-registration-form-url", definition: { valueType: "String" }, value: "DEFAULT"},
      { key: "appcivist.wg.has-registration-form-id", definition: { valueType: "String" }, value: "DEFAULT"},
      { key: "appcivist.wg.enable-moderator-role", definition: { valueType: "Boolean" }, value: true},
      { key: "appcivist.wg.disable-public-site", definition: { valueType: "Boolean" }, value: true}
    ]
    //{ key: "appcivist.wg.membership-type", definition: { valueType: "String" }, value: "REGISTRATION", options: ["REGISTRATION", "INVITATION", "INVITATION_AND_REGISTRATION"]},
  };

  this.getCampaignConfigs = function (configTarget) {
    return [
      { key: "appcivist.campaign.hide-timeline", definition: { valueType: "Boolean" }, value: true},
      { key: "appcivist.campaign.contribution-types", definition: { valueType: "String" }, value: "DEFAULT"},
      { key: "appcivist.campaign.contribution-type-principal", definition: { valueType: "String" }, value: "DEFAULT"},
      { key: "appcivist.campaign.disable-discussions", definition: { valueType: "Boolean" }, value: true},
      { key: "appcivist.campaign.disable-public-site", definition: { valueType: "Boolean" }, value: true},
      { key: "appcivist.campaign.disable-public-discussions", definition: { valueType: "Boolean" }, value: true},
      { key: "appcivist.campaign.disable-informal-voting", definition: { valueType: "Boolean" }, value: true},
      { key: "appcivist.campaign.disable-extended-feedback", definition: { valueType: "Boolean" }, value: true},
      { key: "appcivist.campaign.disable-extended-feedback-public", definition: { valueType: "Boolean" }, value: true},
      { key: "appcivist.campaign.disable-new-contributions", definition: { valueType: "Boolean" }, value: true},
      { key: "appcivist.campaign.disable-etherpad", definition: { valueType: "Boolean" }, value: true},
      { key: "appcivist.campaign.budget-amount", definition: { valueType: "Number" }, value: "0"}
    ]
  };



});
