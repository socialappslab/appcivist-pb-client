/**
 * AppCivist Main Directives
 *
 * # footer and header based on http://gon.to/2013/03/23/the-right-way-of-coding-angularjs-how-to-organize-a-regular-webapp/
 */

appCivistApp.directive('footer', function () {
    return {
        restrict: 'A',  // This means that it will be used as an attribute and NOT as an element. 
        // I don't like creating custom HTML elements
        replace: true,
        templateUrl: "/app/partials/footer.html",
        controller: ['$scope', '$filter', 'localStorageService', function ($scope, $filter, localStorageService) {

            $scope.serverBaseUrl = localStorageService.get("serverBaseUrl");
            $scope.votingApiUrl  = localStorageService.get("votingApiUrl");
            $scope.etherpadServer = localStorageService.get("etherpadServer");

            $scope.changeServer = function () {
                var serverBaseUrl = localStorageService.get("serverBaseUrl");
                appCivistCoreBaseURL = $scope.serverBaseUrl =
                    (serverBaseUrl === appcivist.api.core.development) ?
                        appcivist.api.core.testing : appcivist.api.core.development;

                localStorageService.set("serverBaseUrl", $scope.serverBaseUrl);
                console.log("Changing Backend Server from: [" + serverBaseUrl + "] to [" + appCivistCoreBaseURL + "]");
            }

            $scope.changeVotingServer = function () {
                var apiURL = localStorageService.get("votingApiUrl");
                $scope.votingApiUrl = (apiURL === appcivist.api.voting.development) ? appcivist.api.voting.production : appcivist.api.voting.development;
                localStorageService.set("votingApiUrl", $scope.votingApiUrl);
                console.log("Changing Backend Server from: [" + apiURL + "] to [" + $scope.votingApiUrl + "]");
            }
        }]
    }
});

appCivistApp.directive('header', function () {
    return {
        restrict: 'A',
        replace: false,
        templateUrl: "/app/partials/header.html"
    }
});