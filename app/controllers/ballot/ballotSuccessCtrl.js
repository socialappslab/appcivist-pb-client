/**
 * Voting Landing Page
 */
appCivistApp.controller('ballotSuccessCtrl', function($scope, $routeParams, $location, BallotPaper, localStorageService){
	$scope.signature = localStorageService.get("voteSignature");

  $scope.createBallotPaper = function() {
    var ballot = BallotPaper.save({uuid: $routeParams.uuid}, {vote: {signature: $scope.signature}});
		ballot.$promise.then(function(data){
      localStorageService.set("voteSignature", data.vote.signature);
      $location.url("/ballot/" + $routeParams.uuid + "/vote");
		}, function(error) {
      // If the error code is 409, then that means the signature already exists.
      // Let's redirect the user back to register so they can login with their signature.
      if (error.status === 409)
        $location.url("/ballot/" + $routeParams.uuid + "/register");

      window.appcivist.handleError(error);
		})
  }

  $scope.returnToRegister = function() {
    $location.url("/ballot/" + $routeParams.uuid + "/register");
  }
});
