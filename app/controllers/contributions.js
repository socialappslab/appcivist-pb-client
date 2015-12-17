/**
 * The NewContributionCtrl controls how to display and create new contributions to
 * AppCivist's backend. Contributions can be created in the following spaces:
 * - On the assembly forum space (type = FORUM_POST)
 * - On the assembly resources space (type = DISCUSSION)
 * - On a campaign resources space (type = DISCUSSION)
 * - On a component (i.e., phase) that is part of a campaign (type = PROPOSAL, BRAINSTORMING
 * - On a contribution resources space (type = COMMENT)
 */

var postingContributionFlag = false;

appCivistApp.controller('NewContributionCtrl',
		function ($scope, $http, $routeParams, localStorageService, Contributions) {
			init();
			function init() {
				$scope.clearContribution = clearNewContributionObject;
				$scope.postingContribution = postingContributionFlag;
				$scope.addAttachment = addAttachmentToContribution;
			}

			$scope.postContribution = function (newContribution, targetSpaceId, targetSpace) {
				if (!newContribution.type) {
					newContribution.type = $scope.contributionType;
				}
				createNewContribution(newContribution, targetSpaceId, targetSpace, {}, undefined, Contributions);
			};
		});

appCivistApp.controller('NewContributionModalCtrl',
		function ($scope, $uibModalInstance,
				   assembly, campaign, component, milestone, contributions, themes, newContribution,
				   newContributionResponse, cType, localStorageService, Contributions) {
			init();
			function init() {
				$scope.assembly = assembly;
				$scope.campaign = campaign;
				$scope.component = component;
				$scope.milestone = milestone;
				$scope.contributions = contributions;
				$scope.themes = themes;
				$scope.newContribution = newContribution;
				$scope.newContribution.themes = $scope.themes;
				$scope.newContributionResponse = newContributionResponse;
				$scope.clearContribution = clearNewContributionObject;
				$scope.postingContribution = postingContributionFlag;
				$scope.addAttachment = addAttachmentToContribution;
				$scope.cType = cType;
				$scope.newContribution.type = cType;
			}

			$scope.postContribution = function (newContribution, targetSpaceId, targetSpace) {
				createNewContribution(newContribution, targetSpaceId, targetSpace, {}, undefined, Contributions);
			};

			$scope.postContributionFromModal = function () {
				createNewContribution($scope.newContribution, $scope.component.resourceSpaceId,
						$scope.contributions, $scope.newContributionResponse, $uibModalInstance, Contributions);
			};

			$scope.cancel = function () {
				$scope.newContribution = Contributions.defaultNewContribution();
				$uibModalInstance.dismiss('cancel');
			};
		});

appCivistApp.controller('ContributionModalCtrl',
		function ($scope, $uibModalInstance, $location,
				  contribution, assemblyID, campaignID, componentID, milestoneID, localStorageService, Contributions) {
			init();
			function init() {
				$scope.contribution = contribution;
				$scope.assemblyID = assemblyID;
				$scope.campaignID = campaignID;
				$scope.componentID = componentID;
				$scope.milestoneID = milestoneID;
			}

			$scope.postContribution = function (newContribution, targetSpaceId, targetSpace) {
				createNewContribution(newContribution, targetSpaceId, targetSpace, {}, undefined, Contributions);
			};

			$scope.postContributionFromModal = function () {
				createNewContribution($scope.newContribution, $scope.component.resourceSpaceId,
						$scope.contributions, $scope.newContributionResponse, $uibModalInstance, Contributions);
			};

			$scope.cancel = function () {
				$uibModalInstance.dismiss('cancel');
			};

			$scope.getEtherpadReadOnlyUrl = function (readOnlyPadId) {
				var url = localStorageService.get("etherpadServer")+"p/"+readOnlyPadId+"?showControls=true&showChat=true&showLineNumbers=true&useMonospaceFont=false";
				console.log("Contribution Read Only Etherpad URL: "+url);
				return url;
			};

			$scope.openContributionPage = function(cID)  {
				$location.url("/assembly/"+$scope.assemblyID+"/campaign/"+$scope.campaignID+"/"+$scope.componentID+"/"+$scope.milestoneID+"/"+cID);
				$uibModalInstance.dismiss('cancel');
			};
		});


appCivistApp.controller('contributionCtrl', function($scope, $http, $routeParams, localStorageService) {
	$scope.$root.$on('contribution:selected', function(event, data){
		$scope.contribution = data;
	});
});

appCivistApp.controller('ContributionReadEditCtrl', function($scope, $http, $routeParams, localStorageService,
															 Contributions, Campaigns, Assemblies, Etherpad) {
	init();

	// TODO: improve efficiency by using angularjs filters instead of iterating through arrays
	setCurrentAssembly($scope, localStorageService);
	setCurrentCampaign($scope, localStorageService);

	function init() {
		// 1. Setting up scope ID values
		$scope.assemblyID = ($routeParams.aid) ? parseInt($routeParams.aid) : 0;
		$scope.campaignID = ($routeParams.cid) ? parseInt($routeParams.cid) : 0;
		$scope.componentID = ($routeParams.ciid) ? parseInt($routeParams.ciid) : 0;
		$scope.milestoneID = ($routeParams.mid) ? parseInt($routeParams.mid) : 0;
		$scope.contributionID = ($routeParams.coid) ? parseInt($routeParams.coid) : 0;
		$scope.user = localStorageService.get('user');

		$scope.serverBaseUrl = localStorageService.get("serverBaseUrl");
		$scope.etherpadServer = localStorageService.get("etherpadServer");

		console.log("API Server = " + $scope.serverBaseUrl);
		console.log("Etherpad Server = " + $scope.etherpadServer);
	}
	/**
	 * Returns the current assembly in local storage if its ID matches with the requested ID on the route
	 * If the route ID is different, updates the current assembly in local storage
	 * @param aID id of requested assembly in route
	 * @param assemblies list of assemblies that belong to the user
	 * @param localStorageService service to access the local web storage
	 * @returns assembly
	 */
	function setCurrentAssembly($scope, localStorageService) {
		$scope.assembly = localStorageService.get('currentAssembly');
		if($scope.assembly === null || $scope.assembly.assemblyId != $scope.assemblyID) {
			var res = Assemblies.assembly($scope.assemblyID).get();
			res.$promise.then(function(data) {
				$scope.assembly = data;
				localStorageService.set("currentAssembly", $scope.assembly);
			});
		} else {
			console.log("Route assembly ID is the same as the current assembly in local storage: "+$scope.assembly.assemblyId);
		}
	}


	/**
	 * Returns the current campaign in local storage if its ID matches with the requested ID on the route
	 * If the route ID is different, updates the current campaign in local storage
	 * @param cID id of requested campaigns in route
	 * @param campaign list of campaigns that belong to assemblies of the user
	 * @param localStorageService service to access the local web storage
	 * @returns assembly
	 */
	function setCurrentCampaign($scope, localStorageService) {
		$scope.campaign = localStorageService.get('currentCampaign');
		if($scope.campaign === null || $scope.campaign.campaignId != $scope.campaignID) {
			var res = Campaigns.campaign($scope.assemblyID, $scope.campaignID).get();
			res.$promise.then(function(data) {
				$scope.campaign = data;
				localStorageService.set("currentCampaign", $scope.campaign);
				setCurrentComponent($scope,localStorageService);
				setCurrentMilestone($scope,localStorageService);
				setContributionAndGroup($scope,localStorageService);
				setupDaysToDeadline();
			});
		} else {
			console.log("Route campaign ID is the same as the current campaign in local storage: "+$scope.campaign.campaignId);
			setCurrentComponent($scope,localStorageService);
			setCurrentMilestone($scope,localStorageService);
			setContributionAndGroup($scope,localStorageService);
			setupDaysToDeadline();
		}
	}

	/**
	 * Sets the current component in local storage if its ID matches with the requested ID on the route
	 * If the route ID is different, updates the current component in local storage
	 * @param ciID id of requested component in route
	 * @param component list of components that belong to components of the current campaign
	 * @param localStorageService service to access the local web storage
	 * @returns assembly
	 */
	function setCurrentComponent($scope, localStorageService) {
		$scope.components = $scope.campaign.components;
		if ($scope.componentID === null || $scope.componentID===0) {
			$scope.component = $scope.components[0];
			$scope.componentID = $scope.component.componentInstanceId;
			localStorageService.set("currentComponent", $scope.component );
			console.log("Setting current component to: "+ $scope.component.title );

		} else {
			$scope.component = localStorageService.get('currentComponent');
			if($scope.component === null || $scope.component.componentInstanceId != $scope.componentID) {
				$scope.components.forEach(function(entry) {
					if(entry.componentInstanceId === $scope.componentID) {
						localStorageService.set("currentComponent", entry);
						$scope.component = entry;
						console.log("Setting current component to: " + entry.componentInstanceId);
					}
				});
			} else {
				console.log("Route component ID is the same as the current component in local storage: "+$scope.component.componentInstanceId);
			}
		}
	}


	/**
	 * Returns the current milestone in local storage if its ID matches with the requested ID on the route
	 * If the route ID is different, updates the current milestone in local storage
	 * @param mID id of requested milestone in route
	 * @param milestone list of milestones that belong to milestones of the current component
	 * @param localStorageService service to access the local web storage
	 * @returns milestone
	 */
	function setCurrentMilestone($scope, localStorageService) {
		$scope.milestones = $scope.component.milestones;
		if ($scope.milestoneID === null || $scope.milestoneID === 0) {
			$scope.milestone = $scope.milestones[0];
			$scope.milestoneID = $scope.milestone.componentInstanceMilestoneId;
			localStorageService.set("currentMilestone", $scope.milestone);
			console.log("Setting current milestone to: "+$scope.milestone.title);
		} else {
			$scope.milestone = localStorageService.get('currentMilestone');
			if($scope.milestone === null || $scope.milestone.componentInstanceMilestoneId != $scope.milestoneID) {
				$scope.milestones.forEach(function(entry) {
					if(entry.componentInstanceMilestoneId === $scope.milestoneID) {
						localStorageService.set("currentMilestone", entry);
						$scope.milestone = entry;
						console.log("Setting current milestone to: " + entry.title);
					}
				});
			} else {
				console.log("Route milestone ID is the same as the current milestone in local storage");
			}
		}
	}

	function setContributionAndGroup($scope, localStorageService) {
		var res = Contributions.contribution($scope.assemblyID, $scope.contributionID).get();
		res.$promise.then(function(data) {
			$scope.contribution = data;
			localStorageService.set("currentContribution", $scope.contribution);
			$scope.themes = $scope.contribution.themes;
			$scope.comments = $scope.contribution.comments;
			$scope.stats = $scope.contribution.stats;
			$scope.workingGroup = {};
			if($scope.contribution.responsibleWorkingGroups!=null && $scope.contribution.responsibleWorkingGroups!=undefined) {
				$scope.workingGroup = $scope.contribution.responsibleWorkingGroups[0];
			}
			// Check Authorship
			// 1. Check if user is in the list of authors
			$scope.userIsAuthor = Contributions.verifyAuthorship($scope.user, $scope.contribution);
			// 2. If is not in the list of authorships, check if the user is member of one of the responsible groups
			if(!$scope.userIsAuthor && $scope.workingGroup.groupId) {
				var authorship = Contributions.verifyGroupAuthorship($scope.user, $scope.contribution, $scope.workingGroup).get();
				authorship.$promise.then(function(response){
					if (response.responseStatus === "OK") {
						$scope.userIsAuthor  = true;
					}
				});
			}

			if($scope.contribution.extendedTextPad) {
				$scope.etherpadReadOnlyUrl = Etherpad.embedUrl($scope.contribution.extendedTextPad.readOnlyPadId);
				var etherpadRes = Etherpad.getReadWriteUrl($scope.assemblyID,$scope.contributionID).get();
				etherpadRes.$promise.then(function(pad){
					$scope.etherpadReadWriteUrl = Etherpad.embedUrl(pad.padId);
				});
			}
			console.log("Loading {assembly,campaign,component,milestone,contribution}: "
				+$scope.assembly.assemblyId+", "
				+$scope.campaign.campaignId+", "
				+$scope.component.componentInstanceId+", "
				+$scope.milestone.componentInstanceMilestoneId+", "
				+$scope.contribution.contributionId
			);

			console.log("Loading {# of components, # of components}: "
				+$scope.components.length+", "
				+$scope.milestones.length
			);

		});
	}

	function setupDaysToDeadline() {
		// Days, hours, minutes to end date of this component phase
		var endDate = moment($scope.component.endDate, 'YYYY-MM-DD HH:mm:ss');
		var now = moment();
		var diff = endDate.diff(now, 'minutes');
		$scope.minutesToDue = diff%60;
		$scope.hoursToDue = Math.floor(diff/60) % 24;
		$scope.daysToDue = Math.floor(Math.floor(diff/60) / 24);

		// Days, hours, minutes to end date of this milestone stage
		var mStartDate = moment($scope.milestone.start, 'YYYY-MM-DD HH:mm:ss');
		var mDays = $scope.milestone.days;

		$scope.milestoneStarted = mStartDate.isBefore(now);
		if($scope.milestoneStarted) {
			mDiff = now.diff(mStartDate, 'days');
			$scope.mDaysToDue = $scope.milestone.days - mDiff;

		} else {
			mDiff = mStartDate.diff(now, 'days');
			$scope.mDaysToDue = mDiff;
		}
		$scope.themes= [];
		angular.forEach($scope.component.contributions, function(contribution){
			angular.forEach(contribution.themes, function(theme) {
				var isInList = false;
				angular.forEach($scope.themes, function(actualTheme) {
					if(theme.title === actualTheme.title){
						isInList = true;
					}
				});
				if(isInList === false) {
					$scope.themes.push(theme);
				}
			});
		});
	}
});

appCivistApp.controller('CommentsController', function($scope, $http, $routeParams, localStorageService,
													   Contributions) {
	init();
	initializeNewReplyModel();

	function init() {
		$scope.orderProperty = 'creation';
		$scope.orderReverse = true;
		// TODO: read replies enabled from configurations
		$scope.replyEnabled = true;
		$scope.replyBoxIsOpen = false;

		// Scope Functions
		$scope.orderComments = function (property) {
			if($scope.orderProperty = property) {
				$scope.orderReverse = !$scope.orderReverse;
			}
		}

		$scope.random = function() {
			return 0.5 - Math.random();
		}

		$scope.openReplyBox = function () {
			$scope.replyBoxIsOpen = true;
		}

		$scope.closeReplyBox = function () {
			$scope.replyBoxIsOpen = false;
		}

	}

	function initializeNewReplyModel() {
		$scope.newReply = Contributions.defaultNewContribution();
		$scope.newReply.type = "COMMENT";
	}
});

appCivistApp.controller('ContributionVotesCtrl', function($scope, $http, $routeParams, localStorageService,
														  Contributions ) {
	init();

	function init() {
		$scope.votes = $scope.contribution.stats.points;
		$scope.upVote = function () {
			$scope.contribution.stats.ups+=1;
			var stats = $scope.contribution.stats;
			var voteRes = Contributions.updateStats(stats.contributionStatisticsId).update(stats);
			voteRes.$promise.then(
					function (newStats) {
						$scope.contribution.stats = newStats;
						$scope.votes = $scope.contribution.stats.points;
					}
			);
		};
		$scope.downVote = function () {
			$scope.contribution.stats.downs+=1;
			var stats = $scope.contribution.stats;
			var voteRes = Contributions.updateStats(stats.contributionStatisticsId).update(stats);
			voteRes.$promise.then(
					function (newStats) {
						$scope.contribution.stats = newStats;
						$scope.votes = $scope.contribution.stats.points;
					});
		};
	}


});

appCivistApp.controller('ContributionDirectiveCtrl', function($scope, $routeParams, $uibModal, $location,
															  localStorageService, Contributions) {

	init();

	function init() {

		if(!$scope.contribution.comments) {
			$scope.contribution.comments = [];
		}

		$scope.selectContribution = function(contribution){
			$scope.$root.$emit('contribution:selected', contribution);
		}

		$scope.openContributionModal = function(contribution,size) {
			if(!$scope.inModal) {
				var modalInstance = $uibModal.open({
					animation: true,
					templateUrl: 'app/partials/contributions/contribution/contributionView.html',
					controller: 'ContributionModalCtrl',
					size: 'lg',
					resolve: {
						contribution: function () {
							return $scope.contribution;
						},
						assemblyID: function () {
							return $scope.assemblyID;
						},
						campaignID: function () {
							return $scope.campaignID;
						},
						componentID: function () {
							return $scope.componentID;
						},
						milestoneID: function () {
							return $scope.milestoneID;
						}
					}
				});

				modalInstance.result.then(function () {
					console.log('Closed contribution modal');
				}, function () {
					console.log('Modal dismissed at: ' + new Date());
				});
			}
		};
	}

});

/**
 * Functions common to all Contribution Controllers
 *
 */

function createNewContribution(newContribution, targetSpaceId, targetSpace, response, modalInstance, Contributions) {
	postingContributionFlag = true;
	if (!newContribution.title || !newContribution.title === "") {
		var maxlength = 250;
		var trimlength = maxlength;
		if(newContribution.text.length < maxlength) {
			trimlength = newContribution.text.length;
		}
		newContribution.title = newContribution.text.substring(0, trimlength);
	}

	// If the target space is undefined, it means it was empty an this contribution is the first
	if (!targetSpace) {
		targetSpace = [];
	}

	removeNonSelectedThemes(newContribution.themes);

	var newContributionRes = Contributions.contributionInResourceSpace(targetSpaceId).save(newContribution);
	newContributionRes.$promise.then(
			function (data) {
				newContribution = data;
				targetSpace.unshift(data);
				response.hasErrors = false;
				response.touched = !response.touched;
				if(modalInstance)
					modalInstance.close(newContribution);
				postingContributionFlag = false;
			},
			function (error) {
				console.log("Error creating the contribution: " + angular.toJson(error.statusText));
				response.hasErrors = true;
				response.errors = error;
				response.touched = !response.touched;
				postingContributionFlag = false;
			}
	);
}

function clearNewContributionObject(newContribution, Contributions){
	console.log("Cleaning contribution");
	var cType = newContribution.type;
	newContribution = Contributions.defaultNewContribution();
	newContribution.type = cType;
	newContribution.text = "";
}

function addAttachmentToContribution(newContribution, attachment) {
	// POST attachment to IMGUR
	// ADD to attachments array in Contributions
	newContribution.attachments.push(attachment);
}

function removeNonSelectedThemes(themes) {
	if(themes) {
		for (var i = 0; i < themes.length; i+=1) {
		if(!themes[i].selected) {
			themes.splice(i,1);
		}
	}
	}
}