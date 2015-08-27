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
        controller: ['$scope', '$filter', function ($scope, $filter) {
            // Your behaviour goes here :)
        }]
    }
});

appCivistApp.directive('header', function () {
    return {
        restrict: 'A', 
        replace: false,
        scope: {user: '='}, // This is one of the cool things :). Will be explained in post.
        templateUrl: "/app/partials/header.html",
        controller: ['$scope', '$filter', function ($scope, $filter) {
            console.log("User = "+$scope.user);
            console.log("User = "+$scope.sessionKey);            
        }]
    }
});

appCivistApp.directive('templateConfiguration', function(){
    return {
        restrict: 'C',
        replace: true,
        transclude: true,
        templateUrl: "/app/partials/directives/templateConfiguration/templateConfiguration.html",
        link: function(scope){
            scope.isEnabled = true;
        },
        controller: ['$scope',function($scope){

            $scope.proposalComponents = [
                {name: 'Proposal making'},
                {name: 'Versioning'},
                {name: 'Deliberation'},
                {name: 'Voting'}
            ];

            $scope.supportingComponents = [
                {name: 'Working Groups', alias: 'workingGroups'},
                {name: 'Visualization', alias: 'visualization'},
                {name: 'Mapping', alias:'mapping'},
                {name: 'Mobilization', alias:'mobilization'},
                {name: 'Reporting', alias:'reporting'},
                {name: 'Implementation', alias:'implementation'}
            ];

            $scope.proposalMakingState = null;
            $scope.versioningState = null;
            $scope.deliberationState = null;
            $scope.votingState = null;

            $scope.workingGroups = null;
            $scope.visualization = null;
            $scope.mapping = null;
            $scope.mobilization = null;
            $scope.reporting = null;
            $scope.implementation = null;

            $scope.proposalComponentStatus = function(componentName,state){
                componentName = componentName.replace(/\s/g, '');
                switch(componentName){
                    case 'Proposalmaking':
                        this.proposalMakingChangeState(state);
                        break;
                    case 'Versioning':
                        this.versioningChangeState(state);
                        break;
                    case 'Deliberation':
                        this.deliberationChangeState(state);
                        break;
                    case 'Voting':
                        this.votingChangeState(state);
                        break;
                }
            }

            $scope.proposalMakingChangeState = function(state) {
                if(state) {
                    $scope.proposalMakingState = "active";
                }
                else{
                    $scope.proposalMakingState = null;
                }
            }

            $scope.versioningChangeState = function(state) {
                if(state) {
                    $scope.versioningState = "active";
                }
                else{
                    $scope.versioningState = null;
                }
            }

            $scope.deliberationChangeState = function(state) {
                if(state) {
                    $scope.deliberationState = "active";
                }
                else{
                    $scope.deliberationState = null;
                }
            }

            $scope.votingChangeState = function(state) {
                if(state) {
                    $scope.votingState = "active";
                }
                else{
                    $scope.votingState = null;
                }
            }
        }]
    }
});

appCivistApp.directive('timeline', function(){
    return {
        restrict: 'E',
        replace: true,
        templateUrl: "/app/partials/directives/timeline/timeline.html",
        controller: ['$scope' ,function($scope){

        }]
    }
});

appCivistApp.directive('progressline', function(){
    return {
        restrict: 'E',
        replace: true,
        templateUrl: "/app/partials/directives/progressline/progressline.html",
        controller: ['$scope' ,function($scope){

        }]
    }
});