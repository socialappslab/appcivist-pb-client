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
appCivistApp.controller('NewAssemblyCtrl', function($scope, $location, usSpinnerService, Upload, $timeout, $routeParams, $resource, $http, Assemblies, Contributions,
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
            }
        ];
        $scope.defaultIcons = [
            {"url":"http://appcivist.littlemacondo.com/assets/images/justicia-140.png"},
            {"url":"http://appcivist.littlemacondo.com/assets/images/tabacalera-140.png"},
            {"url":"http://appcivist.littlemacondo.com/assets/images/article19-140.png"},
            {"url":"http://appcivist.littlemacondo.com/assets/images/image74.png"},
            {"url":"http://appcivist.littlemacondo.com/assets/images/image75.jpg"}
        ];
        if ($scope.info === undefined || $scope.info === null) {
            info = $scope.info = helpInfo;
            localStorageService.set("help",info);
        }

        if($scope.newAssembly===null || $scope.newAssembly===undefined){
            $scope.newAssembly = localStorageService.get("temporaryNewAssembly");
            if($scope.newAssembly===null || $scope.newAssembly===undefined) {
                $scope.newAssembly = {
                    //"name": "Assemblée Belleville",
                    //"shortname": "assemblee-belleville",
                    //"description": "This assembly organizes citizens of Belleville, to come up with interesting and feasible proposals to be voted on and later implemented during the PB process of 2015",
                    "listed": true, // TODO: ADD TO FORM
                    "profile": {
                        "targetAudience": "RESIDENTS",
                        "membership": "REGISTRATION",
                        "registration" : {
                            "invitation" : true,
                            "request" : true
                        },
                        "moderators":"two",
                        "coordinators":"two",
                        "icon": "https://appcivist.littlemacondo.com/public/images/barefootdoctor-140.png",
                        "primaryContactName": "",
                        "primaryContactPhone": "",
                        "primaryContactEmail": ""
                    },
                    //"location": {
                    //	"placeName": "Belleville, Paris, France"
                    //},
                    "themes": [{
                        "title": "Housing"
                    }
                    ],
                    "existingThemes": [],
                    "config" : {
                        "facetoface":true,
                        "messaging":false
                    },
                    "configs": [
                        {
                            "key": "assembly.face-to-face.scheduling",
                            "value": "true"
                        },
                        {
                            "key": "assembly.enable.messaging",
                            "value": "false"
                        }
                    ],
                    "lang": "en", // TODO: ADD TO FORM
                    "invitations" : [ ], // { "email": "abc1@example.com", "moderator": true, "coordinator": false }, ... ],
                    "linkedAssemblies" : [ ] // [ { "assemblyId": "2" }, { "assemblyId": "3" }, ... ]
                };
            }
        } else {
            console.log("Temporary New Assembly exists in the scope")
        }

        console.log("Loading Assemblies...");
        $scope.$root.startSpinner();
        $scope.assemblies = Assemblies.assemblies().query();
        $scope.assemblies.$promise.then(function(data){
            $scope.assemblies =  data;
            console.log("Assemblies loaded...");
            $scope.$root.stopSpinner();
        });
	}

    $scope.setCurrentStep = function(number) {
        if($scope.setCurrentStep === 1 && number === 2){
            createNewAssembly(1);
        }
        $scope.currentStep=number;
    }

    $scope.setNewAssemblyIcon = function(url) {
        $scope.newAssembly.profile.icon = url;
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

	$scope.selectAssembly = function(assembly, index) {
		if(this.assemblyState === "assemblySelected"){
			delete this.assemblyState;
			$scope.newAssembly.linkedAssemblies.splice(index,1);
		} else {
			this.assemblyState = "assemblySelected";
			var linked = {};
			linked.assemblyId = assembly.assemblyId;
			$scope.newAssembly.linkedAssemblies.push(linked);
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
		} else if (step === 2) {
			console.log("Creating new Assembly: " + JSON.stringify($scope.newAssembly.profile));
			var newAssembly = Assemblies.assembly().save($scope.newAssembly, function() {
				console.log("Created assembly: "+newAssembly);
				localStorageService.set("currentAssembly",newAssembly);
				$location.url('/assembly/'+newAssembly.assemblyId+"/forum");
			});
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
});

appCivistApp.controller('AssemblyCtrl', function($scope, usSpinnerService, Upload, $timeout, $routeParams, $resource, $http, Assemblies, Contributions,
                                                    loginService, localStorageService) {
    init();

    function init() {
        // Grab assemblyID off of the route
        $scope.assemblyID = ($routeParams.aid) ? parseInt($routeParams.aid) : 0;
        $scope.currentAssembly = {};

        console.log("Loading Assembly: "+$routeParams.aid);


        if ($scope.assemblyID > 0) {
            $scope.$root.startSpinner();
            $scope.currentAssembly = Assemblies.assembly($scope.assemblyID).get();
            $scope.contributions = Contributions.contributions($scope.assemblyID).query();
            $scope.assemblyMembers = Assemblies.assemblyMembers($scope.assemblyID).query();
            $scope.campaigns = null;
            $scope.currentAssembly.$promise.then(function(data) {
                $scope.currentAssembly = data;
                localStorageService.set("currentAssembly", $scope.currentAssembly);
                $scope.campaigns = $scope.currentAssembly.campaigns;
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
});