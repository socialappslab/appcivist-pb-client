// AppCivist Demo Client - Basic Controllers

/**
 * MainCtrl - this controller checks if the user is loggedIn and loads the main
 * view with the public cover or redirects it to the list of assemblies that the
 * user can view
 *
 */
appCivistApp.controller('MainCtrl', function($scope, $resource, $location,
											 localStorageService, Assemblies, loginService, $route) {
	$scope.route = $route;
	init();

	function init() {
		var user = $scope.user = localStorageService.get("user");
		var sessionKey = $scope.sessionKey = localStorageService.get("sessionKey");
		var serverBaseurl = $scope.serverBaseUrl = localStorageService.get("serverBaseUrl");
		var etherpadServer = $scope.etherpadServer = localStorageService.get("etherpadServer");

		if ($scope.serverBaseUrl === undefined || $scope.serverBaseUrl === null) {
			$scope.serverBaseUrl = appCivistCoreBaseURL;
			localStorageService.set("serverBaseUrl", appCivistCoreBaseURL);
			console.log("Setting API Server in MainCtrl to: " + appCivistCoreBaseURL);
		} else {
			console.log("Using API Server: " + $scope.serverBaseUrl);
		}

		if ($scope.etherpadServer === undefined || $scope.etherpadServer === null ) {
			etherpadServer = $scope.etherpadServer = etherpadServerURL;
			localStorageService.set("etherpadServer", etherpadServerURL);
			console.log("Setting Etherpad Server in MainCtrl to: " + etherpadServerURL);
		} else {
			console.log("Using Etherpad Server: " + $scope.etherpadServer);
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

		$scope.assemblies = Assemblies.assembliesWithoutLogin().query();
		$scope.assemblies.$promise.then(function(data) {
			$scope.assemblies = data;
			localStorageService.set("assemblies", $scope.assemblies);
		});
	}

	$scope.searchMoreAssemblies = function() {
		$scope.assemblies = Assemblies.assembliesWithoutLogin().query();
		$scope.assemblies.$promise.then(function(data) {
			$scope.assemblies = data;
			localStorageService.set("assemblies", $scope.assemblies);
		});
	}

	$scope.login = function(email, password) {
		$scope.user = loginService.signIn(email, password);
	}
});