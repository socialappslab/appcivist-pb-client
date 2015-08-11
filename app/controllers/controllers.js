﻿// AppCivist Demo Client - Basic Controllers

/**
 * AccountCtrl - functions to control authentication 
 */
appCivistApp.controller('AccountCtrl', function($scope, $resource, $location,
		localStorageService, appCivistService, loginService) {
	init();

	function init() {
		// check if there is already a user and a sessionKey in the
		// $localStorage
		$scope.user = localStorageService.get("user");
		$scope.sessionKey = localStorageService.get("session_key");

		if ($scope.user != null && $scope.sessionKey != null) {
			// TODO Validate that the Session Key corresponds to the user
			$location.url('/home');
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
		$location.url('/signupform');
	}

	$scope.signout = function() {
		loginService.signOut();
	}
});

/**
 * MainCtrl - this controller checks if the user is loggedIn and loads the main
 * view with the public cover or redirects it to the list of assemblies that the
 * user can view
 * 
 */
appCivistApp.controller('MainCtrl', function($scope, $resource, $location,
		localStorageService, appCivistService, loginService) {

	init();

	function init() {
		// check if there is already a user and a sessionKey in the scope
		if ($scope.user != null && $scope.sessionKey != null) {
			// TODO Validate that the Session Key corresponds to the user
			$location.url('/assemblies');
		} else {
			// check if there is a user and session key in the local storage
			$scope.user = localStorageService.get("user");
			$scope.sessionKey = localStorageService.get("session_key");
			if ($scope.user != null && $scope.sessionKey != null) {
				// TODO Validate that the Session Key corresponds to the user
				$location.url('/assemblies');
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

// This controller retrieves data from the appCivistService and associates it
// with the $scope
// The $scope is bound to the order view
appCivistApp.controller('AssemblyListCtrl', function($scope, $routeParams,
		$resource, appCivistService, loginService, localStorageService) {

	$scope.assemblies = [];
	// I like to have an init() for controllers that need to perform some
	// initialization. Keeps things in
	// one place...not required though especially in the simple example below
	init();

	function init() {
		$scope.assemblies = appCivistService.query();
		$scope.assemblies.$promise.then(function(data) {
			$scope.assemblies = data;
			localStorageService.set("assemblies", $scope.assemblies);
			console.log("Assemblies arrived: " + JSON.stringify($scope.assemblies));
		});
	}
});

// This controller retrieves data from the appCivistService and associates it
// with the $scope
// The $scope is bound to the order view
appCivistApp.controller('AssemblyCtrl',	function($scope, $routeParams, $resource, appCivistService,
						loginService) {
					$scope.currentAssembly = {};
					$scope.comments = 10;
					$scope.questions = 2;
					$scope.issues = 4;
					$scope.ideas = 3;

					// I like to have an init() for controllers that need to
					// perform some initialization. Keeps things in
					// one place...not required though especially in the simple
					// example below
					init();

					function init() {
						// $scope.assemblies = appCivistService.getAssemblies();

						// Grab assemblyID off of the route
						var assemblyID = ($routeParams.assemblyID) ? parseInt($routeParams.assemblyID)
								: 0;
						if (assemblyID > 0) {
							$scope.assembly = appCivistService
									.getCustomer(assemblyID);
						}
					}
				});

appCivistApp.controller('ForumCtrl', function($scope,$http){
	$http.get('assets/comments/comments.json').success(function(data){
		$scope.comments = data;
	}).error(function(error){
		console.log('Error loading data' + error);
	});
});

appCivistApp.controller('CampaignCtrl', function($scope){
	$scope.assemblies = [
		{name:'Mairie de Paris', campaign:'PB Paris'},
		{name:'Fête du Musique 2016', campaign:'PB Paris'},
		{name:'Anti-Eviction Saint Suplice', campaign:'Assemblèe Droit au Logement'}
	];
	$scope.linkedAssembly = $scope.assemblies[1];

	$scope.templates = [
		{name: 'Participatory Budgeting'},
		{name: 'Mobilization'},
		{name: 'Community Organization'},
		{name: 'Create your own...'}
	];
	$scope.selectedTemplate = $scope.templates[1];

	$scope.campaignThemes = [
		{name: 'Urban infrastucture'},
		{name: 'Education'},
		{name: 'Transportation'},
		{name: 'Parks and recreation'}
	]
});

//
////This controller retrieves data from the appCivistService and associates it with the $scope
////The $scope is bound to the orders view
//app.controller('OrdersController', function ($scope, appCivistService) {
//    $scope.assemblies = [];
//
//    //I like to have an init() for controllers that need to perform some initialization. Keeps things in
//    //one place...not required though especially in the simple example below
//    init();
//
//    function init() {
//        $scope.assemblies = appCivistService.getAssemblies();
//    }
//});
//
//app.controller('NavbarController', function ($scope, $location) {
//    $scope.getClass = function (path) {
//        if ($location.path().substr(0, path.length) == path) {
//            return true
//        } else {
//            return false;
//        }
//    }
//});
//
////This controller is a child controller that will inherit functionality from a parent
////It's used to track the orderby parameter and ordersTotal for a assembly. Put it here rather than duplicating 
////setOrder and orderby across multiple controllers.
//app.controller('OrderChildController', function ($scope) {
//    $scope.orderby = 'product';
//    $scope.reverse = false;
//    $scope.ordersTotal = 0.00;
//
//    init();
//
//    function init() {
//        //Calculate grand total
//        //Handled at this level so we don't duplicate it across parent controllers
//        if ($scope.assembly && $scope.assembly.orders) {
//            var total = 0.00;
//            for (var i = 0; i < $scope.assembly.orders.length; i++) {
//                var order = $scope.assembly.orders[i];
//                total += order.orderTotal;
//            }
//            $scope.ordersTotal = total;
//        }
//    }
//
//    $scope.setOrder = function (orderby) {
//        if (orderby === $scope.orderby)
//        {
//            $scope.reverse = !$scope.reverse;
//        }
//        $scope.orderby = orderby;
//    };
//
//});
