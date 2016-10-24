(function() {
'use strict';

angular
  .module('appCivistApp')
  .controller('v2.CampaignDashboardCtrl', CampaignDashboardCtrl);


CampaignDashboardCtrl.$inject = ['$scope', 'Campaigns', '$stateParams', 'Assemblies'];

function CampaignDashboardCtrl($scope, Campaigns, $stateParams, Assemblies) {
	$scope.assemblyID = ($stateParams.aid) ? parseInt($stateParams.aid) : 0;
	$scope.campaignID = ($stateParams.cid) ? parseInt($stateParams.cid) : 0;
	var res = Campaigns.campaign($scope.assemblyID, $scope.campaignID).get();
	res.$promise.then(function(data) {
		$scope.campaign = data;
	});
	var rsp = Assemblies.assembly($scope.assemblyID).get();
	rsp.$promise.then(function(data) {
		$scope.assembly = data;
	});
}
}());
