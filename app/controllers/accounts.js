// AppCivist Demo Client - Basic Controllers

/**
 * AccountCtrl - functions to control authentication
 */
appCivistApp.controller('AccountCtrl', function($scope, $resource, $location, $uibModal,
		localStorageService, Assemblies, loginService, usSpinnerService) {
	init();
	function init() {
		// create a default newUser object for signup forms
		$scope.newUser = {
			"name": "",
			"lang": "en",
			"repeatPassword": "",
			"password": "",
			"email": ""
		};
		// check if there is already a user and a sessionKey in the $localStorage
		$scope.user = localStorageService.get("user");
        $scope.sessionKey = localStorageService.get("sessionKey");
        $scope.serverBaseUrl = localStorageService.get("serverBaseUrl");
        $scope.votingApiUrl  = localStorageService.get("votingApiUrl");

        if ($scope.serverBaseUrl === undefined || $scope.serverBaseUrl === null) {
            $scope.serverBaseUrl = appCivistCoreBaseURL;
            localStorageService.set("serverBaseUrl", $scope.serverBaseUrl);
            console.log("Setting API Server in AccountCtrl to: "+$scope.serverBaseUrl);
        } else {
            console.log("Using API Server: "+$scope.serverBaseUrl);
        }
        console.log("User in AccountCtrl is: "+$scope.user);

		if ($scope.user != null && $scope.sessionKey != null) {
			// TODO Validate that the Session Key corresponds to the user
			//$location.url('/home');
		} else {
			$scope.user = {};
			$scope.sessionKey = null;
		}
	}

	$scope.userIsAuthenticated = function(){
		return loginService.userIsAuthenticated();
	}

	$scope.login = function() {
		console.log("Signing in with email = " + $scope.email);
		loginService.signIn($scope.user.email, $scope.user.password, $scope);
	}

	$scope.signup = function() {
		loginService.signUp($scope.newUser, $scope);
	}

	$scope.signout = function() {
		loginService.signOut();
	}

	$scope.startSpinner = function(){
		$(angular.element.find('[spinner-key="spinner-1"]')[0]).addClass('spinner-container');
		usSpinnerService.spin('spinner-1');
	}

	$scope.stopSpinner = function(){
		usSpinnerService.stop('spinner-1');
		$(angular.element.find('.spinner-container')).remove();
	}

	$scope.openNewUserModal = function(size)  {
		var modalInstance = $uibModal.open({
				animation: true,
				templateUrl: '/app/partials/signup.html',
				controller: 'NewUserModalCtrl',
				size: size,
				resolve: {
					newUser: function () {
						return $scope.newUser;
					}
				}
		});

		var modalInstance;

		modalInstance.result.then(function (newUser) {
			$scope.newUser = newUser;
			console.log('New User with Username: ' + newUser.username);
		}, function () {
			console.log('Modal dismissed at: ' + new Date());
		});
	};

	$scope.changeServer = function() {
		var serverBaseUrl = localStorageService.get("serverBaseUrl");
		appCivistCoreBaseURL = $scope.serverBaseUrl =
				(serverBaseUrl === appcivist.api.core.development) ?
						appcivist.api.core.testing : appcivist.api.core.development;

		localStorageService.set("serverBaseUrl", $scope.serverBaseUrl);
		console.log("Changing Backend Server from: [" + serverBaseUrl + "] to [" + appCivistCoreBaseURL + "]");
	}

    $scope.changeVotingServer = function() {
		var apiURL = localStorageService.get("votingApiUrl");
		$scope.votingApiUrl = (apiURL === appcivist.api.voting.development) ? appcivist.api.voting.production : appcivist.api.voting.development;
		localStorageService.set("votingApiUrl", $scope.votingApiUrl);
		console.log("Changing Backend Server from: [" + apiURL + "] to [" + $scope.votingApiUrl + "]");
	}

});


appCivistApp.controller('NewUserModalCtrl', function($scope, $resource, $location, $uibModalInstance, newUser,
													 localStorageService, Assemblies, loginService, usSpinnerService) {
	init();
	function init() {
		$scope.newUser = newUser;
	}

	$scope.signup = function() {
		loginService.signUp($scope.newUser, $scope, $uibModalInstance);
	}

});

appCivistApp.controller('NewInvitationModalCtrl', function($scope, $resource, $location, $uibModalInstance,
														   target, type, defaultEmail, Invitations, localStorageService, Assemblies,
														   loginService, usSpinnerService) {
	init();
	function init() {
		$scope.targetId = type === 'ASSEMBLY' ? target.assemblyId : target.groupId;
		$scope.type = type;
		$scope.defaultEmail = defaultEmail;
		$scope.newInvitation = Invitations.defaultInvitation($scope.targetId, $scope.type, $scope.defaultEmail);

		$scope.sendInvitation = function() {
			var invitation;
			if(type === 'ASSEMBLY') {
				invitation = Invitations.assemblyInvitation($scope.targetId).save($scope.newInvitation);
			} else {
				invitation = Invitations.groupInvitation($scope.targetId).save($scope.newInvitation);
			}

			invitation.$promise.then(
					function (response){
						$uibModalInstance.close(response);
					},
					function (error) {
						$uibModalInstance.dismiss('cancel');
					}
			);
		}
	}
});
