
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
