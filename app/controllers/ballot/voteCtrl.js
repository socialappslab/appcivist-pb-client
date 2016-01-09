/**
 * Voting Page
 */
 // The ballot UUID to use: 68643fbf-9a30-4b81-83d1-439947711a46
appCivistApp.controller('ballotVoteCtrl', function($scope, $http, $routeParams, $location, Ballot, BallotPaper, Candidate, localStorageService) {
	$scope.uuid = $routeParams.uuid;

	// $scope.votingBallot = {
  // 	  	"votingBallotId" : 1,
  //       "uuid":1,
  //       "instructions":"",
  //       "systemType":"",
  //       "starts":"",
  //       "ends": "",
  //       "candidates": [
  //           {
  //             "targetUuid": 3,
  //           },
  //           {
  //             "targetUuid": 5,
  //           }
  //       ],
  //       "registrationForm": {
  //           "votingBallotRegistrationFormId":1,
  //           "fields": [
  //               {
  //               "votingBallotRegistrationFieldId":2,
  //               "fieldName":"",
  //               "fieldDescription":""
  //               },
  //               {"votingBallotRegistrationFieldId":1,
  //               "fieldName":"",
  //               "fieldDescription":""
  //               }
  //           ]
  //       },
  //       "configs":[]
	// }
	$scope.candidates = [];
	$scope.themeMap = {};
	$scope.themes = [];
	$scope.scores = {};

  $scope.signature = localStorageService.get("voteSignature");

  console.log("Fetching the ballot paper")
  var ballotPaper = BallotPaper.get({uuid: $routeParams.uuid, signature: $scope.signature}).$promise;
  ballotPaper.then(function(data){
    console.log(data)
    console.log("Retreived voting ballot from server.");
    $scope.ballot = data.ballot;
    $scope.vote   = data.vote;
  },
  function(error){
    alert(error.data.error);
    return;
  });

  // TODO: Since we don't have a Candidate API set up yet, we will use dummy data hardcoded
  // in votingService.js. However, we will still use $resource-like calls so that when we DO
  // get the API up and running, then we will only need to change votingService.js.
  console.log("About to fetch all candidates...")
  var candidates = Candidate.all();
  console.log(candidates);
  $scope.candidates = [
    candidates[0],
    candidates[1],
    candidates[2],
    candidates[3]
  ];
  console.log($scope.candidates);
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

	if ($scope.vote){
    for(var i=0;i<$scope.vote.voteValues.length;i++){
      var candidate = $scope.votingBallotVote.voteValues[i];
      $scope.scores[candidate.selectedCandidate.uuid] = candidate.voteValue;
    }
	} else {
    for(var i=0;i<$scope.candidates.length;i++)
      $scope.scores[$scope.candidates[i].uuid]="/100";
	}


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
