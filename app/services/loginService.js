appCivistApp.service('loginService', function($resource, $http, $location, localStorageService, $uibModal, AppCivistAuth,
											  FlashService, $rootScope) {


	this.getUser = function() {
		return $resource(localStorageService.get("serverBaseUrl")+"/user/:id/loggedin", {id: '@id'});
	};

	this.getLogintState = function() {
		return this.userIsAuthenticated();
	};

	this.signUp = function(user, scope, modalInstance, callback) {
		$rootScope.startSpinner();
		if (user.password && user.password.localeCompare(user.repeatPassword) != 0) {
			$rootScope.stopSpinner();
			FlashService.ErrorWithModal("Your passwords don't match.", "USER", null, "BADREQUEST", false);
		} else if (user === '0') {
			$rootScope.stopSpinner();
			FlashService.ErrorWithModal("You are already registered.", "USER", null, "BADREQUEST", false);
		} else {
			console.log(user);
			var authRes = AppCivistAuth.signUp().save(user);
			authRes.$promise.then(
					function (user) {
						if (modalInstance) {
							modalInstance.dismiss('cancel');
						}
						localStorageService.set('sessionKey', user.sessionKey);
						localStorageService.set('authenticated', true);
						console.log("User get from API: " + user.userId);
						localStorageService.set("user", user);
						scope.user = user;
						$rootScope.stopSpinner();
						$location.url('/home');
					},
					function (error) {
						var data = error.data;
						scope.user = null;
						$rootScope.stopSpinner();
						FlashService.ErrorWithModal(data.statusMessage, "USER", null, data.responseStatus, false);
					}
			);
		}

		if (callback) { callback(); }
	}

	this.signIn = function(email, password, scope, callback) {
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
						scope.user = user;
						$location.url('/home');
					} else { // Not Authenticated
						scope.user = null;
						$location.url('/');
						FlashService.ErrorWithModal('You need to log in.', "USER", null, "UNAUTHORIZED", false);
					}
				},
				function(error) {
					var data = error.data;
					FlashService.ErrorWithModal(data.statusMessage, "USER", null, data.responseStatus, false);
					//$uibModal.open({
					//	templateUrl: 'app/partials/landing/loginErrorModal.html',
					//	size: 'sm',
					//	controller: ['$scope', function($scope){
					//		$scope.close = function(){
					//			this.$close();
					//		}
					//	}]
					//});
				}
		);
		if(callback){callback();}
	};

	this.signOut = function(username, scope, callback) {
		var authRes = AppCivistAuth.signOut().save();
		authRes.$promise.then(clearDataAndRedirectToHome,clearDataAndRedirectToHome);
		if(callback){callback()}
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
