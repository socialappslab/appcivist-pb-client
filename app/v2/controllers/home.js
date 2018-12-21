(function () {
  'use strict';

  angular
    .module('appCivistApp')
    .controller('v2.HomeCtrl', HomeCtrl);

  HomeCtrl.$inject = [
    '$scope', 'localStorageService', 'Notify', 'AppCivistAuth',
    '$state', '$filter', 'loginService', '$translate', 'Assemblies', '$rootScope'
  ];

  function HomeCtrl($scope, localStorageService, Notify, AppCivistAuth,
    $state, $filter, loginService, $translate, Assemblies, $rootScope) {

    activate();

    function activate() {
      // if (!$rootScope.ui || ($rootScope.ui && !$rootScope.ui.v2)) {
      //   $rootScope.ui = {
      //     v2: true
      //   }
      //   console.log("Forced version 2 in home controller");
      // }
      $scope.user = {};
      $scope.login = login;
      $scope.isHomePage = true;
      $scope.instanceSpotlight = [
        {
          name: "City of Vallejo",
          purpose: "Participatory Budgeting",
          location: "Vallejo, CA, USA",
          url:"https://vallejopb.appcivist.org"
        },
        {
          name: "City of Dieppe",
          purpose: "Participatory Budgeting",
          location: "Dieppe, Canada",
          url:"https://dieppepb.appcivist.org"
        },
        {
          name: "Our Money Our Voice",
          purpose: "Participatory Budgeting",
          location: "Louisville, KY",
          url:"https://ourmoneyourvoice.appcivist.org"
        },
        {
          name: "PPI Unifesp",
          purpose: "Participatory Planning",
          location: "Sao Paulo, Brazil",
          url:"https://unifesp.appcivist.org"
        }
      ];

      if ($state.params.domain) {
        $scope.domain = $state.params.domain;
        var rsp = Assemblies.assemblyByShortName($scope.domain).get();
        rsp.$promise.then(function (data) {
          $scope.assembly = data;
          if($scope.assembly && $scope.assembly.lang && !$scope.user) {
            $translate.use($scope.assembly.lang);
            moment.locale($scope.assembly.lang);
          }
          localStorageService.set('domain', data);
        });
      }
    }

    function login() {
      if (!$scope.user.email || !$scope.user.password) {
        Notify.show('Email and password are required', 'error');
        return;
      }
      var rsp = AppCivistAuth.signIn().save($scope.user);
      rsp.$promise.then(loginSuccess, loginError);
    }

    function loginSuccess(user) {
      localStorageService.set('sessionKey', user.sessionKey);
      localStorageService.set('authenticated', true);
      localStorageService.set('user', user);
      // todo
      if ($scope.user && $scope.user.language) {
        $translate.use($scope.user.language);
      }
      loginService.loadAuthenticatedUserMemberships(user).then(function () {
        var ongoingCampaigns = localStorageService.get('ongoingCampaigns');
        var assembly = localStorageService.get('currentAssembly');
        $state.go('v2.assembly.aid.campaign.cid', { aid: assembly.assemblyId, cid: ongoingCampaigns[0].campaignId }, { reload: true });
      });
    }

    function loginError(error) {
      var msg = 'Error while trying to authenticate to the server';

      if (error && error.data && error.data.statusMessage) {
        msg = error.data.statusMessage;
      }
      Notify.show(msg, 'error');
    }
  }
}());
