// This controller retrieves data from the Assemblies and associates it
// with the $scope
// The $scope is bound to the order view
appCivistApp.controller('AssemblyListCtrl', function($scope, $routeParams, $resource, $location, Assemblies,
                                                     loginService, localStorageService, $translate) {

	init();

	function init() {
        $scope.user = localStorageService.get("user");
        if ($scope.user && $scope.user.language)
            $translate.use($scope.user.language);

        $scope.assemblies = Assemblies.assemblies().query();
		$scope.assemblies.$promise.then(function(data) {
			$scope.assemblies = data;
			localStorageService.set("assemblies", $scope.assemblies);
		});
	}

	$scope.searchAssembly = function(query) {
		$scope.assemblies = Assemblies.assembliesByQuery(query).query();
		$scope.assemblies.$promise.then(function(data) {
			$scope.assemblies = data;
			localStorageService.set("assemblies", $scope.assemblies);
		});
	}
});

/**
 * This controller facilitates the creation of a new assembly
 */
appCivistApp.controller('NewAssemblyCtrl', function($scope, $location, usSpinnerService, Upload, $timeout,
                                                    $routeParams, $resource, $http, Assemblies, Contributions,
													FileUploader, loginService, localStorageService, $translate,
                                                    LocaleService, LOCALES) {
	init();
    initializeNewAssembly();
    initializeListOfAssembliesToFollow();

    function init() {
        $scope.user = localStorageService.get("user");
        if ($scope.user && $scope.user.language)
            $translate.use($scope.user.language);
        $scope.themes = { list : null};
        $scope.inviteesEmails = { list : null};
        $scope.currentStep=1;
        $scope.tabs = [
            {
                step: 1,
                title:"Describe your assembly",
                template:"app/partials/assembly/newAssemblyStep1.html",
                info: "Assemblies are group of citizens with common interests",
                active: true
            },
            {
                step: 2,
                title:"Select assemblies to follow",
                template:"app/partials/assembly/newAssemblyStep2.html",
                info: "Following assemblies is a quick way for gaining access to the resources and campaigns of other assemblies."
            },
            {
                step: 3,
                title: "Setup your User Account",
                template: "app/partials/assembly/newAssemblyStep3.html",
                info: "Introduce and email address and a password to use to sign in into AppCivist"
            }
        ];
        $scope.defaultIcons = [
            {"name": "Justice Icon", "url":"https://s3-us-west-1.amazonaws.com/appcivist-files/icons/justicia-140.png"},
            {"name": "Plan Icon", "url":"https://s3-us-west-1.amazonaws.com/appcivist-files/icons/tabacalera-140.png"},
            {"name": "Article 49 Icon", "url":"https://s3-us-west-1.amazonaws.com/appcivist-files/icons/article19-140.png"},
            {"name": "Passe Livre Icon", "url":"https://s3-us-west-1.amazonaws.com/appcivist-files/icons/image74.png"},
            {"name": "Skyline Icon", "url":"https://s3-us-west-1.amazonaws.com/appcivist-files/icons/image75.jpg"}
        ];
        if ($scope.info === undefined || $scope.info === null) {
            info = $scope.info = localStorageService.get("help");
        }
        $scope.errors = [];
        $scope.selectedAssemblies = [];
        $scope.userIsNew = $routeParams.userIsNew ? true : false;
        if($scope.userIsNew) {
            $scope.newUser = {};
        }

        $scope.currentLocaleDisplayName = LocaleService.getLocaleDisplayName() ?
            LocaleService.getLocaleDisplayName() : LOCALES.locales[LOCALES.preferredLocale];
        $scope.localesDisplayNames = LocaleService.getLocalesDisplayNames();

        $scope.changeLanguage = function (locale) {
            LocaleService.setLocaleByDisplayName(locale);
        };

        $scope.removeErrors = function(index) {
            $scope.errors.splice(index,1);
        }

        $scope.setCurrentStep = function(number) {
            step(number);
        }

        $scope.setNewAssemblyIcon = function(url, name) {
            $scope.newAssembly.profile.icon = url;
            var file = {};
            file.name = name;
            file.url = url;
            $scope.f = file;

        }

        $scope.addEmailsToList = function(emailsText) {

            $scope.invalidEmails = [];
            console.log("Adding emails: " + emailsText);
            var emails = emailsText.split(',');
            console.log("Adding emails: " + emails);
            emails.forEach(function(email){
                console.log("Adding email: " + email);
                var invitee = {};
                invitee.email = email.trim();
                if($scope.isValidEmail(invitee.email)) {
                    invitee.moderator = false;
                    invitee.coordinator = false;
                    $scope.newAssembly.invitations.push(invitee);
                } else {
                    $scope.invalidEmails.push(invitee.email);
                }
            });
            $scope.inviteesEmails.list = "";
        }

        $scope.isValidEmail = function(email) {
            //var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
            var re = /^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/i;
            return re.test(email);
        }

        $scope.removeInvalidEmail = function(index) {
            $scope.invalidEmails.splice(index, 1);
        };

        $scope.removeInvitee = function(index) {
            $scope.newAssembly.invitations.splice(index,1);
        }

        $scope.addTheme = function(ts) {
            console.log("Adding themes: " + ts);
            var themes = ts.split(',');
            console.log("Adding themes: " + themes);
            themes.forEach(function(theme){
                console.log("Adding theme: " + theme);
                    var addedTheme = {};
                    addedTheme.title = theme.trim();
                    if (addedTheme.title  != "") {
                        $scope.newAssembly.themes.push(addedTheme);
                    }
            });
            $scope.themes.list = "";
        }

        $scope.removeTheme = function(index) {
            $scope.newAssembly.themes.splice(index,1);
        }

        $scope.findWithAttr = function(array, attr, value) {
            for (var i = 0; i < array.length; i += 1) {
                if (array[i][attr] === value) {
                    return i;
                }
            }
        }

        $scope.removeByAttr = function(array, attr, value) {
            for (var i = 0; i < array.length; i += 1) {
                if (array[i][attr] === value) {
                    array.splice(i,1);
                }
            }
        }

        $scope.getLinkedAssemblyById = function(id) {
            return $scope.findWithAttr($scope.newAssembly.linkedAssemblies, "assemblyId", id);
        }

        $scope.removeLinkedAssemblyById = function(id) {
            return $scope.removeByAttr($scope.newAssembly.linkedAssemblies, "assemblyId", id);
        }

        $scope.selectAssembly = function(assemblyId) {
            $scope.selectedAssemblies[assemblyId] = !$scope.selectedAssemblies[assemblyId];

            if($scope.selectedAssemblies[assemblyId]){
                var linked = {"assemblyId" : assemblyId};
                $scope.newAssembly.linkedAssemblies.push(linked);
            } else {
                $scope.removeLinkedAssemblyById(assemblyId);
            }
        }

        // TODO: process selected assemblies
        $scope.createNewAssembly = function(step) {
            if (step === 1) {
                console.log("Creating assembly with name = "+$scope.newAssembly.name);
                if($scope.newAssembly.profile.membership === 'OPEN') {
                    $scope.newAssembly.profile.supportedMembership="OPEN";
                } else if ($scope.newAssembly.profile.membership === 'REGISTRATION') {
                    if($scope.newAssembly.profile.registration.invitation &&
                        ! $scope.newAssembly.profile.registration.request) {
                        $scope.newAssembly.profile.supportedMembership = "INVITATION";
                    } else if(! $scope.newAssembly.profile.registration.invitation &&
                        $scope.newAssembly.profile.registration.request) {
                        $scope.newAssembly.profile.supportedMembership = "REQUEST";
                    } else if($scope.newAssembly.profile.registration.invitation &&
                        $scope.newAssembly.profile.registration.request) {
                        $scope.newAssembly.profile.supportedMembership = "INVITATION_AND_REQUEST";
                    }
                }

                // TODO: change moderation and coordination configurations to be stored differently
                console.log("Creating assembly with membership = "+$scope.newAssembly.profile.supportedMembership);
                if($scope.newAssembly.profile.moderators === 'none' && $scope.newAssembly.profile.coordinators === 'none' ) {
                    $scope.newAssembly.profile.managementType="OPEN";
                } else if ($scope.newAssembly.profile.moderators === 'two' || $scope.newAssembly.profile.moderators === 'all') {
                    if($scope.newAssembly.profile.coordinators === 'two') {
                        $scope.newAssembly.profile.managementType = "COORDINATED_AND_MODERATED";
                    } else if($scope.newAssembly.profile.coordinators === 'all') {
                        $scope.newAssembly.profile.managementType = "OPEN";
                    } else {
                        $scope.newAssembly.profile.managementType = "MODERATED";
                    }
                } else {
                    if ($scope.newAssembly.profile.coordinators === 'all') {
                        $scope.newAssembly.profile.managementType = "OPEN";
                    } else {
                        $scope.newAssembly.profile.managementType = "COORDINATED";
                    }
                }

                $scope.newAssembly.configs[0].value = $scope.newAssembly.config.facetoface;
                $scope.newAssembly.configs[1].value = $scope.newAssembly.config.messaging;

                console.log("Creating assembly with managementType = "+$scope.newAssembly.profile.managementType);
                //delete $scope.newAssembly.profile.;
                //delete $scope.newAssembly.profile.member;
                //delete $scope.newAssembly.profile.roles;
                //delete $scope.newAssembly.profile.role;
                localStorageService.set("temporaryNewAssembly",$scope.newAssembly);
                $scope.tabs[1].active=true;
            } else if (step === 2 && !$scope.userIsNew) {
                console.log("Creating new Assembly: " + JSON.stringify($scope.newAssembly.profile));
                var newAssemblyRes = Assemblies.assembly().save($scope.newAssembly);
                newAssemblyRes.$promise.then(
                    // Success
                    function(data) {
                        console.log("Created assembly: "+data.assemblyId);
                        localStorageService.set("currentAssembly",data);
                        localStorageService.set("temporaryNewAssembly","");
                        $location.url('/v1/assembly/'+data.assemblyId+"/forum");
                    },
                    // Error
                    function(error) {
                        var e = error.data;
                        console.log("Couldn't create assembly: "+e.statusMessage);
                        $scope.errors.push(e);
                    }
                );
            } else if (step === 2 && $scope.userIsNew) {
                $scope.tabs[2].active=true;
            } else if (step === 3 && $scope.userIsNew) {
                $scope.newUser.newAssembly = $scope.newAssembly;
                $scope.newUser.lang = LocaleService.getLocale();
                if (!$scope.newUser.lang) {
                    $scope.newUser.lang = LOCALES.preferredLocale;
                }

                loginService.signUp($scope.newUser, $scope);
            }
        }

        $scope.uploadFiles = function(file, errFiles) {
            $scope.f = file;
            $scope.errFile = errFiles && errFiles[0];
            if (file) {
                file.upload = Upload.upload({
                    url: FileUploader.uploadEndpoint(),
                    data: {file: file}
                });

                file.upload.then(function (response) {
                    $timeout(function () {
                        file.result = response.data;
                        $scope.newAssembly.profile.icon = response.data.url;
                    });
                }, function (response) {
                    if (response.status > 0)
                        $scope.errorMsg = response.status + ': ' + response.data;
                }, function (evt) {
                    file.progress = Math.min(100, parseInt(100.0 *
                        evt.loaded / evt.total));
                    console.log('progress: ' + file.progress + '% ');
                });
            }
        }

        $scope.startSpinner = function(){
            $(angular.element.find('[spinner-key="spinner-1"]')[0]).addClass('spinner-container');
            usSpinnerService.spin('spinner-1');
        }

        $scope.stopSpinner = function(){
            usSpinnerService.stop('spinner-1');
            $(angular.element.find('.spinner-container')).remove();
        }

        $scope.$watch("newAssembly.name",function(newVal, oldval){
            $translate('assembly.newAssemblystep1.text5', { newAssemblyName: $scope.newAssembly.name }).then(function (text) {
                $scope.newAssembly.invitationEmail = text;
            });
        },true);
	}

    function initializeNewAssembly() {
        if($scope.newAssembly===null || $scope.newAssembly===undefined || $scope.newAssembly===""){
            $scope.newAssembly = localStorageService.get("temporaryNewAssembly");
            if($scope.newAssembly===null || $scope.newAssembly===undefined || $scope.newAssembly==="" ) {
                $scope.newAssembly = Assemblies.defaultNewAssembly();
            }
        } else {
            console.log("Temporary New Assembly exists in the scope")
        }
        if ($scope.userIsNew) {
            $scope.newAssembly.newUser = {
                // username: "",
                // email: "",
                // password: "",
                // repeatPassword: "",
                themes: [] // same as assemblyThemes
            }
        }
        $scope.newAssembly.profile.icon = $scope.defaultIcons[0].url;
        var file = {};
        file.name = $scope.defaultIcons[0].name;
        file.url = $scope.defaultIcons[0].url;
        $scope.f = file;
    }

    function initializeListOfAssembliesToFollow() {
        $scope.startSpinner();
        var sessionKey = localStorageService.get("sessionKey");
        if(sessionKey === null || sessionKey === undefined || sessionKey === "") {
            $scope.assemblies = Assemblies.assembliesWithoutLogin().query();
        } else {
            $scope.assemblies = Assemblies.assemblies().query();
        }
        $scope.assemblies.$promise.then(
            function(data){
                $scope.assemblies =  data;
                console.log("Assemblies loaded...");
                $scope.stopSpinner();
            },
            function (error) {
                $scope.errors.push(error);
                $scope.stopSpinner();
            }
        );
    }

    function step(number) {
        if($scope.setCurrentStep === 1 && number === 2){
            createNewAssembly(1);
        } if($scope.setCurrentStep === 2 && number === 3){
            createNewAssembly(2);
        }
        $scope.currentStep=number;
    }
});

appCivistApp.controller('AssemblyCtrl', function($rootScope, $scope, usSpinnerService, Upload, $timeout, $routeParams,
                                                 $resource, $http, Assemblies, $location, Contributions, $uibModal,
                                                 loginService, localStorageService, Memberships, Invitations,
                                                 FlashService, $translate, $filter, logService) {

    init();

    function init() {
        initScopeFunctions();
        initScopeContent();
        initializeSideBoxes();
    }

    function initScopeFunctions () {
        // Scope Functions
        $scope.startSpinner = function(){
            $(angular.element.find('[spinner-key="spinner-1"]')[0]).addClass('spinner-container');
            usSpinnerService.spin('spinner-1');
        }

        $scope.stopSpinner = function(){
            usSpinnerService.stop('spinner-1');
            $(angular.element.find('.spinner-container')).remove();
        }

        $scope.selectCampaignById = function(cId) {
            $scope.campaigns = localStorageService.get("campaigns");
            campaign = campaigns.forEach(function(entry) {
                if(entry.campaignId == cId) {
                    return entry;
                }
            });
            localStorageService.set("currentCampaign", campaign);
        };

        $scope.selectCampaign = function(campaign) {
            localStorageService.set("currentCampaign", campaign);
        };

        $scope.selectGroup = function(group) {
            localStorageService.set("currentGroup", group);
        };

        $scope.publishComment = function(comment) {
            //Contributions.contributions($scope.currentAssembly.assemblyId).save();
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

        $scope.checkShow = function(button) {
            var show = false;
            buttonMap = {
                joinButton:
                !$scope.userIsMember && $scope.currentAssembly.profile != undefined
                && ( ($scope.currentAssembly.profile.supportedMembership === "OPEN")
                    || ($scope.currentAssembly.profile.supportedMembership === "INVITATION_AND_REQUEST")
                    || ($scope.currentAssembly.profile.supportedMembership === "REQUEST")
                ),
                inviteButton:
                $scope.userIsMember
                && $scope.currentAssembly.profile != undefined
                && ( ( $scope.currentAssembly.profile.managementType === "OPEN")
                    || ( ($scope.currentAssembly.profile.managementType === "COORDINATED")
                        && ($scope.isRightRole("COORDINATOR") )
                        || ( ($scope.currentAssembly.profile.managementType === "COORDINATED_AND_MODERATED")
                        && ($scope.isRightRole("COORDINATOR")) )
                    )
                ),
                campaignButton:
                $scope.userIsMember
                && $scope.currentAssembly.profile != undefined
                && ( ($scope.currentAssembly.profile.managementType === "OPEN")
                    || ( ($scope.currentAssembly.profile.managementType === "COORDINATED")
                        && ($scope.isRightRole("COORDINATOR") )
                        || ( ($scope.currentAssembly.profile.managementType === "COORDINATED_AND_MODERATED")
                            && ($scope.isRightRole("COORDINATOR"))
                        )
                    )
                ),
                groupButton:
                $scope.userIsMember
                && $scope.currentAssembly.profile != undefined
                && ( ($scope.currentAssembly.profile.managementType === "OPEN")
                    || ( ($scope.currentAssembly.profile.managementType === "COORDINATED")
                        && ($scope.isRightRole("COORDINATOR") )
                        || ( ($scope.currentAssembly.profile.managementType === "COORDINATED_AND_MODERATED")
                            && ($scope.isRightRole("COORDINATOR"))
                        )
                    )
                )
            };
            if(buttonMap[button]){
                show = true
            }
            return show;
        };

        $scope.openNewInvitationModal = function(size)  {
            var modalInstance = $uibModal.open({
                animation: true,
                templateUrl: '/app/partials/invitation.html',
                controller: 'NewInvitationModalCtrl',
                size: size,
                resolve: {
                    target: function () {
                        return $scope.currentAssembly;
                    },
                    type: function () {
                        return "ASSEMBLY";
                    },
                    defaultEmail: function() {
                        return $scope.currentAssembly.invitationEmail;
                    }
                }
            });

            var modalInstance;

            modalInstance.result.then(
                function (newInvitation) {
                    $scope.newInvitation = newInvitation;
                    getInvitations($scope.assemblyID);
                },
                function () {
                    console.log('Modal dismissed at: ' + new Date());
                }
            );
        };

        $scope.joinAssembly = function() {
            if (!$scope.userIsMember && !$scope.userIsRequestedMember && !$scope.userIsInvitedMember) {
                // If user is not a member, has not requested to join and has no pending invitation,
                // send a request for membership
                var membership = {
                    userId : $scope.user.userId,
                    email : $scope.user.email,
                    type : "REQUEST",
                    targetCollection: "ASSEMBLY"
                }
                var membershipRequest = Memberships.membershipRequest("assembly",$scope.assemblyID).save(membership);
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
                $location.url("/v1/invitation/"+$scope.membership.invitationToken);
            }
        };

        $scope.approveMember = function (member) {
            var res = Memberships.updateStatus(member.membershipId, "ACCEPTED").update(member);
            res.$promise.then(
                function (data) {
                    member.status = "ACCEPTED";
                },
                function (error) {
                    FlashService.Error("membership approval failed");
                }
            );
        }
        $scope.resendInvitation = function (invitation) {
            $rootScope.startSpinnerByKey("spinner-invitations");
            var res = Memberships.reSendInvitation(invitation.id).save();
            res.$promise.then(
                function (data) {
                    $rootScope.stopSpinnerByKey("spinner-invitations");
                    $rootScope.showAlert("Invitation sent!", "Invitation was sent to", invitation.email, false);
                    FlashService.Success("Invitation was re-sent!");
                },
                function (error) {
                    $rootScope.stopSpinnerByKey("spinner-invitations");
                    $rootScope.showError(error.data, "INVITATION", invitation.id);
                    FlashService.Error("Invitation was not sent!");
                }
            );
        }
    }

    function initScopeContent () {
        $scope.user = localStorageService.get("user");
        if ($scope.user && $scope.user.language)
            $translate.use($scope.user.language);
        // Grab assemblyID off of the route
        $scope.assemblyID = ($routeParams.aid) ? parseInt($routeParams.aid) : 0;
        console.log("Loading Assembly: "+$routeParams.aid);

        if ($scope.assemblyID > 0) {
            $scope.startSpinner();
            // 0. Prepare scope variables to use and start loading spinner
            $scope.currentAssembly = {};

            $scope.campaigns = [];
            $scope.workingGroups = [];
            $scope.assemblyMembers = [];
            $scope.contribution = [];
            $scope.pendingInvitations = [];
            $scope.newContribution = Contributions.defaultNewContribution();

            // 1. Verify if the user is member of this assembly and read get its membership detail
            $scope.membership = Memberships.membershipInAssembly($scope.assemblyID, $scope.user.userId).get();
            $scope.membership.$promise.then(userIsMemberSuccess, userIsMemberError);
        }
        // log read assembly
        logService.logAction("READ_ASSEMBLY");
    }

    function initializeSideBoxes() {
        $scope.sideBoxes = [];
        $scope.translations = [
            'Assembly', 'Assemblies', 'Campaign', 'Campaigns', 'Ongoing', 'Upcoming', 'Past',
            'Working Group', 'Working Groups', 'Member', 'Members',
            'New Assembly', 'New Campaign', 'New Working Group',
            'My Assemblies', 'My Campaigns', 'My Working Groups',
            'No assemblies to show.', 'No campaigns to show.',
            'No working groups to show.', 'Invite participants',
            'Upcoming Campaigns', 'Ongoing Campaigns', 'Past Campaigns'
        ];

        $translate($scope.translations).then (
            function (translations) {
                $scope.translations = translations;

                $scope.sideBoxes['upCampaigns'] = {
                    title: $scope.translations["Upcoming Campaigns"],
                    type: "CAMPAIGNS",
                    itemList: [],
                    errorMessage: $scope.translations["No campaigns to show."]
                };

                $scope.sideBoxes['onCampaigns'] = {
                    title: $scope.translations["Ongoing Campaigns"],
                    type: "CAMPAIGNS",
                    itemList: [],
                    errorMessage: $scope.translations["No campaigns to show."]
                };

                $scope.sideBoxes['pastCampaigns'] = {
                    title: $scope.translations["Past Campaigns"],
                    type: "CAMPAIGNS",
                    itemList: [],
                    errorMessage: $scope.translations["No campaigns to show."]
                };

                $scope.sideBoxes['groups'] = {
                    title: $scope.translations["Working Groups"],
                    type: "GROUPS",
                    itemList: [],
                    errorMessage: $scope.translations["No working groups to show."]
                };

                $scope.sideBoxes['members'] = {
                    title: $scope.translations["Members"],
                    type: "MEMBERS",
                    itemList: [],
                    errorMessage: $scope.translations["No working groups to show."]
                };

            }
        );
    }

    /**
     * Callback when the membership verification is a success
     * @param data
     */
    function userIsMemberSuccess (data) {
        $scope.membership = data;
        $scope.membershipRoles = data.roles;
        $scope.userIsMember = $scope.membership.status === "ACCEPTED";
        $scope.userIsRequestedMember = $scope.membership.status === "REQUESTED";
        $scope.userIsInvitedMember = $scope.membership.status === "INVITED";

        localStorageService.set("currentAssemblyMembership",$scope.membership);
        // 2.
        // - If user is member of the Assembly, get the full information of the assembly.
        // - If the user is not a member of the Assembly, get public profile of the assembly
        if ($scope.userIsMember) {

            // 2.1. Read assembly and initialize it in the scope
            $scope.currentAssembly = Assemblies.assembly($scope.assemblyID).get();
            $scope.currentAssembly.$promise.then(
                initializeAssembly,
                function (error) {
                    $scope.stopSpinner();
                    FlashService.Error("An error occured while trying to read the assembly: "+JSON.stringify(error));
                }
            );

        } else {
            $scope.userIsMember = false;
            initalizeAssemblyForNonMember (data);
        }
    }

    /**
     * Callback when the membership verification is an error
     * @param data
     */
    function userIsMemberError (error) {
        $scope.userIsMember = false;
        $scope.userIsRequestedMember = false;
        $scope.userIsInvitedMember = false;
        if (error.data && error.data.responseStatus &&
            (error.data.responseStatus === "NODATA" || error.data.responseStatus === "UNAUTHORIZED")
        ) {
            initalizeAssemblyForNonMember();
        } else {
            $scope.stopSpinner();
            FlashService.Error("An error occured while verifying your membership to the assembly: "+JSON.stringify(error))
        }
    }

    /**
     * After getting information about the assembly, initialize the corresponding scope variable and
     * its resources (contributions, members, campaigns, workign groups)
     * @param data
     */
    function initializeAssembly (data) {
        $scope.currentAssembly = data;
        if(!$scope.currentAssembly.forumPosts) {
            $scope.currentAssembly.forumPosts = [];
        }
        localStorageService.set("currentAssembly", $scope.currentAssembly);

        // 3. Initialize campaigns, contributions, working groups and members of the Assembly
        initializeAssemblyResources();
    }

    /**
     * Flag the user as "non-member" and try to read the public profile of the assembly
     * @param error
     */
    function initalizeAssemblyForNonMember () {
        // 2. If user is not member, read the public profile of the assembly if this is available
        $scope.currentAssembly = Assemblies.assemblyPublicProfile($scope.assemblyID).get();
        $scope.currentAssembly.$promise.then(
            function (data) {
                $scope.stopSpinner();
                $scope.currentAssembly = data;
            },
            function (error) {
                $scope.stopSpinner();
                $scope.assemblyNotListed = true;
                FlashService.Error("The assembly is not listed");
            }
        );
    }

    function initializeAssemblyResources () {
        $scope.campaigns = $scope.currentAssembly.campaigns;
        $scope.sideBoxes['onCampaigns'].itemList = $filter('filter')($scope.campaigns, { active: true });
        $scope.sideBoxes['upCampaigns'].itemList = $filter('filter')($scope.campaigns, { upcoming: true });
        $scope.sideBoxes['pastCampaigns'].itemList = $filter('filter')($scope.campaigns, { past: true });
        $scope.workingGroups = $scope.currentAssembly.workingGroups;
        $scope.sideBoxes['groups'].itemList = $scope.workingGroups;
        $scope.contributions = Contributions.contributions($scope.assemblyID).query();
        $scope.assemblyMembers = Assemblies.assemblyMembers($scope.assemblyID).query();
        $scope.contributions.$promise.then(function(data){
            $scope.contributions = data;
        });
        $scope.assemblyMembers.$promise.then(
            function(data){
                $scope.assemblyMembers = data;
                $scope.members = data;
                $scope.stopSpinner();
            },
            function(error) {
                $scope.stopSpinner();
            }
        );
        getInvitations($scope.assemblyID);
    }

    function getInvitations (target) {
        $scope.pendingInvitations = Invitations.invitations(target,"INVITED").query();
        $scope.pendingInvitations.$promise.then(
            function(response){
                $scope.pendingInvitations = response;
            },
            function(error) {
                FlashService.Error("Invitations couldn't be read: "+JSON.stringify(error));
            }
        );
    }
});
