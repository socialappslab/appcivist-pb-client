(function () {
    'use strict';
  
    /**
     * @name motivationalMessages
     * @memberof components
     *
     * @description
     *  Component that renders main motivational messages.
     *
     * @example
     *
     *  <motivational-messages></motivational-messages>
     */
    appCivistApp
      .component('motivational', {
        selector: 'motivational',
        bindings: {
        },
        controller: TopbarLangpickerCtrl,
        controllerAs: 'vm',
        templateUrl: '/app/v2/components/motivational-messages/motivational-messages.html'
      });
  
      TopbarLangpickerCtrl.$inject = [
        '$scope', '$translate', 'localStorageService', 'LocaleService'
    ];
  
    function TopbarLangpickerCtrl($scope, $translate, localStorageService, LocaleService) {
      
    }
  
  }());
  