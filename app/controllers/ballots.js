appCivistApp.controller('ConsensusVotingCtrl', function($scope, $http, $routeParams, localStorageService,
														  Contributions, $translate ) {

  init();

  function init() {
    $scope.user = localStorageService.get('user');
    console.log('test');
  }
});
