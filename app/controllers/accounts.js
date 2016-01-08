﻿// AppCivist Demo Client - Basic Controllers

/**
 * AccountCtrl - functions to control authentication 
 */
appCivistApp.controller('AccountCtrl', function($scope, $resource, $location,/* $uibModal,*/
		localStorageService, Assemblies, loginService, usSpinnerService) {
	init();
	function init() {
		// check if there is already a user and a sessionKey in the
		// $localStorage
		$scope.newUser = {
			"name": "",
			"lang": "en",
			"repeatPassword": "",
			"password": "",
			"email": ""
		};
		$scope.user = localStorageService.get("user");
        $scope.sessionKey = localStorageService.get("sessionKey");
        $scope.serverBaseUrl = localStorageService.get("serverBaseUrl");

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
		loginService.signIn($scope.user.email, $scope.user.password);
	}

	$scope.signup = function() {
		loginService.signUp($scope.newUser);
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
		/*var modalInstance = $uibModal.open({
			animation: true,
			templateUrl: '/app/partials/signup.html',
			controller: 'NewUserModalCtrl',
			size: size,
			resolve: {
				newUser: function () {
					return $scope.newUser;
				}
			}
		});*/

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
				(serverBaseUrl === backendServers.remoteDev) ?
						backendServers.localDev : backendServers.remoteDev;

		localStorageService.set("serverBaseUrl", $scope.serverBaseUrl);
		console.log("Changing Backend Server from: [" + serverBaseUrl + "] to [" + appCivistCoreBaseURL + "]");
	}
});


appCivistApp.controller('NewUserModalCtrl', function($scope, $resource, $location, /*$uibModalInstance, */newUser,
													 localStorageService, Assemblies, loginService, usSpinnerService) {
	init();
	function init() {
		$scope.newUser = newUser;
	}

	$scope.signup = function() {
		//loginService.signUp($scope.newUser, $uibModalInstance);
	}

});