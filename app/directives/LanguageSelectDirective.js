/**
 * Created by cdparra on 5/11/16.
 * Based on https://scotch.io/tutorials/internationalization-of-angularjs-applications
 */
appCivistApp.directive('ngTranslateLanguageSelect', function (LocaleService, LOCALES) { 'use strict';

    return {
        restrict: 'A',
        replace: true,
        template: ''+
        '<div class=language-select" ng-if="visible">'+
        '<label class="main-title">'+
        '{{"directives.language-select.Language" | translate}}:  '+
        '</label>'+
        '<select ng-model="currentLocaleDisplayName"'+
        'ng-options="localesDisplayName for localesDisplayName in localesDisplayNames"'+
        'ng-change="changeLanguage(currentLocaleDisplayName)">'+
        '</select>'+
        '</div>'+
        '',
        controller: function ($scope) {
            $scope.currentLocaleDisplayName = LocaleService.getLocaleDisplayName() ?
                LocaleService.getLocaleDisplayName() : LOCALES.locales[LOCALES.preferredLocale];
            $scope.localesDisplayNames = LocaleService.getLocalesDisplayNames();
            $scope.visible = $scope.localesDisplayNames &&
                $scope.localesDisplayNames.length > 1;

            $scope.changeLanguage = function (locale) {
                LocaleService.setLocaleByDisplayName(locale);
            };
        }
    };
});