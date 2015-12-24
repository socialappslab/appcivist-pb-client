/**
 * Created by cdparra on 12/8/15.
 */


appCivistApp.controller('NewWorkingGroupCtrl', function($scope, $http, $routeParams, localStorageService) {

});

appCivistApp.controller('WorkingGroupCtrl', function($scope, $http, $routeParams, usSpinnerService,
                                                     localStorageService, Contributions, WorkingGroups, Assemblies) {
    init();
    function init() {
        $scope.assemblyID = $routeParams.aid;
        $scope.workingGroupID = $routeParams.wid;
        $scope.newForumPost = Contributions.defaultNewContribution();
        $scope.newForumPost.contributionType = "FORUM_POST";
        $scope.errors = [];
        $scope.wGroup = {};
        $scope.wGroupMembers = [];
        $scope.proposals = [];

        initializeWorkingGroup();
        initializeAssemblyCampaigns();

        //angular.forEach(localStorageService.get('workingGroups'), function(wGroup) {
        //    if(wGroup.groupId == $routeParams.wid) {
        //        $scope.wGroup = wGroup;
        //    }
        //    var res = WorkingGroups.workingGroupMembers($routeParams.aid, $routeParams.wid,
        //        $scope.wGroup.supportedMembership).get();
        //    res.$promise.then(function(data) {
        //        $scope.wGroupMembers = data;
        //    });
        //});
    }

    $scope.postContribution = function(content){
        var newContribution =
            Contributions.groupContribution($routeParams.aid, $routeParams.wid).save(content, function() {
            console.log("Created contribution wGroup: "+newContribution);
            localStorageService.set("currentContributionWGroup", newContribution);
        });
    }

    function initializeWorkingGroup() {
        $scope.$root.startSpinner();
        var res = WorkingGroups.workingGroup($scope.assemblyID, $scope.workingGroupID).get();
        res.$promise.then(
            function (data) {
                $scope.wGroup = data;
                $scope.$root.stopSpinner();
                getWorkingGroupMembers($scope.assemblyID, $scope.workingGroupID);
                getWorkingGroupProposals($scope.assemblyID, $scope.workingGroupID);
            },
            function (error) {
                $scope.$root.stopSpinner();
                $scope.errors.unshift(error);
            }
        )
    }

    function initializeAssemblyCampaigns() {
        var res = Assemblies.assembly($scope.assemblyID).get();
        res.$promise.then(
            function (data) {
                $scope.assembly = data;
                $scope.assemblyCampaigns = data.campaigns;
            },
            function (error) {
                $scope.errors.unshift(error);
            }
        )
    }


    function getWorkingGroupMembers() {
        var res = WorkingGroups.workingGroupMembers($scope.assemblyID, $scope.workingGroupID,
            "ALL").query();
        res.$promise.then(
            function (data) {
                $scope.wGroupMembers = data;
            },
            function (error) {
                $scope.errors.unshift(error);
            }
        );
    }

    function getWorkingGroupProposals() {
        var res = WorkingGroups.workingGroupProposals($scope.assemblyID, $scope.workingGroupID).query();
        res.$promise.then(
            function (data) {
                $scope.proposals = data;
            },
            function (error) {
                $scope.errors.unshift(error);
            }
        );
    }
});