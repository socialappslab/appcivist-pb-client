	// AppCivist Demo Client - Basic Controllers

/**
 * MainCtrl - this controller checks if the user is loggedIn and loads the main
 * view with the public cover or redirects it to the list of assemblies that the
 * user can view
 *
 */
appCivistApp.controller('MainCtrl', function($scope, $resource, $location, localStorageService,
											 Assemblies, loginService, $route, $routeParams, usSpinnerService, $uibModal) {
	init();

	function init() {
		$scope.route = $route;
		$scope.user = localStorageService.get("user");
		$scope.sessionKey = localStorageService.get("sessionKey");
		$scope.serverBaseUrl = localStorageService.get("serverBaseUrl");
    $scope.votingApiUrl  = localStorageService.get("votingApiUrl");
		$scope.etherpadServer = localStorageService.get("etherpadServer");
		$scope.info = localStorageService.get("help");
		$scope.userVotes = localStorageService.get("userVotes");
		$scope.assembliesLoading = false;

		if ($scope.serverBaseUrl === undefined || $scope.serverBaseUrl === null) {
			$scope.serverBaseUrl = appCivistCoreBaseURL;
			localStorageService.set("serverBaseUrl", appCivistCoreBaseURL);
			console.log("Setting API Server in MainCtrl to: " + appCivistCoreBaseURL);
		} else {
			console.log("Using API Server: " + $scope.serverBaseUrl);
		}

    if ($scope.votingApiUrl)
      console.log("Using Voting API Server: " + $scope.votingApiUrl);
		else {
      $scope.votingApiUrl = votingApiUrl;
			localStorageService.set("votingApiUrl", $scope.votingApiUrl);
			console.log("Setting Voting API Server in MainCtrl to: " + $scope.votingApiUrl);
		}

		if ($scope.etherpadServer === undefined || $scope.etherpadServer === null ) {
			$scope.etherpadServer = etherpadServerURL;
			localStorageService.set("etherpadServer", etherpadServerURL);
			console.log("Setting Etherpad Server in MainCtrl to: " + etherpadServerURL);
		} else {
			console.log("Using Etherpad Server: " + $scope.etherpadServer);
		}

		if ($scope.info === undefined || $scope.info === null) {
			$scope.info = helpInfo;
			localStorageService.set("help", $scope.info);
		}

		if (!$scope.userVotes) {
			$scope.userVotes = [];
			localStorageService.set("userVotes", $scope.userVotes);
		}

		// does scope already has the user and the sessionKey?
		console.log("User in MainCtrl is: " + $scope.user);

		authCheck($scope.user,$scope.sessionKey);
		loadListedAssemblies();

        //$scope.$watch(appCivistCoreBaseURL,function() {
        //    loadListedAssemblies();
        //}, true);
	}

	// TODO: Redirect to the real search query
	$scope.searchMoreAssemblies = function(query) {
		searchAssemblies(query);
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
				(serverBaseUrl === backendServers.remoteDev) ?
						backendServers.localDev : backendServers.remoteDev;

		localStorageService.set("serverBaseUrl", $scope.serverBaseUrl);
		console.log("Changing Backend Server from: [" + serverBaseUrl + "] to [" + appCivistCoreBaseURL + "]");
	}

  $scope.changeVotingServer = function() {
		var apiURL = localStorageService.get("votingApiUrl");
		$scope.votingApiUrl = (apiURL === appcivist.api.voting.development) ? appcivist.api.voting.production : appcivist.api.voting.development;
		localStorageService.set("votingApiUrl", $scope.votingApiUrl);
		console.log("Changing Backend Server from: [" + apiURL + "] to [" + $scope.votingApiUrl + "]");
	}

	function authCheck(user, sessionKey) {
		// check if there is already a user and a sessionKey in the scope
		// TODO: Implement login/session control like this: http://plnkr.co/edit/tg25kr?p=preview

		if (user != null && sessionKey != null) {
			// TODO Validate that the Session Key corresponds to the user
			//$location.url('/home');
		} else {
			$scope.user = {};
			$scope.sessionKey = null;
		}
	}

	function loadListedAssemblies() {
		// Load 'listed' assemblies
		$scope.assembliesLoading = true;
		$scope.assemblies = Assemblies.assembliesWithoutLogin().query();
		$scope.assemblies.$promise.then(
				function(data) {
					$scope.assemblies = data;
					localStorageService.set("assemblies", $scope.assemblies);
					$scope.assembliesLoading = false;
				},
				function(error) {
					$scope.error = error;
					$scope.assembliesLoading = false;
				}
		);
	}

	function searchAssemblies(query) {
		// Searching 'listed' assemblies
		$scope.assembliesLoading = true;
		$scope.assemblies = Assemblies.assembliesByQuery(query).query();
		$scope.assemblies.$promise.then(
				function(data) {
					$scope.assemblies = data;
					localStorageService.set("assemblies", $scope.assemblies);
					$scope.assembliesLoading = false;
				},
				function(error) {
					$scope.error = error;
					$scope.assembliesLoading = false;
				}
		);
	}
});



appCivistApp.controller('InvitationCtrl', function($scope, $resource, $location, localStorageService,
												   Assemblies, loginService, $route, $routeParams, usSpinnerService, $uibModal,
												   Invitations, WorkingGroups, Memberships) {
	init();

	function init() {

		$scope.token = $routeParams.uuid;
		$scope.errors = [];
		console.log("Reading invitation: "+$scope.token);
		$scope.invitation = Invitations.invitation($scope.token).get();
		$scope.newUser = {};
		$scope.newUser.lang = 'en';
		$scope.newUser.invitationToken = $scope.token;

		$scope.invitation.$promise.then(
				function (response) {
					$scope.invitation = response;
				},
				function (error) {
					$scope.errors.push(error.data);
				}
		);

		$scope.sendResponse = function (resp) {
			$scope.invitation.status = resp;
			$scope.response = Invitations.invitation($scope.token).update($scope.invitation);
		}

		$scope.acceptInvitationAndSignup = function() {
			loginService.signUp($scope.newUser);
		}
	}
});