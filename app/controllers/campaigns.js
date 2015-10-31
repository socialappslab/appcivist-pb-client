appCivistApp.controller('CampaignListCtrl', function($scope, $routeParams,$resource, $location, Campaigns, loginService, localStorageService) {
	$scope.campaigns = [];
	$scope.serverBaseUrl = localStorageService.get("serverBaseUrl");
	$scope.etherpadServer = localStorageService.get("etherpadServer");

	console.log("API Server = " + $scope.serverBaseUrl);
	console.log("Etherpad Server = " + $scope.etherpadServer);
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

appCivistApp.controller('CampaignComponentCtrl', function($scope, $http, $routeParams, $location, localStorageService, Assemblies, Campaigns){

	init();

	$scope.getEtherpadReadOnlyUrl = function (readOnlyPadId) {
		var url = $scope.etherpadServer+"p/"+readOnlyPadId+"?showControls=true&showChat=true&showLineNumbers=true&useMonospaceFont=false";
		console.log("Contribution Read Only Etherpad URL: "+url);
		return url;
	}

	$scope.getEtherpadReadWriteUrl = function (c) {
		return $scope.etherpadServer+"p/";//+ ... +"?showControls=true&showChat=true&showLineNumbers=true&useMonospaceFont=false";
	}

	$scope.openContributionPage = function(cID)  {
		$location.url("/assembly/"+$scope.assemblyID+"/campaign/"+$scope.campaignID+"/"+$scope.componentID+"/"+$scope.milestoneID+"/"+cID);
	}
	// TODO: improve efficiency by using angularjs filters instead of iterating through arrays
	setCurrentAssembly($scope, localStorageService);
	setCurrentCampaign($scope, localStorageService);

	function init() {
		// 1. Setting up scope ID values
		$scope.assemblyID = ($routeParams.aid) ? parseInt($routeParams.aid) : 0;
		$scope.campaignID = ($routeParams.cid) ? parseInt($routeParams.cid) : 0;
		$scope.componentID = ($routeParams.ciid) ? parseInt($routeParams.ciid) : 0;
		$scope.milestoneID = ($routeParams.mid) ? parseInt($routeParams.mid) : 0;

		$scope.serverBaseUrl = localStorageService.get("serverBaseUrl");
		$scope.etherpadServer = localStorageService.get("etherpadServer");

		console.log("API Server = " + $scope.serverBaseUrl);
		console.log("Etherpad Server = " + $scope.etherpadServer);
	}
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
			var res = Assemblies.assembly($scope.assemblyID).get();
			res.$promise.then(function(data) {
				$scope.assembly = data;
				localStorageService.set("currentAssembly", $scope.assembly);
			});
		} else {
			console.log("Route assembly ID is the same as the current assembly in local storage: "+$scope.assembly.assemblyId);
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
			var res = Campaigns.campaign($scope.assemblyID, $scope.campaignID).get();
			res.$promise.then(function(data) {
				$scope.campaign = data;
				localStorageService.set("currentCampaign", $scope.campaign);
				setCurrentComponent($scope,localStorageService);
				setCurrentMilestone($scope,localStorageService);
				setContributionsAndGroups($scope,localStorageService);
				setupDaysToDue();
			});
		} else {
			console.log("Route campaign ID is the same as the current campaign in local storage: "+$scope.campaign.campaignId);
			setCurrentComponent($scope,localStorageService);
			setCurrentMilestone($scope,localStorageService);
			setContributionsAndGroups($scope,localStorageService);
			setupDaysToDue();
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
			console.log("Setting current component to: "+ $scope.component.title );

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
				console.log("Route component ID is the same as the current component in local storage: "+$scope.component.componentInstanceId);
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

		console.log("Loading {assembly,campaign,component,milestone}: "
			+$scope.assembly.assemblyId+", "
			+$scope.campaign.campaignId+", "
			+$scope.component.componentInstanceId+", "
			+$scope.milestone.componentInstanceMilestoneId
		);


		console.log("Loading {# of components, # of components}: "
			+$scope.components.length+", "
			+$scope.milestones.length
		);

	}

	function setupDaysToDue() {
		// Days, hours, minutes to end date of this component phase
		var endDate = moment($scope.component.endDate, 'YYYY-MM-DD HH:mm:ss');
		var now = moment();
		var diff = endDate.diff(now, 'minutes');
		$scope.minutesToDue = diff%60;
		$scope.hoursToDue = Math.floor(diff/60) % 24;
		$scope.daysToDue = Math.floor(Math.floor(diff/60) / 24);

		// Days, hours, minutes to end date of this milestone stage
		var mStartDate = moment($scope.milestone.start, 'YYYY-MM-DD HH:mm:ss');
		var mDays = $scope.milestone.days;

		$scope.milestoneStarted = mStartDate.isBefore(now);
		if($scope.milestoneStarted) {
			mDiff = now.diff(mStartDate, 'days');
			$scope.mDaysToDue = $scope.milestone.days - mDiff;

		} else {
			mDiff = mStartDate.diff(now, 'days');
			$scope.mDaysToDue = mDiff;
		}
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