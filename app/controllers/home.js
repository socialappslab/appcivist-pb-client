appCivistApp.controller('HomeCtrl', function ($scope, $routeParams, $resource, $location, Campaigns, Memberships,
                                              Notifications, loginService, localStorageService, $translate) {
    init();
    initializeSideBoxes();
    getUserAssemblies();
    getUserCampaigns();
    getUserWorkingGroups();
    getUserNotifications();

    function init() {
        $scope.user = localStorageService.get("user");
        if ($scope.user && $scope.user.language)
            $translate.use($scope.user.language);

        $scope.serverBaseUrl = localStorageService.get("serverBaseUrl");
        console.log("serverBaseUrl: " + $scope.serverBaseUrl);
        $scope.assemblies = [];
        $scope.campaigns = [];
        $scope.workingGroups = [];
        $scope.notifications = [];
        $scope.errors = [];

        $scope.selectCampaign = function (campaign) {
            localStorageService.set("currentCampaign", campaign);
        }
    }

    function initializeSideBoxes() {
        $scope.sideBoxes = [];

        $scope.sideBoxes['assemblies'] = {
            title: "My Assemblies",
            type: "ASSEMBLIES",
            addAction: {
                title: "New Assembly",
                href: "/#/assembly/create"
            },
            itemList: [],
            errorMessage: "User has no assemblies yet. Go ahead and create or join one!"
        };

        $scope.sideBoxes['campaigns'] = {
            title: "My Campaigns",
            type: "CAMPAIGNS",
            itemList: [],
            errorMessage: "The user is not participating in a campaign yet."
        };

        $scope.sideBoxes['groups'] = {
            title: "My Working Groups",
            type: "GROUPS",
            itemList: [],
            errorMessage: "The user is not participating in a working group yet."
        };
    }

    function getUserAssemblies() {
        $scope.assemblies = Memberships.assemblies($scope.user.userId).query();
        $scope.assemblies.$promise.then(
            function (data) {
                $scope.assemblies = [];
                for (var i = 0; i < data.length; i += 1) {
                    if (data[i].membershipType === 'ASSEMBLY') {
                        $scope.assemblies.push(data[i].assembly);
                    }
                }
                $scope.sideBoxes['assemblies'].itemList = $scope.assemblies;
            },
            function (error) {
                $scope.sideBoxes['assemblies'].error = error;
            }
        );
    }

    function getUserCampaigns() {
        $scope.campaigns = Campaigns.campaigns($scope.user.uuid, 'ongoing').query();
        $scope.campaigns.$promise.then(
            function (data) {
                $scope.campaigns = data;
                localStorageService.set("campaigns", $scope.campaigns);
                $scope.sideBoxes['campaigns'].itemList = $scope.campaigns;
            },
            function (error) {
                $scope.sideBoxes['campaigns'].error = error;
            }
        );
    }

    function getUserWorkingGroups() {
        $scope.workingGroups = Memberships.workingGroups($scope.user.userId).query();
        $scope.workingGroups.$promise.then(
            function (data) {
                $scope.workingGroups = [];

                for (var i = 0; i < data.length; i += 1) {
                    if (data[i].membershipType === 'GROUP') {
                        $scope.workingGroups.push(data[i].workingGroup);
                    }
                }

                localStorageService.set("workingGroups", $scope.workingGroups);
                $scope.sideBoxes['groups'].itemList = $scope.workingGroups;
            },
            function (error) {
                $scope.sideBoxes['groups'].error = error;
            }
        );
    }

    function getUserNotifications() {
        $scope.notifications = Notifications.userNotificationsByUUID($scope.user.uuid).query();

        $scope.notifications.$promise.then(
            function (data) {
                $scope.notifications = {
                    'upcoming_milestones': [],
                    'other_updates' : []
                };
                angular.forEach(data, function (obj) {
                    if (obj.type === 'UPCOMING_MILESTONE') {
                        $scope.notifications.upcoming_milestones.push(obj);
                    } else {
                        $scope.notifications.other_updates.push(obj);
                    }
                });
                localStorageService.set("notifications", $scope.notifications);
            },
            function (error) {
                $scope.errors['notifications'] = error;
            }
        );
    }
});