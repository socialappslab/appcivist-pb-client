/**
 * AppCivist Common Components
 *
 */

appCivistApp.directive('templateConfiguration',  function(){
    return {
        restrict: 'C',
        replace: true,
        transclude: true,
        templateUrl: "/app/partials/directives/templateConfiguration/templateConfiguration.html",
        link: function(scope){
            scope.isEnabled = true;
        },
        controller: ['$scope', 'Components', function($scope){
            initializeComponents();

            function initializeComponents() {
                $scope.proposalComponents =
                    $scope.newCampaign.proposalComponents === undefined ?
                        Components.defaultProposalComponents() :  $scope.newCampaign.proposalComponents;

                $scope.supportingComponents = $scope.newCampaign.supportingComponents === undefined ?
                    Components.defaultSupportingComponents() : $scope.supportingComponents;
            }

            $scope.updateLinkedCampaign =  function() {
                $scope.proposalComponents[1].enabled = !$scope.newCampaign.useLinkedCampaign;
                $scope.proposalComponents[2].enabled = !$scope.newCampaign.useLinkedCampaign;
                $scope.proposalComponents[6].enabled = !$scope.newCampaign.useLinkedCampaign;
            }

            if ($scope.newCampaign.template.value === 'LINKED' && $scope.newCampaign.useLinkedCampaign) {
                $scope.proposalComponents[3].enabled = $scope.newCampaign.useLinkedCampaign;
                $scope.proposalComponents[4].enabled = $scope.newCampaign.useLinkedCampaign;
                $scope.proposalComponents[5].enabled = $scope.newCampaign.useLinkedCampaign;
            }

            $scope.changeComponentState = function(index, state) {
                if($scope.proposalComponents[index].enabled && !$scope.proposalComponents[index].linked) {
                    $scope.proposalComponents[index].active = state;
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

appCivistApp.directive('timelineedit', function(){
    return {
        restrict: 'E',
        replace: true,
        templateUrl: "/app/partials/directives/timeline/timelineedit.html",
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
           contribution: '='
       },
       controller: "ContributionVotesCtrl"
   }
});

/* Consensus Voting */
appCivistApp.directive('consensusControls', function(){
  return {
    restrict: 'E',
    replace: true,
    templateUrl: "/app/partials/directives/consensusVoting/consensusControls.html",
    scope: {
      contribution: '='
    },
    controller: "ConsensusVotingCtrl"
  }
});

appCivistApp.directive('contribution', function(){
    return{
        restrict: 'E',
        replace: true,
        templateUrl: "/app/partials/directives/contribution/contribution.html",
        scope: {
            contribution: '=',
            assemblyID: '=assemblyid',
            campaignID: '=campaignid',
            componentID: '=componentid',
            inModal: '=inmodal',
            container : '=container',
            containerID : '=containerid',
            containerIndex : '=containerindex'
        },
        controller: "ContributionDirectiveCtrl",
    }
});


appCivistApp.directive('workingGroup', function(){
    return{
        restrict: 'E',
        replace: true,
        templateUrl: "/app/partials/directives/wgroups/working-group.html",
        scope: {
            workingGroup: '=group',
            assemblyID: '=assemblyid',
            campaignID: '=campaignid',
            container : '=container',
            containerID : '=containerid',
            containerIndex : '=containerindex'
        },
        controller: "WGroupDirectiveCtrl",
    }
});

appCivistApp.directive('proposal', function(){
    return{
        restrict: 'E',
        replace: true,
        templateUrl: "/app/partials/directives/proposal/proposal.html",
        scope: {
            content: '='
        },
        controller: ['$scope', function($scope){
            $scope.proposal = $scope.content;
        }]
    }
});

appCivistApp.directive('newContribution', function() {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: "/app/partials/contributions/newContribution/newContribution.html",
        scope: {
            content: '=',
            targetSpaceId: '=targetspaceid',
            targetSpace: '=targetspace',
            themes: '=',
            contributionType: "@ctype",
            response: "=response",
            newContribution: '=ngModel'
        },
        controller: "NewContributionCtrl",
        link: newContributionLink
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

appCivistApp.directive('newForumPost', function() {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: "/app/partials/contributions/newForumPostBox/newForumPostBox.html",
        scope: {
            content: '=',
            targetSpaceId: '=targetspaceid',
            targetSpace: '=targetspace',
            themes: '=',
            contributionType: "@ctype",
            replyParent: "=replyparent",
            newContribution: '=ngModel'
        },
        controller: "NewContributionCtrl",
        link: newContributionLink
    }
});

appCivistApp.directive('campaignHeader', function() {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: "/app/partials/campaign/component/campaignHeader.html",
        scope: {
            content: '=',
            assembly: '=assembly',
            campaign: '=campaign',
            component: '=component'
        }
    }
});

appCivistApp.directive('sideBox', function() {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: "/app/partials/boxes/sideBox.html",
        scope: {
            box: '=box'
        }
    }
});

appCivistApp.directive('appcivistComments', function() {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: "/app/partials/forum/comments.html",
        scope: {
            comments: '=comments',
            assemblyID: '=assemblyid',
            containerID: '=containerid'
        },
        controller: "CommentsController"
    }
});

appCivistApp.directive('appcivistIndividualComment', function() {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: "/app/partials/contributions/contribution/contributionComment.html",
        scope: {
            comment: '=comment',
            assemblyID: '=assemblyid',
            container: '=container',
            containerID: '=containerid',
            containerIndex: '=containerindex'
        },
        controller: "CommentsController"
    }
});

appCivistApp.directive('appcivistIndividualCommentNoReply', function() {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: "/app/partials/contributions/contribution/contributionCommentWithoutReply.html",
        scope: {
            comment: '=comment',
            assemblyID: '=assemblyid',
            container: '=container',
            containerID: '=containerid',
            containerIndex: '=containerindex'
        },
        controller: "CommentsController"
    }
});

appCivistApp.directive('attachments', function () {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: "/app/partials/contributions/contribution/attachments.html",
        scope: {
            attachments: "=attachments",
            newAttachment: "=newattach",
            contribution: "=contribution",
            showTitle: "=showtitle",
            assemblyID: "=assemblyid"
        },
        controller: "ContributionCtrl"
    }
});

appCivistApp.directive('addAttachment', function () {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: "/app/partials/contributions/contribution/add-attachment.html",
        scope: {
            attachments: "=attachments",
            newAttachment: "=newattach",
            contribution: "=contribution",
            showTitle: "=showtitle",
            assemblyID: "=assemblyid"
        },
        controller: "ContributionCtrl"
    }
});

appCivistApp.directive('signupForm', function() {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: "/app/partials/signup-form.html"
    }
});

/**
 * Functions common to all component directives
 */
function newContributionLink(scope, element, attrs, ngModel) {
    //if(scope.newContribution)
    //scope.newContribution.type = scope.contributionType;
    //scope.$watch('contributionType', function(value){
    //    if(value){
    //        scope.newContribution.type = value;
    //    }
    //}, true);
}
