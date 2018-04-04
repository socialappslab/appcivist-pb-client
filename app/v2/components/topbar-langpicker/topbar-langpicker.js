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
      '$scope', '$translate', 'localStorageService', 'LocaleService', '$compile', '$rootScope'
  ];

  function TopbarLangpickerCtrl($scope, $translate, localStorageService, LocaleService, $compile, $rootScope) {
    let user = localStorageService.get('user');
    $rootScope.$on("$translateChangeEnd",
      (evt, current, previous)=> {
        console.log("Language changed to: "+current.language);
        let currentLanguage = current.language;
        $scope.loadLangPickerFromLang(currentLanguage);      }
    );
    $scope.getLanguageShortCode = function(lang) {
      let langParts = lang.split('-');
      let langShort;
      if (langParts.length>1) {
        langShort = langParts[1].toLowerCase();
      } else {
        langShort = langParts[0].toLowerCase();
      }
      return langShort;
    }
    $scope.changeLanguage = function(key) {
      $translate.use(key);
      if (user) {
        user.language = key;
        localStorageService.set('user', user);
      }
      LocaleService.setLocale(key);
      // Redo the langpicker
      $scope.loadLangPicker();
    }
    $scope.loadLangPicker = function() {
      let currentLanguage = (user && user.language) ? user.language : LocaleService.getLocale();
      $scope.loadLangPickerFromLang(currentLanguage);
    }
    $scope.loadLangPickerFromLang = function(currentLanguage) {
      let availableLanguages, currentPosition, availableLanguagesContent;
      availableLanguages = $translate.getAvailableLanguageKeys().slice();
      currentPosition = availableLanguages.indexOf(currentLanguage);
      availableLanguages.splice(currentPosition, 1);
      let currentLangShortCode = $scope.getLanguageShortCode(currentLanguage);
      angular.element($('#currentlang')).html('<img class="i18flag" src="../assets/i18n/flags/'+currentLangShortCode+'.png" alt="'+currentLanguage+'">');
      availableLanguagesContent = "";
      angular.forEach(availableLanguages, function(lang) {
        let langShortCode = $scope.getLanguageShortCode(lang);
        availableLanguagesContent += '<li><a class="langitem" ng-click="changeLanguage(\''+lang+'\')"><img class="i18flag" src="../assets/i18n/flags/'+langShortCode+'.png" alt="'+lang+'"></a></li>';
      });
      angular.element($("#availablelangs")).html($compile(availableLanguagesContent)($scope));
    }
    angular.element(document).ready(function() {
      $scope.loadLangPicker();
    });
  }

}());
