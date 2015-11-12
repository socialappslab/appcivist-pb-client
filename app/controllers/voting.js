appCivistApp.controller('VotingLandingCtrl', function($scope){
	$scope.instructions = {
		range: 'All Assembly members may vote.',
		system:'Range Voting:'};
	$scope.configuration = [
		'For each proposal, assign a score between 0(min) and 100(max).',
	'The first 3 top ranked proposals will be declared winners, regardless of budget.'];
	$scope.information = [{
		dateAndTheme: 'Saturday, March 21: Vote Launch & Project Expo',
		time:'(9 AM - 2 PM)',
		address:'Houghton Park Community Center, 6301 Myrtle Avenue',
		addition: 'Come vote and enjoy free food, music and activities for kids!'},
		{dateAndTheme: 'Sunday, March 22: Light & Life',
		time:'(9:30 AM - 1 PM)',
		address:'Light & Life Church, 5951 Downey Avenue',
		addition:''},
		{dateAndTheme: 'Monday-Thursday, March 23-26: Main Voting Site ',
		time:'(2 PM - 7 PM)',
		address:'Council District 9 Field Office, 6509 Gundry Avenue',
		addition: ''},
		{dateAndTheme: 'Friday, March 27: Main Voting Site (extended hours!)',
		time:'(7:30 AM - 5 PM)',
		address:'Council District 9 Field Office, 6509 Gundry Avenue',
		addition:''}];

});

appCivistApp.controller('RangeVotingCtrl', function($scope){
	$scope.urbanProposals = [
		{name: 'Playground in Square Marcel Mouioudji',
		image:'assets/images/image78.jpg',
		cost:'175000',
		location:'Square Marcel Mouioudji, 75019 Paris',
		description: 'Random description goes here as an example. I do not have anything particular in mind, so I am just going to say something like this'},
		{name: 'Organic Garden in Square Marcel Mouioudji',
		image:'assets/images/image78.jpg',
		cost:'25000',
		location:'Square Marcel Mouioudji, 75019 Paris',
		description: 'Random description goes here as an example. I do not have anything particular in mind, so I am just going to say something like this'},
		{name: 'Library at Hamman Médina Center',
		image:'assets/images/image78.jpg',
		cost:'150000',
		location:'Hamman Médina Center, Rue Petit, Paris',
		description: 'Random description goes here as an example. I do not have anything particular in mind, so I am just going to say something like this'},
		{name: 'Smart Traffic lights on Rue de Crimée',
		image:'assets/images/image78.jpg',
		cost:'100000',
		location:'Rue de Crimée, 75019 Paris',
		description: 'Random description goes here as an example. I do not have anything particular in mind, so I am just going to say something like this'},
		{name: 'City bike sharing in Parc des Buttes-Chaumont',
		image:'assets/images/image78.jpg',
		cost:'100000',
		location:'Rue de Crimée, 75019 Paris',
		description: 'Random description goes here as an example. I do not have anything particular in mind, so I am just going to say something like this'}
	];
	$scope.streetProposals = [
		{name: 'Interactive Urban Lights Project on major avenues',
		image:'assets/images/dublin.jpg',
		cost:'175000',
		location:'Square Marcel Mouioudji, 75019 Paris',
		description: 'Random description goes here as an example. I do not have anything particular in mind, so I am just going to say something like this'},
		{name: 'Alley lighting in Higher-Crime Zones',
		image:'assets/images/dublin.jpg',
		cost:'25000',
		location:'Square Marcel Mouioudji, 75019 Paris',
		description: 'Random description goes here as an example. I do not have anything particular in mind, so I am just going to say something like this'},
		{name: 'Rue de Tangier beautification',
		image:'assets/images/dublin.jpg',
		cost:'150000',
		location:'Hamman Médina Center, Rue Petit, Paris',
		description: 'Random description goes here as an example. I do not have anything particular in mind, so I am just going to say something like this'},
		{name: 'Bike Lanes on Avenue Jean Jaurés',
		image:'assets/images/dublin.jpg',
		cost:'100000',
		location:'Rue de Crimée, 75019 Paris',
		description: 'Random description goes here as an example. I do not have anything particular in mind, so I am just going to say something like this'}
	];
});

appCivistApp.controller('RangeResultCtrl', function($scope) {
	$scope.bound = '100';
	$scope.winners = [
		{name: 'Organic Garden in Parc de Belleville',
		image:'assets/images/image78.jpg',
		cost:'25000',
		location:'Square Marcel Mouioudji, 75019 Paris',
		description: 'Random description goes here as an example. I do not have anything particular in mind, so I am just going to say something like this',
		theme: 'Urban Infrastructure',
		point: '78',
		assembly: 'Passionés du Parc de Belleville',
		icon: 'assets/images/image71.tiff',
		comments: '3',
		likes: '50'},
		{name: 'Smart Traffic lights on Rue de Ménilmontant',
		image:'assets/images/image78.jpg',
		cost:'100000',
		location:'Rue de Crimée, 75019 Paris',
		description: 'Random description goes here as an example. I do not have anything particular in mind, so I am just going to say something like this',
		theme: 'Streets and Transportation',
		point: '62',
		assembly: 'Conseil Belleville',
		icon: 'assets/images/image69.tiff',
		comments: '34',
		likes: '89'},
		{name: 'Library at Rue Ramponeau',
		image:'assets/images/image78.jpg',
		cost:'150000',
		location:'Hamman Médina Center, Rue Petit, Paris',
		description: 'Random description goes here as an example. I do not have anything particular in mind, so I am just going to say something like this',
		theme: 'Urban Infrastructure',
		point: '38',
		assembly: 'Passionés du Parc de Belleville',
		icon: 'assets/images/image71.tiff',
		comments:'3',
		like:'50'}
		
	];
	$scope.used = '27';
	$scope.total = '300000';
	$scope.others = [
		{name: 'Playground in Parc de Belleville',
		points: '16'},
		{name: 'Organic Garden in Parc de Belleville',
		points: '15'},
		{name: 'Playground in Parc de Belleville',
		points: '12'},
		{name: 'Library at Rue Ramponeau',
		points: '5'},
		{name: 'Smart traffic lights on Rue de Ménilmontant',
		points: '3'},
		{name: 'Smart traffic lights on Rue de Ménilmontant',
		points: '3'}
	];
	$scope.calculateTotal = function() {
		var total = 0; 
		var i = 0; 
		for (i = 0; i < $scope.winners.length; i++) {
			total += parseInt($scope.winners[i].cost); 
		}
		return total.toString(); 
	}
});

appCivistApp.controller('RangeSummaryCtrl', function($scope, $http, $routeParams, localStorageService, VoteSummary){
//	var res_1 = VoteSummary.votingBallot().get(); // gets the VotingBallot
//	var res_2 = VoteSummary.votingBallotVote().get(); 
//	res_1.$promise.then(function(data) {
//		$scope.votingBallot = data; 
//		$scope.year = $scope.votingBallot.ends.getYear(); 
//		$scope.month = $scope.votingBallot.ends.getMonth(); 
//	}
//	res_2.$promise.then(function(data) {
//		$scope.votingBallotVote = data; 
//		$scope.votingBallotVotes = data.voteValues; 
//	}); 	
//      $scope.getCurrentName = function(votingCandidate candidate) {
//		    var res = VoteSummary.votingCandidateName(candidate.targetUUID).get(); 
//		    return res.title; 
//	}//
//

//	// hardcoded stuff vvvvv 
//	$scope.assembly = localStorageService.get('currentAssembly');
//	$scope.year = '2016'; 
//	$scope.assembly = 'Paris PB 2016'; 
//	$scope.year = '2016'; 
//	$scope.month = 'August'; 
//	$scope.totalScored = '09'; 
//	$scope.totalProposals = '12'; 
//	$scope.votingBallotVotes = [
//		{name: 'Playground in Parc de Belleville', voteValue: '80/100'}, 
//		{name: 'Organic Garden in Parc de Belleville', voteValue: '50/100'}, 
//		{name: 'Library at Rue Ramponeau', voteValue: '95/100'}, 
//		{name: 'Smart traffic lights on Rue de Ménilmontant', voteValue: '32/100'}
//	]; 
	var vote = VoteSummary.vote().get(); 
	vote.$promise.then(function(data) {
		$scope.votingBallot = data.votingBallot; 
		$scope.year = $scope.votingBallot.ends.getYear(); 
		$scope.month = $scope.votingBallot.ends.getMonth(); 
		$scope.votingBallotVotes = data.voteValues; 
		$scope.totalProposals = data.totalProposals; 
		$scope.totalScored = data.totalScored; 
	})
 // local storage service: set and get 
});