appCivistApp.controller('NewContributionCtrl', function($scope, $http, $routeParams, localStorageService, Contributions){
	init();
	function init() {
		$scope.campaigns = localStorageService.get('campaigns');
		$scope.campaignID = ($routeParams.aid) ? parseInt($routeParams.aid) : 0;
		console.log("Loading campaign: "+$scope.campaignID);
		$scope.campaigns.forEach(function(entry) {
			if(entry.campaignId === $scope.campaignID) {
				localStorageService.set("currentCampaign", entry);
			}
		});
		$scope.campaign = localStorageService.get("currentCampaign");
		$scope.assembly = localStorageService.get('currentAssembly');
		$scope.component = $scope.campaign.components[0];
		$scope.milestones = $scope.component.milestones;
		$scope.themes= [];
		var endDate = moment($scope.component.endDate);
		var now = moment();
		var diff = endDate.diff(now, 'minutes');
		$scope.minutesToDue = diff%60;
		$scope.hoursToDue = Math.floor(diff/60) % 24;
		$scope.daysToDue = Math.floor(Math.floor(diff/60) / 24);
	}

	$scope.newContribution = {
		"title": "",
		"text": "",
		"type": "",
		"location": {
			"placeName": "",
			"city": "",
			"state": ""
		},
		"themes": [
			{
				"themeId": 1
			}
		],
		"hashtags": [
			{
				"hashtag": ""
			},
			{
				"hashtagId": 1
			}
		],
		"attachments": [
			{
				"url": "https://upload.wikimedia.org/wikipedia/commons/f/f2/Trappe_i_r%C3%A5dhushallen.jpg"
			}
		],
		"associatedMilestones": [
			{
				"componentInstanceMilestonId": 1
			}
		]
	};

	$scope.postContribution = function(){
		var newContribution = Contributions.contribution($scope.assembly.assemblyId, $scope.campaignID, $scope.component.componentInstanceId).save($scope.newContribution, function() {
			console.log("Created contribution: "+newContribution);
			localStorageService.set("currentContribution",newContribution);
			//$location.url('/assembly/{id}/campaign/{id}/component/{id}');
		});
	}
});