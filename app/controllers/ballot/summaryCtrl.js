/**
 * Summary of one's voting choices
 */
appCivistApp.controller('ballotVoteSummaryCtrl', function($scope, $routeParams, $location, BallotPaper, Candidate, localStorageService){
  var ballotPaper = BallotPaper.get({uuid: $routeParams.uuid, signature: localStorageService.get("voteSignature")}).$promise;
  ballotPaper.then(function(data){
    console.log(data)
    console.log("Retreived voting ballot from server.");
    $scope.ballot = data.ballot;
    $scope.vote   = data.vote;
    $scope.candidates = [];

    // This stitches the results from /ballot/:uuid/vote/:signature with the mock candidates.
    for (var candidateUuid = 1; candidateUuid < 5; candidateUuid++) {
      var voteFromAPI = $scope.vote.votes.filter(function(el) {return el.candidate_id == candidateUuid});

      var value = null;
      if (voteFromAPI && voteFromAPI[0]) {
        console.log(voteFromAPI[0])
        value = voteFromAPI[0].value;
      }

      $scope.candidates.push(Candidate.get({uuid: candidateUuid, value: value}))
    };

    $scope.scoredCandidates = $scope.candidates.filter(function(c) { return c.value; });
  }, function(error){ window.appcivist.handleError(error); });

  $scope.transitionToVoting = function() {
    $location.url("ballot/" + $routeParams.uuid + "/vote");
  }

	$scope.submitBallotPaper = function(){
    var ballot_paper = BallotPaper.complete(
      {uuid: $routeParams.uuid, signature: localStorageService.get("voteSignature")},
      {vote: {status: 1}}
    ).$promise;
    ballot_paper.then(function(data){
      console.log(data);
      $location.url("/ballot/" + $routeParams.uuid + "/result");
    }, function(error) { window.appcivist.handleError(error); })
	}
});
