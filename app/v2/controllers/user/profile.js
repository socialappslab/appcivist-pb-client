(function() {
  'use strict';

  appCivistApp
    .controller('v2.ProfileCtrl', ProfileCtrl);

  ProfileCtrl.$inject = [
    '$rootScope', '$scope', '$resource', '$location', 'localStorageService', '$http',
    'loginService', 'Notify', '$translate', 'Facebook', 'Memberships'
  ];

  function ProfileCtrl($rootScope, $scope, $resource, $location, localStorageService, $http,
    loginService, Notify, $translate, Facebook, Memberships) {

    activate();

    function activate() {
      $scope.user = localStorageService.get('user');
      $scope.showFbSocialIdeationButton = false;
      $scope.FbButtonMessage = "Connect to Facebook through Social Ideation";
      $scope.alreadyLoggedInFb = false;
      // $scope.assemblyUuid = "";
      $scope.userAssemblies = [];
      let lang = $scope.user.lang || $scope.user.language;
      if ($scope.user && lang) {
        $translate.use(lang);
      }
      if ($scope.user != undefined) {
        console.log($scope.user);
        $scope.profile = {
          name: $scope.user.name,
          firstname: $scope.user.firstname,
          lastname: $scope.user.lastname,
          email: $scope.user ? $scope.user.email : '',
          username: $scope.user ? $scope.user.username : '',
          facebookUserId: $scope.user ? $scope.user.facebookUserId : '',
          userAccessToken: $scope.user ? $scope.user.userAccessToken : '',
          tokenExpiresIn: $scope.user ? $scope.user.tokenExpiresIn : '',
          lang: $scope.user ? $scope.user.lang : 'en-US',
          language: $scope.user ? $scope.user.language : 'en-US'
        };
        $scope.userFromServer = {
          name: $scope.profile.name,
          firstname: $scope.profile.firstname,
          lastname: $scope.profile.lastname,
          email: $scope.profile.email,
          username: $scope.profile.username,
          facebookUserId: $scope.profile.facebookUserId,
          userAccessToken: $scope.profile.userAccessToken,
          tokenExpiresIn: $scope.profile.tokenExpiresIn,
          lang: $scope.profile.lang,
          language: $scope.profile.language
        };
      }
      $scope.blurReset = blurReset;
      $scope.updateProfile = updateProfile;
      $scope.toggleChangePassword = toggleChangePassword;
      $scope.getImageFromFile = getImageFromFile.bind($scope);
      $scope.goBack = goBack.bind($scope);
      $scope.emailIsForbidden = emailIsForbidden.bind($scope);
      $scope.$watch('profile.profile_pic', $scope.getImageFromFile);

      $scope.langlist = [];

      verifyMembershipConfigs();
      getLocales();
    }

    function blurReset() {
      if (!$scope.profile.firstname) {
        $scope.profile.firstname = $scope.user ? $scope.user.name ? $scope.user.name.split(' ')[0] : '' : '';
      }
      if (!$scope.profile.lastname) {
        $scope.profile.lastname = $scope.user ? $scope.user.name ? $scope.user.name.split(' ')[1] : '' : '';
      }
      if (!$scope.profile.email) {
        $scope.profile.email = $scope.user ? $scope.user.email : '';
      }
      if (!$scope.profile.username) {
        $scope.profile.username = $scope.user ? $scope.user.username : '';
      }
    }

    function getLocales() {
      $scope.langlist = $translate.getAvailableLanguageKeys().slice().sort();
    }

    function updateUserData(checkPic = false) {
      var url = localStorageService.get('serverBaseUrl') + '/user/' + $scope.user.userId;
      if (checkPic && picChanged()) {
        updatePic(false);
      }
      $http.put(url, {
        name: $scope.profile.name,
        firstname: $scope.profile.firstname,
        lastname: $scope.profile.lastname,
        email: $scope.profile.email,
        username: $scope.profile.username,
        facebookUserId: $scope.profile.facebookUserId,
        lang: $scope.profile.lang,
        language: $scope.profile.language
      }
      ).then(function(response) {
        var rsp = loginService.getUser().get({ id: $scope.user.userId });
        rsp.$promise.then(
          function(data) {
            localStorageService.set('user', data);
            if (passwordChanged()) {
              updatePassword();
            } else {
              $translate('Changed saved').then(
                successMsg => {
                  Notify.show(successMsg, 'success');
                }
              );
              //Notify.show('Data saved correctly');
              window.location.reload();
            }
          },
          function(error) {
            Notify.show(error.statusMessage, 'error');
          }
        );
      });
    }

    function updatePic(checkData = false) {
      var url = localStorageService.get('serverBaseUrl') + '/user/' + $scope.user.userId;
      var fd = new FormData();
      fd.append('profile_pic', $scope.profile.profile_pic);
      $http.put(url, fd, {
        headers: {
          'Content-Type': undefined
        },
        transformRequest: angular.identity,
        params: {}
      }).then(function(response) {
        if (checkData && userInfoChanged()) {
          updateUserData();
        } else {
          $translate('Changed saved').then(
            successMsg => {
            Notify.show(successMsg, 'success');
            }
          );
          //Notify.show('Data saved correctly');
          window.location.reload();
        }
      }, function(error) {
        Notify.show(error.statusMessage, 'error');
      });
    }

    function updateProfile() {
      if (userInfoChanged()) {
        updateUserData(true);
      }
      else if (picChanged()) {
        updatePic(true);
      } else if (passwordChanged()) {
        updatePassword();
      }
    }

    function toggleChangePassword() {
      $scope.showChangePassword = !$scope.showChangePassword;
    }

    function updatePassword() {
      if ($scope.profile.password === $scope.profile.repeatPassword) {
        if ($scope.profile.password.length < 5) {
          Notify.show('Password length must at least 5 characters', 'error');
          return;
        }

        var url = localStorageService.get('serverBaseUrl') + '/user/password/change';
        var data = {
          password: $scope.profile.password,
          repeatPassword: $scope.profile.repeatPassword,
          // TODO: we should change the API to not request this
          oldPassword: $scope.profile.oldPassword
        };
        var ChangePasswordService = loginService.changePassword();
        var rsp = new ChangePasswordService(data);
        rsp.$save().then(
          function(response) {
            $translate('Changed saved').then(
              successMsg => {
                Notify.show(successMsg, 'success');
              }
            );
            //Notify.show('Data saved correctly');
          },
          function(error) {
            console.log(error);
            Notify.show(error.statusMessage, 'error');
          }
        );
      } else {
        Notify.show('Repeat password field does not match', 'error');
      }
    }

    function emailIsForbidden() {
      return ($scope.profile['email'].includes('@example.com') || $scope.profile['email'].includes('@appcivist.com') || $scope.profile['email'].includes('@ldap.com'));
    }

    function userInfoChanged() {
      var props = ['firstname', 'lastname', 'email', 'username', 'facebookUserId', 'lang', 'language'];

      if (emailIsForbidden()) {
        return false;
      }

      for (var i = 0; i < props.length; i++) {
        var prop = props[i];
        if ($scope.profile[prop] !== $scope.userFromServer[prop]) {
          return true;
        }
      }
      return false;
    }

    function picChanged() {
      if ($scope.profile.profile_pic !== $scope.userFromServer.profile_pic) {
        return true;
      }
      return false;
    }

    function passwordChanged() {
      return !!$scope.profile.password;
    }

    function getImageFromFile(file) {
      if (!file) {
        return;
      }
      let reader = new FileReader();
      reader.onload = (e) => {
        $scope.$apply(() => $scope.profile.selectedPic = e.target.result);
      };
      reader.readAsDataURL(file);
    }

    function updateFacebookToken(assemblyUuid){
      $scope.FbButtonMessage = "Connected to Facebook through Social Ideation"
      var url = localStorageService.get('serverBaseUrl') + '/user/' + $scope.user.userId + '/fbtoken';
      var fd = new FormData();
      fd.append('userId', $scope.profile.facebookUserId);
      fd.append('accessToken', $scope.profile.userAccessToken);
      fd.append('expiration', $scope.profile.tokenExpiresIn);
      fd.append('auuid', assemblyUuid);
      $http.get(url, fd, {
          headers: {
            'Content-Type': undefined
          },
          transformRequest: angular.identity,
          params: {}
        }).then(
          function(response) {
            $http.put(url, fd, {
              headers: {
                'Content-Type': undefined
              },
              transformRequest: angular.identity,
              params: {}
            });
          },
          function(error) {
            console.log(error);
            $http.post(url, fd, {
              headers: {
                'Content-Type': undefined
              },
              transformRequest: angular.identity,
              params: {}
            });
          }
        );
    }

    function verifyMembershipConfigs(uid){
      var rsp = Memberships.assemblies($scope.user.userId).query();
      rsp.$promise.then(
        function(data) {
          for(let assembly of data) {
            if( assembly && assembly.assembly.configs){
              for(let config of assembly.assembly.configs){
                if (config.key === "appcivist.assembly.enable-social-ideation" && (config.value === "true" || config.value === "TRUE")){
                  $scope.userAssemblies.push(assembly.assembly);
                  break;
                }
              }
            }
          }
        },
        function (error){
          console.log("Eror when trying to get user's assemblies and configs "+JSON.stringify(error));
        }
      );

    }

    function goBack() {
      window.history.back();
    }

    $scope.login = function (assemblyUuid) {
      // From now on you can use the Facebook service just as Facebook api says
      Facebook.login(function(response) {
        $scope.profile.facebookUserId = response.authResponse.userID;
        $scope.profile.userAccessToken = response.authResponse.accessToken;
        $scope.profile.tokenExpiresIn = response.authResponse.expiresIn;
        updateFacebookToken(assemblyUuid);
      }, {scope: 'public_profile,email,user_friends,publish_actions'});
    };

     $scope.getLoginStatus = function(assemblyUuid) {
      Facebook.getLoginStatus(function(response) {
        if(response.status === 'connected') {
          $rootScope.showAlert("Permissions already granted", "You have already logged in with Social Ideation Facebook app", "", false);
          $scope.alreadyLoggedInFb = true;
          $scope.profile.facebookUserId = response.authResponse.userID;
          $scope.profile.userAccessToken = response.authResponse.accessToken;
          $scope.profile.tokenExpiresIn = response.authResponse.expiresIn;
          updateFacebookToken(assemblyUuid);
        } else {
          $scope.login(assemblyUuid);
        }
      });
    };

    $scope.$watch(function() {
    // This is for convenience, to notify if Facebook is loaded and ready to go.
      return Facebook.isReady();
    }, function(newVal) {
      // You might want to use this to disable/show/hide buttons and else
      $scope.facebookReady = true;
    });
  }
}());
