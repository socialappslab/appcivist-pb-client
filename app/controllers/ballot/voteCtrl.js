/**
 * Voting Page
 */
    // The ballot UUID to use: 68643fbf-9a30-4b81-83d1-439947711a46
appCivistApp.controller('ballotVoteCtrl', function ($scope, $routeParams, $location, BallotPaper, Candidate,
                                                    BallotCampaign, localStorageService, Ballot) {
    $scope.candidates = [];
    $scope.themeMap = {};
    $scope.themes = [];
    $scope.scores = {};

    $scope.signature = localStorageService.get("voteSignature");
    $scope.user = localStorageService.get("user");
    console.log($scope.signature);
    $scope.campaigns = [];
    var campaign = BallotCampaign.query({uuid:$routeParams.uuid}).$promise;
    campaign.then(
        function (data) {
            $scope.campaigns = data;
        },
        function (error) {
            console.log("No campaigns associated with ballot: "+$scope.ballotUUID);
        }
    );

    if (!$scope.signature) {
        $scope.signature = $scope.user.uuid;
    }

    $scope.ballotUUID = $routeParams.uuid;
    console.log("Fetching the ballot paper")
    var ballotPaper = BallotPaper.get({uuid: $routeParams.uuid, signature: $scope.signature}).$promise;
    ballotPaper.then(function (data) {
            console.log(data)
            console.log("Retreived voting ballot from server.");
            $scope.ballotPaper = data;
            $scope.ballot = data.ballot;
            $scope.vote = data.vote;

            // // This stitches the results from /ballot/:uuid/vote/:signature with the mock candidates.
            // for (var candidateUuid = 1; candidateUuid < 5; candidateUuid++) {
            //     var voteFromAPI = $scope.vote.votes.filter(function (el) {
            //         return el.candidate_id == candidateUuid
            //     });
            //
            //     var value = null;
            //     if (voteFromAPI && voteFromAPI[0]) {
            //         console.log(voteFromAPI[0])
            //         value = voteFromAPI[0].value;
            //     }
            //
            //     //console.log(value)
            //     $scope.candidates.push(Candidate.get({uuid: candidateUuid, value: value}))
            // }
            // ;

            //Get Candidate IDs
            //candidateIDs = [60]
            $scope.campaign = localStorageService.get("currentCampaign");
            $scope.campaign.ballotResults = Ballot.results({uuid: $scope.campaign.bindingBallot}).$promise;
            $scope.campaign.ballotResults.then(
                function (data) {
                    $scope.campaign.ballotResults = data;
                },
                function (error) {
                    $scope.campaign.ballotResults = null;
                }
            );
            var candidatesIndex = $scope.campaign.ballotResults.candidatesIndex;
            var candidatesArr = []
            for(keys in candidatesIndex){
              candidatesArr.push(candidatesIndex[key])
            }
            for(var i =0; i< candidatesArr.length; i++){
              $scope.candidates.push(Candidate.get({uuid: candidatesArr[i], value: null}));
            }

            //for testing purposes
            // $scope.candidates.push(Candidate.get({uuid: "20", value: null}));
            // $scope.candidates.push(Candidate.get({uuid: "21", value: null}));
            // $scope.candidates.push(Candidate.get({uuid: "22", value: null}));
            // $scope.candidates.push(Candidate.get({uuid: "23", value: null}));

            for (var i = 0; i < $scope.candidates.length; i++) {
                var candidate = $scope.candidates[i];
                for (var j = 0; j < candidate.themes.length; j++) {
                    var theme = candidate.themes[j].title;
                    if (theme in $scope.themeMap) {
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
        function (error) {
            window.appcivist.handleError(error);
        });

    $scope.minimumPossibleScore = function () {
        if ($scope.ballot) {
            return $scope.ballot.ballot_configurations[0].value;
        } else
            return 234234324;
    }

    $scope.maximumPossibleScore = function () {
        if ($scope.ballot) {
            return $scope.ballot.ballot_configurations[1].value;
        } else
            return 234234234;
    }

    $scope.saveBallot = function () {
        console.log("Candidates: ")
        console.log($scope.candidates)

        var ballot_paper = BallotPaper.update({
            uuid: $routeParams.uuid,
            signature: $scope.signature
        }, {vote: {votes: $scope.candidates}}).$promise;
        ballot_paper.then(function (data) {
            console.log(data);
            $location.url("/ballot/" + $routeParams.uuid + "/summary");
        }, function (error) {
            alert(error.data.error);
            return;
        })
    }
});
