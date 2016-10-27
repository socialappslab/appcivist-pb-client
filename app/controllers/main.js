	// AppCivist Demo Client - Basic Controllers

/**
 * MainCtrl - this controller checks if the user is loggedIn and loads the main
 * view with the public cover or redirects it to the list of assemblies that the
 * user can view
 *
 */
appCivistApp.controller('MainCtrl', function($scope, $resource, $location, localStorageService, $translate,
											 Assemblies, loginService, $route, $routeParams, usSpinnerService,
											 $uibModal, LocaleService, LOCALES) {
	init();

	function init() {
		$scope.route = $route;
		$scope.user = localStorageService.get("user");
		if ($scope.user && $scope.user.language) {
			LocaleService.setLocale($scope.user.language);
		}

		$scope.currentLocaleDisplayName = LocaleService.getLocaleDisplayName();
		$scope.localesDisplayNames = LocaleService.getLocalesDisplayNames();

		$scope.sessionKey = localStorageService.get("sessionKey");
		$scope.serverBaseUrl = localStorageService.get("serverBaseUrl");
    	$scope.votingApiUrl  = localStorageService.get("votingApiUrl");
		$scope.etherpadServer = localStorageService.get("etherpadServer");
		$scope.info = localStorageService.get("help");
		$scope.userVotes = localStorageService.get("userVotes");
		$scope.assembliesLoading = false;
		$scope.onlyLanding = localStorageService.get("onlyLanding");

		// New User Object to be used by signup forms
		$scope.newUser = {
			"name": "",
			"lang": "en",
			"repeatPassword": "",
			"password": "",
			"email": ""
		};


		$scope.changeLanguage = function (locale) {
			LocaleService.setLocaleByDisplayName(locale);
		};

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

	$scope.signup = function() {
		$scope.newUser.lang = LocaleService.getLocale();
		if (!$scope.newUser.lang) {
			$scope.newUser.lang = LOCALES.preferredLocale;
		}
		loginService.signUp($scope.newUser, $scope, $uibModalInstance);
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
												   Assemblies, loginService, $route, $routeParams, usSpinnerService,
												   $uibModal, Invitations, WorkingGroups, Memberships, FlashService,
												   LocaleService, LOCALES) {
	init();

	function init() {

		$scope.token = $routeParams.uuid;
		$scope.errors = [];
		console.log("Reading invitation: "+$scope.token);
		$scope.invitation = Invitations.invitation($scope.token).get();
		$scope.newUser = {};
		$scope.newUser.lang = 'en';
		$scope.newUser.invitationToken = $scope.token;


		$scope.currentLocaleDisplayName = LocaleService.getLocaleDisplayName() ?
				LocaleService.getLocaleDisplayName() : LOCALES.locales[LOCALES.preferredLocale];
		$scope.localesDisplayNames = LocaleService.getLocalesDisplayNames();

		$scope.changeLanguage = function (locale) {
			LocaleService.setLocaleByDisplayName(locale);
		};

		$scope.invitation.$promise.then(
				function (response) {
					$scope.invitation = response;
					$scope.newUser.email = $scope.invitation.email;
				},
				function (error) {
					$scope.errors.push(error.data);
				}
		);

		$scope.sendResponse = function (resp) {
			$scope.response = Invitations.invitationResponse($scope.token, resp).update();
			$scope.response.$promise.then(
					function (data)	{
						$location.url("/assembly/"+$scope.invitation.targetId+"/forum");
					},
					function (error) {
						FlashService.Error("An error occured while trying to answer your invitation: "+JSON.stringify(error));
					}
			);
		}

		$scope.acceptInvitationAndSignup = function() {
			$scope.newUser.lang = LocaleService.getLocale();
			if (!$scope.newUser.lang) {
				$scope.newUser.lang = LOCALES.preferredLocale;
			}
			loginService.signUp($scope.newUser, $scope);
		}
	}
});

appCivistApp.controller('ErrorModalCtrl', function($scope, $rootScope, $translate, $uibModalInstance,
												   localStorageService, FlashService, LocaleService, LOCALES,
												   error, resourceType, resourceId, supportContact) {
	init();

	function init() {

		$scope.error = error;
		var errorMsg = error.data ? error.data.statusMessage : "Server is offline";
		var errorStatus = error.data ? error.data.responseStatus : "OFFLINE";
		$scope.errorMsg = errorMsg;
		$scope.errorStatus = errorStatus;
		$scope.resourceType = resourceType;
		$scope.resourceId = resourceId;
		$scope.supportContact = supportContact;
		$scope.user = localStorageService.get("user");
		if ($scope.user && $scope.user.language)
			$translate.use($scope.user.language);

		$scope.cancel = function () {
			$uibModalInstance.dismiss('cancel');
		};
	}
});

appCivistApp.controller('AlertModalCtrl', function($scope, $rootScope, $translate, $uibModalInstance,
												   localStorageService, FlashService, LocaleService, LOCALES,
												   title, message, allowCancelOption, messageExtra) {
	init();

	function init() {

		$scope.title = title;
		$scope.message = message;
		$scope.allowCancelOption = allowCancelOption;
		$scope.messageExtra = messageExtra;
		$scope.user = localStorageService.get("user");
		if ($scope.user && $scope.user.language)
			$translate.use($scope.user.language);

		$scope.cancel = function () {
			$uibModalInstance.dismiss('cancel');
		};

		$scope.ok = function () {
			$uibModalInstance.dismiss('ok');
		};
	}
});
