appCivistApp.service('loginService', function($resource, $http, $location, localStorageService) {

	var User = $resource('https://appcivist-pb.herokuapp.com/api/user/loggedin/:id', {id: '@id'});

	this.getUser = function() {
		return user;
	};
	
	this.getLogintState = function() {
		return user.authenticated;
	};

	this.signIn = function(email, password) {
		var user = {};
		user.email = email;
		user.password = password;
		console.log(user);
		//$http.post('/user/login', {email:user.email,password:user.password})
		$http.post('https://appcivist-pb.herokuapp.com/api/user/login', user)
			.success(function(user) {
				if (user !== '0') {
					localStorageService.set("user",user);
					localStorageService.set("session_key",user.sessionKey);
					user = User.get({id:user.id});
					console.log("User get from API: " + user);
					localStorageService.set('authenticated',true);
					$location.url('/assemblies');
					// Not Authenticated
				} else {
					$rootScope.message = 'You need to log in.';
					// $timeout(function(){deferred.reject();}, 0);
					//deferred.reject();
					$location.url('/');
				}
			});

	};

	this.signOut = function(username) {
		user.username = '';
		user.authenticated = false;
		$http.post('https://appcivist-pb.herokuapp.com/api/user/logout').success();
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
					user.authenticated = true;
					user.$save();
					localStorageService.set('authenticated', true);
					//$location.url('/assemblies');
				}
			});
		}
		}
		return 	authenticated;
	};
});