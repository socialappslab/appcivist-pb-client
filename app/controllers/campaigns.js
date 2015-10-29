appCivistApp.controller('CampaignListCtrl', function($scope, $routeParams,
													 $resource, $location, Campaigns, loginService, localStorageService) {
	$scope.campaigns = [];
	$scope.serverBaseUrl = localStorageService.get("serverBaseUrl");

	init();

	function init() {
		$scope.campaigns = Campaigns.get();
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

appCivistApp.controller('CampaignComponentCtrl', function($scope, $http, $routeParams, localStorageService, Assemblies, Campaigns){
	// QUESTION: when is all this executed? Before the partial is loaded?

	// TODO: instead of storing "ALL" the assemblies in the storage, store only the list of assembly profiles
	// and get the campaign information through API calls
	// or find a way for both "assemblies" and "campaigns" to store only the information that can be publicly
	// readable
	//$scope.assemblies = localStorageService.get('assemblies');
	//$scope.campaigns = localStorageService.get('campaigns');

	// 1. Setting up scope ID values
	$scope.assemblyID = ($routeParams.aid) ? parseInt($routeParams.aid) : 0;
	$scope.campaignID = ($routeParams.cid) ? parseInt($routeParams.cid) : 0;
	$scope.componentID = ($routeParams.ciid) ? parseInt($routeParams.ciid) : 0;
	$scope.milestoneID = ($routeParams.mid) ? parseInt($routeParams.mid) : 0;

	// TODO: improve efficiency by using angularjs filters instead of iterating through arrays

	setCurrentAssembly($scope, localStorageService);
	setCurrentCampaign($scope, localStorageService);

	// TODO: move to a service

	/**
	 * Returns the current assembly in local storage if its ID matches with the requested ID on the route
	 * If the route ID is different, updates the current assembly in local storage
	 * @param aID id of requested assembly in route
	 * @param assemblies list of assemblies that belong to the user
	 * @param localStorageService service to access the local web storage
	 * @returns assembly
	 */
	function setCurrentAssembly($scope, localStorageService) {
		$scope.assembly = localStorageService.get('currentAssembly');
		if($scope.assembly === null || $scope.assembly.assemblyId != $scope.assemblyID) {
			$scope.assembly = Assemblies.assembly($scope.assemblyID).get();
			$scope.assembly.$promise.then(function(data) {
				$scope.assembly = data;
				localStorageService.set("currentAssembly", $scope.assembly);
			});
			//assemblies.forEach(function(entry) {
			//	if(entry.assemblyId === aID) {
			//		localStorageService.set("currentAssembly", entry);
			//		console.log("Setting current assembly to: " + entry.assemblyId);
			//	}
			//});
			//assembly = localStorageService.get('currentAssembly');
		} else {
			console.log("Route assembly ID is the same as the current assembly in local storage");
		}
	}


	/**
	 * Returns the current campaign in local storage if its ID matches with the requested ID on the route
	 * If the route ID is different, updates the current campaign in local storage
	 * @param cID id of requested campaigns in route
	 * @param campaign list of campaigns that belong to assemblies of the user
	 * @param localStorageService service to access the local web storage
	 * @returns assembly
	 */
	function setCurrentCampaign($scope, localStorageService) {
		$scope.campaign = localStorageService.get('currentCampaign');
		if($scope.campaign === null || $scope.campaign.campaignId != $scope.campaignID) {
			$scope.campaign = Campaigns.campaign($scope.assemblyID, $scope.campaignID).get();
			$scope.campaign.$promise.then(function(data) {
				$scope.campaign = data;
				localStorageService.set("currentCampaign", $scope.campaign);
				setCurrentComponent($scope,localStorageService);
				setCurrentMilestone($scope,localStorageService);
				setContributionsAndGroups($scope,localStorageService);
				init();
			});
		} else {
			console.log("Route campaign ID is the same as the current campaign in local storage");
			setCurrentComponent($scope,localStorageService);
			setCurrentMilestone($scope,localStorageService);
			setContributionsAndGroups($scope,localStorageService);
			init();
		}
	}

	/**
	 * Sets the current component in local storage if its ID matches with the requested ID on the route
	 * If the route ID is different, updates the current component in local storage
	 * @param ciID id of requested component in route
	 * @param component list of components that belong to components of the current campaign
	 * @param localStorageService service to access the local web storage
	 * @returns assembly
	 */
	function setCurrentComponent($scope, localStorageService) {
		$scope.components = $scope.campaign.components;
		if ($scope.componentID === null || $scope.componentID===0) {
			$scope.component = $scope.components[0];
			$scope.componentID = $scope.component.componentInstanceId;
			localStorageService.set("currentComponent", $scope.component );
			console.log("Setting current component to: "+$scope.component );

		} else {
			$scope.component = localStorageService.get('currentComponent');
			if($scope.component === null || $scope.component.componentInstanceId != $scope.componentID) {
				$scope.components.forEach(function(entry) {
					if(entry.componentInstanceId === $scope.componentID) {
						localStorageService.set("currentComponent", entry);
						$scope.component = entry;
						console.log("Setting current component to: " + entry.componentInstanceId);
					}
				});
			} else {
				console.log("Route component ID is the same as the current component in local storage");
			}

		}
	}


	/**
	 * Returns the current milestone in local storage if its ID matches with the requested ID on the route
	 * If the route ID is different, updates the current milestone in local storage
	 * @param mID id of requested milestone in route
	 * @param milestone list of milestones that belong to milestones of the current component
	 * @param localStorageService service to access the local web storage
	 * @returns milestone
	 */
	function setCurrentMilestone($scope, localStorageService) {
		$scope.milestones = $scope.component.milestones;
		if ($scope.milestoneID === null || $scope.milestoneID === 0) {
			$scope.milestone = $scope.milestones[0];
			$scope.milestoneID = $scope.milestone.componentInstanceMilestoneId;
			localStorageService.set("currentMilestone", $scope.milestone);
			console.log("Setting current milestone to: "+$scope.milestone.title);
		} else {
			$scope.milestone = localStorageService.get('currentMilestone');
			if($scope.milestone === null || $scope.milestone.componentInstanceMilestoneId != $scope.milestoneID) {
				$scope.milestones.forEach(function(entry) {
					if(entry.componentInstanceMilestoneId === $scope.milestoneID) {
						localStorageService.set("currentMilestone", entry);
						$scope.milestone = entry;
						console.log("Setting current milestone to: " + entry.title);
					}
				});
			} else {
				console.log("Route milestone ID is the same as the current milestone in local storage");
			}
		}

	}

	function setContributionsAndGroups($scope, localStorageService) {
		$scope.contributions = $scope.component.contributions;
		$scope.workingGroups = $scope.campaign.workingGroups;
		$scope.themes = $scope.campaign.themes;
		$scope.displayedContributionType = $scope.milestone.mainContributionType;

		console.log("Loading {assembly,campaign,component,milestone): "
			+$scope.assemblyID+", "
			+$scope.campaignID+", "
			+$scope.componentID+", "
			+$scope.milestoneID
		);
	}

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
});