/**
 * Summary of results once ellection is over
 */
appCivistApp.controller('ballotResultCtrl', function ($scope, $routeParams, Ballot, BallotCampaign, Candidate,
                                                      $translate, localStorageService) {
    $scope.total = 300000;
    $scope.candidates = [];

    var ballot = Ballot.get({uuid: $routeParams.uuid}).$promise;
    ballot.then(function (data) {
        $scope.ballot = data.ballot;
    }, function (error) {
        window.appcivist.handleError(error)
    });

    var results = Ballot.results({uuid: $routeParams.uuid}).$promise;
    results.then(function (data) {
        for (var candidateUuid = 1; candidateUuid < 5; candidateUuid++) {
            var scoreFromAPI = data.results.filter(function (el) {
                return el.candidate_id == candidateUuid
            });

            var score = null;
            if (scoreFromAPI && scoreFromAPI[0]) {
                score = scoreFromAPI[0].score;
            }

            $scope.candidates.push(Candidate.get({uuid: candidateUuid, score: score}));
        }
        ;

        $scope.candidates.sort((w1, w2) = > w1.score < w2.score ? 1 : -1
        )
    }, (error) = > window.appcivist.handleError(error)
    )
    ;

    $scope.calculateTotalBudget = function () {
        return $scope.candidates.slice(0, 3).reduce((prev, curr) = > prev + parseInt(curr.budget), 0
        )
        ;
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
