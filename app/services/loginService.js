appCivistApp.service('loginService', function($resource, $http, $location, localStorageService) {

	var serverBaseUrl = localStorageService.get('serverBaseUrl');
	if (serverBaseUrl == undefined || serverBaseUrl == null) {
		serverBaseUrl = appCivistCoreBaseURL;
		localStorageService.set("serverBaseUrl", appCivistCoreBaseURL);
		console.log("Setting API Server in loginService to: "+appCivistCoreBaseURL);
	} else {
		console.log("Using API Server in loginServer: "+serverBaseUrl);
	}

	//var User = $resource('https://appcivist-pb.herokuapp.com/api/user/:id/loggedin', {id: '@id'});
	var User = $resource(serverBaseUrl+"/user/:id/loggedin", {id: '@id'});


	this.getUser = function() {
		return User;
	};
	
	this.getLogintState = function() {
		return this.userIsAuthenticated();
	};

	this.signUp = function(user) { //valentine written
		if (user.password.localeCompare(user.repeatPassword) != 0) {
			$rootScope.message = "Your passwords don't match."; 
			$location.url('/');
		} else if (user === '0') {
			$rootScope.message = 'You are already registered.'; 
			$location.url('/'); 
		}
		console.log(user); 
		$http.post(serverBaseUrl+'/user/signup', user)
			.success(function(user) {
				localStorageService.set('sessionKey',user.sessionKey);
				localStorageService.set('authenticated',true);
				console.log("User get from API: " + user.userId);
				localStorageService.set("user",user);
				$location.url('/home');
			})
	}

	this.signIn = function(email, password) {
		var user = {};
		user.email = email;
		user.password = password;
		console.log(user);
		//$http.post('/user/login', {email:user.email,password:user.password})
		//$http.post('https://appcivist-pb.herokuapp.com/api/user/login', user)
		//var serverBaseUrl = $scope.serverBaseUrl;
		$http.post(serverBaseUrl+'/user/login', user)
			.success(function(user) {
				if (user !== '0') {
					localStorageService.set('sessionKey',user.sessionKey);
					localStorageService.set('authenticated',true);
					console.log("User get from API: " + user.userId);
					localStorageService.set("user",user);
					$location.url('/home');
				} else { // Not Authenticated
					$rootScope.message = 'You need to log in.';
					// $timeout(function(){deferred.reject();}, 0);
					//deferred.reject();
					$location.url('/');
				}
			});

	};

	this.signOut = function(username) {
		localStorageService.set('user',null);
		localStorageService.set('authenticated', false);
		localStorageService.set('sessionKey','');
		$http.post(serverBaseUrl+'/user/logout').success();
		$location.url('/');
		
	};

	this.userIsAuthenticated = function() {

		var authenticated = localStorageService.get('authenticated');

		// TODO check token expiration

		if (authenticated == undefined || authenticated == false) {
			var localUser = localStorageService.get('user');
			if (localUser != undefined) {
				var userId = localUser.userId;
				var user = User.get({id:userId}, function() {
					if (user != undefined && user.userId > 0 ) {
						localStorageService.set('user',user);
						localStorageProvider.set('authenticated',true);
						//user.$save();
						//localStorageService.set('authenticated', true);
						$location.url('/home');
					}
				});
			}
		}
		return 	authenticated;
	};
});