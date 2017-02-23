(function () {
  'use strict';

  appCivistApp
    .controller('v2.ProfileCtrl', ProfileCtrl);

  ProfileCtrl.$inject = [
    '$scope', '$resource', '$location', 'localStorageService', '$http',
    'loginService', 'Notify', '$translate'
  ];

  function ProfileCtrl($scope, $resource, $location, localStorageService, $http,
    loginService, Notify, $translate) {

    activate();

    function activate() {
      $scope.user = localStorageService.get('user');
      if ($scope.user && $scope.user.language)
        $translate.use($scope.user.language);
      $scope.profile = {
        firstname: $scope.user.name.split(' ')[0],
        lastname: $scope.user.name.split(' ')[1],
        email: $scope.user.email,
        username: $scope.user.username
      };
      $scope.userFromServer = {
        firstname: $scope.profile.firstname,
        lastname: $scope.profile.lastname,
        email: $scope.profile.email,
        username: $scope.profile.username
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
        $scope.profile.username = $scope.user.username;
      }

    }

    function updateProfile() {
      var url = localStorageService.get('serverBaseUrl') + '/user/' + $scope.user.userId;
      var fd = new FormData();
      fd.append('profile_pic', $scope.profile.profile_pic);
      fd.append('name', $scope.profile.firstname + ' ' + $scope.profile.lastname);
      fd.append('email', $scope.profile.email);
      fd.append('username', $scope.profile.username);

      if (userInfoChanged()) {
        $http.put(url, fd, {
          headers: {
            'Content-Type': undefined
          },
          transformRequest: angular.identity,
          params: {
            //fd
          }
        }).then(function (response) {
          var rsp = loginService.getUser().get({ id: $scope.user.userId });
          rsp.$promise.then(
            function (data) {
              localStorageService.set('user', data);
              if (passwordChanged()) {
                updatePassword();
              } else {
                Notify.show('Data saved correctly');
                window.location.reload();
              }
            },
            function (error) {
              Notify.show('Error fetching user information from the server', 'error');
            }
          );
        });
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
          function (response) {
            Notify.show('Data saved correctly');
          },
          function (error) {
            console.log(error);
            Notify.show('Error updating user password', 'error');
          }
        );
      } else {
        Notify.show('Repeat password field does not match', 'error');
      }
    }

    function userInfoChanged() {
      var props = ['firstname', 'lastname', 'email', 'username', 'profile_pic'];

      for (var i = 0; i < props.length; i++) {
        var prop = props[i];
        if ($scope.profile[prop] !== $scope.userFromServer[prop]) {
          return true;
        }
      }
      return false;
    }

    function passwordChanged() {
      return !!$scope.profile.password;
    }
  }

} ());
