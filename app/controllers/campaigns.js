appCivistApp.controller('CampaignListCtrl', function($scope, $routeParams,
													 $resource, $location, Campaigns, loginService, localStorageService) {
	$scope.campaigns = [];
	$scope.serverBaseUrl = localStorageService.get("serverBaseUrl");

	init();

	function init() {
		$scope.campaigns = Campaigns.query();
		$scope.campaigns.$promise.then(function(data) {
			$scope.campaigns = data;
			localStorageService.set("campaigns", $scope.campaigns);
		});
	}
});

appCivistApp.controller('CreateCampaignCtrl', function($scope, $http, $templateCache){
	$scope.assemblies = [
		{name:'Mairie de Paris', campaign:'PB Paris'},
		{name:'Fête du Musique 2016', campaign:'PB Paris'},
		{name:'Anti-Eviction Saint Suplice', campaign:'Assemblèe Droit au Logement'}
	];
	$scope.linkedAssembly = $scope.assemblies[1];

	$scope.templates = [
		{name: 'Participatory Budgeting'},
		{name: 'Mobilization'},
		{name: 'Community Organization'},
		{name: 'Create your own...'}
	];
	$scope.selectedTemplate = $scope.templates[1];

	$scope.campaignThemes = [
		{name: 'Urban infrastucture'},
		{name: 'Education'},
		{name: 'Transportation'},
		{name: 'Parks and recreation'}
	]

	$http.get('assets/tags/tags.json').success(function(data){
		$scope.tags = data;
	}).error(function(error){
		console.log('Error loading data' + error);
	});

	$http.get('/app/partials/tooltips/linkedCampaign/linkedCampaign.html').success(function(data){
		$scope.linkedCampaignTooltip = data;
	}).error(function(error){
		console.log('Error loading data' + error);
	});

});

appCivistApp.controller('CampaignCtrl', function($scope, $http, $routeParams, localStorageService){
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

	init();

	function init() {
		var endDate = moment($scope.component.endDate);
		var now = moment();
		var diff = endDate.diff(now, 'minutes');
		$scope.minutesToDue = diff%60;
		$scope.hoursToDue = Math.floor(diff/60) % 24;
		$scope.daysToDue = Math.floor(Math.floor(diff/60) / 24);

		$scope.themes= [];
		angular.forEach($scope.component.contributions, function(contribution){
			angular.forEach(contribution.themes, function(theme) {
				var isInList = false;
				angular.forEach($scope.themes, function(actualTheme) {
					if(theme.title === actualTheme.title){
						isInList = true;
					}
				});
				if(isInList === false) {
					$scope.themes.push(theme);
				}
			});
		});
	}

	/*
	$scope.promise = $http.get('assets/campaigns/campaign.json').success(function(data){
		$scope.campaign = data;
		$scope.phases = data.phases;
		$http.get($scope.campaign.suggestions).success(function(data){
			$scope.campaign.suggestions = data;
		}).error(function(error){
			console.log('Error loading data' + error);
		});
	}).error(function(error){
		console.log('Error loading data' + error);
	});
	*/
});

appCivistApp.controller('CampaignComponentCtrl', function($scope, $http, $routeParams, localStorageService){
	// QUESTION: when is all this executed? Before the partial is loaded?

	// TODO: instead of storing "ALL" the assemblies in the storage, store only the list of assembly profiles
	// and get the campaign information through API calls
	// or find a way for both "assemblies" and "campaigns" to store only the information that can be publicly
	// readable
	$scope.assemblies = localStorageService.get('assemblies');
	$scope.campaigns = localStorageService.get('campaigns');

	// 1. Setting up scope ID values
	$scope.assemblyID = ($routeParams.aid) ? parseInt($routeParams.aid) : 0;
	$scope.campaignID = ($routeParams.cid) ? parseInt($routeParams.cid) : 0;
	$scope.componentID = ($routeParams.ciid) ? parseInt($routeParams.ciid) : 0;
	$scope.milestoneID = ($routeParams.mid) ? parseInt($routeParams.mid) : 0;

	console.log("Loading {assembly,campaign,component,milestone): "
		+$scope.assemblyID+", "
		+$scope.campaignID+", "
		+$scope.componentID+", "
		+$scope.milestoneID
	);

	// TODO: improve efficiency by using angularjs filters instead of iterating through arrays
	$scope.assemblies.forEach(function(entry) {
		if(entry.assemblyId === $scope.assemblyID) {
			localStorageService.set("currentAssembly", entry);
			console.log("Setting current assembly to: "+entry);

		}
	});
	$scope.assembly = localStorageService.get('currentAssembly');

	$scope.campaigns.forEach(function(entry) {
		if(entry.campaignId === $scope.campaignID) {
			localStorageService.set("currentCampaign", entry);
			console.log("Setting current campaign to: "+entry);
		}
	});
	$scope.campaign = localStorageService.get("currentCampaign");

	$scope.components = $scope.campaign.components;
	$scope.components.forEach(function(entry) {
		if(entry.componentInstanceId === $scope.componentID) {
			localStorageService.set("currentComponent", entry);
			console.log("Setting current component to: "+entry);
		}
	});
	$scope.component = localStorageService.get("currentComponent");

	$scope.milestones = $scope.component.milestones;
	$scope.milestones.forEach(function(entry) {
		if(entry.componentInstanceMilestoneId === $scope.milestoneID) {
			localStorageService.set("currentMilestone", entry);
			console.log("Setting current milestone to: "+entry);
		}
	});
	$scope.milestone = localStorageService.get('currentMilestone');
	$scope.contributions = $scope.component.contributions;
	$scope.themes = $scope.campaign.themes;

	init();

	function init() {
		var endDate = moment($scope.component.endDate);
		var now = moment();
		var diff = endDate.diff(now, 'minutes');
		$scope.minutesToDue = diff%60;
		$scope.hoursToDue = Math.floor(diff/60) % 24;
		$scope.daysToDue = Math.floor(Math.floor(diff/60) / 24);

		$scope.themes= [];
		angular.forEach($scope.component.contributions, function(contribution){
			angular.forEach(contribution.themes, function(theme) {
				var isInList = false;
				angular.forEach($scope.themes, function(actualTheme) {
					if(theme.title === actualTheme.title){
						isInList = true;
					}
				});
				if(isInList === false) {
					$scope.themes.push(theme);
				}
			});
		});
	}

	/*
	 $scope.promise = $http.get('assets/campaigns/campaign.json').success(function(data){
	 $scope.campaign = data;
	 $scope.phases = data.phases;
	 $http.get($scope.campaign.suggestions).success(function(data){
	 $scope.campaign.suggestions = data;
	 }).error(function(error){
	 console.log('Error loading data' + error);
	 });
	 }).error(function(error){
	 console.log('Error loading data' + error);
	 });
	 */
});