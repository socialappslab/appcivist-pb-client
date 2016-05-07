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
    results.then(
        function (data) {
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
            $scope.candidates.sort( function (w1, w2) { return w1.score < w2.score ? 1 : -1});
        },
        function (error) {
            window.appcivist.handleError(error);
        }
    );

    $scope.calculateTotalBudget = function () {
        return $scope.candidates.slice(0, 3).reduce(function (prev, curr) { return prev + parseInt(curr.budget), 0 });
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

appCivistApp.controller('ConsensusResultsCtrl', function($scope, $controller, $http, localStorageService, Ballot){
    $scope.campaign = localStorageService.get('currentCampaign');
    $scope.bindingBallotId = $scope.bindingBallotId ? $scope.bindingBallotId : $scope.campaign.bindingBallot;
    $scope.contributions = $scope.contributions ? $scope.contributions : $scope.campaign.contributions;
    $scope.contributionsIndex = $scope.contributionsIndex ? $scope.contributionsIndex : buildContributionsIndex();

    var resultsData = [
        {
            type: "stackedBar100",
            showInLegend: true,
            name: "YES",
            dataPoints: [
                // Examples:
                // {y: 350, label: "Georga lsjfd klsakka sdjfals jflskfj sae" },
                // {y: 350, label: "Alex" },
                // {y: 350, label: "Mike" },
                // {y: 374, label: "Jake" },
                // {y: 320, label: "Shah" },
                // {y: 300, label: "Joe" },
                // {y: 400, label: "Fin" },
                // {y: 220, label: "Larry" }

            ]
        },

        {
            type: "stackedBar100",
            showInLegend: true,
            name: "NO",
            dataPoints: [ ]
        },
        {
            type: "stackedBar100",
            showInLegend: true,
            name: "ABSTAIN",
            dataPoints: [ ]
        },

        {
            type: "stackedBar100",
            showInLegend: true,
            name: "BLOCK",
            dataPoints: [ ]
        }

    ];

    CanvasJS.addColorSet("voteColors",
        [ "#18BE43", "#FE3920", "#2353A9", "#FEB020"]
    );

    var results = Ballot.results({uuid: $scope.bindingBallotId}).$promise;
    results.then(function (data) {
        $scope.results = data.results;
        $scope.ballot = data.ballot;
        // Results array is ordered from the highest scored candidate to the lower scored
        for (var i = $scope.results.length - 1; i >= 0 ; i--) {
            console.log($scope.results[i])
            var contributionInfo = getContributionInfo($scope.results[i].contribution_uuid);
            var dataYes = {
                y: $scope.results[i].summary.yes,
                label: contributionInfo
            }
            var dataNo = {
                y: $scope.results[i].summary.no,
                label: contributionInfo
            }
            var dataAbstain = {
                y: $scope.results[i].summary.abstain,
                label: contributionInfo
            }
            var dataBlock = {
                y: $scope.results[i].summary.block,
                label: contributionInfo
            }
            resultsData[0].dataPoints.push(dataYes);
            resultsData[1].dataPoints.push(dataNo);
            resultsData[2].dataPoints.push(dataAbstain);
            resultsData[3].dataPoints.push(dataBlock);
        }
        $scope.chart = new CanvasJS.Chart("chartContainer",
            {
                colorSet: "voteColors",
                theme: 'theme2',
                title: {
                    text: "Consensus Results"

                },
                animationEnabled: true,
                axisY: {},
                toolTip: {
                    shared: true
                },
                data: resultsData

            });

        $scope.chart.render();
    }, function (error) {
        window.appcivist.handleError(error)
    });

    console.log(resultsData);

    function buildContributionsIndex () {
        var contributionsIndex = {};
        for (var i = 0; i < $scope.contributions.length; i++) {
            contributionsIndex[$scope.contributions[i].uuid] = $scope.contributions[i];
        }
        return contributionsIndex;
    }

    function getContributionInfo (uuid) {
        return $scope.contributionsIndex[uuid].title;
    }
});