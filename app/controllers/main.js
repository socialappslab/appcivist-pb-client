// AppCivist Demo Client - Basic Controllers

/**
 * MainCtrl - this controller checks if the user is loggedIn and loads the main
 * view with the public cover or redirects it to the list of assemblies that the
 * user can view
 *
 */
appCivistApp.controller('MainCtrl', function($scope, $resource, $location,
											 localStorageService, Assemblies, loginService) {
	init();

	function init() {
		var user = $scope.user = localStorageService.get("user");
		var sessionKey = $scope.sessionKey = localStorageService.get("sessionKey");
		var serverBaseurl = $scope.serverBaseUrl = localStorageService.get("serverBaseUrl");

		if ($scope.serverBaseUrl == undefined || $scope.serverBaseUrl == null) {
			$scope.serverBaseUrl = appCivistCoreBaseURL;
			localStorageService.set("serverBaseUrl", appCivistCoreBaseURL);
			console.log("Setting API Server in MainCtrl to: "+appCivistCoreBaseURL);
		} else {
			console.log("Using API Server: "+$scope.serverBaseUrl);
		}

		// does scope already has the user and the sessionKey?
		console.log("User in MainCtrl is: "+user);

		// check if there is already a user and a sessionKey in the scope
		if (user != null && sessionKey != null) {
			// TODO Validate that the Session Key corresponds to the user
			$location.url('/home');
		} else {
			if (user != null && sessionKey != null) {
				// TODO Validate that the Session Key corresponds to the user
				$location.url('/home');
			} else {
				$scope.user = {};
				$scope.sessionKey = null;
			}
		}
	}

	$scope.login = function(email, password) {
		$scope.user = loginService.signIn(email, password);
	}
});