﻿// This controller retrieves data from the Assemblies and associates it
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
													loginService, localStorageService) {
	init();
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
            {"name": "Justice Icon", "url":"http://appcivist.littlemacondo.com/assets/images/justicia-140.png"},
            {"name": "Plan Icon", "url":"http://appcivist.littlemacondo.com/assets/images/tabacalera-140.png"},
            {"name": "Article 49 Icon", "url":"http://appcivist.littlemacondo.com/assets/images/article19-140.png"},
            {"name": "Passe Livre Icon", "url":"http://appcivist.littlemacondo.com/assets/images/image74.png"},
            {"name": "Skyline Icon", "url":"http://appcivist.littlemacondo.com/assets/images/image75.jpg"}
        ];
        if ($scope.info === undefined || $scope.info === null) {
            info = $scope.info = helpInfo;
            localStorageService.set("help",info);
        }
        $scope.errors = [];
        $scope.selectedAssemblies = [];
        $scope.userIsNew = $routeParams.userIsNew ? true : false;

        initializeNewAssembly();
        initializeListOfAssembliesToFollow();
	}

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

	$scope.uploadFiles = function(file) {
		$scope.f = file;
		if (file && !file.$error) {
			file.upload = Upload.upload({
                // TODO SETUP CREDENTIALS AND UPLOAD SERVER
				url: 'https://angular-file-upload-cors-srv.appspot.com/upload',
				file: file
			});

			file.upload.then(function (response) {
				$timeout(function () {
					file.result = response.data;
                    // TODO SETUP THE RESPONSE URL AND PUT IT IN NEW ASSEMBLY ICON
                    $scope.f.url = "";

				});
			}, function (response) {
				if (response.status > 0)
					$scope.errorMsg = response.status + ': ' + response.data;
			});

			file.upload.progress(function (evt) {
				file.progress = Math.min(100, parseInt(100.0 *
					evt.loaded / evt.total));
			});
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

    $scope.createNewAssemblyText = "Create a New Assembly"; 
    $scope.step1NameText = "Name"; 
    $scope.nameExample = "e.g. Assemble Belleville"; 
    $scope.step1Description = "What's your assembly about?"; 
    $scope.descriptionExample = "e.g. Assembly of residents of Beleville. We are using AppCivist to develop proposals to improve the neighborhood."; 
    $scope.step1locationText = "Location"; 
    $scope.step1LocExample = "e.g. City Hall"; 
    $scope.step1ContactText = "Primary Contact"; 
    $scope.phoneText = "Phone"; 
    $scope.emailText = "Email"; 
    $scope.iconSelectText = "Select Icon"; 
    $scope.uploadImageBtn = "Upload Image"; 
    $scope.defineThemesText = "Define Assembly Themes"; 
    $scope.defineThemesEx = "e.g. Education"; 
    $scope.themeExample1 = "City Planning"; 
    $scope.themeExample2 = "Parks"; 
    $scope.themeExample3 = "Infrastructure"; 
    $scope.nextBtn = "Next"; 

    $scope.step2Description = "Set Member Permissions"; 
    $scope.memberDescription = "Who are members?"; 
    $scope.memberDescriptionEx = "Describe who you want to join your assembly."; 
    $scope.joiningMethod = "How can members join?"; 
    $scope.joinOption1 = "Open"; 
    $scope.joinOption2 = "Registration"; 
    $scope.byInvitation = "By invitation"; 
    $scope.byRequest = "By request"; 
    $scope.modConfiguration = "Configure Moderation"; 
    $scope.modDescription = "Who will be able to remove inappropriate comments?"; 
    $scope.modRecommendation = "AppCivist recommends that assemblies have at least two moderators. To remove comments, at least two moderators must agree."; 
    $scope.modOption1 = "Nominate specific moderators (at least two)"; 
    $scope.modOption2 = "Make all members moderators"; 
    $scope.modOption3 = "Have no moderators"; 
    $scope.coordinationConfig = "Configure Coordination"; 
    $scope.coordDescr = "Who will be able to change assembly settings?"; 
    $scope.coordRecommendation = "AppCivist recommends that assemblies have at least two coordinators. To make changes, at least two coordinators must agree."; 
    $scope.coordOption1 = "Nominate specific coordinators (at least two)"; 
    $scope.coordOption2 = "Make all members moderating power"; 
    $scope.coordOption3 = "Have no coordinators"; 
    $scope.otherRolesText = "Other Roles"; 
    $scope.otherRolesDescr = "You may define additional roles (although these will not have extra functionality on the platform)."; 
    $scope.otherRolesTextBox = "Enter Role"; 

    $scope.inviteMembersText = "Invite Members to Join"; 
    $scope.inviteGenMembersText = "Invite General Members"; 
    $scope.inviteListText = "Invite List"; 
    $scope.inviteListDescr = "Enter emails separated by commas, or upload a CSV."; 
    $scope.uploadCSVBtn = "Upload CSV of Emails"; 
    $scope.invitationMsgText = "Invitation Message"; 
    $scope.invitationMsgEx = "You've been invited to join [Assembly_Name] on AppCivist!\n [Assembly Description]\n If you have any questions, feel free to contact [Primary_Contact_Name] at [Primary_Contact_Email]."; 
    $scope.inviteModsText = "Invite Moderators"; 
    $scope.inviteModsEx = "You've been invited to be a moderator for [Assembly_Name] on AppCivist!\n [Assembly Description]\n If you have any questions, feel free to contact [Primary_Contact_Name] at [Primary_Contact_Email]."
    $scope.inviteCoordsText = "Invite Coordinators"; 
    $scope.inviteCoordsEx = "You've been invited to be a coordinator of [Assembly_Name] on AppCivist!\n [Assembly Description]\n If you have any questions, feel free to contact [Primary_Contact_Name] at [Primary_Contact_Email]."
    $scope.backBtn = "Back"; 
    $scope.createBtn = "Create Assembly"; 

});

appCivistApp.controller('AssemblyCtrl', function($scope, usSpinnerService, Upload, $timeout, $routeParams,
                                                 $resource, $http, Assemblies, Contributions,
                                                 loginService, localStorageService, Memberships) {
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
            $scope.currentAssembly.$promise.then(function(data) {
                $scope.currentAssembly = data;
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
});