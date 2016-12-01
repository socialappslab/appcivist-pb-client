(function () {
  'use strict';

  appCivistApp
    .controller('v2.ProfileCtrl', ProfileCtrl);

  ProfileCtrl.$inject = [
    '$scope', '$resource', '$location', 'localStorageService', '$http',
    'loginService', 'Notify'
  ];

  function ProfileCtrl($scope, $resource, $location, localStorageService, $http,
    loginService, Notify) {

    activate();

    function activate() {
      $scope.user = localStorageService.get('user');
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
      $scope.user.username = $scope.profile.username;
      $scope.user.name = $scope.profile.firstname + ' ' + $scope.profile.lastname;
      $scope.user.email = $scope.profile.email;
      var url = localStorageService.get('serverBaseUrl') + '/user/' + $scope.user.userId;
      var data = $scope.user;

      if (userInfoChanged()) {
        $http.put(url, data).then(function (response) {
          var rsp = loginService.getUser().get({ id: $scope.user.userId });
          rsp.$promise.then(
            function (data) {
              localStorageService.set('user', data);
              if (passwordChanged()) {
                updatePassword();
              } else {
                Notify.show('Data saved correctly');
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
        var url = localStorageService.get('serverBaseUrl') + '/user/password/change';
        var data = {
          password: $scope.profile.password,
          repeatPassword: $scope.profile.repeatPassword
        };
        var rsp = loginService.changePassword();
        rsp.save(data).$promise.then(
          function (response) {
            Notify.show('Data saved correctly');
          },
          function (error) {
            Notify.show('Error updating user password', 'error');
          }
        );
      } else {
        Notify.show('Repeat password field does not match', 'error');
      }
    }

    function userInfoChanged() {
      var props = ['firstname', 'lastname', 'email', 'username'];

      for(var i = 0; i < props.length; i++){
        var prop = props[i];
        if($scope.profile[prop] !== $scope.userFromServer[prop]){
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
