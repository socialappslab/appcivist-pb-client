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
      transitionToVoting();
		}, function(error) {
			alert("Sorry, the provided information cannot generate a valid voting ballot.");
			return;
		})
	};

	$scope.loadBallotPaper = function(){
		var ballotPaper = BallotPaper.get({uuid: $routeParams.uuid, signature: $scope.signature}).$promise;
	  ballotPaper.then(function(data){
      console.log(data)
      $scope.signature = data;
      // transitionToVoting();
    }, function(error) {
      alert("Sorry, no valid signature under this username can be retreived.");
      return;
    });
  }

  var transitionToVoting = function() {
    $location.url("/ballot/" + $routeParams.uuid + "/vote");
  }
});
