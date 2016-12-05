/**
 * Summary of one's voting choices
 */
appCivistApp.controller('ballotVoteSummaryCtrl', function ($scope, $routeParams, $location, BallotPaper, Candidate,
                                                           BallotCampaign, $translate, localStorageService) {
    var ballotPaper = BallotPaper.get({
        uuid: $routeParams.uuid,
        signature: localStorageService.get("voteSignature")
    }).$promise;
    ballotPaper.then(function (data) {
        console.log(data)
        console.log("Retreived voting ballot from server.");
        $scope.ballot = data.ballot;
        $scope.vote = data.vote;
        $scope.candidates = [];

        // This stitches the results from /ballot/:uuid/vote/:signature with the mock candidates.
        for (var candidateUuid = 1; candidateUuid < 5; candidateUuid++) {
            var voteFromAPI = $scope.vote.votes.filter(function (el) {
                return el.candidate_id == candidateUuid
            });

            var value = null;
            if (voteFromAPI && voteFromAPI[0]) {
                console.log(voteFromAPI[0])
                value = voteFromAPI[0].value;
            }

            $scope.candidates.push(Candidate.get({uuid: candidateUuid, value: value}))
        }
        ;

        $scope.scoredCandidates = $scope.candidates.filter(function (c) {
            return c.value;
        });
    }, function (error) {
        window.appcivist.handleError(error);
    });

    $scope.transitionToVoting = function () {
        $location.url("/v1/ballot/" + $routeParams.uuid + "/vote");
    }

    $scope.submitBallotPaper = function () {
        var ballot_paper = BallotPaper.complete(
            {uuid: $routeParams.uuid, signature: localStorageService.get("voteSignature")},
            {vote: {status: 1}}
        ).$promise;
        ballot_paper.then(function (data) {
            console.log(data);
            $location.url("/v1/ballot/" + $routeParams.uuid + "/result");
        }, function (error) {
            window.appcivist.handleError(error);
        })
    }


    $scope.campaigns = [];
    var campaign = BallotCampaign.query({uuid: $routeParams.uuid}).$promise;
    campaign.then(
        function (data) {
            $scope.campaigns = data;
        },
        function (error) {
            console.log("No campaigns associated with ballot: " + $scope.ballotUUID);
        }
    );

    $scope.user = localStorageService.get("user");
    if ($scope.user && $scope.user.language) {
        $translate.use($scope.user.language);
        $scope.signature = $scope.user.uuid;
    }
});
