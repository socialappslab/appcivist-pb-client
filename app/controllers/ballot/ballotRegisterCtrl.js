// This controller retrieves data from the Assemblies and associates it
// with the $scope
// The $scope is bound to the order view
appCivistApp.controller('ballotRegisterCtrl', function($scope, $routeParams, $location, Ballot, BallotPaper, localStorageService) {
  $scope.signature = localStorageService.get("voteSignature");

  var ballot = Ballot.get({uuid:$routeParams.uuid}).$promise;
  ballot.then(function(data) {
    console.log(data)
    $scope.ballot = data;
  }, function(error){ window.appcivist.handleError(error); });

	$scope.generateSignature = function() {
		var ballot = Ballot.save({uuid: $routeParams.uuid}, {ballot_registration_fields: $scope.ballot.ballot_registration_fields});
		ballot.$promise.then(function(data){
      console.log("Posted voting registration form.");
      localStorageService.set("voteSignature", data.signature);
      $location.url("/ballot/" + $routeParams.uuid + "/success");
		}, function(error){ window.appcivist.handleError(error); })
	};

	$scope.loadBallotPaper = function(){
    if (!$scope.signature)
      return;
		var ballotPaper = BallotPaper.get({uuid: $routeParams.uuid, signature: $scope.signature}).$promise;
	  ballotPaper.then(function(data){
      localStorageService.set("voteSignature", $scope.signature);
      $location.url("/ballot/" + $routeParams.uuid + "/vote");
    }, function(error){ window.appcivist.handleError(error); });
  }
});
