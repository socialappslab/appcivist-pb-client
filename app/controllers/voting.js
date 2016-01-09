

/**
 * Summary of one's voting choices
 */
appCivistApp.controller('ballotVoteSummaryCtrl', function($scope, $http, $routeParams, $location, Ballot, localStorageService){
	init();

	function init(){
		$scope.currentBallot = localStorageService.get("currentBallot");
		if($scope.currentBallot==null){
			$location.url('/ballot/'+$scope.votingBallot.uuid+"/vote");
		} else {
			$scope.votingBallot = $scope.currentBallot.ballot;
			$scope.votingBallotVote = $scope.currentBallot.vote;
			$scope.uuidMap = {};
			$scope.scored = 0;
			for (var i=0;i<$scope.votingBallot.candidates.length;i++){
				/*uncomment when backend is ready*/
				// var candidate = Ballot.candidate($scope.votingBallot.candidates[i].targetUuid).get();
				// candidate.$promise.then(
				// 	function(data){
				// 		$scope.uuidMap[data.uuid] = data.title;
				// 	},
				// 	function(error){
				// 		console.log("Candidate with targetUuid: "+$scope.votingBallot.candidates[i].targetUuid+" could not be obtained from the server.");
				// 	}
				// )
				var candidate = Ballot.getCandidate($scope.votingBallot.candidates[i].targetUuid);
				$scope.uuidMap[candidate.uuid] = candidate.title;
			}
			for (var j=0;j<$scope.votingBallotVote.voteValues.length;j++){
				if ($scope.votingBallotVote.voteValues[j].voteValue){
					$scope.scored+=1;
				}
			}
		}
	}

	$scope.submit = function(){
		/*uncomment when backend is ready*/
		// var toSave = Ballot.fill($scope.uuid).$save($scope.currentBallot);
		// toSave.$promise.then(
		// 	function(){
		// 		$location.url('/ballot/'+$scope.votingBallot.uuid+"/result");
		// 	}
		// )
		$location.url('/ballot/'+$scope.votingBallot.uuid+"/result");
	}
});

/**
 * Summary of results once ellection is over
 */
appCivistApp.controller('ballotResultCtrl', function($scope, $http, $routeParams, $location, VotingTally, Ballot, localStorageService){
	$scope.winners = [];
	$scope.used = 0;
	$scope.total = 300000;
	$scope.allCandidates = [];

	$scope.uuid = $routeParams.uuid;
	$scope.signature = Ballot.signature($scope.uuid);
	$scope.tally = VotingTally.tally($scope.uuid, $scope.signature);
	$scope.ballot = $scope.tally.ballot;
	$scope.configs = {};
	for (var i=0;i<$scope.ballot.configs.length;i++){
		var config = $scope.ballot.configs[i];
		$scope.configs[config.key] = config.value;
	}
	for (var j=0;j<$scope.tally.talliedResults.length;j++){
		var result = $scope.tally.talliedResults[j];
		var candidate = Ballot.getCandidate(result.selectedCandidate.targetUuid);
		candidate.score = result.voteValue;
		$scope.allCandidates[$scope.allCandidates.length] = candidate;
		if(j<$scope.configs["number of winners"]){
			$scope.winners[$scope.winners.length] = candidate;
		}
	}
});
