appCivistApp.controller('homeCtrl', function($scope, $routeParams,
													 $resource, $location, Campaigns, Memberships, Notifications, loginService, localStorageService) {

	$scope.serverBaseUrl = localStorageService.get("serverBaseUrl");
	$scope.assemblies = [];
	$scope.campaigns = [];
	$scope.workingGroups = [];
	$scope.notifications = [];

	init();

	function init() {
		$scope.memberships = Memberships.query();
		$scope.campaigns = Campaigns.query();
		$scope.membership = Memberships.query();
		$scope.notifications = Notifications.query();

		$scope.membership.$promise.then(function(data) {
			angular.forEach(data, function(obj) {
				if(obj.membershipType === 'ASSEMBLY') {
					$scope.assemblies.push(obj.assembly);
				}
			});
			localStorageService.set("assemblies", $scope.assemblies);
		});
		$scope.campaigns.$promise.then(function(data) {
			$scope.campaigns = data;
			localStorageService.set("campagins", $scope.campaigns);
		});
		$scope.memberships.$promise.then(function(data) {
			angular.forEach(data, function(obj) {
				if(obj.membershipType === 'GROUP') {
					$scope.workingGroups.push(obj.workingGroup);
				}
			});
			localStorageService.set("workingGroups", $scope.workingGroups);
		});
		$scope.notifications.$promise.then(function(data) {
			$scope.notifications = data;
			localStorageService.set("notifications", $scope.notifications);
		});
	}

});