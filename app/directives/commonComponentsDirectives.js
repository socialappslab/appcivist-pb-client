/**
 * AppCivist Commono Components
 *
 */

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
        /*scope: {
            activePhase: '@activephase'
        },*/
        controller: ['$scope' ,function($scope){
            /*$scope.promise.then(function(){
                 angular.forEach($scope.phases, function(phase) {
                    console.log('ho');
                 });
            });*/
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

appCivistApp.directive('votesCounter', function(){
   return{
       restrict: 'E',
       replace: true,
       templateUrl: "/app/partials/directives/votesCounter/votesCounter.html",
       scope: {
           content: '='
       },
       controller: ['$scope', function($scope){
           $scope.votes = $scope.content.stats.ups-$scope.content.stats.downs;
       }]
   }
});

appCivistApp.directive('contribution', function(){
    return{
        restrict: 'E',
        replace: true,
        templateUrl: "/app/partials/directives/contribution/contribution.html",
        scope: {
            content: '='
        },
        controller: ['$scope', function($scope){
            $scope.contribution = $scope.content;
            $scope.selectContribution = function(contribution){
                $scope.$root.$emit('contribution:selected', contribution);
            }
        }]
    }
});