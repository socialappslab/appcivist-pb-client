/**
 * Voting Landing Page
 */
 // The ballot UUID to use: 68643fbf-9a30-4b81-83d1-439947711a46
appCivistApp.controller('ballotStartCtrl', function($scope, $routeParams, $location, Ballot,
                                                    BallotCampaign, localStorageService){
    $scope.ballotUUID = $routeParams.uuid;
	var ballot = Ballot.get({uuid:$routeParams.uuid}).$promise;
  ballot.then(function(data) {
    console.log(data)
    $scope.ballot = data;
  }, function(error){ window.appcivist.handleError(error); });

	$scope.transitionToRegistration = function(){
		$location.url("/ballot/" + $routeParams.uuid + "/register");
	}

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

    $scope.user = localStorageService.get("user");
    if ($scope.user && $scope.user.language) {
        $translate.use($scope.user.language);
        $scope.signature = $scope.user.uuid;
        localStorageService.set("voteSignature",$scope.signature);
        $location.url("/ballot/" + $routeParams.uuid + "/vote");
    }

});
