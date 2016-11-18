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

  activate();

  function activate() {
    $scope.user = localStorageService.get('user');
    $scope.profile = {
      'firstname': $scope.user.name.split(' ')[0],
      'lastname': $scope.user.name.split(' ')[1],
      'email': $scope.user.email,
      'username': $scope.user.username
    };
    $scope.blurReset = blurReset;
    $scope.updateProfile = updateProfile;
    $scope.toggleChangePassword = toggleChangePassword;
  }

	function blurReset() {
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

	}

	function updateProfile() {
		$scope.user.username = $scope.profile.username;
    $scope.user.name = $scope.profile.firstname + ' ' + $scope.profile.lastname;
    $scope.user.email = $scope.profile.email;
		var url = localStorageService.get('serverBaseUrl') + '/user/' + $scope.user.userId;
		var data = $scope.user;
		$http.put(url, data).then(function(response){
      var rsp = loginService.getUser().get({id: $scope.user.userId});
      rsp.$promise.then(
         function(data) {
          localStorageService.set('user', data);
          passwordChange();
        },
         function(error) {
          FlashService.Error('Error fetching user information from the server'); 
        }
      );
		});
	}

  function toggleChangePassword() {
    $scope.showChangePassword = !$scope.showChangePassword;
  }

  function passwordChange() {
    if(!$scope.profile.password) {
      return;
    }

    if($scope.profile.password === $scope.profile.repeatPassword) {
      var url = localStorageService.get('serverBaseUrl') + '/user/password/change';
      var data = {
        password: $scope.profile.password,
        repeatPassword: $scope.profile.repeatPassword
      };
      var rsp = loginService.changePassword();
      rsp.save(data).$promise.then(
        function(response){
          console.log('password updated');
        },
        function(error) {
          FlashService.Error('Error updating user password'); 
        }
      );
    }else{
      FlashService.Error('Repeat password field does not match'); 
    }
  }
}

}());
