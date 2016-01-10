/**
 * Voting Page
 */
 // The ballot UUID to use: 68643fbf-9a30-4b81-83d1-439947711a46
appCivistApp.controller('ballotVoteCtrl', function($scope, $http, $routeParams, $location, Ballot, BallotPaper, Candidate, localStorageService) {
	$scope.candidates = [];
	$scope.themeMap = {};
	$scope.themes = [];
	$scope.scores = {};

  $scope.signature = localStorageService.get("voteSignature");
  console.log($scope.signature)

  console.log("Fetching the ballot paper")
  var ballotPaper = BallotPaper.get({uuid: $routeParams.uuid, signature: $scope.signature}).$promise;
  ballotPaper.then(function(data){
    console.log(data)
    console.log("Retreived voting ballot from server.");
    $scope.ballot = data.ballot;
    $scope.vote   = data.vote;

    // This stitches the results from /ballot/:uuid/vote/:signature with the mock candidates.
    for (var candidateUuid = 1; candidateUuid < 5; candidateUuid++) {
      var voteFromAPI = $scope.vote.votes.filter(function(el) {return el.candidate_id == candidateUuid});

      var value = null;
      if (voteFromAPI && voteFromAPI[0]) {
        console.log(voteFromAPI[0])
        value = voteFromAPI[0].value;
      }

      console.log(value)
      $scope.candidates.push(Candidate.get({uuid: candidateUuid, value: value}))
    };

    console.log($scope.candidates)

    for(var i = 0; i < $scope.candidates.length; i++){
  		var candidate = $scope.candidates[i];
      for(var j = 0; j < candidate.themes.length;j++){
  			var theme = candidate.themes[j];
  			if (theme in $scope.themeMap){
  				$scope.themeMap[theme][$scope.themeMap[theme].length] = candidate.title;
  			} else {
  				$scope.themeMap[theme] = [];
  				$scope.themeMap[theme][0] = candidate.title;
  				$scope.themes[$scope.themes.length] = theme;
  			}
  		}
  	}

    // if ($scope.vote){
    //   for(var i=0;i<$scope.vote.voteValues.length;i++){
    //     var candidate = $scope.votingBallotVote.voteValues[i];
    //     $scope.scores[candidate.selectedCandidate.uuid] = candidate.voteValue;
    //   }
    // } else {
    //   for(var i=0;i<$scope.candidates.length;i++)
    //     $scope.scores[$scope.candidates[i].uuid]="/100";
    // }

  },
  function(error){
    window.appcivist.handleError(error);
  });

  $scope.minimumPossibleScore = function() {
    if ($scope.ballot) {
      return $scope.ballot.ballot_configurations[0].value;
    } else
      return 234234324;
  }

  $scope.maximumPossibleScore = function() {
    if ($scope.ballot) {
      return $scope.ballot.ballot_configurations[1].value;
    } else
      return 234234234;
  }

	$scope.saveBallot = function() {
    console.log("Candidates: ")
    console.log($scope.candidates)

    var ballot_paper = BallotPaper.update({uuid: $routeParams.uuid, signature: $scope.signature}, {vote: {votes: $scope.candidates}}).$promise;
    ballot_paper.then(function(data){
      console.log(data);
      $location.url("/ballot/" + $routeParams.uuid + "/summary");
    }, function(error) {
      alert(error.data.error);
      return;
    })
	}
});
