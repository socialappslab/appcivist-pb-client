// This controller retrieves data from the Assemblies and associates it
// with the $scope
// The $scope is bound to the order view
appCivistApp.controller('AssemblyListCtrl', function($scope, $routeParams,
													 $resource, $location, Assemblies, loginService, localStorageService) {

	$scope.assemblies = [];
	$scope.serverBaseUrl = localStorageService.get("serverBaseUrl");

	init();

	function init() {
		$scope.assemblies = Assemblies.assemblies().get();
		$scope.assemblies.$promise.then(function(data) {
			$scope.assemblies = data;
			localStorageService.set("assemblies", $scope.assemblies);
			//console.log("Assemblies arrived: " + JSON.stringify($scope.assemblies));
		});
	}

	$scope.searchAssembly = function(query) {
		$scope.assemblies = Assemblies.assembliesByQuery(query).query();
		$scope.assemblies.$promise.then(function(data) {
			$scope.assemblies = data;
			localStorageService.set("assemblies", $scope.assemblies);
			//console.log("Assemblies arrived: " + JSON.stringify($scope.assemblies));
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
							"name": "",
							"shortname": "",
							"description": "",
							"listed": true,
							"profile": {
								"targetAudience": "",
								"supportedMembership": "",
								"managementType": "",
								"icon": "https://appcivist-pb.herokuapp.com/public/images/barefootdoctor-140.png",
								"primaryContactName": "",
								"primaryContactPhone": "",
								"primaryContactEmail": "",
								"lang": "en"
							},
							"location": {
								"placeName": "",
								"country": "",
								"geoJson": "{   'type': 'FeatureCollection',   'features': [     {       'type': 'Feature',       'properties': {},       'geometry': {         'type': 'Polygon',         'coordinates': [           [             [               2.0458602905273438,               48.800305780490156             ],             [               2.0413970947265625,               48.795330416333336             ],             [               2.055816650390625,               48.79125929678568             ],             [               2.0685195922851562,               48.78967599441185             ],             [               2.0757293701171875,               48.796687382771             ],             [               2.0853424072265625,               48.802341014504485             ],             [               2.0801925659179688,               48.80505453139158             ],             [               2.0650863647460938,               48.8118376812941             ],             [               2.0537567138671875,               48.815228912154815             ],             [               2.0496368408203125,               48.80505453139158             ],             [               2.0458602905273438,               48.800305780490156             ]           ]         ]       }     }   ] }"
							},
							"themes" : [{
								"title" : "Housing"
							}
							],
							"existingThemes" : [{
								"themeId" : 1
							}
							],
							"configs": [{
									"key":"assembly.face-to-face.scheduling",
									"value":"true"
									},
									{
									"key":"assembly.enable.messaging",
									"value":"true"
							}],
							"lang": "en"
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
				console.log("Obtained assembly: " + JSON.stringify($scope.currentAssembly));
				$scope.contributions.$promise.then(function(data){
					$scope.contributions = data;
				});
				$scope.campaigns = $scope.currentAssembly.campaigns;
				$scope.$root.stopSpinner();
			});
			$scope.assemblyMembers.$promise.then(function(data){
				$scope.assemblyMembers = data;
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

	$scope.selectAssembly = function(assembly) {
		if(this.assemblyState === "assemblySelected"){
			delete this.assemblyState;
		}
		else{
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