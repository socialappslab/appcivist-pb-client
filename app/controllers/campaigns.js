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

appCivistApp.controller('CampaignCtrl', function($scope, $http, localStorageService){
	$scope.campaign = localStorageService.get('currentCampaign');
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