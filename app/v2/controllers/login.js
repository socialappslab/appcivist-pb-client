(function() {
'use strict';

angular
  .module('appCivistApp')
  .controller('v2.LoginCtrl', LoginCtrl);

LoginCtrl.$inject = [
  '$scope', 'localStorageService', 'FlashService', 'AppCivistAuth',
  '$state', '$filter', 'loginService'
];

function LoginCtrl($scope, localStorageService, FlashService, AppCivistAuth,
                   $state, $filter, loginService) {

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
    loginService.loadAuthenticatedUserMemberships(user).then(function() {
      var ongoingCampaigns = localStorageService.get('ongoingCampaigns');
      var assembly = localStorageService.get('currentAssembly');
      $state.go('v2.assembly.aid.campaign.cid', {aid: assembly.assemblyId, cid: ongoingCampaigns[0].campaignId}, {reload: true});
      location.reload();
    }); 
  }

  function loginError(error) {
		FlashService.Error('Error while trying to authenticate to the server');
  }
}
}());
