(function() {
'use strict';

angular
  .module('appCivistApp')
  .controller('v2.LoginCtrl', LoginCtrl);

LoginCtrl.$inject = [
  '$scope', 'localStorageService', 'FlashService', 'AppCivistAuth',
  'Memberships', 'Assemblies', '$state', '$filter'
];

function LoginCtrl($scope, localStorageService, FlashService, AppCivistAuth,
                   Memberships, Assemblies, $state, $filter) {

  activate();

  function activate() {
    $scope.user = {};
    $scope.login = login;
  }
	
  function login() {
    if(!$scope.user.email || !$scope.user.password) {
		  FlashService.Error('Email and password are required', true, 'BADREQUEST');
      return;
    }
		var rsp = AppCivistAuth.signIn().save($scope.user);
    rsp.$promise.then(loginSuccess, loginError);
  }

  function loginSuccess(user) {
    localStorageService.set('sessionKey', user.sessionKey);
    localStorageService.set('authenticated', true);
    localStorageService.set('user', user);
    var rsp = Memberships.workingGroups(user.userId).query();
    rsp.$promise.then(memberSuccess, memberError);
  }

  function loginError(error) {
		FlashService.Error('Error while trying to authenticate to the server');
  }

  function memberSuccess(data) {
    var membershipsInGroups = $filter('filter')(data, { status: 'ACCEPTED' });
    var myWorkingGroups = [];
    
    angular.forEach(membershipsInGroups, function(m) {
      myWorkingGroups.push(m.workingGroup);
    });
    var wg = myWorkingGroups[0];
    localStorageService.set('myWorkingGroups', myWorkingGroups);
    
    if(wg) {
      var currentAssembly = wg.assemblies[0];
      var rsp = Assemblies.assembly(currentAssembly).get();
      rsp.$promise.then(singleAssemblySuccess, singleAssemblyError);
    }
  }
  
  function memberError(error) {
		FlashService.Error('Error while trying to get assemblies from server');
  }

  function singleAssemblySuccess(assembly) {
    localStorageService.set('currentAssembly', assembly);
    var ongoingCampaigns = $filter('filter')(assembly.campaigns, { active: true });
    localStorageService.set('ongoingCampaigns', ongoingCampaigns);
    $state.go('v2.assembly.aid.campaign.cid', {aid: assembly.assemblyId, cid: ongoingCampaigns[0].campaignId}, {reload: true});
  }
  
  function singleAssemblyError(error) {
		FlashService.Error('Error while trying to get assembly from server');
  }
}
}());
