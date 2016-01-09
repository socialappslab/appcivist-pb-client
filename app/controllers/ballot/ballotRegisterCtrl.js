// This controller retrieves data from the Assemblies and associates it
// with the $scope
// The $scope is bound to the order view
appCivistApp.controller('ballotRegisterCtrl', function($scope, $http, $routeParams, $location, Ballot, localStorageService) {
  var ballot = Ballot.get({uuid:$routeParams.uuid}).$promise;
  ballot.then(function(data) {
    console.log(data)
    $scope.ballot = data;
  }, function(error) {
    alert(data);
  });

	$scope.createBallotPaper = function() {
		var ballot = Ballot.save({uuid: $routeParams.uuid}, {ballot_registration_fields: $scope.ballot.ballot_registration_fields});
		ballot.$promise.then(function(data){
      console.log("Posted voting registration form.");
      alert("You've successfully registered! Your unique registration signature is " + data.signature + ". Please record it to access your ballot at a later date.")
      $location.url("/ballot/" + $routeParams.uuid + "/vote");
		}, function(error) {
			alert("Sorry, the provided information cannot generate a valid voting ballot.");
			return;
		})
	};

	$scope.loadBallot = function(){
		/*uncomment when backend is ready*/
		// var signature = Ballot.signature($scope.uuid).get();
		// signature.$promise.then(
		// 	function(data){
		// 		$scope.signature = data;
		// 		console.log("Retreived signature from server.");
		// 	},
		// 	function(error){
		// 		alert("Sorry, no valid signature under this username can be retreived.");
		// 		return;
		// 	}
		// )
		// var ballot = Ballot.ballot($scope.uuid, $scope.signature).get();
		// ballot.$promise.then(
		// 	function(data){
		// 		$scope.votingBallot = data;
		// localStorageService.set("currentBallot", data);
		// $location.url('/ballot/'+$scope.votingBallot.uuid+"/voting");
		// 	},
		// 	function(error){
		// 		alert("Sorry, no valid voting ballot can be retreived using this signature.");
		// 		return;
		// 	}
		// )

		$scope.signature = Ballot.signature($scope.uuid);
		$scope.votingBallot = Ballot.ballot($scope.uuid, $scope.signature).ballot;
		localStorageService.set("currentBallot", Ballot.ballot($scope.uuid, $scope.signature));
		$location.url('/ballot/'+$scope.votingBallot.uuid+"/vote");
	}

});
