(function() {
'use strict';

appCivistApp
  .controller('v2.ProfileCtrl', ProfileCtrl);
  
ProfileCtrl.$inject = [
  '$scope', '$resource', '$location', 'localStorageService', '$http',
  'loginService', 'FlashService'
];

function ProfileCtrl($scope,$resource,$location, localStorageService, $http,
                     loginService, FlashService){
	$scope.user = localStorageService.get('user');
	$scope.profile = {
		'firstname': $scope.user.name.split(' ')[0],
		'lastname': $scope.user.name.split(' ')[1],
		'email': $scope.user.email,
		'username': $scope.user.username
	};

	$scope.blurReset = function() {
		if (!$scope.profile.firstname) {
			$scope.profile.firstname = $scope.user.name.split(' ')[0];
		}
		if (!$scope.profile.lastname) {
			$scope.profile.lastname = $scope.user.name.split(' ')[1];
		}
		if (!$scope.profile.email) {
			$scope.profile.email = $scope.user.email;
		}
		if (!$scope.profile.username) {
			$scope.profile.username  = $scope.user.username;
		}

	};

	$scope.updateProfile = function() {
		$scope.user.username = $scope.profile.username;
    $scope.user.name = $scope.profile.firstname + ' ' + $scope.profile.lastname;
    console.log('user', $scope.user.name);
    $scope.user.email = $scope.profile.email;
		var url = localStorageService.get('serverBaseUrl') + '/user/' + $scope.user.userId;
		var data = $scope.user;
		$http.put(url, data).then(function(response){
      var rsp = loginService.getUser().get({id: $scope.user.userId});
      rsp.$promise.then(
         function(data) {
          localStorageService.set('user', data);
        },
         function(error) {
          FlashService.Error('Error fetching user information from the server'); 
        }
      );
		});

	};

}

}());
