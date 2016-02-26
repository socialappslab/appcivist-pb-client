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
        $scope.translations = [
            'Assembly', 'Assemblies', 'Campaign', 'Campaigns',
            'Working Group', 'Working Groups', 'Member', 'Members',
            'New Assembly', 'New Campaign', 'New Working Group',
            'My Assemblies', 'My Campaigns', 'My Working Groups',
            'No assemblies to show.', 'No current campaigns to show.',
            'No working groups to show.'
        ];

        $translate($scope.translations).then (
            function (translations) {
                $scope.translations = translations;
                $scope.sideBoxes['assemblies'] = {
                    title: $scope.translations["My Assemblies"],
                    type: "ASSEMBLIES",
                    addAction: {
                        title: $scope.translations["New Assembly"],
                        href: "/#/assembly/create"
                    },
                    itemList: [],
                    errorMessage: $scope.translations["No assemblies to show."]
                };

                $scope.sideBoxes['campaigns'] = {
                    title: $scope.translations["My Campaigns"],
                    type: "CAMPAIGNS",
                    addAction: {
                        title: $scope.translations["New Campaign"],
                        href: "/#/assembly/"+$scope.assemblyID+"/campaign/create"
                    },
                    itemList: [],
                    errorMessage: $scope.translations["No current campaigns to show."]
                };

                $scope.sideBoxes['groups'] = {
                    title: $scope.translations["My Working Groups"],
                    type: "GROUPS",
                    itemList: [],
                    errorMessage: $scope.translations["No working groups to show."]
                };
            }
        );
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