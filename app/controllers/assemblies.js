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

// This controller retrieves data from the Assemblies and associates it
// with the $scope
// The $scope is bound to the order view
appCivistApp.controller('AssemblyCtrl', function($scope, usSpinnerService, Upload, $timeout, $routeParams, $resource, $http, Assemblies, Contributions,
													loginService, localStorageService) {
	$scope.currentAssembly = {};
	$scope.newAssembly = {
		//"name": "Assemblée Belleville",
		//"shortname": "assemblee-belleville",
		//"description": "This assembly organizes citizens of Belleville, to come up with interesting and feasible proposals to be voted on and later implemented during the PB process of 2015",
		//"listed": true,
		"profile": {
			"targetAudience": "RESIDENTS",
			"supportedMembership": "REGISTRATION",
			"registration" : {
				"invitation" : true,
				"request" : false
			},
			"moderators":"two",
			"coordinators":"two",
			"managementType": "COORDINATED_AND_MODERATED",
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
		"existingThemes": [{
			"themeId": 1
		}
		],
		"configs": [
			{
				"key": "assembly.face-to-face.scheduling",
				"value": "true"
			},
			{
				"key": "assembly.enable.messaging",
				"value": "true"
			}
		],
		"lang": "en",
		"invitations" : [
			//{
			//	"email": "abc1@example.com",
			//	"moderator": true,
			//	"coordinator": false
			//},
			//{
			//	"email" : "abc2@example.com",
			//	"moderator" : true,
			//	"coordinator" : true
			//},
			//{
			//	"email" : "abc3@example.com",
			//	"moderator" : true,
			//	"coordinator" : true
			//}
		],
		"linkedAssemblies" : [
			{
				"assemblyId": "2"
			},
			{
				"assemblyId": "3"
			}
		]
	};

	$scope.info = {
		assemblyDefinition : "Assemblies are group of citizens with common interests",
		locationTooltip : "Can be the name of a specific place, address, city or country associated with your assembly",
		targetAudienceTooltip : "Describe who you want to participate",
		supportedMembershipRegistrationTooltip : "Members can be invited or request to join the assembly, or both.",
		moderatorsTooltip: "Moderators are assembly members empowered to delete inappropriate content. AppCivist recommends that assemblies have at least two. An alternative is to allow all members to be moderators. In both cases at least two moderators must agree.",
		coordinatorsTooltip: "Coordinators are assembly members empowered to change settings",
		invitationsTooltip: "Add one or more email addresses of people you want to invite, separated by comma, then click add to list",
		invitationinvitationsEmailTooltip: "Each invitee will receive the following email"
	};

	console.log("Loading Assembly: "+$routeParams.aid);

	init();

	function init() {
		// Grab assemblyID off of the route
		$scope.assemblyID = ($routeParams.aid) ? parseInt($routeParams.aid) : 0;

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

	$scope.addEmailsToList = function(emailsText) {
		console.log("Adding emails: " + emailsText);
		var emails = emailsText.split(',');
		console.log("Adding emails: " + emails);
		emails.forEach(function(email){
			console.log("Adding email: " + email);
			var invitee = {};
			invitee.email = email.trim();
			invitee.moderator = false;
			invitee.coordinator = false;
			$scope.newAssembly.invitations.push(invitee);

		});
		$scope.inviteesEmails = "";
	}

	$scope.removeInvitee = function(index) {
		$scope.newAssembly.invitations.splice(index,1);
	}

	$scope.selectAssembly = function(assembly) {
		if(this.assemblyState === "assemblySelected"){
			delete this.assemblyState;
		} else {
			this.assemblyState = "assemblySelected";
		}
	}

	$scope.createNewAssembly = function(step) {
		if (step === 1) {
			console.log("Creating assembly with name = "+$scope.newAssembly.name);
			console.log("Creating assembly with description = "+$scope.newAssembly.description);

			if($scope.newAssembly.profile.membership === 'open') {
				$scope.newAssembly.profile.supportedMembership="OPEN";
			} else if ($scope.newAssembly.profile.membership === 'registration') {
				if($scope.newAssembly.profile.member.invitation &&
					! $scope.newAssembly.profile.member.request) {
					$scope.newAssembly.profile.supportedMembership = "INVITATION";
				} else if(! $scope.newAssembly.profile.member.invitation &&
					 $scope.newAssembly.profile.member.request) {
					$scope.newAssembly.profile.supportedMembership = "REQUEST";
				} else if($scope.newAssembly.profile.member.invitation &&
					 $scope.newAssembly.profile.member.request) {
					$scope.newAssembly.profile.supportedMembership = "INVITATION_AND_REQUEST";
				}
			}

			console.log("Creating assembly with membership = "+$scope.newAssembly.profile.supportedMembership);

			if($scope.newAssembly.profile.roles === 'no') {
				$scope.newAssembly.profile.managementType="OPEN";
			} else if ($scope.newAssembly.profile.roles === 'yes') {
				if($scope.newAssembly.profile.role.coordinators &&
					! $scope.newAssembly.profile.role.moderators ) {
					$scope.newAssembly.profile.managementType = "COORDINATED";
				} else if(! $scope.newAssembly.profile.role.coordinators &&
					 $scope.newAssembly.profile.role.moderators ) {
					$scope.newAssembly.profile.managementType = "MODERATED";
				} else if($scope.newAssembly.profile.role.coordinators &&
					 $scope.newAssembly.profile.role.moderators ) {
					$scope.newAssembly.profile.managementType = "COORDINATED_AND_MODERATED";
				}
			}

			console.log("Creating assembly with managementType = "+$scope.newAssembly.profile.managementType);
			delete $scope.newAssembly.profile.membership;
			delete $scope.newAssembly.profile.member;
			delete $scope.newAssembly.profile.roles;
			delete $scope.newAssembly.profile.role;
			localStorageService.set("temporaryNewAssembly",$scope.newAssembly)
		} else if (step === 3) {
			$scope.newAssembly = localStorageService.get("temporaryNewAssembly");
			console.log("Creating new Assembly: " + JSON.stringify($scope.newAssembly));
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
				url: 'https://angular-file-upload-cors-srv.appspot.com/upload',
				file: file
			});

			file.upload.then(function (response) {
				$timeout(function () {
					file.result = response.data;
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