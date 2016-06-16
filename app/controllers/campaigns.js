appCivistApp.controller('CampaignListCtrl', function($scope, $routeParams,$resource, $location, Campaigns, loginService,
													 localStorageService, $translate, logService) {
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

/**
 * CreateCampaignCtrl - controls the logic for creating a campaign, managing its components and milestones
 * TODO: needs a complete re-engineering to make it much more simple
 * - The complicated part, as it is now, is the workflow of components with their associated milestones.
 * - As it is, it was done to support a generic list of components, but we actually just have a fixed list
 * - Simplify the componen-milestone component to make it clear which milestones signals the start date of the component
 * - Also, intead of using array for components and milestones, we need to have associated dictionaries/hashtables
 *   to minimize the time of search/retrieve procedures.
 * - Right now, this is all over the place
 * - Also, we need to replace the Milestones and Component config views to follow a more Question/Answer walktrough
 *   style
 */
appCivistApp.controller('CreateCampaignCtrl', function($scope, $sce, $http, $templateCache, $routeParams,
													   $resource, $location, $timeout, localStorageService,
													   Campaigns, Assemblies, Components, Contributions,
													   moment, modelFormatConfig, $translate) {

	init();

	function init() {
		initScopeFunctions();
		initScopeContent();
		initializeNewCampaignModel();
		setListOfLinkedAssemblies();
	}

	function initScopeFunctions () {
		$scope.changeCampaignTemplate = function(template) {
			if(template.value==="LINKED") {
				$scope.newCampaign.proposalComponents[3].enabled=true;
				$scope.newCampaign.proposalComponents[4].enabled=true;
				$scope.newCampaign.proposalComponents[5].enabled=true;
			} else {
				$scope.newCampaign.useLinkedCampaign=false;
				$scope.newCampaign.proposalComponents[1].enabled=true;
				$scope.newCampaign.proposalComponents[2].enabled=true;
				$scope.newCampaign.proposalComponents[3].enabled=false;
				$scope.newCampaign.proposalComponents[4].enabled=false;
				$scope.newCampaign.proposalComponents[5].enabled=false;
				$scope.newCampaign.proposalComponents[6].enabled=true;
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
					if(component.title === 'Deliberation') {
						$scope.newCampaign.linkedComponents[0] = component;
					} else if(component.title === 'Voting') {
						$scope.newCampaign.linkedComponents[1] = component;
					}else if(component.title === 'Implementation') {
						$scope.newCampaign.linkedComponents[2] = component;
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
					if(component.title === 'Implementation') {
						$scope.newCampaign.linkedComponents[2] = $scope.newCampaign.linkedCampaign.campaign.components[i];
					}
				}
			}

			var linkedDeliberation = $scope.newCampaign.linkedComponents[0];
			var linkedVoting = $scope.newCampaign.linkedComponents[1];
			var linkedImplementation = $scope.newCampaign.linkedComponents[2];

			if(linkedDeliberation)
				$scope.newCampaign.proposalComponents[3].componentId = linkedDeliberation.componentId;
			if(linkedVoting)
				$scope.newCampaign.proposalComponents[4].componentId = linkedVoting.componentId;
			if(linkedImplementation)
				$scope.newCampaign.proposalComponents[5].componentId = linkedImplementation.componentId;
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
		};
	}

	function initScopeContent () {
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
			info.configEnableUpDownVote = "Enable up-votes and down-votes on contributions"; 
			localStorageService.set("help", info);
		}

		$scope.errors = [];
		$scope.templateErrors = [];
		$scope.componentErrors = [];
		$scope.campaigns = [];
		$scope.templateOptions = [
			{
				description : "Yes, link to another campaign and use its template", 
				value: "LINKED",
				subTemplateTitle: "Select a campaign from the list or search by name"
			},
			{
				description : "No, use a predefined template", 
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

	}

	/**
	 * Initialize the model for the New Campaign with default values
	 */
	function initializeNewCampaignModel() {
		$scope.newCampaign = Campaigns.defaultNewCampaign();
		$scope.newCampaign.template = $scope.templateOptions[1];
		$scope.newCampaign.proposalComponents = Components.defaultProposalComponents();
		$scope.newCampaign.enableBudget="yes";
		$scope.newCampaign.supportingComponents = Components.defaultSupportingComponents();
		$scope.newCampaign.milestones = Components.defaultProposalComponentMilestones();
		$scope.newCampaign.linkedComponents = [];
		initializeMilestonesTimeframe();
	}

	/**
	 * Initializes the timeframe models for milestones
	 */
	function initializeMilestonesTimeframe() {
		$scope.newCampaign.campaignTimeframeInMonths=1;
		$scope.newCampaign.campaignTimeframeInDays = 32;
		$scope.newCampaign.campaignTimeframeStartDate = moment().local().toDate();
		$scope.newCampaign.triggerTimeframeUpdate = false;
		$scope.newCampaign.noOverlapping = false;
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
		var start = moment($scope.newCampaign.milestones[0].date);
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
		newCampaign.title = $scope.newCampaign.goal; // campaign and goal are now the same, title will be removed from API
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
				// TODO: change in API "start" to just "date"
				m.start = m.date;
				// TODO: remove days from milestones s
				//if (i!=(milestones.length-1))
				//	m.days = duration(moment(m.date),moment(milestones[i+1])).days;
				//else
				//	m.days = 0;
				components[m.componentIndex].milestones.push(m);

				if(m.type==="START") {
					// Set component start date to the the date of the first milestone of type "START"
					if (components[m.componentIndex].startDate) {
						var milestoneIsBefore = moment(m.date).isBefore(components[m.componentIndex].startDate);
						components[m.componentIndex].startDate =
								milestoneIsBefore ?
										m.date : components[m.componentIndex].startDate;
					} else {
						components[m.componentIndex].startDate = m.date;
					}
				} else if(m.type==="END") {
					// Set component end date to the the date of last milestone of type "END"
					if (components[m.componentIndex].endDate) {
						var milestoneIsAfter = moment(m.date).isAfter(components[m.componentIndex].endDate);
						components[m.componentIndex].endDate =
								milestoneIsAfter ?
										m.date : components[m.componentIndex].endDate;
					} else {
						components[m.componentIndex].endDate = m.date;
					}
				}
				// Make sure date is in format "YYYY-MM-DD HH:mm"
				m.date = moment(m.date).format("YYYY-MM-DD HH:mm");
			}

			for (var i = 0; i<components.length; i+=1) {
				var component = components[i];
				if((component.enabled && component.active)||(component.enabled && component.linked)) {
					newCampaign.components.push(component);
				}
				// Make sure start dates are not null
				component.startDate = component.startDate ?
						component.startDate : i-1>0 ?
						components[i-1].endDate : today().toDate();

				component.endDate = component.endDate ?
						component.endDate : i+1<components.length ?
						components[i+1].startDate : moment(component.startDate).add(30,"days");

				// Make sure date is in format "YYYY-MM-DD HH:mm a z"
				component.startDate = moment(component.startDate).format("YYYY-MM-DD HH:mm");
				component.endDate = moment(component.endDate).format("YYYY-MM-DD HH:mm");
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
														  localStorageService, Assemblies, WorkingGroups, Campaigns,
														  Contributions, FlashService, $translate, $filter, moment,
														  Ballot, Candidate, VotesByUser, NewBallotPaper, BallotPaper,
                                                          logService, usSpinnerService, $timeout, $window, Memberships){

	init();

	function init() {
		initScopeFunctions();
		initScopeContent();
		setCurrentAssembly($scope, localStorageService);
		setCurrentCampaign($scope, localStorageService);
	}

	function initScopeContent(){
		$scope.user = localStorageService.get("user");
		if ($scope.user && $scope.user.language)
			$translate.use($scope.user.language);
		$scope.assemblyID = ($routeParams.aid) ? parseInt($routeParams.aid) : 0;
		$scope.campaignID = ($routeParams.cid) ? parseInt($routeParams.cid) : 0;
		$scope.componentID = ($routeParams.ciid) ? parseInt($routeParams.ciid) : 0;
		$scope.serverBaseUrl = localStorageService.get("serverBaseUrl");
		$scope.etherpadServer = localStorageService.get("etherpadServer");
		$scope.newComment = $scope.newContribution = Contributions.defaultNewContribution();
		$scope.newContributionResponse = {hasErrors:false};
		$scope.orderProperty = 'creation';
		$scope.orderReverse = true;
        $scope.showVotingResults = false;
        $scope.showVotingResultsBeforeEnd = false;
        $scope.ballotResultsAreAvailable = false;
		$scope.contentTabs = [
			{
				title : 'Brainstorming (issues and suggestions)', 
				tooltip: 'help.tooltip.brainstorming',
				ctype : 'BRAINSTORMING',
				//contentArray : 'contributions',
				showInComponent : {
					'proposal making' : true,
					'deliberation' : true,
					'voting' : true,
					'implementation' : true
				},
				active : true,
			},
			{
				title : 'Working Groups', 
                tooltip: 'help.tooltip.working-groups',
				ctype : 'WORKING_GROUP',
				//contentArray : 'workingGroups',
				showInComponent : {
					'proposal making' : false,
					'deliberation' : false,
					'voting' : false,
					'implementation' : false
				},
				active : false,
			},
			{
				title : 'Proposals', 
                tooltip: 'help.tooltip.proposals',
				ctype : 'PROPOSAL',
				//contentArray : 'contributions',
				showInComponent : {
					'proposal making' : true,
					'deliberation' : true,
					'voting' : true,
					'implementation' : true
				},
				active : false,
			},
			{
				title : 'Winning Proposals', 
                tooltip: 'help.tooltip.winning-proposals',
				ctype : 'PROPOSAL',
				//contentArray : 'winningContributions',
				showInComponent : {
					'proposal making' : false,
					'deliberation' : false,
					'voting' : false,
					'implementation' : true
				},
				active : false,
			},
            {
                title : 'Notes', 
                tooltip: 'help.tooltip.notes',
                ctype : 'NOTE',
                //contentArray : 'winningContributions',
                showInComponent : {
                    'proposal making' : true,
                    'deliberation' : true,
                    'voting' : true,
                    'implementation' : true
                },
                active : false,
            }
		];
        $scope.contentTabsIndex = {
            "brainstorming" : $scope.contentTabs[0],
            "working_groups" : $scope.contentTabs[1],
            "proposals" : $scope.contentTabs[2],
            "winning_proposals" : $scope.contentTabs[3],
            "notes" : $scope.contentTabs[4]
        }
		$scope.showVotingInstructions = false;
		$scope.userIsCoordinator = false;
		$scope.showLinkToBallot = false;

		$scope.membership = localStorageService.get("currentAssemblyMembership");

		if ($scope.membership && $scope.membership.assembly
				&& $scope.membership.assembly.assemblyId === $scope.assemblyID) {
			$scope.membershipRoles = $scope.membership.roles;
			$scope.userIsMember = $scope.membership.status === "ACCEPTED";
			$scope.userIsRequestedMember = $scope.membership.status === "REQUESTED";
			$scope.userIsInvitedMember = $scope.membership.status === "INVITED";
			$scope.userIsCoordinator = $scope.isRightRole("COORDINATOR");
		} else {
			$scope.membership = Memberships.membershipInAssembly($scope.assemblyID, $scope.user.userId).get();
			$scope.membership.$promise.then(userIsMemberSuccess, userIsMemberError);
		}
	}

    /**
     * Functions that are available to be called from view partials
     */
	function initScopeFunctions(){
		$scope.getEtherpadReadOnlyUrl = function (readOnlyPadId) {
			return localStorageService.get("etherpadServer")+"p/"+readOnlyPadId+"?showControls=true&showChat=true&showLineNumbers=true&useMonospaceFont=false";
		};

		$scope.openContributionPage = function(cID, edit)  {
			$location.url("/assembly/"+$scope.assemblyID+"/campaign/"+$scope.campaignID+"/contribution/"+cID+"?edit="+edit);
		};

		$scope.openNewContributionModal = function(size, cType)  {
			if (!cType) cType = "BRAINSTORMING";
			var modalInstance = $uibModal.open({
				animation: true,
				templateUrl: '/app/partials/contributions/newContributionModal/newContributionModal.html',
				controller: 'NewContributionModalCtrl',
				size: size,
				resolve: {
					assembly: function () {
						return $scope.assembly;
					},
					campaign: function () {
						return $scope.campaign;
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

            var createdContributionType = cType;
			modalInstance.result.then(function (newContribution) {
				$scope.newContribution = newContribution;
				console.log('New Contribution with Title: ' + newContribution.title);
                if(createdContributionType==="PROPOSAL") {
                    $scope.contentTabsIndex["brainstorming"].active=false;
                    $scope.contentTabsIndex["proposals"].active=true;
                    $scope.contentTabsIndex["notes"].active=false;
                } else if (createdContributionType==="NOTE") {
                    $scope.contentTabsIndex["brainstorming"].active=false;
                    $scope.contentTabsIndex["proposals"].active=false;
                    $scope.contentTabsIndex["notes"].active=true;
                } else {
                    $scope.contentTabsIndex["brainstorming"].active=true;
                    $scope.contentTabsIndex["proposals"].active=false;
                    $scope.contentTabsIndex["notes"].active=false;
                }
			}, function () {
				console.log('Modal dismissed at: ' + new Date());
			});

			if (cType="PROPOSAL") {
				logService.logAction("CREATING_PROPOSAL");
			} else if (cType="BRAINSTORMING") {
				logService.logAction("CREATING_CONTRIBUTION");
			}
		};

		$scope.orderContributions = function(property) {
			if($scope.orderProperty === property) {
				$scope.orderReverse = !$scope.orderReverse;
			} else if (property === 'random') {
				$scope.orderProperty = $scope.random;
		    } else {
				$scope.orderProperty = property;
			}
		};

		$scope.random = function(){
			return 0.5 - Math.random();
		};

		$scope.filterContributionsByTheme = function (t) {
			if (t==="all") {
				$scope.campaignContributionThemeFilter = "";
			} else {
				$scope.campaignContributionThemeFilter = t.title;
			}
		}

		$scope.isButtonDisabled = function (button) {
			return $scope.disableButton[button];
		}

        $scope.showFinalResults = function () {
            $scope.showVotingResults = !$scope.showVotingResults;
        };

        $scope.startSpinner = function(){
            $(angular.element.find('[spinner-key="spinner-1"]')[0]).addClass('spinner-container');
            usSpinnerService.spin('spinner-1');
        }

        $scope.stopSpinner = function(){
            usSpinnerService.stop('spinner-1');
            $(angular.element.find('.spinner-container')).remove();
        }

        $scope.startSpinner();

		$scope.reloadContributionsAndGroups = function() {
			// Get list of contributions from server
			$scope.contributions = Contributions.contributionInResourceSpace($scope.campaign.resourceSpaceId).query();
			$scope.contributions.$promise.then(
					function (data) {
						$scope.contributions = data;
						if(!$scope.contributions){
							$scope.contributions = [];
						}
						$scope.contentTabsIndex["brainstorming"].contentArray = $scope.contributions;
						$scope.contentTabsIndex["proposals"].contentArray = $scope.contributions;
						$scope.contentTabsIndex["notes"].contentArray = $scope.contributions;
					},
					function (error) {
						console.log(JSON.stringify(error));
						FlashService.Error("Error loading campaign contributions from server"); 
					}
			);

			// Get list of working groups from server
			$scope.workingGroups = WorkingGroups.workingGroupsInCampaign($scope.assemblyID, $scope.campaignID).query();
			$scope.workingGroups.$promise.then(
					function (data) {
						$scope.workingGroups = data;
						$scope.contentTabsIndex["working_groups"].contentArray = $scope.workingGroups;
					},
					function (error) {
						console.log(JSON.stringify(error));
						FlashService.Error("Error loading campaign contributions from server"); 
					}
			);

			$timeout(function(){
				$scope.reloadContributionsAndGroups();
			},300000);
		};

		$scope.loadBallotPaper = function() {
			//console.log($scope.campaign, $scope.user.uuid);
			var ballotPaper = BallotPaper.get({uuid: $scope.campaign.bindingBallot, signature: $scope.user.uuid}).$promise;
			ballotPaper.then(function (data) {
				localStorageService.set("voteSignature", $scope.user.uuid);
				$location.url("/ballot/" + $scope.campaign.bindingBallot + "/vote");
			}, function (error) {
				window.appcivist.handleError(error);
			});
		};

		$scope.toggleVotingInstructions = function () {
			$scope.showVotingInstructions = !$scope.showVotingInstructions;
		};

		$scope.changeToTab = function (key) {
			$scope.contentTabsIndex["brainstorming"].active = false;
			$scope.contentTabsIndex["working_groups"].active = false;
			$scope.contentTabsIndex["proposals"].active = false;
			$scope.contentTabsIndex["winning_proposals"].active = false;
			$scope.contentTabsIndex["notes"].active = false;
			$scope.contentTabsIndex[key].active = true;
		};

		$scope.openCampaignBallot = function () {
			$window.open("/#/ballot/"+$scope.campaign.bindingBallot+"/start", "_blank");
		}

		$scope.isRightRole = function(roleName) {
			var result = false;
			angular.forEach($scope.membershipRoles, function(role){
				if(role.name === roleName) {
					result = true;
				}
			});
			return result;
		};

		$scope.toggleLinkToBallot = function () {
			$scope.showLinkToBallot=!$scope.showLinkToBallot;
		}
    }

	function userIsMemberSuccess (data) {
		$scope.membership = data;
		$scope.membershipRoles = $scope.membership.roles;
		$scope.userIsMember = $scope.membership.status === "ACCEPTED";
		$scope.userIsRequestedMember = $scope.membership.status === "REQUESTED";
		$scope.userIsInvitedMember = $scope.membership.status === "INVITED";
		$scope.userIsCoordinator = $scope.isRightRole("COORDINATOR");
	}

	/**
	 * Callback when the membership verification is an error
	 * @param data
	 */
	function userIsMemberError (error) {
		$scope.userIsMember = false;
		$scope.userIsRequestedMember = false;
		$scope.userIsInvitedMember = false;
		$scope.userIsCoordinator = false;
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
		// TODO: find a better way of caching results, explore they use of memoization
		$scope.campaign = null;
		$scope.loadedLocally = true;
		if(!$scope.campaign || $scope.campaign.campaignId != $scope.campaignID) {
			$scope.loadedLocally = false;
			var res = Campaigns.campaign($scope.assemblyID, $scope.campaignID).get(); // GET /assembly/:aid/campaign/:cid
			res.$promise.then(function(data) {
				$scope.campaign = data;
				localStorageService.set("currentCampaign", $scope.campaign);
                // now that we have a campaign, process its components, milestones, contributions and ballots
				setCurrentComponentAndMilestones($scope,localStorageService);
				setMilestonesMap();
                $scope.stopSpinner();
                setContributionsAndGroups($scope,localStorageService);
				ballotInit($scope, localStorageService);
			});
		} else {
			console.log("Route campaign ID is the same as the current campaign in local storage: "+$scope.campaign.campaignId);
            // now that we have a campaign, process its components, milestones, contributions and ballots
			setCurrentComponentAndMilestones($scope,localStorageService);
			setMilestonesMap();
            $scope.stopSpinner();
			setContributionsAndGroups($scope,localStorageService);
			ballotInit($scope, localStorageService);
		}
		logService.logAction("READ_CAMPAIGN");
	}

    /**
     * Read User's BallotPaper related to the campaign binding ballot
     * Read BallotResults related to the campaign binding ballot
     * @param $scope
     * @param localStorageService
     */
    function ballotInit($scope, localStorageService) {
        var ballotId = $scope.campaign.bindingBallot; // campaign binding ballot's uuid
        var userId = $scope.user.uuid; // user's uuid is also the signature used for voting by logged in users

		$scope.ballotUrl = $location.protocol()+"://"+$location.host()+"/#/ballot/"+$scope.campaign.bindingBallot+"/start";

		// Read the current results of the voting
        $scope.campaign.ballotResults = Ballot.results({uuid: $scope.campaign.bindingBallot}).$promise;
        $scope.campaign.ballotResults.then(
            function (data) {
                $scope.campaign.ballotResults = data;
                $scope.ballotResultsAreAvailable = true;
            },
            function (error) {
                $scope.campaign.ballotResults = null;
                $scope.ballotResultsAreAvailable = false;
            }
        );

        // User binding votes
        $scope.listOfVotesByUser = {};
        $scope.candidatesIndex = {};
        $scope.campaign.ballotPaper = {};

        // Read user's binding votes
        var userVotes = VotesByUser.getVotes(ballotId, userId).votes().$promise;
        userVotes.then(function (data) {
            $scope.listOfVotesByUser = data.vote.votes;
            $scope.candidatesIndex = data.ballot.candidatesIndex;
            $scope.campaign.ballotPaper = data;
        }, function (error) {
            if (error.status == "400" || error.status == "404") { // no votes under this signature
                var newBallot = NewBallotPaper.ballot(ballotId).save({vote: {signature: userId}}).$promise;
            }
        });
    }

	/**
	 * Sets the current component in local storage if its ID matches with the requested ID on the route
	 * If the route ID is different, updates the current component in local storage
	 * @param ciID id of requested component in route
	 * @param component list of components that belong to components of the current campaign
	 * @param localStorageService service to access the local web storage
	 * @returns assembly
	 */
	function setCurrentComponentAndMilestones($scope, localStorageService) {
		$scope.components = $scope.campaign.components;
		$scope.milestones = localStorageService.get("currentMilestones");
		$scope.buildMilestones = false;
		if (!$scope.loadedLocally || !$scope.milestones) {
			$scope.milestones = [];
			$scope.buildMilestones = true;
		}

		if ($scope.components && ($scope.componentID === null || $scope.componentID === 0)) {
			// check which component is the current
			for(var i=0; i<$scope.components.length; i++) {
				var c = $scope.components[i];

				// add milestones of component to array of milestones
				if ($scope.buildMilestones) $scope.milestones = $scope.milestones.concat(c.milestones);

				// if a $scope.component has not been selected yet, check if this component (c) is current
				if (!$scope.component) {
					var startMoment = moment(c.startDate, 'YYYY-MM-DD HH:mm');
					var endMoment = moment(c.endDate, 'YYYY-MM-DD HH:mm');
					//, and we are in the right dates,
					// this component to current
					if (moment().local().isBetween(startMoment, endMoment)) {
						console.log("=> Today is in this date range! Choosing as current " + c.title);
						$scope.component = c;
					}
				}
			}
			if (!$scope.component) {
				$scope.component = $scope.components[$scope.components.length-1];
			}
			$scope.componentID = $scope.component.componentId;
			localStorageService.set("currentComponent", $scope.component);
			console.log("Setting current component to: "+ $scope.component.title );
		} else if ($scope.components) {
			$scope.component = localStorageService.get('currentComponent');
            if ($scope.component === null || $scope.component.componentId != $scope.componentID || $scope.buildMilestones) {
                $scope.components.forEach(function(entry) {
                    // add milestones of component to array of milestones
                    if ($scope.buildMilestones) $scope.milestones = $scope.milestones.concat(entry.milestones);

                    if ($scope.component === null || $scope.component.componentId != $scope.componentID) {
                        if(entry.componentId === $scope.componentID) {
                            localStorageService.set("currentComponent", entry);
                            $scope.component = entry;
                            console.log("Setting current component to: " + entry.componentId);
                        }
                    }
                });
            } else {
                console.log("Route component ID is the same as the current component in local storage: "+$scope.component.componentId);
            }
		}
		if ($scope.buildMilestones) {
			localStorageService.set("currentMilestones", $scope.milestones);
		}

		$scope.enableVoting = false;
		if ($scope.component && $scope.component.key!="Proposalmaking") {
            $scope.contentTabsIndex["brainstorming"].active=false;
			$scope.contentTabsIndex["proposals"].active=true;
		} else {
            $scope.contentTabsIndex["brainstorming"].active=true;
            $scope.contentTabsIndex["proposals"].active=false;
        }
	}

	function setMilestonesMap () {
		if ($scope.buildMilestones && $scope.milestones) {
			$scope.milestonesMap = [];
            for (var i = 0; i< $scope.milestones.length; i++) {
                var m = $scope.milestones[i];
                $scope.milestonesMap[m.key] = m;
            }
			localStorageService.set("currentMilestonesMap", $scope.milestonesMap);
		} else {
			$scope.milestonesMap = localStorageService.get("currentMilestonesMap");
		}

		var campaignStart = moment($scope.campaign.startDate, 'YYYY-MM-DD HH:mm');
		var brainstormingEnd = $scope.milestonesMap['end_brainstorming'] ?
				moment($scope.milestonesMap['end_brainstorming'].date, 'YYYY-MM-DD HH:mm') : null;
		var wGroupFormationEnd = $scope.milestonesMap['end_wgroups_creation'] ?
				moment($scope.milestonesMap['end_wgroups_creation'].date, 'YYYY-MM-DD HH:mm') : null;
		var proposalsEnd = $scope.milestonesMap['end_proposals'] ?
				moment($scope.milestonesMap['end_proposals'].date, 'YYYY-MM-DD HH:mm') : null;
		var voteStart = $scope.milestonesMap['start_voting'] ?
				moment($scope.milestonesMap['start_voting'].date, 'YYYY-MM-DD HH:mm') : null;
		var voteEnd = $scope.milestonesMap['end_voting'] ?
				moment($scope.milestonesMap['end_voting'].date, 'YYYY-MM-DD HH:mm') : null;
		var assessmentEnd = $scope.milestonesMap['end_assessment'] ?
				moment($scope.milestonesMap['end_assessment'].date, 'YYYY-MM-DD HH:mm') : null;

		$scope.disableButton = {
				contribute: !moment().local().isBetween(campaignStart, brainstormingEnd),
				newGroup: !moment().local().isBetween(campaignStart, wGroupFormationEnd),
				newProposal: !moment().local().isBetween(campaignStart, proposalsEnd),
				vote: !moment().local().isBetween(voteStart, voteEnd),
                results: !moment().local().isAfter(voteStart),
				assess: !moment().local().isBetween(campaignStart,assessmentEnd),
				editCampaign: $scope.userIsMember
					&& $scope.assembly.profile != undefined
					&& ( ( $scope.assembly.profile.managementType === "OPEN")
							|| ( $scope.isRightRole("COORDINATOR") )
				       )

			};

		$scope.enableVoting = !$scope.disableButton.vote;
	}

	function setContributionsAndGroups($scope, localStorageService) {
		if ($scope.loadedLocally) {
			// Get list of contributions from server
			$scope.contributions = Contributions.contributionInResourceSpace($scope.campaign.resourceSpaceId).query();
			$scope.contributions.$promise.then(
					function (data) {
						$scope.contributions = data;
						if(!$scope.contributions){
							$scope.contributions = [];
						}
                        $scope.contentTabsIndex["brainstorming"].contentArray = $scope.contributions;
						$scope.contentTabsIndex["proposals"].contentArray = $scope.contributions;
                        $scope.contentTabsIndex["notes"].contentArray = $scope.contributions;
					},
					function (error) {
						console.log(JSON.stringify(error));
						FlashService.Error("Error loading campaign contributions from server"); 
					}
			);
		} else {
			$scope.contributions = $scope.campaign.contributions;
			if(!$scope.contributions){
				$scope.contributions = [];
			}
            $scope.contentTabsIndex["brainstorming"].contentArray = $scope.contributions;
            $scope.contentTabsIndex["proposals"].contentArray = $scope.contributions;
            $scope.contentTabsIndex["notes"].contentArray = $scope.contributions;
		}

		if ($scope.loadedLocally) {
			// Get list of working groups from server
			$scope.workingGroups = WorkingGroups.workingGroupsInCampaign($scope.assemblyID, $scope.campaignID).query();
			$scope.workingGroups.$promise.then(
					function (data) {
						$scope.workingGroups = data;
						$scope.contentTabsIndex["working_groups"].contentArray = $scope.workingGroups;
					},
					function (error) {
						console.log(JSON.stringify(error));
						FlashService.Error("Error loading campaign contributions from server"); 
					}
			);
		} else {
			$scope.workingGroups = $scope.campaign.workingGroups;
            $scope.contentTabsIndex["working_groups"].contentArray = $scope.workingGroups;
		}


		if ($scope.campaign.ballots && $scope.campaign.ballots.length>0)
			$scope.ballot = $scope.campaign.ballots[0];
		$scope.themes = $scope.campaign.themes;

		console.log("Loading {assembly,campaign,component}: "
			+$scope.assemblyID+", "
			+$scope.campaignID+", "
			+$scope.componentID
		);

		console.log("Loading {# of components, # of milestones}: "
				+$scope.components.length+", "
				+$scope.milestones.length
		);

		$timeout(function(){
			$scope.reloadContributionsAndGroups();
		},300000);
	}
});

appCivistApp.controller('EditCampaignCtrl', function($scope, $controller, $sce, $http, $templateCache, $routeParams,
													   $resource, $location, $timeout, localStorageService,
													   Campaigns, Assemblies, Components, Contributions,
													   moment, modelFormatConfig, $translate, logService){


		angular.extend(this, $controller('CampaignComponentCtrl', {$scope: $scope}));

		init();

		function init() {
			initScopeFunctions();
		}

		function initScopeFunctions () {

			$scope.open = function($event,m) {
				m.calOpened = true;
			};
		}

});
/* Edit Campaign Controller */

// General functions
/**
 * Returns a moment.js object representing Today
 * @returns {*}
 */
function today() {
	return moment().local();
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
