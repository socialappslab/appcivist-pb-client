appCivistApp.controller('CampaignListCtrl', function($scope, $routeParams,$resource, $location, Campaigns, loginService,
													 localStorageService, $translate) {
	$scope.campaigns = [];
	$scope.serverBaseUrl = localStorageService.get("serverBaseUrl");
	$scope.etherpadServer = localStorageService.get("etherpadServer");

	console.log("API Server = " + $scope.serverBaseUrl);
	console.log("Etherpad Server = " + $scope.etherpadServer);
	init();

	function init() {
		$scope.user = localStorageService.get("user");
		if ($scope.user && $scope.user.language)
			$translate.use($scope.user.language);		$scope.campaigns = Campaigns.get();
		$scope.campaigns.$promise.then(function(data) {
			$scope.campaigns = data;
			localStorageService.set("campaigns", $scope.campaigns);
		});
	}
});

appCivistApp.controller('CreateCampaignCtrl', function($scope, $sce, $http, $templateCache, $routeParams,
													   $resource, $location, $timeout, localStorageService,
													   Campaigns, Assemblies, Components, Contributions,
													   moment, modelFormatConfig, $translate) {

	init();
	initializeNewCampaignModel();
	setListOfLinkedAssemblies();

	function init() {
		$scope.user = localStorageService.get("user");
		if ($scope.user && $scope.user.language)
			$translate.use($scope.user.language);
		$scope.forms = {};
		$scope.assemblyID = ($routeParams.aid) ? parseInt($routeParams.aid) : 0;
		$scope.currentStep = 1;
		$scope.prevStep = 2;

		// Campaign creation steps and templates for each step
		$scope.steps = [
			{
				step: 1,
				title: "Campaign description",
				template: "app/partials/campaign/creation/newCampaign1.html",
				info: "",
				active: true,
				disabled: false
			},
			{
				step: 2,
				title: "Campaign milestones",
				template: "app/partials/campaign/creation/newCampaign2.html",
				info: "",
				active: false,
				disabled: false
			},
			{
				step: 3,
				title: "Campaign stages",
				template: "app/partials/campaign/creation/newCampaign3.html",
				info: "",
				active: false,
				disabled: false
			}
		];

		// Setting up help info tooltips
		if ($scope.info === undefined || $scope.info === null) {
			info = $scope.info = helpInfo;
			info.configCommentsInDiscussion = "Enable reply-to comments in discussions";
			info.configCommentsInDiscussion = "Enable up-votes and down-votes on contributions";
			localStorageService.set("help", info);
		}

		$scope.errors = [];
		$scope.templateErrors = [];
		$scope.componentErrors = [];
		$scope.campaigns = [];
		$scope.templateOptions = [
			{
				description : "Link to another campaign and use its template",
				value: "LINKED",
				subTemplateTitle: "Select a campaign from the list or search by name"
			},
			{
				description : "Select a predefined template",
				value: "PREDEFINED",
				subTemplateTitle: "Select a template from the list"
			}
		];
		$scope.dateOptions = {
			formatYear: 'yyyy',
			startingDay: 1
		};
		$scope.oneAtATime = false;
		$scope.section = {};

		// TODO: enable additional tabs only when the first form is valid
		//$scope.$watch("newCampaignForm1.$valid", function(validity) {
		//	if(validity)
		//		$scope.steps[1].disabled = $scope.steps[2].disabled = false;
		//}, true);

		$scope.changeCampaignTemplate = function(template) {
			if(template.value==="LINKED") {
				$scope.newCampaign.proposalComponents[4].enabled=true;
				$scope.newCampaign.proposalComponents[5].enabled=true;
			} else {
				$scope.newCampaign.useLinkedCampaign=false;
				$scope.newCampaign.proposalComponents[2].enabled=true;
				$scope.newCampaign.proposalComponents[3].enabled=true;
				$scope.newCampaign.proposalComponents[4].enabled=false;
				$scope.newCampaign.proposalComponents[5].enabled=false;
			}
		}

		$scope.updateConfigOptionValue = function(config, optionValue) {
			config.value = optionValue.value;
		}

		$scope.checkOption = function(config,option) {
			console.log('Checked: '+option.value+" for config "+config.key);
		}

		$scope.checkParentValue =  function(parent, child) {
			return internalCheckParentValue(parent,child);
		}

		$scope.configIsEnabled = function(config, configs, type) {
			var typeCondition = config.type === type;
			var dependsOfIsUndefined = config.dependsOf === undefined || config.dependsOf === 0 || config.dependsOf === null;
			var dependsOfConfigValueIsSelected = !dependsOfIsUndefined && internalCheckParentValue(configs[config.dependsOf-1],config)
			var result = ( typeCondition && (dependsOfIsUndefined || dependsOfConfigValueIsSelected ) );
			return result;
		}

		$scope.removeError = function (index) {
			$scope.errors.splice(index,1)
		}

		$scope.removeTemplateError = function (index) {
			$scope.templateErrors.splice(index,1)
		}

		/**
		 * Add/removes themes to the list of themes in the newCampaign Model
		 * @param ts
		 */
		$scope.addTheme = function(ts) {
			var themes = ts.split(',');
			themes.forEach(function(theme){
				var addedTheme = {title: theme.trim()};
				$scope.newCampaign.themes.push(addedTheme);
			});
			$scope.themes = "";
		}

		$scope.removeTheme = function(index) {
			$scope.newCampaign.themes.splice(index,1);
		}

		$scope.addExistingTheme = function(ts) {
			var themes = ts.split(',');
			themes.forEach(function(theme){
				var addedTheme = {title: theme.trim()};
				$scope.newCampaign.existingThemes.push(addedTheme);

			});
			$scope.themes = "";
		}

		$scope.removeExistingTheme = function(index) {
			$scope.newCampaign.existingThemes.splice(index,1);
		}

		/**
		 * Add/removes sections to the contributions template of a component
		 * @param section
		 */
		$scope.addContributionTemplateSection = function(section, component) {
			var newSection = {
				title: section.title,
				description: section.description,
				length: section.length
			};
			component.contributionTemplate.push(newSection);
		}

		$scope.removeContributionTemplateSection = function(index, component) {
			component.contributionTemplate.splice(index,1);
		}

		/**
		 * Updates the current and previous step models in the $scope
		 * @param step
		 * @param prevStep
		 */
		$scope.setCurrentStep = function (step, prevStep) {
			privateSetCurrentStep(step,prevStep);
		}

		/**
		 * Populates the list of optional themes according to the linked campaign themes
		 * Additionally, it includes linked components in the new campaign
		 */
		$scope.initializeLinkedCampaignOptionThemes = function(campaign) {
			$scope.campaignThemes = [];
			$scope.newCampaign.linkedCampaign = campaign;
			var linkedCampaignThemes = $scope.newCampaign.linkedCampaign.campaign.themes;
			if (linkedCampaignThemes != undefined && linkedCampaignThemes != null && linkedCampaignThemes.length > 0) {
				for (var i = 0; i < linkedCampaignThemes.length; i += 1) {
					var t = linkedCampaignThemes[i];
					var themeOption = {
						title: t.title,
						selected: true,
						id: t.themeId
					}
					$scope.campaignThemes.push(themeOption);
				}
			}

			if($scope.newCampaign.linkedComponents[0]===undefined) {
				for(var i=0; i<$scope.newCampaign.linkedCampaign.campaign.components.length; i+=1) {
					var component = $scope.newCampaign.linkedCampaign.campaign.components[i];
					if(component.title === 'Voting' || component.title === 'Deliberation') {
						$scope.newCampaign.linkedComponents.push(component);
					}
				}
			} else {
				for(var i=0; i<$scope.newCampaign.linkedCampaign.campaign.components.length; i+=1) {
					var component = $scope.newCampaign.linkedCampaign.campaign.components[i];
					if(component.title === 'Deliberation') {
						$scope.newCampaign.linkedComponents[0] = $scope.newCampaign.linkedCampaign.campaign.components[i];
					}
					if(component.title === 'Voting') {
						$scope.newCampaign.linkedComponents[1] = $scope.newCampaign.linkedCampaign.campaign.components[i];
					}
				}
			}
			$scope.newCampaign.proposalComponents[4].componentId = $scope.newCampaign.linkedComponents[0].componentId;
			$scope.newCampaign.proposalComponents[5].componentId = $scope.newCampaign.linkedComponents[1].componentId;
		}

		/**
		 * Populates the list of optional themes according to the parent assembly
		 */
		$scope.initializeAssemblyOptionThemes = function() {
			$scope.assemblyThemes = [];
			var assemblyThemes = $scope.assembly.themes;
			if (assemblyThemes != undefined && assemblyThemes != null && assemblyThemes.length > 0) {
				for (var i = 0; i < assemblyThemes.length; i += 1) {
					var t = assemblyThemes[i];
					var themeOption = {
						title: t.title,
						selected: true,
						id: t.themeId
					}
					$scope.assemblyThemes.push(themeOption);
				}
			}
		}

		/**
		 * Scope shortcut to refreshing the Timeframe slider models
		 * for milestones
		 * @param months
		 */
		$scope.refreshTimeframe = function(months) {
			privateRefreshTimeframe(months);
		}

		/**
		 * Updates the value of a milestone based on a new date
		 * @param date
		 * @param index
		 */
		$scope.updateMilestoneValue =  function(date, index) {
			var newDate = moment(date);
			var campaignStartDate = moment($scope.campaignTimeframeStartDate);
			var d = duration(campaignStartDate,newDate);
			$scope.newCampaign.milestones[index].date = date;
			$scope.newCampaign.milestones[index].value = d.days;
			$scope.newCampaign.triggerTimeframeUpdate = true;
		}

		/**
		 * Opens or closes the date pickers for each milestone
		 * @param $event
		 * @param m
		 */
		$scope.open = function($event,m) {
			m.calOpened = true;
		};

		$scope.disabled = function(date, mode) {
			return ( mode === 'day' && ( date.getDay() === 0 || date.getDay() === 6 ) );
		};

		/**
		 * Scope function called to create the campaign
		 * or move between stages of the creation process
		 * @param step
		 * @param options
		 */
		$scope.createCampaign = function (step, options) {
			if (!step.disabled) {
				privateCreateCampaign(step.step,options);
			}
		}
	}

	/**
	 * Initialize the model for the New Campaign with default values
	 */
	function initializeNewCampaignModel() {
		$scope.newCampaign = Campaigns.defaultNewCampaign();
		$scope.newCampaign.template = $scope.templateOptions[0];
		$scope.newCampaign.proposalComponents = Components.defaultProposalComponents();
		$scope.newCampaign.supportingComponents = Components.defaultSupportingComponents();
		$scope.newCampaign.linkedComponents = [];
		initializeMilestonesTimeframe();
	}

	/**
	 * Initializes the timeframe models for milestones
	 */
	function initializeMilestonesTimeframe() {
		$scope.newCampaign.campaignTimeframeInMonths=12;
		$scope.newCampaign.campaignTimeframeInDays = 183;
		$scope.newCampaign.campaignTimeframeStartDate = moment().toDate();
		$scope.newCampaign.triggerTimeframeUpdate = false;
		$scope.newCampaign.noOverlapping = true;
		privateRefreshTimeframe(6);
	}

	/**
	 * Non-scope function to update current/previous step models
	 * @param step
	 * @param prevStep
     */
	function privateSetCurrentStep(step,prevStep) {
		if (step!=prevStep) {
			$scope.prevStep = prevStep;
			$scope.currentStep = step;
			$scope.steps[step - 1].active = true;
			$scope.steps[prevStep - 1].active = false;
		}
	}

	/**
	 * Non-scope function to update the timeframe for milestones
	 * @param months
     */
	function privateRefreshTimeframe(months) {
		var start = moment($scope.newCampaign.milestones[0].start);
		var end = moment(start).add(months,'M');
		var d = duration(start, end);
		$scope.newCampaign.campaignTimeframeInDays = d.days;
		$scope.newCampaign.campaignTimeframeEndDate = end.toDate();
		$scope.newCampaign.triggerTimeframeUpdate = true;
		console.log("Trigger Timeframe Update: "+$scope.newCampaign.triggerTimeframeUpdate);
	}

	function updateMilestoneStartDate(newValue, campaignStartDate){
		return moment(campaignStartDate).add(newValue,'d');
	}

	function setListOfLinkedAssemblies() {
		var assembliesRes = Assemblies.linkedAssemblies($scope.assemblyID).query();
		assembliesRes.$promise.then(
				function(assemblies){
					$scope.linkedAssemblies = assemblies;
				},
				function(error){
					$scope.linkedAssemblies = undefined;
					//$scope.templateErrors.push(error);
				}
		);

		var featuredAssembliesRes = Assemblies.featuredAssemblies().query();
		featuredAssembliesRes.$promise.then(
				function(assemblies){
					$scope.assemblies = assemblies;
					for (var i = 0; i < assemblies.length; i += 1) {
						var assembly = assemblies[i];
						var aCampaigns = assembly.campaigns;
						if(aCampaigns!=undefined && aCampaigns !=null) {
							for (var j = 0; j < aCampaigns.length; j += 1) {
								var c = aCampaigns[j];
								$scope.campaigns.push({
									assembly: assembly.name,
									title: c.title,
									value: c.campaignId,
									campaign: c
								});
							}
						}
					}
					$scope.initializeLinkedCampaignOptionThemes($scope.campaigns[0]);

					$scope.assembly = localStorageService.get("currentAssembly");
					if($scope.assembly!=undefined && $scope.assembly!=null && $scope.assembly.assemblyId === $scope.assemblyID) {
						$scope.initializeAssemblyOptionThemes();
					} else {
						var assemblyRes = Assemblies.assembly($scope.assemblyID).get();
						assemblyRes.$promise.then(
								function(a) {
									$scope.assembly = a;
									localStorageService.set("currentAssembly",a);
									$scope.initializeAssemblyOptionThemes();
								},
								function (error) {
									$scope.templateErrors.push(error);
								}
						);
					}
				},
				function(error){
					$scope.templateErrors.push(error);
				}
		);

		var templateRes = Campaigns.templates().query();
		templateRes.$promise.then(
				function(templates){
					$scope.templates = templates;
					$scope.newCampaign.selectedTemplate = $scope.templates[0];
				},
				function(error){
					$scope.templateErrors.push(error);
				}
		);
	}

	function prepareCampaignToCreate() {
		var newCampaign = {};
		newCampaign.title = $scope.newCampaign.title;
		newCampaign.goal = $scope.newCampaign.goal;
		newCampaign.listed = $scope.newCampaign.listed;
		newCampaign.themes = $scope.newCampaign.themes;

		var requiredFields = newCampaign.title!=undefined && newCampaign.goal!=undefined;

		if (requiredFields) {
			var components = $scope.newCampaign.proposalComponents;
			var milestones = $scope.newCampaign.milestones;

			// Setup existing themes
			newCampaign.existingThemes = [];
			addToExistingThemes(newCampaign.existingThemes, $scope.assemblyThemes);

			if ($scope.newCampaign.template.value === 'LINKED') {
				addToExistingThemes(newCampaign.existingThemes, $scope.campaignThemes);
			}

			// setup milestones in components
			// TODO: setup milestones already inside components when creation
			newCampaign.components = [];
			newCampaign.existingComponents = [];
			for (var i = 0; i<milestones.length; i+=1) {
				var m = milestones[i];
				m.start = m.date;
				if (i!=(milestones.length-1))
					m.days = duration(moment(m.date),moment(milestones[i+1])).days;
				else
					m.days = 0;
				components[m.componentIndex].milestones.push(m);
			}

			for (var i = 0; i<components.length; i+=1) {
				var component = components[i];
				if((component.enabled && component.active)||(component.enabled && component.linked)) {
					newCampaign.components.push(component);
				}
			}

			// Setup configurations
			newCampaign.configs = $scope.newCampaign.configs;
			newCampaign.configs[0].value = $scope.newCampaign.config.budget;
			newCampaign.configs[1].value = $scope.newCampaign.config.budgetCurrency;
			newCampaign.configs[2].value = $scope.newCampaign.config.discussionReplyTo;
			newCampaign.configs[3].value = $scope.newCampaign.config.upDownVoting;
		} else {
			newCampaign.error = "Validation Errors in the new Campaign. No title or goal was established";
		}
		return newCampaign;
	}

	function addToExistingThemes(existingThemes, addedThemes) {
		if(addedThemes != undefined && addedThemes != null && addedThemes.length > 0) {
			for (var i = 0; i<addedThemes.length; i+=1) {
				var t = addedThemes[i];
				if (t.selected) {
					existingThemes.push(t);
				}
			}
		}
	}

	function addToExistingComponents(existingComponents, addedComponents, linkedCampaign) {
		if(addedComponents != undefined && addedComponents != null && addedComponents.length > 0
			&& linkedCampaign != undefined && linkedCampaign != null) {
			for (var i = 0; i<addedComponents.length; i+=1) {
				var c = addedComponents[i];
				if(c.linked) {
					c.componentId = getComponentIdByKey(linkedCampaign.campaign.components, c.key);
					if (c.componentId > 0) {
						existingComponents.push(c.componentId);
					}
				}
			}
		}

	}

	function getComponentIdByKey(components, key) {
		for (var i = 0; i<components.length; i+=1) {
			var c = components[i];
			if (c.key === key) {
				return c.componentId;
			}
		}
		return -1;
	}

	function privateCreateCampaign(step,options){
		if (step < 4) {
			privateSetCurrentStep(step,$scope.currentStep);
			if(step === 1 && !options.fastrack) {
				$scope.steps[0].active = true;
				$scope.steps[1].active = false;
			} else if(step === 2 && !options.fastrack) {
				$scope.steps[0].active = false;
				$scope.steps[1].active = true;
			} else {
				$scope.steps[1].active = false;
				$scope.steps[2].active = true;
			}
		} else {
			console.log("Creating Campaign: "+$scope.newCampaign.title);
			var postCampaign = prepareCampaignToCreate();
			if (postCampaign.error === undefined) {
				var campaignRes = Campaigns.newCampaign($scope.assemblyID).save(postCampaign);
				campaignRes.$promise.then(
						function(data) {
							$scope.newCampaign = data;
							console.log("Redirecting to /#/assembly/"+$scope.assemblyID+"/campaign/"+$scope.newCampaign.campaignId);
							$location.url('/assembly/'+$scope.assemblyID+'/campaign/'+$scope.newCampaign.campaignId);
						},
						function(error) {
							console.log("Error in the creation of the Campaign: "+JSON.stringify(error.statusMessage));
						}
				);
			} else {
				$scope.errors.push(postCampaign.error);
				console.log("Error. Could not create the campaign: "+JSON.stringify(postCampaign.error.statusMessage));
				postCampaign.error=undefined;
			}
		}

	}

	function internalCheckParentValue(parent, child) {
		return parent.value === child.dependsOfValue;
	}
});

appCivistApp.controller('CampaignComponentCtrl', function($scope, $http, $routeParams, $location, $uibModal,
														  localStorageService, Assemblies,
														  Campaigns, Contributions, $translate){

	init();

	function init() {
		$scope.user = localStorageService.get("user");
		if ($scope.user && $scope.user.language)
			$translate.use($scope.user.language);
		// 1. Setting up scope ID values
		$scope.assemblyID = ($routeParams.aid) ? parseInt($routeParams.aid) : 0;
		$scope.campaignID = ($routeParams.cid) ? parseInt($routeParams.cid) : 0;
		$scope.componentID = ($routeParams.ciid) ? parseInt($routeParams.ciid) : 0;
		$scope.milestoneID = ($routeParams.mid) ? parseInt($routeParams.mid) : 0;
		$scope.serverBaseUrl = localStorageService.get("serverBaseUrl");
		$scope.etherpadServer = localStorageService.get("etherpadServer");
		$scope.newComment = $scope.newContribution = Contributions.defaultNewContribution();
		$scope.newContributionResponse = {hasErrors:false};
		$scope.orderProperty = 'creation';
		$scope.orderReverse = true;


		$scope.getEtherpadReadOnlyUrl = function (readOnlyPadId) {
			var url = localStorageService.get("etherpadServer")+"p/"+readOnlyPadId+"?showControls=true&showChat=true&showLineNumbers=true&useMonospaceFont=false";
			console.log("Contribution Read Only Etherpad URL: "+url);
			return url;
		};

		$scope.openContributionPage = function(cID, edit)  {
			$location.url("/assembly/"+$scope.assemblyID+"/campaign/"+$scope.campaignID+"/"+$scope.componentID+"/"+$scope.milestoneID+"/"+cID+"?edit="+edit);
		};

		$scope.openNewContributionModal = function(size, cType)  {
			if (!cType) cType = "BRAINSTORMING";
			var modalInstance = $uibModal.open({
				animation: true,
				templateUrl: '/app/partials/contributions/newView/newView.html',
				controller: 'NewContributionModalCtrl',
				size: size,
				resolve: {
					assembly: function () {
						return $scope.assembly;
					},
					campaign: function () {
						return $scope.campaign;
					},
					component: function () {
						return $scope.component;
					},
					milestone: function () {
						return $scope.milestone;
					},
					contributions: function () {
						return $scope.contributions;
					},
					themes: function () {
						return $scope.themes;
					},
					newContribution: function () {
						return $scope.newContribution;
					},
					newContributionResponse: function () {
						return $scope.newContributionResponse;
					},
					cType: function () {
						return cType;
					}
				}
			});

			modalInstance.result.then(function (newContribution) {
				$scope.newContribution = newContribution;
				console.log('New Contribution with Title: ' + newContribution.title);
			}, function () {
				console.log('Modal dismissed at: ' + new Date());
			});
		};

		$scope.orderContributions = function(property) {
			if($scope.orderProperty === property) {
				$scope.orderReverse = !$scope.orderReverse;
			} else {
				$scope.orderProperty = property;
			}
		};

		// TODO: 	improve efficiency by using angularjs filters instead of iterating through arrays
		setCurrentAssembly($scope, localStorageService);
		setCurrentCampaign($scope, localStorageService);
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
				setContributionsAndGroups($scope,localStorageService);
				setupDaysToDue();
			});
		} else {
			console.log("Route campaign ID is the same as the current campaign in local storage: "+$scope.campaign.campaignId);
			setCurrentComponent($scope,localStorageService);
			setCurrentMilestone($scope,localStorageService);
			setContributionsAndGroups($scope,localStorageService);
			setupDaysToDue();
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
			$scope.componentID = $scope.component.componentId;
			localStorageService.set("currentComponent", $scope.component );
			console.log("Setting current component to: "+ $scope.component.title );

		} else {
			$scope.component = localStorageService.get('currentComponent');
			if($scope.component === null || $scope.component.componentId != $scope.componentID) {
				$scope.components.forEach(function(entry) {
					if(entry.componentId === $scope.componentID) {
						localStorageService.set("currentComponent", entry);
						$scope.component = entry;
						console.log("Setting current component to: " + entry.componentId);
					}
				});
			} else {
				console.log("Route component ID is the same as the current component in local storage: "+$scope.component.componentId);
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
			$scope.milestoneID = $scope.milestone.componentMilestoneId;
			localStorageService.set("currentMilestone", $scope.milestone);
			console.log("Setting current milestone to: "+$scope.milestone.title);
		} else {
			$scope.milestone = localStorageService.get('currentMilestone');
			if($scope.milestone === null || $scope.milestone.componentMilestoneId != $scope.milestoneID) {
				$scope.milestones.forEach(function(entry) {
					if(entry.componentMilestoneId === $scope.milestoneID) {
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

	function setContributionsAndGroups($scope, localStorageService) {
		// TODO: always get the list of contributions from server
		var contributionsRes = Contributions.contributionsInCampaignComponent($scope.assemblyID, $scope.campaignID, $scope.componentID).query();
		$scope.contributions = $scope.component.contributions;
		contributionsRes.$promise.then(
				function(data) {
					$scope.component.contributions = data;
					$scope.contributions = $scope.component.contributions;
				},
				function(error) {

				}
		)

		$scope.workingGroups = $scope.campaign.workingGroups;
		$scope.themes = $scope.campaign.themes;
		$scope.displayedContributionType = $scope.milestone.mainContributionType;

		console.log("Loading {assembly,campaign,component,milestone}: "
			+$scope.assemblyID+", "
			+$scope.campaignID+", "
			+$scope.componentID+", "
			+$scope.milestoneID
		);

		console.log("Loading {# of components, # of components}: "
				+$scope.components.length+", "
				+$scope.milestones.length
		);
	}

	function setupDaysToDue() {
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


// General functions
/**
 * Returns a moment.js object representing Today
 * @returns {*}
 */
function today() {
	return moment();
}

/**
 * Calculates the difference in days, minutes and hours between two
 * moments
 * @param start
 * @param end
 * @returns {{days: number, minutes: number, hours: number}}
 */
function duration(start, end) {
	var diff = end.diff(start, 'minutes');
	var minutesToEnd = diff%60;
	var hoursToEnd = Math.floor(diff/60) % 24;
	var daysToEnd = Math.floor(Math.floor(diff/60) / 24);
	return { days: daysToEnd, minutes: minutesToEnd, hours: hoursToEnd};
}