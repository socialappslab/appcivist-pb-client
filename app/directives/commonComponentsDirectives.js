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

            // TODO: change state by
            $scope.proposalComponents = [
                {name: 'Proposal making', key: "Proposalmaking", enabled: true, active: false, state: ""},
                {name: 'Versioning', key: "Versioning", enabled: true, active: false, state: ""},
                {name: 'Deliberation', key: "Deliberation", enabled: true, active: false, state: ""},
                {name: 'Voting', key: "Voting", enabled: true, active: false, state: ""}
            ];

            $scope.supportingComponents = [
                {name: 'Working Groups', alias: 'workingGroups'},
                {name: 'Visualization', alias: 'visualization'},
                {name: 'Mapping', alias:'mapping'},
                {name: 'Mobilization', alias:'mobilization'},
                {name: 'Reporting', alias:'reporting'},
                {name: 'Implementation', alias:'implementation'}
            ];

            $scope.disableComponentsInLinkedCampaign = function() {
                // TODO: actually check in linked campaign what are the components
                $scope.proposalComponents[2].enabled = false;
                $scope.proposalComponents[3].enabled = false;
            }

            $scope.switchCampaignComponents = function(index) {
                $scope.proposalComponents[index] = !$scope.proposalComponents[index];
            }

            $scope.updateLinkedCampaign =  function() {
                $scope.proposalComponents[2].enabled = !$scope.newCampaign.useLinkedCampaign;
                $scope.proposalComponents[3].enabled = !$scope.newCampaign.useLinkedCampaign;
            }

            if ($scope.newCampaign.template.value === 'LINKED' && $scope.newCampaign.useLinkedCampaign) {
                $scope.disableComponentsInLinkedCampaign();
            }

            /**
             * For the sake of compatibility, keep the following until
             * all views and controllers no longer reference them and instead
             * and only use the "proposalComponents" array
             */
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

            $scope.makeAllActive = function() {
                $scope.proposalMakingChangeState(true);
                $scope.versioningChangeState(true);
                $scope.deliberationChangeState(true);
                $scope.votingChangeState(true);

            }

            $scope.changeComponentState = function(index, state) {
                if($scope.proposalComponents[index].enabled) {
                    $scope.proposalComponents[index].active = state;
                    if(state)
                        $scope.proposalComponents[index].state = "active";
                    else
                        $scope.proposalComponents[index].state = "";
                }
            }

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
                $scope.proposalComponents[0].active=state;
                if(state) {
                    $scope.proposalMakingState = "active";
                }
                else{
                    $scope.proposalMakingState = null;
                }
                $scope.proposalComponents[0].state=$scope.proposalMakingState;
            }

            $scope.versioningChangeState = function(state) {
                $scope.proposalComponents[1].active=state;
                if(state) {
                    $scope.versioningState = "active";
                }
                else{
                    $scope.versioningState = null;
                }
                $scope.proposalComponents[1].state=$scope.versioningState;
            }

            $scope.deliberationChangeState = function(state) {
                $scope.proposalComponents[2].active=state;
                if(state) {
                    $scope.deliberationState = "active";
                }
                else{
                    $scope.deliberationState = null;
                }
                $scope.proposalComponents[2].state=$scope.deliberationState;
            }

            $scope.votingChangeState = function(state) {
                $scope.proposalComponents[3].active=state;
                if(state) {
                    $scope.votingState = "active";
                }
                else{
                    $scope.votingState = null;
                }
                $scope.proposalComponents[3].state=$scope.votingState;
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

appCivistApp.directive('timelineedit', function(){
    return {
        restrict: 'E',
        replace: true,
        templateUrl: "/app/partials/directives/timeline/timelineedit.html",
        /*scope: {
         activePhase: '@activephase'
         },*/
        controller: ['$scope' ,function($scope){
            $scope.changeState =  function(index,newState) {
                $scope.proposalComponents[index].active = newState;
                if(newState)
                    $scope.proposalComponents[index].state = "active";
                else
                    $scope.proposalComponents[index].state = "";
            }
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

appCivistApp.directive('backgroundImage', function(){
    return function(scope, element, attrs){
        var url = attrs.backgroundImage;
        element.css({
            'background-image': 'url(' + url +')'
        });
    };
});