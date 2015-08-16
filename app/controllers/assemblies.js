// This controller retrieves data from the Assemblies and associates it
// with the $scope
// The $scope is bound to the order view
appCivistApp.controller('AssemblyListCtrl', function($scope, $routeParams,
													 $resource, Assemblies, loginService, localStorageService) {

	$scope.assemblies = [];
	$scope.serverBaseUrl = localStorageService.get("serverBaseUrl");

	init();

	function init() {
		$scope.assemblies = Assemblies.query();
		$scope.assemblies.$promise.then(function(data) {
			$scope.assemblies = data;
			localStorageService.set("assemblies", $scope.assemblies);
			console.log("Assemblies arrived: " + JSON.stringify($scope.assemblies));
		});
	}
});

// This controller retrieves data from the Assemblies and associates it
// with the $scope
// The $scope is bound to the order view
appCivistApp.controller('AssemblyCtrl',	function($scope, $routeParams, $resource, $http, Assemblies,
													loginService, localStorageService) {
	$scope.currentAssembly = {};
	$scope.newAssembly = {};
	$scope.comments = 10;
	$scope.questions = 2;
	$scope.issues = 4;
	$scope.ideas = 3;

	console.log("Loading Assembly: "+$routeParams.aid);

	// I like to have an init() for controllers that need to
	// perform some initialization. Keeps things in
	// one place...not required though especially in the simple
	// example below
	init();

	function init() {

		// Grab assemblyID off of the route
		var assemblyID = ($routeParams.aid) ? parseInt($routeParams.aid)
			: 0;
		if (assemblyID > 0) {
			var currentAssembly = Assemblies.get({assemblyId: assemblyID}, function() {
				$scope.currentAssembly = currentAssembly;
				localStorageService.set("currentAssembly", $scope.currentAssembly);
				console.log("Obtained assembly: " + JSON.stringify($scope.currentAssembly));
			});
		}

		$http.get('assets/comments/comments.json').success(function(data){
			$scope.comments = data;
		}).error(function(error){
			console.log('Error loading data' + error);
		});
	}


	$scope.createNewAssembly = function(step) {
		if (step === 1) {
			console.log("Creating assembly with name = "+$scope.newAssembly.name);
			console.log("Creating assembly with description = "+$scope.newAssembly.description);
		} else if (step === 2) {
			console.log("Creating new Assembly: " + $scope.newAssembly);
			var newAssembly = Assemblies.save($scope.newAssembly, function() {
				console.log("Created assembly: "+newAssembly);
			});
		}
	}

});