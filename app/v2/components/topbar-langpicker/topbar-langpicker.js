(function () {
  'use strict';

  /**
   * @name langpicker
   * @memberof components
   *
   * @description
   *  Component that renders main langpicker.
   *
   * @example
   *
   *  <langpicker></langpicker>
   */
  appCivistApp
    .component('langpicker', {
      selector: 'langpicker',
      bindings: {
      },
      controller: TopbarLangpickerCtrl,
      controllerAs: 'vm',
      templateUrl: '/app/v2/components/topbar-langpicker/topbar-langpicker.html'
    });

    TopbarLangpickerCtrl.$inject = [
      '$scope', '$translate', 'localStorageService', 'LocaleService', '$compile'
  ];

  function TopbarLangpickerCtrl($scope, $translate, localStorageService, LocaleService, $compile) {
    let user = localStorageService.get('user');
    $scope.changeLanguage = function(key) {
      $translate.use(key);
      if (user) {
        user.language = key;
        localStorageService.set('user', user);
      } else {
        LocaleService.setLocale(key);
      }
      // Redo the langpicker
      $scope.loadLangPicker();
    }
    $scope.loadLangPicker = function() {
      let currentLanguage, availableLanguages, currentPosition, availableLanguagesContent;
      currentLanguage = (user && user.language) ? user.language : LocaleService.getLocale();
      availableLanguages = $translate.getAvailableLanguageKeys().slice();
      currentPosition = availableLanguages.indexOf(currentLanguage);
      availableLanguages.splice(currentPosition, 1);
      angular.element($('#currentlang')).html('<img class="i18flag" src="../assets/i18n/flags/'+currentLanguage.split('-')[0]+'.png" alt="'+currentLanguage+'">');
      availableLanguagesContent = "";
      angular.forEach(availableLanguages, function(lang) {
        availableLanguagesContent += '<li><a class="langitem" ng-click="changeLanguage(\''+lang+'\')"><img class="i18flag" src="../assets/i18n/flags/'+lang.split('-')[0]+'.png" alt="'+lang+'"></a></li>';
      });
      angular.element($("#availablelangs")).html($compile(availableLanguagesContent)($scope));
    }
    angular.element(document).ready(function() {
      $scope.loadLangPicker();
    });
  }

}());