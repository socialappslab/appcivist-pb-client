

/**
 * Voting Page (the actual UI of the ballot)
 */
appCivistApp.controller('ballotVoteCtrl', function($scope, $http, $routeParams, $location, Ballot, localStorageService){
	$scope.uuid = $routeParams.uuid;

	$scope.votingBallot = {
  	  	"votingBallotId" : 1,
        "uuid":1,
        "instructions":"",
        "systemType":"",
        "starts":"",
        "ends": "",
        "candidates": [
            {
              "targetUuid": 3,
            },
            {
              "targetUuid": 5,
            }
        ],
        "registrationForm": {
            "votingBallotRegistrationFormId":1,
            "fields": [
                {
                "votingBallotRegistrationFieldId":2,
                "fieldName":"",
                "fieldDescription":""
                },
                {"votingBallotRegistrationFieldId":1,
                "fieldName":"",
                "fieldDescription":""
                }
            ]
        },
        "configs":[]
	}
	$scope.candidates = [];
	$scope.themeMap = {};
	$scope.themes = [];
	$scope.scores = {};
	init();

	function init(){
		var currentBallot = localStorageService.get("currentBallot");
		if (currentBallot==null) {
			/*uncomment when backend is ready; delete the part currently used*/
			// var signature = Ballot.signature($scope.uuid).get();
			// signature.$promise.then(
			// 	function(data){
			// 		$scope.signature = data;
			// 		console.log("Retreived signature from server.");
			// 	},
			// 	function(error){
			// 		alert("Sorry, no valid signature could be found for this username.");
			// 		return;
			// 	}
			// )
			// var ballot = Ballot.ballot($scope.uuid, $scope.signature).get();
			// ballot.$promise.then(
			// 	function(data){
					// $scope.votingBallot = data.ballot;
					// $scope.votingBallotVote = data.vote;
			// 		console.log("Retreived voting ballot from server.");
			// 		localStorageService.set("currentBallot",data);
			// 	},
			// 	function(error){
			// 		alert("Sorry, no valid voting ballot could be found using this signature.");
			// 		return;
			// 	}
			// )
			$scope.votingBallot = Ballot.ballot($scope.uuid, 1).ballot;
			$scope.votingBallotVote = Ballot.ballot($scope.uuid, 1).vote;
			localStorageService.set("currentBallot",Ballot);
		} else {
			$scope.votingBallot = currentBallot.ballot;
			$scope.votingBallotVote = currentBallot.vote;
		}

		for(var i=0;i<$scope.votingBallot.candidates.length;i++){
			/*uncomment when backend is ready; delete the part currently used*/
			// var candidateInfo = Ballot.getCandidate($scope.votingBallot.candidates[i].targetUuid).get();
			// candidateInfo.$promise.then(
			// 	function(data){
			// 		$scope.candidates[$scope.candidates.length] = data;
			// 	},
			// 	function(error){
			// 		console.log("The candidate with uuid "+candidate.targetUuid+" cannot be retreived from the server.");
			// 	}
			// )
			var candidate = Ballot.getCandidate($scope.votingBallot.candidates[i].targetUuid);
			$scope.candidates[$scope.candidates.length] = candidate;
			for(var j=0;j<candidate.themes.length;j++){
				var theme = candidate.themes[j];
				if(theme in $scope.themeMap){
					$scope.themeMap[theme][$scope.themeMap[theme].length] = candidate.title;
				} else {
					$scope.themeMap[theme] = [];
					$scope.themeMap[theme][0] = candidate.title;
					$scope.themes[$scope.themes.length] = theme;
				}
			}
		}
		if ($scope.votingBallotVote!=null){
			for(var i=0;i<$scope.votingBallotVote.voteValues.length;i++){
				var candidate = $scope.votingBallotVote.voteValues[i];
				$scope.scores[candidate.selectedCandidate.uuid] = candidate.voteValue;
			}
		} else {
			for(var i=0;i<$scope.candidates.length;i++){
				$scope.scores[$scope.candidates[i].uuid]="/100";
			}
		}
	}

	$scope.save = function(){

		var newVote = {
			"ballot":"",
			"vote":""
		};
		newVote.ballot = $scope.votingBallot;
		if($scope.votingBallotVote!=undefined){
			for(var i = 0;i<$scope.votingBallotVote.voteValues.length;i++){
				var vote = $scope.votingBallotVote.voteValues[i];
				vote.voteValue = document.getElementById(vote.selectedCandidate.uuid).value+"/100";
			}

			newVote.vote = $scope.votingBallotVote;
			localStorageService.set("currentBallot",newVote);
			alert("Your vote has been saved successfully!");
		/*uncomment when backend is ready*/
		// 	var toSave = Ballot.fill($scope.uuid).$put(newVote);
		// 	toSave.$promise.then(
		// 		function(){
					// alert("Your vote has been saved successfully!");
		// 			$location.url('/ballot/'+$scope.votingBallot.uuid+"/summary");
		// 		}
		// 	)
		} else {
			var ballotVote = {
				"votingBallotVote":1,
            "uuid":1,
            "signature":"1",
            "status":"DRAFT",
            "voteValues":[]
			};
			var temp = {
				"votingCandidateVoteId":1,
                "uuid":1,
               	"selectedCandidate":{
                    "uuid":1
                },
                "voteValue":"",
                "voteValueType":""
            };
            var count=0;
            for (var i=0;i<$scope.candidates.length;i++) {
            	var candidate = $scope.candidates[i];
            	temp.selectedCandidate.uuid = candidate.uuid;
            	var value = document.getElementById(candidate.uuid).value;
            	if (value==null) continue;
            	temp.voteValue = value + "/100";
            	temp.voteValueType = $scope.votingBallot.systemType;
            	ballotVote.voteValues[count] = temp;
            	count++;
            }
            newVote.vote = ballotVote;
            localStorageService.set("currentBallot",newVote);
            /*uncomment when backend is ready*/
		// 	var toSave = Ballot.fill($scope.uuid).$save(newVote);
		// 	toSave.$promise.then(
		// 		function(){
		// 			$location.url('/ballot/'+$scope.votingBallot.uuid+"/summary");
		// 		}
		// 	)
		}
	}

	$scope.submit = function(){
		var newVote = {
			"ballot":"",
			"vote":""
		};
		newVote.ballot = $scope.votingBallot;
		for(var i = 0;i<$scope.votingBallotVote.voteValues.length;i++){
			var vote = $scope.votingBallotVote.voteValues[i];
			if(document.getElementById(vote.selectedCandidate.uuid).value==undefined){
				continue;
			}
			vote.voteValue = document.getElementById(vote.selectedCandidate.uuid).value+"/100";
		}
		$scope.votingBallotVote.status = "FINISHED";
		newVote.vote = $scope.votingBallotVote;
		localStorageService.set("currentBallot",newVote);
		$location.url('/ballot/'+$scope.votingBallot.uuid+"/summary");
	}
});

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

	$scope.back = function(){
		$location.url('/ballot/'+$scope.votingBallot.uuid+"/vote");
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
