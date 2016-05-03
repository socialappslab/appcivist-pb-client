/**
 * Voting Page
 */
    // The ballot UUID to use: 68643fbf-9a30-4b81-83d1-439947711a46
appCivistApp.controller('ballotVoteCtrl', function ($scope, $routeParams, $location, BallotPaper, Candidate,
                                                    BallotCampaign, localStorageService, Ballot, Contributions) {
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
            if ($scope.campaigns.length>0)
                $scope.campaign = $scope.campaigns[0];
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
            console.log("Retreived voting ballot from server.");
            $scope.ballotPaper = data;
            $scope.ballot = data.ballot;
            $scope.vote = data.vote;

            $scope.ballotResults = Ballot.results({uuid: $routeParams.uuid}).$promise;
            $scope.ballotResults.then(
                function (data) {
                    $scope.ballotResults = data;
                    var candidates = $scope.ballotResults.ballot.candidates;

                    for(var i =0; i< candidates.length; i++){
                        var contributionRes = Contributions.getContributionByUUID(candidates[i].contribution_uuid).get();
                        contributionRes.$promise.then(
                            function (contribution) {
                                $scope.candidates.push(contribution);
                                var candidate = contribution;
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
                            },
                            function (error) {
                                console.log("No contribution for candidate: "+candidatesArr[i]);
                            }
                        );
                    }
                },
                function (error) {
                    $scope.ballotResults = null;
                }
            );
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
