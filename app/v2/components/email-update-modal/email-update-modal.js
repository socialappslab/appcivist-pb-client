(function () {
    'use strict';

    /**
     * @name email-update-modal
     * @memberof components
     *
     * @description
     *  Component that dispaly consent information.
     *
     * @example
     *
     *  <email-update-modal></email-update-modal>
     */
    appCivistApp
      .component('emailUpdateModal', {
        selector: 'emailUpdateModal',
        controller: EmailUpdateModalCtrl,
        controllerAs: 'vm',
        templateUrl: '/app/v2/components/email-update-modal/email-update-modal.html',
        bindings: {
          campaign: '<',
          config: '<',
          assembly: '=',
          user: '<'
        }
      });

      EmailUpdateModalCtrl.$inject = [
        '$scope', 'loginService', 'AppCivistAuth', 'Notify', 'localStorageService', 'Space', '$state', '$stateParams',
        'LocaleService', '$rootScope', 'Assemblies', '$window', 'Utils', 'Memberships', '$timeout', 'Campaigns', '$sce',
        '$translate', '$http'
    ];

    function EmailUpdateModalCtrl($scope, loginService, AppCivistAuth, Notify, localStorageService, Space, $state,
                              $stateParams, LocaleService, $rootScope, Assemblies, $window, Utils, Memberships,
                              $timeout, Campaigns, $sce, $translate, $http) {

      let self = this;

      this.$onInit = () => {
        this.showModal = false;
      }

      $scope.$on('emailUpdate:check', () => {
        this.getEmailUpdateStatus();
      });

      this.getEmailUpdateStatus = () => {
        if (this.user) {
          console.log(this.user);
          if (this.user.emailUpdated === undefined || this.user.emailUpdated === null || this.user.emailUpdated === false) {
            angular.element('#emailUpdateModal').modal({show: true, keyboard: false, backdrop: 'static'});
          }
        }
      }

      this.emailIsForbidden = () => {
        if (this.user) {
          return (this.user.email.includes('@example.com') || this.user.email.includes('@appcivist.com') || this.user.email.includes('@ldap.com'));
        } else {
          return true;
        }
      }

      this.redirectToProfile = () => {
        $state.go('v2.user.uid.profile', {}, { reload: true });
      }

      this.confirmEmail = () => {
        var url = localStorageService.get('serverBaseUrl') + '/user/' + this.user.userId;
        $http.put(url, {
          emailUpdated: true,
          email: self.user.email
        }
        ).then(function(response) {
          var rsp = loginService.getUser().get({ id: self.user.userId });
          rsp.$promise.then(
            function(data) {
              localStorageService.set('user', data);
              $translate("Thank you for confirming your email").then(
                translation => {
                  Notify.show(translation, 'success');
                  angular.element('#emailUpdateModal').modal('hide');
                }
              );
            },
            function(error) {
              Notify.show(error.statusMessage, 'error');
            }
          );
        });
      }

    }
  }());
