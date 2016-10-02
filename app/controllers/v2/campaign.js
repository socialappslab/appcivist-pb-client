(function() {
'use strict';

angular
  .module('appCivistApp')
  .controller('v2.CampaignCtrl', CampaignCtrl);


CampaignCtrl.$inject = ['$scope', 'Campaigns', '$routeParams', 'Assemblies'];

function CampaignCtrl($scope, Campaigns, $routeParams, Assemblies) {
	$scope.assemblyID = ($routeParams.aid) ? parseInt($routeParams.aid) : 0;
	$scope.campaignID = ($routeParams.cid) ? parseInt($routeParams.cid) : 0;
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
