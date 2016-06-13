/**
 * Created by cdparra on 12/8/15.
 */


appCivistApp.controller('NewWorkingGroupCtrl', function($scope, $http, $routeParams, localStorageService,
                                                        Assemblies, Campaigns, WorkingGroups, Contributions,
                                                        FileUploader, $translate, $location, logService) {

    init();

    function init() {
        initScopeFunctions();
        initScopeContent();
        initializeAssembly();
        initializeCampaign();
    }

    function initScopeFunctions() {
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

        $scope.addEmailsToList = function(emailsText) {
            $scope.invalidEmails = [];
            var emails = emailsText.split(',');
            emails.forEach(function(email){
                console.log("Adding email: " + email);
                var invitee = {};
                invitee.email = email.trim();
                if($scope.isValidEmail(invitee.email)) {
                    invitee.moderator = false;
                    invitee.coordinator = false;
                    $scope.newWorkingGroup.invitations.push(invitee);
                } else {
                    $scope.invalidEmails.push(invitee.email);
                }
            });
            $scope.inviteesEmails = "";
        }

        $scope.isValidEmail = function(email) {
            var re = /^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/i;
            return re.test(email);
        }

        $scope.removeInvalidEmail = function(index) {
            $scope.invalidEmails.splice(index, 1);
        };

        $scope.removeInvtedAssemblyMemberFromInvitees = function(email) {
            for( i=$scope.assemblyMembers.length-1; i>=0; i--) {
                if( $scope.assemblyMembers[i].user.email == email)
                    $scope.assemblyMembers[i].invite=false;
            }
        };

        $scope.removeInvitee = function(index) {
            var email = $scope.newWorkingGroup.invitations[index].email;
            if($scope.invitedAssemblyMembers && $scope.invitedAssemblyMembers[email])
                $scope.removeInvtedAssemblyMemberFromInvitees(email);
            $scope.newWorkingGroup.invitations.splice(index,1);
        };

        $scope.removeInviteeByEmail = function(email) {
            for( i=$scope.newWorkingGroup.invitations.length-1; i>=0; i--) {
                if( $scope.newWorkingGroup.invitations[i].email == email)
                    $scope.newWorkingGroup.invitations.splice(i,1);
            }
        };

        $scope.createWorkingGroup = function() {
            // 1. process themes
            if ($scope.campaignThemes) {
                for (var i = 0; i < $scope.campaignThemes.length; i++) {
                    if ($scope.campaignThemes[i].selected) {
                        $scope.newWorkingGroup.existingThemes.push($scope.campaignThemes[i]);
                    }
                }
            }
            // 2. process membership
            if($scope.newWorkingGroup.profile.membership === 'OPEN') {
                $scope.newWorkingGroup.profile.supportedMembership="OPEN";
            } else if ($scope.newWorkingGroup.profile.membership === 'REGISTRATION') {
                if($scope.newWorkingGroup.profile.registration.invitation &&
                    ! $scope.newWorkingGroup.profile.registration.request) {
                    $scope.newWorkingGroup.profile.supportedMembership = "INVITATION";
                } else if(! $scope.newWorkingGroup.profile.registration.invitation &&
                    $scope.newWorkingGroup.profile.registration.request) {
                    $scope.newWorkingGroup.profile.supportedMembership = "REQUEST";
                } else if($scope.newWorkingGroup.profile.registration.invitation &&
                    $scope.newWorkingGroup.profile.registration.request) {
                    $scope.newWorkingGroup.profile.supportedMembership = "INVITATION_AND_REQUEST";
                }
            }
            // 3. process management
            console.log("Creating assembly with membership = "+$scope.newWorkingGroup.profile.supportedMembership);
            if($scope.newWorkingGroup.profile.moderators === 'none' && $scope.newWorkingGroup.profile.coordinators === 'none' ) {
                $scope.newWorkingGroup.profile.managementType="OPEN";
            } else if ($scope.newWorkingGroup.profile.moderators === 'two' || $scope.newWorkingGroup.profile.moderators === 'all') {
                if($scope.newWorkingGroup.profile.coordinators === 'two') {
                    $scope.newWorkingGroup.profile.managementType = "COORDINATED_AND_MODERATED";
                } else if($scope.newWorkingGroup.profile.coordinators === 'all') {
                    $scope.newWorkingGroup.profile.managementType = "OPEN";
                } else {
                    $scope.newWorkingGroup.profile.managementType = "MODERATED";
                }
            } else {
                if($scope.newWorkingGroup.profile.coordinators === 'all') {
                    $scope.newWorkingGroup.profile.managementType = "OPEN";
                } else {
                    $scope.newWorkingGroup.profile.managementType = "COORDINATED";
                }
            }

            // 4. process brainstorming contributions
            if($scope.contributions) {
                for (var i = 0; i<$scope.contributions.length; i++) {
                    if($scope.contributions[i].addToGroup) {
                        if(!$scope.newWorkingGroup.existingContributions) $scope.newWorkingGroup.existingContributions = [];
                        $scope.newWorkingGroup.existingContributions.push($scope.contributions[i]);
                    }
                }
            }
            var newGroup = WorkingGroups.workingGroupsInCampaign($scope.assemblyID, $scope.campaignID).save($scope.newWorkingGroup);
            newGroup.$promise.then(
                function (response) {
                    $scope.newWorkingGroup = response;
                    $scope.workingGroups = localStorageService.get("workingGroups");
                    if ($scope.workingGroups === undefined || $scope.workingGroups === null) { $scope.workingGroups = [];}
                    $scope.workingGroups.push($scope.newWorkingGroup);
                    localStorageService.set("workingGroups", $scope.workingGroups);
                    $location.url("/assembly/"+$scope.assemblyID+"/group/"+$scope.newWorkingGroup.groupId);
                },
                function (error) {
                    $scope.errors.push(error);
                }
            );

            logService.logAction("CREATE_WORKING_GROUP");
        }

        $scope.addAssemblyMemberToInvitationList = function(member, index) {
            var email = member.user.email;
            if (!member.invite) {
                if (!$scope.invitedAssemblyMembers) $scope.invitedAssemblyMembers = {}
                $scope.invitedAssemblyMembers[email] = false;
                $scope.removeInviteeByEmail(email);
            } else {
                $scope.addEmailsToList(email);
                if (!$scope.invitedAssemblyMembers) $scope.invitedAssemblyMembers = {}
                $scope.invitedAssemblyMembers[email] = true;
            }
        }

        $scope.contribsNumberOfPages=function(){
            return Math.ceil($scope.contributions.length/$scope.contribsPageSize);
        }

        $scope.membersNumberOfPages=function(){
            return Math.ceil($scope.assemblyMembers.length/$scope.membersPageSize);
        }

        $scope.changeCampaign = function (campaignId) {
            $scope.campaignID = campaignId;
            initializeCampaign();
        }
    }

    function initScopeContent() {
        $scope.user = localStorageService.get("user");
        if ($scope.user && $scope.user.language)
            $translate.use($scope.user.language);
        $scope.errors = [];
        $scope.assemblyID = $routeParams.aid;
        $scope.campaignID = $routeParams.cid;

        if ($scope.campaignID === undefined || $scope.campaignID === null) {
            $scope.selectCampaign = true;
        }

        $scope.workingGroupID = $routeParams.wid;
        $scope.newWorkingGroup = WorkingGroups.defaultNewWorkingGroup();
        $scope.defaultIcons = [
            {"name": "Justice Icon", "url":"https://s3-us-west-1.amazonaws.com/appcivist-files/icons/justicia-140.png"},
            {"name": "Plan Icon", "url":"https://s3-us-west-1.amazonaws.com/appcivist-files/icons/tabacalera-140.png"},
            {"name": "Article 49 Icon", "url":"https://s3-us-west-1.amazonaws.com/appcivist-files/icons/article19-140.png"},
            {"name": "Passe Livre Icon", "url":"https://s3-us-west-1.amazonaws.com/appcivist-files/icons/image74.png"},
            {"name": "Skyline Icon", "url":"https://s3-us-west-1.amazonaws.com/appcivist-files/icons/image75.jpg"}
        ];
        $scope.newWorkingGroup.profile.icon = $scope.defaultIcons[0].url;
        $scope.f = {"name" : $scope.defaultIcons[0].name, "url" : $scope.defaultIcons[0].url}

        $scope.contribsCurrentPg = 0;
        $scope.contribsPageSize = 5;
        $scope.contributions = [];

        $scope.membersCurrentPg = 0;
        $scope.membersPageSize = 5;
        $scope.assemblyMembers = [];

        $scope.$watch("newWorkingGroup.name",function(newVal, oldval){
            $translate('wgroup.invitation.email.text', { group: $scope.newWorkingGroup.name }).then(function (text) {
                $scope.newWorkingGroup.invitationEmail = text;
            });
        },true);
    }

    function initializeAssembly () {
        $scope.assembly = Assemblies.assembly($scope.assemblyID).get();
        $scope.assembly.$promise.then(
            function (response) {
                $scope.assembly = response;
                $scope.assemblyCampaigns = $scope.assembly.campaigns;
            },
            function (error) {
                $scope.errors.push(error);
            }
        );
        $scope.assemblyMembers = Assemblies.assemblyMembers($scope.assemblyID).query();
        $scope.assemblyMembers.$promise.then(
            function(data){
                $scope.assemblyMembers = data;
                $scope.members = data;
            },
            function(error) {
            }
        );

    }

    function initializeCampaign () {
        $scope.campaign = Campaigns.campaign($scope.assemblyID, $scope.campaignID).get();
        $scope.campaign.$promise.then(
            function (response) {
                $scope.campaign = response;
                $scope.contributions = $scope.campaign.contributions;
                $scope.campaignThemes = $scope.campaign.themes;
                if (!$scope.campaignThemes) {
                    $scope.campaignThemes = [];
                }
            },
            function (error) {
                $scope.campaignThemes = [];
                $scope.errors.push(error);
            }
        );
    }
});

appCivistApp.controller('WorkingGroupCtrl', function($scope, $http, $routeParams, usSpinnerService, $uibModal,
                                                     $location, Upload, localStorageService, Contributions,
                                                     WorkingGroups, Memberships, Assemblies, Invitations, FlashService,
                                                     $translate, $filter, logService) {
    init();
    function init() {
        initScopeFunctions();
        initScopeContent();
        initializeSideBoxes()
    }

    function initScopeFunctions () {
        $scope.startSpinner = function(){
            $(angular.element.find('[spinner-key="spinner-1"]')[0]).addClass('spinner-container');
            usSpinnerService.spin('spinner-1');
        }

        $scope.stopSpinner = function(){
            usSpinnerService.stop('spinner-1');
            $(angular.element.find('.spinner-container')).remove();
        }

        $scope.postContribution = function(content){
            var newContribution =
                Contributions.groupContribution($routeParams.aid, $routeParams.wid).save(content, function() {
                    console.log("Created contribution wGroup: "+newContribution);
                    localStorageService.set("currentContributionWGroup", newContribution);
                });
            logService.logAction("CREATE_COMMENT");
        }
        $scope.openNewInvitationModal = function(size)  {
            var modalInstance = $uibModal.open({
                animation: true,
                templateUrl: '/app/partials/invitation.html',
                controller: 'NewInvitationModalCtrl',
                size: size,
                resolve: {
                    target: function () {
                        return $scope.wGroup;
                    },
                    type: function () {
                        return "GROUP";
                    },
                    defaultEmail: function() {
                        return $scope.wGroup.invitationEmail;
                    }
                }
            });

            var modalInstance;

            modalInstance.result.then(
                function (newInvitation) {
                    $scope.newInvitation = newInvitation;
                    getInvitations($scope.workingGroupID);
                },
                function () {
                    console.log('Modal dismissed at: ' + new Date());
                }
            );
        };
        $scope.checkShow = function(button) {
            var show = false;
            buttonMap = {
                joinButton:
                !$scope.userIsMember && $scope.wGroup.profile != undefined
                && ( ($scope.wGroup.profile.supportedMembership === "OPEN")
                    || ($scope.wGroup.profile.supportedMembership === "INVITATION_AND_REQUEST")
                    || ($scope.wGroup.profile.supportedMembership === "REQUEST")
                ),
                inviteButton:
                $scope.userIsMember
                && $scope.wGroup.profile != undefined
                && ( ( $scope.wGroup.profile.managementType === "OPEN")
                    || ( ($scope.wGroup.profile.managementType === "COORDINATED")
                        && ($scope.isRightRole("COORDINATOR") )
                        || ( ($scope.wGroup.profile.managementType === "COORDINATED_AND_MODERATED")
                        && ($scope.isRightRole("COORDINATOR")) )
                    )
                ),
                campaignButton:
                $scope.userIsMember
                && $scope.wGroup.profile != undefined
                && ( ($scope.wGroup.profile.managementType === "OPEN")
                    || ( ($scope.wGroup.profile.managementType === "COORDINATED")
                        && ($scope.isRightRole("COORDINATOR") )
                        || ( ($scope.wGroup.profile.managementType === "COORDINATED_AND_MODERATED")
                            && ($scope.isRightRole("COORDINATOR"))
                        )
                    )
                ),
                sendMessage: $scope.userIsMember && $scope.wGroup.profile != undefined,
                organizeMeeting: $scope.userIsMember
                // && $scope.wGroup.profile != undefined
                //&& ( ($scope.wGroup.profile.supportedMembership === "OPEN")
                //|| ( ($scope.wGroup.profile.supportedMembership === "COORDINATED")
                //    && ($scope.isRightRole("COORDINATOR") )
                //    || ( ($scope.wGroup.profile.supportedMembership === "COORDINATED_AND_MODERATED")
                //        && ($scope.isRightRole("COORDINATOR"))
                //    )
                //)
                //)
            };
            if(buttonMap[button]){
                show = true
            }
            return show;
        };
        $scope.isRightRole = function(roleName) {
            var result = false;
            angular.forEach($scope.membershipRoles, function(role){
                if(role.name === roleName) {
                    result = true;
                }
            });
            return result;
        };
        $scope.joinGroup = function() {
            if (!$scope.userIsMember && !$scope.userIsRequestedMember && !$scope.userIsInvitedMember) {
                // If user is not a member, has not requested to join and has no pending invitation,
                // send a request for membership
                var membership = {
                    userId : $scope.user.userId,
                    email : $scope.user.email,
                    type : "REQUEST",
                    targetCollection: "GROUP"
                }
                var membershipRequest = Memberships.membershipRequest("group",$scope.workingGroupID).save(membership);
                membershipRequest.$promise.then(
                    function (data) {
                        $scope.userIsMember = false;
                        $scope.userIsRequestedMember = true;
                        $scope.userIsInvitedMember = false;
                        $scope.membership = data;
                        $scope.membershipRoles = $scope.membership.roles;
                    },
                    function (error) {
                        FlashService.Error("Membership request could not be completed: "+JSON.stringify(error));
                    }
                );
            } else if (!$scope.userIsMember && $scope.userIsInvitedMember) {
                // If user has been invited to join, redirect to the invitation verification page
                $location.url("/invitation/"+$scope.membership.invitationToken);
            }
        };
    }

    function initScopeContent () {
        // 0. Initalize general scope variables
        $scope.startSpinner();
        $scope.user = localStorageService.get("user");
        if ($scope.user && $scope.user.language)
            $translate.use($scope.user.language);

        $scope.assemblyID = $routeParams.aid;
        $scope.workingGroupID = $routeParams.wid;
        $scope.newForumPost = Contributions.defaultNewContribution();
        $scope.newForumPost.contributionType = "FORUM_POST";
        $scope.errors = [];
        $scope.wGroup = {};
        $scope.wGroupMembers = [];
        $scope.members = [];
        $scope.proposals = [];
        $scope.contributions = [];
        $scope.pendingInvitations = [];

        if ($scope.assemblyID >= 0 && $scope.workingGroupID >= 0) {
            $scope.membership = Memberships.membershipInGroup($scope.workingGroupID, $scope.user.userId).get();
            $scope.membership.$promise.then(userIsMemberSuccess, userIsMemberError);
        }
    }

    function initializeSideBoxes() {
        $scope.sideBoxes = [];
        $scope.translations = [
            'Campaign', 'Campaigns', 'Ongoing', 'Upcoming', 'Past',
            'New Campaign', 'New Working Group',
            'No campaigns to show.'
        ];

        $translate($scope.translations).then (
            function (translations) {
                $scope.translations = translations;

                $scope.sideBoxes['upCampaigns'] = {
                    title: $scope.translations["Upcoming"]+" "+$scope.translations["Campaigns"],
                    type: "CAMPAIGNS",
                    itemList: [],
                    errorMessage: $scope.translations["No campaigns to show."]
                };

                $scope.sideBoxes['onCampaigns'] = {
                    title: $scope.translations["Ongoing"]+" "+$scope.translations["Campaigns"],
                    type: "CAMPAIGNS",
                    itemList: [],
                    errorMessage: $scope.translations["No campaigns to show."]
                };

                $scope.sideBoxes['pastCampaigns'] = {
                    title: $scope.translations["Past"]+" "+$scope.translations["Campaigns"],
                    type: "CAMPAIGNS",
                    itemList: [],
                    errorMessage: $scope.translations["No campaigns to show."]
                };
            }
        );
    }

    function userIsMemberSuccess(data) {
        $scope.membership = data;
        $scope.membershipRoles = data.roles;
        $scope.userIsMember = $scope.membership.status === "ACCEPTED";
        $scope.userIsRequestedMember = $scope.membership.status === "REQUESTED";
        $scope.userIsInvitedMember = $scope.membership.status === "INVITED";
        if ($scope.userIsRequestedMember) {
            console.log("User "+$scope.user.userId+" has requested to join group "+$scope.workingGroupID);
        }

        if ($scope.userIsInvitedMember) {
            console.log("User "+$scope.user.userId+" has been invited to join group "+$scope.workingGroupID);
        }

        // 2.
        // - If user is member of the Assembly, get the full information of the assembly.
        // - If the user is not a member of the Assembly, get public profile of the assembly
        if ($scope.userIsMember) {
            console.log("User "+$scope.user.userId+" is member of the group "+$scope.workingGroupID);
            initializeWorkingGroup();
            initializeAssemblyCampaigns();
        } else {
            $scope.userIsMember = false;
            console.log("User "+$scope.user.userId+" is NOT a member of the group "+$scope.workingGroupID);
            initializeWorkingGroupForNonMembers();
            initializeAssemblyCampaigns();
        }
    }

    function userIsMemberError(error) {
        $scope.userIsMember = false;
        $scope.userIsRequestedMember = false;
        $scope.userIsInvitedMember = false;
        if (error.data.responseStatus === "NODATA" || error.data.responseStatus === "UNAUTHORIZED") {
            initializeWorkingGroupForNonMembers();
            initializeAssemblyCampaigns();
        } else {
            $scope.stopSpinner();
            FlashService.Error("An error occured while verifying your membership to the assembly: "+JSON.stringify(error))
        }
    }

    function initializeWorkingGroup() {
        console.log("Reading detail information of group "+$scope.workingGroupID);
        var res = WorkingGroups.workingGroup($scope.assemblyID, $scope.workingGroupID).get();
        res.$promise.then(
            function (data) {
                $scope.wGroup = data;
                $scope.stopSpinner();
                getWorkingGroupMembers($scope.assemblyID, $scope.workingGroupID);
                getWorkingGroupProposals($scope.assemblyID, $scope.workingGroupID);
                getWorkingGroupContributions($scope.assemblyID, $scope.workingGroupID);
                getInvitations($scope.workingGroupID);
            },
            function (error) {
                $scope.stopSpinner();
                FlashService.Error("Error occured trying to initialize the working group: "+JSON.stringify(error));
            }
        )
    }

    function initializeWorkingGroupForNonMembers() {
        console.log("Reading public information of group "+$scope.workingGroupID);
        var res = WorkingGroups.workingGroupPublicProfile($scope.assemblyID, $scope.workingGroupID).get();
        res.$promise.then(
            function (data) {
                $scope.wGroup = data;
                $scope.stopSpinner();

                if ($scope.userIsInvitedMember) {
                    getWorkingGroupMembers($scope.assemblyID, $scope.workingGroupID);
                    getWorkingGroupProposals($scope.assemblyID, $scope.workingGroupID);
                    getWorkingGroupContributions($scope.assemblyID, $scope.workingGroupID);
                    getInvitations($scope.workingGroupID);
                }
            },
            function (error) {
                console.log("Group "+$scope.workingGroupID+" is NOT public");
                $scope.stopSpinner();
                FlashService.Error("Error occured trying to initialize the working group: "+JSON.stringify(error));
            }
        )
    }

    function initializeAssemblyCampaigns() {
        var res = Assemblies.assembly($scope.assemblyID).get();
        res.$promise.then(
            function (data) {
                $scope.assembly = data;
                $scope.assemblyCampaigns = data.campaigns;
                $scope.campaigns = data.campaigns;
                $scope.sideBoxes['onCampaigns'].itemList = $filter('filter')($scope.campaigns, { active: true });
                $scope.sideBoxes['upCampaigns'].itemList = $filter('filter')($scope.campaigns, { upcoming: true });
                $scope.sideBoxes['pastCampaigns'].itemList = $filter('filter')($scope.campaigns, { past: true });
            },
            function (error) {
                $scope.errors.unshift(error);
            }
        )
    }

    function getWorkingGroupMembers() {
        var res = WorkingGroups.workingGroupMembers($scope.assemblyID, $scope.workingGroupID,"ALL").query();
        res.$promise.then(
            function (data) {
                $scope.wGroupMembers = data;
                $scope.members = data;
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

    function getWorkingGroupContributions() {
        var res = WorkingGroups.workingGroupContributions($scope.assemblyID, $scope.workingGroupID).query();
        res.$promise.then(
            function (data) {
                $scope.contributions = data;
            },
            function (error) {
                $scope.errors.unshift(error);
            }
        );
    }


    function getInvitations(target) {
        $scope.pendingInvitations = Invitations.invitations(target,"INVITED").query();
        $scope.pendingInvitations.$promise.then(
            function(response){
                $scope.pendingInvitations = response;
            },
            function(error) {
                $scope.errors.push(error);
            }
        );
    }

});

appCivistApp.controller('WGroupDirectiveCtrl', function($scope, $routeParams, $uibModal, $location,
                                                              localStorageService, Etherpad, Contributions, $translate) {

    init();

    function init() {
        $scope.user = localStorageService.get("user");
        if ($scope.user && $scope.user.language)
            $translate.use($scope.user.language);
    }

});
