appCivistApp.controller('CreateCampaignCtrl', function($scope){
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
});

appCivistApp.controller('CampaignCtrl', function($scope, $http){
	$scope.activePhases = [];
	$scope.selectedPhase = 'proposalMaking';

	$http.get('assets/suggestions/suggestions.json').success(function(data){
		$scope.suggestions = data;
	}).error(function(error){
		console.log('Error loading data' + error);
	});
});