appCivistApp.service('loginService', function($resource, $http, $location, localStorageService, $modal, AppCivistAuth) {


	this.getUser = function() {
		return $resource(localStorageService.get("serverBaseUrl")+"/user/:id/loggedin", {id: '@id'});
	};
	
	this.getLogintState = function() {
		return this.userIsAuthenticated();
	};

	this.signUp = function(user, modalInstance) { //valentine written
		if (user.password.localeCompare(user.repeatPassword) != 0) {
			$rootScope.message = "Your passwords don't match."; 
			$location.url('/');
		} else if (user === '0') {
			$rootScope.message = 'You are already registered.'; 
			$location.url('/'); 
		}
		console.log(user);
		var authRes = AppCivistAuth.signUp().save(user);
		authRes.$promise.then(
				function(user) {
					if(modalInstance) {
						modalInstance.dismiss('cancel');
					}
					localStorageService.set('sessionKey',user.sessionKey);
					localStorageService.set('authenticated',true);
					console.log("User get from API: " + user.userId);
					localStorageService.set("user",user);
					$location.url('/home');
				},
				function(error) {
					$rootScope.message = "There was an error with your sign up" + error;
				}
		);
	}

	this.signIn = function(email, password) {
		var user = {};
		user.email = email;
		user.password = password;
		console.log(user);
		var authRes = AppCivistAuth.signIn().save(user);
		authRes.$promise.then(
				function(user) {
					if (user !== '0') {
						localStorageService.set('sessionKey', user.sessionKey);
						localStorageService.set('authenticated', true);
						console.log("User get from API: " + user.userId);
						localStorageService.set("user", user);
						$location.url('/home');
					} else { // Not Authenticated
						$rootScope.message = 'You need to log in.';
						// $timeout(function(){deferred.reject();}, 0);
						//deferred.reject();
						$location.url('/');
					}
				},
				function(error) {
					$modal.open({
						templateUrl: 'app/partials/landing/loginErrorModal.html',
						size: 'sm',
						controller: ['$scope', function($scope){
							$scope.close = function(){
								this.$close();
							}
						}]
					});
				}
		);
	};

	this.signOut = function(username) {
		var authRes = AppCivistAuth.signOut().save();
		authRes.$promise.then(clearDataAndRedirectToHome,clearDataAndRedirectToHome);
	};

	function clearDataAndRedirectToHome() {
		localStorageService.clearAll();
		$location.url('/');
	}

	this.verifyUser = function(userId) {
		return $resource(localStorageService.get("serverBaseUrl")+'/api/user/:uid/loggedin', {uid: UserId});
	}

	this.userIsAuthenticated = function() {
		var authenticated = localStorageService.get('authenticated');
		if (authenticated === undefined || authenticated === false) {
			var localUser = localStorageService.get('user');
			if (localUser != undefined) {
				var userId = localUser.userId;
				var user = User.get({id:userId},
						function(user) {
							if (user != undefined && user.userId > 0 ) {
								localStorageService.set('user',user);
								localStorageProvider.set('authenticated',true);
								//user.$save();
								//localStorageService.set('authenticated', true);
								//$location.url('/home');
							}
						});
			}
		}

		return 	authenticated;
	};
});