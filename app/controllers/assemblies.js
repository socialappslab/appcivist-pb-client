// This controller retrieves data from the Assemblies and associates it
// with the $scope
// The $scope is bound to the order view
appCivistApp.controller('AssemblyListCtrl', function($scope, $routeParams,
													 $resource, $location, Assemblies, loginService, localStorageService) {

	$scope.assemblies = [];
	$scope.serverBaseUrl = localStorageService.get("serverBaseUrl");

	init();

	function init() {
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
													FileUploader, loginService, localStorageService) {
	init();
    initializeNewAssembly();
    initializeListOfAssembliesToFollow();

    function init() {
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
            info = $scope.info = helpInfo;
            localStorageService.set("help",info);
        }
        $scope.errors = [];
        $scope.selectedAssemblies = [];
        $scope.userIsNew = $routeParams.userIsNew ? true : false;

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
            $scope.inviteesEmails = "";
        }

        $scope.isValidEmail = function(email) {
            var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
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
                $scope.newAssembly.themes.push(addedTheme);

            });
            $scope.themes = "";
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
                var linked = {"assemblyId":assemblyId};
                $scope.newAssembly.linkedAssemblies.push(linked);
            } else {
                $scope.removeLinkedAssemblyById(assemblyId);
            }
        }

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

                console.log("Creating assembly with membership = "+$scope.newAssembly.profile.supportedMembership);
                if($scope.newAssembly.profile.moderators === 'none' && $scope.newAssembly.profile.coordinators === 'none' ) {
                    $scope.newAssembly.profile.managementType="OPEN";
                } else if ($scope.newAssembly.profile.moderators === 'two' || $scope.newAssembly.profile.moderators === 'all') {
                    if($scope.newAssembly.profile.coordinators === 'two' || $scope.newAssembly.profile.coordinators === 'all') {
                        $scope.newAssembly.profile.managementType = "COORDINATED_AND_MODERATED";
                    } else if(! $scope.newAssembly.profile.role.coordinators &&
                        $scope.newAssembly.profile.role.moderators ) {
                        $scope.newAssembly.profile.managementType = "MODERATED";
                    }
                } else {
                    $scope.newAssembly.profile.managementType = "COORDINATED";
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
            } else if ((step === 2 && !$scope.userIsNew) || step === 3) {
                console.log("Creating new Assembly: " + JSON.stringify($scope.newAssembly.profile));
                var newAssemblyRes = Assemblies.assembly().save($scope.newAssembly);
                newAssemblyRes.$promise.then(
                    // Success
                    function(data) {
                        console.log("Created assembly: "+data.assemblyId);
                        localStorageService.set("currentAssembly",data);
                        localStorageService.set("temporaryNewAssembly","");
                        $location.url('/assembly/'+data.assemblyId+"/forum");
                    },
                    // Error
                    function(error) {
                        var e = error.data;
                        console.log("Couldn't create assembly: "+e.statusMessage);
                        $scope.errors.push(e);
                    }
                );
            } else if (step === 2 && $scope.userIsNew) {
                localStorageService.set("temporaryNewAssembly",$scope.newAssembly);
                $scope.tabs[2].active=true;
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

	}

    function initializeNewAssembly() {
        if($scope.newAssembly===null || $scope.newAssembly===undefined){
            $scope.newAssembly = localStorageService.get("temporaryNewAssembly");
            if($scope.newAssembly===null || $scope.newAssembly===undefined) {
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
    }

    function initializeListOfAssembliesToFollow() {
        $scope.$root.startSpinner();
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
                $scope.$root.stopSpinner();
            },
            function (error) {
                $scope.errors.push(error);
                $scope.$root.stopSpinner();
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

appCivistApp.controller('AssemblyCtrl', function($scope, usSpinnerService, Upload, $timeout, $routeParams,
                                                 $resource, $http, Assemblies, Contributions, $uibModal,
                                                 loginService, localStorageService, Memberships, Invitations) {
    init();

    function init() {
        // Grab assemblyID off of the route
        $scope.assemblyID = ($routeParams.aid) ? parseInt($routeParams.aid) : 0;
        $scope.currentAssembly = {};
        $scope.newContribution = Contributions.defaultNewContribution();


        console.log("Loading Assembly: "+$routeParams.aid);

        if ($scope.assemblyID > 0) {
            $scope.$root.startSpinner();
            $scope.currentAssembly = Assemblies.assembly($scope.assemblyID).get();
            $scope.contributions = Contributions.contributions($scope.assemblyID).query();
            $scope.assemblyMembers = Assemblies.assemblyMembers($scope.assemblyID).query();
            $scope.verifyAssembly = Assemblies.verifyMembership($scope.assemblyID, $scope.user.userId).get();
            $scope.membership = Memberships.memberships().query();
            $scope.campaigns = null;
            $scope.pendingInvitations = [];
            $scope.currentAssembly.$promise.then(function(data) {
                $scope.currentAssembly = data;
                if(!$scope.currentAssembly.forumPosts) {
                    $scope.currentAssembly.forumPosts = [];
                }
                localStorageService.set("currentAssembly", $scope.currentAssembly);
                $scope.campaigns = $scope.currentAssembly.campaigns;
            });
            $scope.verifyAssembly.$promise.then(function(data) {
                $scope.verifyAssembly = data.responseStatus === "OK";
            });
            $scope.membership.$promise.then(function(data) {
                $scope.membership = data;
                $scope.membershipRoles = null;
                for (var i = 0; i < $scope.membership.length; i += 1) {
                    var membership = $scope.membership[i];
                    if (membership.assembly) {
                        if (membership.assembly.assemblyId === $scope.currentAssembly.assemblyId) {
                            $scope.membershipRoles = membership.roles;
                        }
                    }
                }
            });
            $scope.contributions.$promise.then(function(data){
                $scope.contributions = data;
            });
            $scope.assemblyMembers.$promise.then(function(data){
                $scope.assemblyMembers = data;
                $scope.$root.stopSpinner();
            });
            getInvitations($scope.assemblyID);
        }
    }

    $scope.selectCampaign = function(campaign) {
        localStorageService.set("currentCampaign", campaign);
    }

    $scope.selectCampaignById = function(cId) {
        $scope.campaigns = localStorageService.get("campaigns");
        campaign = campaigns.forEach(function(entry) {
            if(entry.campaignId == cId) {
                return entry;
            }
        });
        localStorageService.set("currentCampaign", campaign);
    }

    $scope.selectGroup = function(group) {
        localStorageService.set("currentGroup", group);
    }

    $scope.publishComment = function(comment) {
        //Contributions.contributions($scope.currentAssembly.assemblyId).save();
    }

    $scope.isRightRole = function(roleName) {
        var result = false;
        angular.forEach($scope.membershipRoles, function(role){
            if(role.name === roleName) {
                result = true;
            }
        });
        return result;
    }

    $scope.checkShow = function(button) {
        var show = false;
        buttonMap = {
            joinButton:
                !$scope.verifyAssembly && $scope.currentAssembly.profile != undefined
                    && ( ($scope.currentAssembly.profile.supportedMembership === "OPEN")
                        || ($scope.currentAssembly.profile.supportedMembership === "INVITATION_AND_REQUEST")
                ),
            inviteButton:
                $scope.verifyAssembly
                && $scope.currentAssembly.profile != undefined
                && ( ( $scope.currentAssembly.profile.supportedMembership === "OPEN")
                    || ( ($scope.currentAssembly.profile.supportedMembership === "COORDINATED")
                        && ($scope.isRightRole("COORDINATOR") )
                        || ( ($scope.currentAssembly.profile.supportedMembership === "COORDINATED_AND_MODERATED")
                        && ($scope.isRightRole("COORDINATOR")) )
                    )
            ),
            campaignButton:
                $scope.verifyAssembly
                && $scope.currentAssembly.profile != undefined
                && ( ($scope.currentAssembly.profile.supportedMembership === "OPEN")
                    || ( ($scope.currentAssembly.profile.supportedMembership === "COORDINATED")
                        && ($scope.isRightRole("COORDINATOR") )
                        || ( ($scope.currentAssembly.profile.supportedMembership === "COORDINATED_AND_MODERATED")
                            && ($scope.isRightRole("COORDINATOR"))
                        )
                    )
                )
        };
        if(buttonMap[button]){
            show = true
        }
        return show;
    }

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
            },
            function () {
                console.log('Modal dismissed at: ' + new Date());
            }
        );
    };

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
