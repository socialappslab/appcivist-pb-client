(function() {
  'use strict';

  /**
   * Created by cdparra on 5/11/16.
   * Based on https://scotch.io/tutorials/internationalization-of-angularjs-applications
   */
  appCivistApp.directive('languageSelect', LanguageSelect);


  LanguageSelect.$inject = ['LocaleService', 'LOCALES'];

  function LanguageSelect(LocaleService, LOCALES) {

    return {
      restrict: 'E',
      templateUrl: '/app/v2/partials/directives/language-select.html',
      controller: function($scope) {
        $scope.currentLocaleDisplayName = LocaleService.getLocaleDisplayName() ?
          LocaleService.getLocaleDisplayName() : LOCALES.locales[LOCALES.preferredLocale];
        $scope.localesDisplayNames = LocaleService.getLocalesDisplayNames();
        $scope.visible = $scope.localesDisplayNames &&
          $scope.localesDisplayNames.length > 1;

        $scope.changeLanguage = function(locale) {
          LocaleService.setLocaleByDisplayName(locale);
        };
      }
    };
  }
}());