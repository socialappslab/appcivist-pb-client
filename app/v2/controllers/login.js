(function() {
'use strict';

angular
  .module('appCivistApp')
  .controller('v2.LoginCtrl', LoginCtrl);

LoginCtrl.$inject = [
  '$scope', 'localStorageService', 'FlashService', 'AppCivistAuth',
  'Memberships', 'Assemblies', '$state'
];

function LoginCtrl($scope, localStorageService, FlashService, AppCivistAuth,
                   Memberships, Assemblies, $state) {

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
    var rsp = Memberships.memberships(user.userId).query();
    rsp.$promise.then(memberSuccess, memberError);
  }

  function loginError(error) {
		FlashService.Error('Error while trying to authenticate to the server');
  }

  function memberSuccess(data) {
    var member = data[0];
    if(member.workingGroup && member.workingGroup.assemblies) {
      var rsp = Assemblies.assembly(member.workingGroup.assemblies[0]).get();
      rsp.$promise.then(singleAssemblySuccess, singleAssemblyError);
    }
  }
  
  function memberError(error) {
		FlashService.Error('Error while trying to get assemblies from server');
  }

  function singleAssemblySuccess(assembly) {
    $state.go('v2.assembly.aid.campaign.cid', {aid: assembly.assemblyId, cid: assembly.campaigns[0].campaignId}, {reload: true});
  }
  
  function singleAssemblyError(error) {
		FlashService.Error('Error while trying to get assembly from server');
  }
}
}());
