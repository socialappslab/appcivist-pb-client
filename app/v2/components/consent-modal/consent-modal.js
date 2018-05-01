(function () {
    'use strict';
  
    /**
     * @name consent-modal
     * @memberof components
     *
     * @description
     *  Component that renders the notifications widget inside topbar.
     *
     * @example
     *
     *  <consent-modal></consent-modal>
     */
    appCivistApp
      .component('consentModal', {
        selector: 'consentModal',
        controller: ConsentModalCtrl,
        controllerAs: 'vm',
        templateUrl: '/app/v2/components/consent-modal/consent-modal.html',
        bindings: {
          campaign: '<',
          open: '='
        }
      });
  
      ConsentModalCtrl.$inject = [
        '$scope', 'loginService', 'AppCivistAuth', 'Notify', 'localStorageService', 'Space', '$state', '$stateParams', 'LocaleService', '$rootScope', 'Assemblies', '$window', 'Utils', 'Memberships', '$timeout'
    ];
  
    function ConsentModalCtrl($scope, loginService, AppCivistAuth, Notify, localStorageService, Space, $state, $stateParams, LocaleService, $rootScope, Assemblies, $window, Utils, Memberships, $timeout) {

        this.$postLink = () => {
            $timeout(() => {
                console.log('OPEN CONSENT MODAL');
                if (this.open) {
                    angular.element('#consentModal').modal({show:true});
                }
            }, 5000)
        }
  
      this.$onInit = () => {
  
      }
    }
  }());
  