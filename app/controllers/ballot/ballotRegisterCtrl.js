// This controller retrieves data from the Assemblies and associates it
// with the $scope
// The $scope is bound to the order view
appCivistApp.controller('ballotRegisterCtrl', function($scope, $http, $routeParams, $location, Ballot, localStorageService) {
  var ballot = Ballot.get({uuid:$routeParams.uuid}).$promise;
  ballot.then(function(data) {
    console.log(data)
    $scope.ballot = data;
  }, function(error) {
    alert(data);
  });

	// $scope.uuid = $routeParams.uuid;
	// var resource = GetRegistrationForm.form($scope.uuid);
	// $scope.returned = {
	// 	"votingBallotRegistrationFormId":"1",
	// 	"fields": [
	// 		{
	// 			"votingBallotRegistrationFieldId":1,
	// 			"fieldName":"",
	// 			"fieldDescription":"",
	// 			"providedValue":""
	// 		}
	// 	]
	// };
	/*to be deleted when backend is ready*/
	// $scope.returned = resource;
	// $scope.fields = resource.fields;
	/*uncomment when backend is ready!*/
	// resource.get().$promise.then(function(data){
	// 	$scope.returned.votingBallotRegistrationFormId = data.votingBallotRegistrationFormId;
	// 	$scope.fields = data.fields;
	// 	while ($scope.returned.fields.length<$scope.fields.length) {
	// 		$scope.returned.fields[$scope.returned.fields.length] =
	// 		{

	//       		"votingBallotRegistrationFieldId":,
	//         	"fieldName":"",
	//             "fieldDescription":""

	//    		};
	// 	}
	// 	for (var i=0;i<$scope.returned.fields.length;i+=1) {
	// 		$scope.returned.fields[i].votingBallotRegistrationFieldId = $scope.fields[i].votingBallotRegistrationFieldId;
	// 	}
	// });

	$scope.fillForm = function() {
		for (var i=0;i<$scope.returned.fields.length;i++) {
			$scope.returned.fields[i].providedValue = document.getElementById($scope.fields[i].votingBallotRegistrationFieldId).value;
		}
		/* uncomment when backend is ready */
		// var form = resource.$save($scope.returned);
		// form.$promise.then(
		// 	function(data){
		// 		// $scope.password = data.password;
		// 		$scope.signature = data.signature;
		// 		console.log("Posted voting registration form.");
		// 	},
		// 	function(error) {
		// 		alert("Sorry, the provided information cannot generate a valid voting ballot.");
		// 		return;
		// 	}
		// )
		// var ballot = Ballot.ballot($scope.uuid, $scope.signature).get();
		// ballot.$promise.then(
		// 	function(data){
		// 		$scope.votingBallot= data;
		// localStorageService.set("currentBallot", data);
		// 	},
		// 	function(error){
		// 		alert("Sorry, a valid ballot could not be obtained from the server.");
		// 		return;
		// 	}
		// )

		var ballot = Ballot.ballot($scope.uuid, 1);

		/*save the votingBallot to the localservice so that we can access it from other controllers*/
		localStorageService.set("currentBallot",ballot);
		// TODO: below if is only a temporal fix to always redirect to a valid ballot url
		var redirect = '/ballot/'+$scope.votingBallot.uuid+"/vote";
		if (!$scope.votingBallot || !$scope.votingBallot.uuid) {
			redirect = "/ballot/abcd-efgh-ijkl-mnop/vote";
		}
		$location.url(redirect);
	}

	$scope.loadBallot = function(){
		/*uncomment when backend is ready*/
		// var signature = Ballot.signature($scope.uuid).get();
		// signature.$promise.then(
		// 	function(data){
		// 		$scope.signature = data;
		// 		console.log("Retreived signature from server.");
		// 	},
		// 	function(error){
		// 		alert("Sorry, no valid signature under this username can be retreived.");
		// 		return;
		// 	}
		// )
		// var ballot = Ballot.ballot($scope.uuid, $scope.signature).get();
		// ballot.$promise.then(
		// 	function(data){
		// 		$scope.votingBallot = data;
		// localStorageService.set("currentBallot", data);
		// $location.url('/ballot/'+$scope.votingBallot.uuid+"/voting");
		// 	},
		// 	function(error){
		// 		alert("Sorry, no valid voting ballot can be retreived using this signature.");
		// 		return;
		// 	}
		// )

		$scope.signature = Ballot.signature($scope.uuid);
		$scope.votingBallot = Ballot.ballot($scope.uuid, $scope.signature).ballot;
		localStorageService.set("currentBallot", Ballot.ballot($scope.uuid, $scope.signature));
		$location.url('/ballot/'+$scope.votingBallot.uuid+"/vote");
	}

});
