	// AppCivist Demo Client - Basic Controllers

/**
 * MainCtrl - this controller checks if the user is loggedIn and loads the main
 * view with the public cover or redirects it to the list of assemblies that the
 * user can view
 *
 */
appCivistApp.controller('MainCtrl', function($scope, $resource, $location, localStorageService, Assemblies, loginService, $route) {
	$scope.route = $route;
	init();

	function init() {
		var user = $scope.user = localStorageService.get("user");
		var sessionKey = $scope.sessionKey = localStorageService.get("sessionKey");
		var serverBaseurl = $scope.serverBaseUrl = localStorageService.get("serverBaseUrl");
		var etherpadServer = $scope.etherpadServer = localStorageService.get("etherpadServer");
		var info = $scope.info = localStorageService.get("help");

		$scope.assembliesLoading = false;


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

		if ($scope.info === undefined || $scope.info === null) {
			info = $scope.info = helpInfo;
			localStorageService.set("help",info);
		}

		// does scope already has the user and the sessionKey?
		console.log("User in MainCtrl is: "+user);

		authCheck(user,sessionKey);
		loadListedAssemblies();
	}

	// TODO: Redirect to the real search query
	$scope.searchMoreAssemblies = function(query) {
		searchAssemblies(query);
	}

	$scope.login = function(email, password) {
		$scope.user = loginService.signIn(email, password);
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

	$scope.page1Msg = "A platform for democratic assembly and collective action."; 
	$scope.nameText = "Name"; 
	$scope.pwText = "Password"; 
	$scope.signUpText = "Sign Up"; 
	$scope.logInText = "Log In"; 
	$scope.p2Msg = "AppCivist empowers local or global Assemblies to run Campaigns that address the community's concerns."; 
	$scope.p2Step1 = "CREATE OR JOIN AN ASSEMBLY"; 
	$scope.p2s1Text = "Assemblies are communities of people with a shared concern, like neighborhood safety, city budgets, or climate change."; 
	$scope.p2Step2 = "CREATE A CAMPAIGN"; 
	$scope.p2s2Text = "Define a problem that your assembly can provide solutions for within a given timeframe."; 
	$scope.p2Step3 = "SUBMIT AND EVALUATE PROPOSALS"; 
	$scope.p2s3Text = "Empower assembly members to develop proposals, ultimately choosing the best to implement."; 
	$scope.p3Title = "Decision Making Components"; 
	$scope.p3Msg = "AppCivist provides a framework for collaborative solution development."; 
	$scope.propMaking = "PROPOSAL MAKING"; 
	$scope.PMs1 = "Brainstorming"; 
	$scope.PMs2 = "Forming Working Groups"; 
	$scope.PMs3 = "Drafting Proposals"; 
	$scope.versioning = "VERSIONING"; 
	$scope.versS1 = "Proposal Editing"; 
	$scope.versS2 = "Finalizing Proposals"; 
	$scope.versS3 = "Proposal Selection"; 
	$scope.deliberation = "DELIBERATION"; 
	$scope.delibS1 = "Expert Review"; 
	$scope.delibs2 = "Open Discussion"; 
	$scope.voting = "Voting"; 
	$scope.votingS1 = "Selection"; 
	$scope.p3Msg = "AppCivist provides customizable tools for democratic action."; 
	$scope.versForums = "Versioning Forums"; 
	$scope.VF_1 = "Moderated / Unmoderated"; 
	$scope.VF_2 = "Upvoting / Downvoting"; 
	$scope.VF_3 = "Chronological / Weighted"; 
	$scope.VF_4 = "Public / Private"; 
	$scope.voteProcess = "Voting Processes"; 
	$scope.VP_1 = "Simple democratic"; 
	$scope.VP_2 = "Random Jury"; 
	$scope.VP_3 = "Ranked Options"; 
	$scope.VP_4 = "Budget Constrained"; 
	$scope.suppFunc = "Supporting Functionality"; 
	$scope.SF_1 = "Data Visualization"; 
	$scope.SF_2 = "Mapping"; 
	$scope.SF_3 = "Mobilizing"; 
	$scope.SF_4 = "Group Messaging"; 
	$scope.createOrJoin = "Create or Join an Assembly"; 
});