appCivistApp.service('loginService', function($resource, $http, $location, localStorageService, $uibModal, AppCivistAuth,
											  FlashService, $rootScope, $q, Memberships, Assemblies, $filter, $state) {


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
	};

	this.signIn = function(email, password, scope, callback) {
		$rootScope.startSpinner();
		var user = {};
		user.email = email;
		user.password = password;
		var authRes = AppCivistAuth.signIn().save(user);
		authRes.$promise.then(
				function(user) {
					$rootScope.stopSpinner();
					if (user !== '0') {
						localStorageService.set('sessionKey', user.sessionKey);
						localStorageService.set('authenticated', true);
						console.log("User get from API: " + user.userId);
						localStorageService.set("user", user);
						scope.user = user;

            loadAuthenticatedUserMemberships(user).then(function() {
              var ongoingCampaigns = localStorageService.get('ongoingCampaigns');
              var assembly = localStorageService.get('currentAssembly');
              $state.go('v2.assembly.aid.campaign.cid', {aid: assembly.assemblyId, cid: ongoingCampaigns[0].campaignId}, {reload: true});
              location.reload();
            });
          } else { // Not Authenticated
						scope.user = null;
						$location.url('/');
						FlashService.ErrorWithModal('You need to log in.', "USER", null, "UNAUTHORIZED", false);
					}
				},
				function(error) {
					$rootScope.stopSpinner();
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
	};

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

  this.changePassword = function(data) {
    return $resource(localStorageService.get('serverBaseUrl') + '/user/password/change');
  };

  /**
   * Retrieve and store current user working groups, ongoing campaigns.
   */
  this.loadAuthenticatedUserMemberships = function(){
    return loadAuthenticatedUserMemberships();
  };

  function loadAuthenticatedUserMemberships() {
    var user = localStorageService.get('user');
    var rsp = Memberships.workingGroups(user.userId).query();
    return rsp.$promise.then(memberSuccess, memberError);
  }

  function memberSuccess(data) {
    var membershipsInGroups = $filter('filter')(data, { status: 'ACCEPTED' });
    var myWorkingGroups = [];

    angular.forEach(membershipsInGroups, function(m) {
      myWorkingGroups.push(m.workingGroup);
    });
    var wg = myWorkingGroups[0];
    localStorageService.set('myWorkingGroups', myWorkingGroups);
    var currentAssembly = wg.assemblies[0];
    var rsp = Assemblies.assembly(currentAssembly).get();
    return rsp.$promise.then(singleAssemblySuccess, singleAssemblyError);
  }

  function memberError(error) {
		FlashService.Error('Error while trying to get assemblies from server');
  }

  function singleAssemblySuccess(assembly) {
    localStorageService.set('currentAssembly', assembly);
    var ongoingCampaigns = $filter('filter')(assembly.campaigns, { active: true });
    localStorageService.set('ongoingCampaigns', ongoingCampaigns);
    var user = localStorageService.get('user');
    return Memberships.assemblies(user.userId).query().$promise.then(assembliesSuccess, assembliesError);
  }

  function singleAssemblyError(error) {
		FlashService.Error('Error while trying to get assembly from server');
  }

  function assembliesSuccess(memberships) {
    var currentAssembly = localStorageService.get('currentAssembly');
    var assemblies = [];
    angular.forEach(memberships, function(m) {

      if(m.assembly.assemblyId !== currentAssembly.assemblyId) {
        assemblies.push(m.assembly);
      }
    });
    localStorageService.set('assemblies', assemblies);
    var deferred = $q.defer();
    deferred.resolve(assemblies);
    return deferred.promise;
  }

  function assembliesError(error) {

    if(error.data && error.data.responseStatus === 'NODATA') {
      localStorageService.set('assemblies', []);
      var deferred = $q.defer();
      deferred.resolve([]);
      return deferred.promise;
    }
    FlashService.Error('Error while trying to get assemblies from server');
  }
});
