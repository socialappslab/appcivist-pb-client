﻿appCivistApp.controller('HomeCtrl', function($scope, $routeParams,
													 $resource, $location, Campaigns, Memberships, Notifications, loginService, localStorageService) {

	$scope.serverBaseUrl = localStorageService.get("serverBaseUrl");
	$scope.assemblies = [];
	$scope.campaigns = [];
	$scope.workingGroups = [];
	$scope.notifications = [];

	init();

	function init() {
		$scope.assemblies = Memberships.assemblies().query();
		$scope.campaigns = Campaigns.campaigns('ongoing').query();
		$scope.workingGroups = Memberships.workingGroups().query();
		$scope.notifications = Notifications.query();

		$scope.assemblies.$promise.then(function(data) {
			$scope.assemblies = [];
			angular.forEach(data, function(obj){
				$scope.assemblies.push(obj.assembly);
			});
		});
		$scope.campaigns.$promise.then(function(data) {
			$scope.campaigns = data;
			localStorageService.set("campaigns", $scope.campaigns);
		});
		$scope.workingGroups.$promise.then(function(data) {
			$scope.workingGroups = [];
			angular.forEach(data, function(obj) {
				if(obj.membershipType === 'GROUP') {
					$scope.workingGroups.push(obj.workingGroup);
				}
			});
			localStorageService.set("workingGroups", $scope.workingGroups);
		});
		$scope.notifications.$promise.then(
				function(data) {
					$scope.notifications = {
						'upcoming_milestones' : []
					};
					angular.forEach(data, function(obj) {
						if(obj.type === 'UPCOMING_MILESTONE'){
							$scope.notifications.upcoming_milestones.push(obj);
						}
					});
					localStorageService.set("notifications", $scope.notifications);
				});
	}

	$scope.selectCampaign = function(campaign){
		localStorageService.set("currentCampaign", campaign);
	}

	$scope.upcomingMilestones = "Upcoming Milestones"; 
	$scope.remainingPropDays = "Days left to submit a proposal to "; 
	$scope.remainingConsenDays = "Days left for consensus in "; 
	$scope.recentActivity = "Recent Activity"; 
	$scope.myAssembliesText = "My Assemblies"; 
	$scope.newAssemblyBtnText = "New Assembly"; 
	$scope.myCurrCampaignsText = "My Current Campaigns"; 
	$scope.newCampaignBtn = "New Campaign"; 
	$scope.myWorkingGroupsText = "My Working Groups"; 
	$scope.newWGBtn = "New Working Group"; 

});