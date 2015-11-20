// AppCivist Demo Client - Basic Controllers

/**
 * AccountCtrl - functions to control authentication 
 */
appCivistApp.controller('AccountCtrl', function($scope, $resource, $location,
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
		var user = $scope.user = localStorageService.get("user");
        var sessionKey = $scope.sessionKey = localStorageService.get("sessionKey");
        var serverBaseurl = $scope.serverBaseUrl = localStorageService.get("serverBaseUrl");

        if ($scope.serverBaseUrl == undefined || $scope.serverBaseUrl == null) {
            $scope.serverBaseUrl = appCivistCoreBaseURL;
            localStorageService.set("serverBaseUrl", appCivistCoreBaseURL);
            console.log("Setting API Server in AccountCtrl to: "+appCivistCoreBaseURL);
        } else {
            console.log("Using API Server: "+$scope.serverBaseUrl);
        }
        console.log("User in AccountCtrl is: "+user);

		if (user != null && sessionKey != null) {
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
});