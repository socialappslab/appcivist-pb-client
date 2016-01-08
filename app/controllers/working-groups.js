/**
 * Created by cdparra on 12/8/15.
 */


appCivistApp.controller('NewWorkingGroupCtrl', function($scope, $http, $routeParams, localStorageService,
                                                        Assemblies, Campaigns, WorkingGroups, Contributions, FileUploader) {

    init();
    initializeCampaign();

    function init() {
        $scope.errors = [];
        $scope.assemblyID = $routeParams.aid;
        $scope.campaignID = $routeParams.cid;
        $scope.workingGroupID = $routeParams.wid;
        $scope.newWorkingGroup = WorkingGroups.defaultNewWorkingGroup();
        $scope.defaultIcons = [
            {"name": "Justice Icon", "url":"http://appcivist.littlemacondo.com/assets/images/justicia-140.png"},
            {"name": "Plan Icon", "url":"http://appcivist.littlemacondo.com/assets/images/tabacalera-140.png"},
            {"name": "Article 49 Icon", "url":"http://appcivist.littlemacondo.com/assets/images/article19-140.png"},
            {"name": "Passe Livre Icon", "url":"http://appcivist.littlemacondo.com/assets/images/image74.png"},
            {"name": "Skyline Icon", "url":"http://appcivist.littlemacondo.com/assets/images/image75.jpg"}
        ];

        $scope.setNewWorkingGroupIcon = function(url, name) {
            $scope.newWorkingGroup.profile.icon = url;
            var file = {};
            file.name = name;
            file.url = url;
            $scope.f = file;
        }

        $scope.uploadFiles = function(file, errFiles) {
            $scope.f = file;
            $scope.errFile = errFiles && errFiles[0];
            $scope.iconResource = {};
            FileUploader.uploadFileAndAddToResource(file, $scope.iconResource);
        };

    }

    function initializeAssembly () {

    }

    function initializeCampaign () {
        $scope.campaign = Campaigns.campaign($scope.assemblyID, $scope.campaignID).get();
        $scope.campaign.$promise.then(
            function (response) {
                $scope.campaign = response;
                $scope.campaignThemes = $scope.campaign.themes;
            },
            function (error) {
                $scope.errors.push(error);
            }
        );
    }
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