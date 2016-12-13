appCivistApp.service('loginService', function ($resource, $http, $location, localStorageService, $uibModal, AppCivistAuth,
  FlashService, $rootScope, $q, Memberships, Assemblies, $filter, $state, Notify, Campaigns) {


  this.getUser = function () {
    return $resource(localStorageService.get("serverBaseUrl") + "/user/:id/loggedin", { id: '@id' });
  };

  this.getLogintState = function () {
    return this.userIsAuthenticated();
  };

  this.signUp = function (user, scope, modalInstance, callback) {
    $rootScope.startSpinner();
    if (user.password && user.password.localeCompare(user.repeatPassword) != 0) {
      $rootScope.stopSpinner();
      Notify.show("Your passwords don't match.", 'error');
    } else if (user === '0') {
      $rootScope.stopSpinner();
      Notify.show("You are already registered.", 'error');
    } else {
      var authRes = AppCivistAuth.signUp().save(user);
      authRes.$promise.then(
        function (user) {
          if (modalInstance) {
            modalInstance.dismiss('cancel');
          }
          localStorageService.set('sessionKey', user.sessionKey);
          localStorageService.set('authenticated', true);
          localStorageService.set("user", user);
          scope.user = user;
          $rootScope.stopSpinner();
          $location.url('/v1/home');
        },
        function (error) {
          var data = error.data;
          scope.user = null;
          $rootScope.stopSpinner();
          Notify.show(data.statusMessage, 'error');
        }
      );
    }

    if (callback) { callback(); }
  };

  this.signIn = function (email, password, scope, callback) {
    $rootScope.startSpinner();
    var user = {};
    user.email = email;
    user.password = password;
    var authRes = AppCivistAuth.signIn().save(user);
    authRes.$promise.then(
      function (user) {
        $rootScope.stopSpinner();
        if (user !== '0') {
          localStorageService.set('sessionKey', user.sessionKey);
          localStorageService.set('authenticated', true);
          localStorageService.set("user", user);
          scope.user = user;

          loadAuthenticatedUserMemberships(user).then(function () {
            var ongoingCampaigns = localStorageService.get('ongoingCampaigns');
            var assembly = localStorageService.get('currentAssembly');
            $state.go('v2.assembly.aid.campaign.cid',
              { aid: assembly.assemblyId, cid: ongoingCampaigns[0].campaignId },
              { reload: true }).then(function () {
                location.reload();
              });
          });
        } else { // Not Authenticated
          scope.user = null;
          $location.url('/');
          Notify.show('You need to log in.', 'error');
        }
      },
      function (error) {
        $rootScope.stopSpinner();
        var data = error.data;
        Notify.show(data ? data.statusMessage ? data.statusMessage : '' : '', 'error');
      }
    );
    if (callback) { callback(); }
  };

  this.signOut = function (username, scope, callback) {
    var authRes = AppCivistAuth.signOut().save();
    authRes.$promise.then(clearDataAndRedirectToHome, clearDataAndRedirectToHome);
    if (callback) { callback() }
  };

  function clearDataAndRedirectToHome() {
    localStorageService.clearAll();
    $location.url('/');
  }

  this.verifyUser = function (userId) {
    return $resource(localStorageService.get("serverBaseUrl") + '/api/user/:uid/loggedin', { uid: UserId });
  };

  this.userIsAuthenticated = function () {
    var authenticated = localStorageService.get('authenticated');
    if (authenticated === undefined || authenticated === false) {
      var localUser = localStorageService.get('user');
      if (localUser != undefined) {
        var userId = localUser.userId;
        var user = User.get({ id: userId },
          function (user) {
            if (user != undefined && user.userId > 0) {
              localStorageService.set('user', user);
              localStorageProvider.set('authenticated', true);
            }
          });
      }
    }
    return authenticated;
  };

  this.changePassword = function (data) {
    return $resource(localStorageService.get('serverBaseUrl') + '/user/password/change');
  };

  /**
   * Retrieve and store current user working groups, ongoing campaigns.
   */
  this.loadAuthenticatedUserMemberships = function () {
    return loadAuthenticatedUserMemberships();
  };

  function loadAuthenticatedUserMemberships() {
    var user = localStorageService.get('user');
    var rsp = Memberships.memberships(user.userId).query();
    return rsp.$promise.then(memberSuccess, memberError);
  }

  function memberSuccess(data) {
    var membershipsInGroups = $filter('filter')(data, { status: 'ACCEPTED', membershipType: 'GROUP' });
    var membershipsInAssemblies = $filter('filter')(data, { status: 'ACCEPTED', membershipType: 'ASSEMBLY' });
    var myWorkingGroups = [];
    var myAssemblies = [];
    var groupMembershipsHash = {};
    var assemblyMembershipsHash = {};


    angular.forEach(membershipsInGroups, function (m) {
      myWorkingGroups.push(m.workingGroup);
      groupMembershipsHash[m.workingGroup.groupId] = m.roles;
    });

    angular.forEach(membershipsInAssemblies, function (m) {
      myAssemblies.push(m.assembly);
      assemblyMembershipsHash[m.assembly.assemblyId] = m.roles;

    });

    localStorageService.set('myWorkingGroups', myWorkingGroups);
    localStorageService.set('assemblies', myAssemblies);
    localStorageService.set('groupMembershipsHash', groupMembershipsHash);
    localStorageService.set('assemblyMembershipsHash', assemblyMembershipsHash);

    var currentAssembly = myAssemblies[0];
    if (currentAssembly != null) {
      return singleAssemblySuccess(currentAssembly);
    } else {
      singleAssemblyError("No assembly in memberships");
    }
  }

  function memberError(error) {
    Notify.show('Error while trying to get assemblies from server', 'error');
  }

  function singleAssemblySuccess(assembly) {
    var user = localStorageService.get('user');
    localStorageService.set('currentAssembly', assembly);
    var ongoingCampaigns = $filter('filter')(assembly.campaigns, { active: true });

    var rsp = Campaigns.campaigns(user.uuid, 'ongoing').query().$promise;
    rsp.then(
      function (data) {
        localStorageService.set('ongoingCampaigns', data);
      },
      function(){
        Notify.show('Error while trying to get ongoing campaigns from server', 'error');
      }
    )
    return rsp;
  }

  function singleAssemblyError(error) {
    Notify.show('Error while trying to get assembly from server', 'error');
  }

  function assembliesSuccess(memberships) {
    var currentAssembly = localStorageService.get('currentAssembly');
    var assemblies = [];
    angular.forEach(memberships, function (m) {

      if (m.assembly.assemblyId !== currentAssembly.assemblyId) {
        assemblies.push(m.assembly);
      }
    });
    localStorageService.set('assemblies', assemblies);
    var deferred = $q.defer();
    deferred.resolve(assemblies);
    return deferred.promise;
  }

  function assembliesError(error) {

    if (error.data && error.data.responseStatus === 'NODATA') {
      localStorageService.set('assemblies', []);
      var deferred = $q.defer();
      deferred.resolve([]);
      return deferred.promise;
    }
    Notify.show('Error while trying to get assemblies from server', 'error');
  }
});
