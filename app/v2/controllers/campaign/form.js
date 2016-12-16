(function () {
  'use strict';

  angular
    .module('appCivistApp')
    .controller('v2.CampaignFormCtrl', CampaignFormCtrl);


  CampaignFormCtrl.$inject = [
    '$scope', '$sce', '$http', '$templateCache', '$routeParams',
    '$resource', '$location', '$timeout', 'localStorageService',
    'Campaigns', 'Assemblies', 'Components', 'Contributions',
    'moment', 'modelFormatConfig', '$translate', 'Notify', '$state'
  ];

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
  function CampaignFormCtrl($scope, $sce, $http, $templateCache, $routeParams,
    $resource, $location, $timeout, localStorageService,
    Campaigns, Assemblies, Components, Contributions,
    moment, modelFormatConfig, $translate, Notify, $state) {

    init();

    function init() {
      initScopeFunctions();
      initScopeContent();
      initializeNewCampaignModel();
      setListOfLinkedAssemblies();
    }

    function initScopeFunctions() {
      $scope.changeCampaignTemplate = function (template) {
        if (template.value === "LINKED") {
          $scope.newCampaign.proposalComponents[3].enabled = true;
          $scope.newCampaign.proposalComponents[4].enabled = true;
          $scope.newCampaign.proposalComponents[5].enabled = true;
        } else {
          $scope.newCampaign.useLinkedCampaign = false;
          $scope.newCampaign.proposalComponents[1].enabled = true;
          $scope.newCampaign.proposalComponents[2].enabled = true;
          $scope.newCampaign.proposalComponents[3].enabled = false;
          $scope.newCampaign.proposalComponents[4].enabled = false;
          $scope.newCampaign.proposalComponents[5].enabled = false;
          $scope.newCampaign.proposalComponents[6].enabled = true;
        }
      }

      $scope.updateConfigOptionValue = function (config, optionValue) {
        config.value = optionValue.value;
      }

      $scope.checkOption = function (config, option) {
        console.log('Checked: ' + option.value + " for config " + config.key);
      }

      $scope.checkParentValue = function (parent, child) {
        return internalCheckParentValue(parent, child);
      }

      $scope.configIsEnabled = function (config, configs, type) {
        var typeCondition = config.type === type;
        var dependsOfIsUndefined = config.dependsOf === undefined || config.dependsOf === 0 || config.dependsOf === null;
        var dependsOfConfigValueIsSelected = !dependsOfIsUndefined && internalCheckParentValue(configs[config.dependsOf - 1], config)
        var result = (typeCondition && (dependsOfIsUndefined || dependsOfConfigValueIsSelected));
        return result;
      }

      $scope.removeError = function (index) {
        $scope.errors.splice(index, 1)
      }

      $scope.removeTemplateError = function (index) {
        $scope.templateErrors.splice(index, 1)
      }

      /**
       * Add/removes themes to the list of themes in the newCampaign Model
       * @param ts
       */
      $scope.addTheme = function (ts) {
        var themes = ts.split(',');
        themes.forEach(function (theme) {
          var addedTheme = { title: theme.trim() };
          $scope.newCampaign.themes.push(addedTheme);
        });
        $scope.themes = "";
      }

      $scope.removeTheme = function (index) {
        $scope.newCampaign.themes.splice(index, 1);
      }

      $scope.addExistingTheme = function (ts) {
        var themes = ts.split(',');
        themes.forEach(function (theme) {
          var addedTheme = { title: theme.trim() };
          $scope.newCampaign.existingThemes.push(addedTheme);

        });
        $scope.themes = "";
      }

      $scope.removeExistingTheme = function (index) {
        $scope.newCampaign.existingThemes.splice(index, 1);
      }

      /**
       * Add/removes sections to the contributions template of a component
       * @param section
       */
      $scope.addContributionTemplateSection = function (section, component) {
        var newSection = {
          title: section.title,
          description: section.description,
          length: section.length
        };
        component.contributionTemplate.push(newSection);
      }

      $scope.removeContributionTemplateSection = function (index, component) {
        component.contributionTemplate.splice(index, 1);
      }

      /**
       * Updates the current and previous step models in the $scope
       * @param step
       * @param prevStep
       */
      $scope.setCurrentStep = function (step, prevStep) {
        privateSetCurrentStep(step, prevStep);
      }

      /**
       * Populates the list of optional themes according to the linked campaign themes
       * Additionally, it includes linked components in the new campaign
       */
      $scope.initializeLinkedCampaignOptionThemes = function (campaign) {
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

        if ($scope.newCampaign.linkedComponents[0] === undefined) {
          for (var i = 0; i < $scope.newCampaign.linkedCampaign.campaign.components.length; i += 1) {
            var component = $scope.newCampaign.linkedCampaign.campaign.components[i];
            if (component.title === 'Deliberation') {
              $scope.newCampaign.linkedComponents[0] = component;
            } else if (component.title === 'Voting') {
              $scope.newCampaign.linkedComponents[1] = component;
            } else if (component.title === 'Implementation') {
              $scope.newCampaign.linkedComponents[2] = component;
            }
          }
        } else {
          for (var i = 0; i < $scope.newCampaign.linkedCampaign.campaign.components.length; i += 1) {
            var component = $scope.newCampaign.linkedCampaign.campaign.components[i];
            if (component.title === 'Deliberation') {
              $scope.newCampaign.linkedComponents[0] = $scope.newCampaign.linkedCampaign.campaign.components[i];
            }
            if (component.title === 'Voting') {
              $scope.newCampaign.linkedComponents[1] = $scope.newCampaign.linkedCampaign.campaign.components[i];
            }
            if (component.title === 'Implementation') {
              $scope.newCampaign.linkedComponents[2] = $scope.newCampaign.linkedCampaign.campaign.components[i];
            }
          }
        }

        var linkedDeliberation = $scope.newCampaign.linkedComponents[0];
        var linkedVoting = $scope.newCampaign.linkedComponents[1];
        var linkedImplementation = $scope.newCampaign.linkedComponents[2];

        if (linkedDeliberation)
          $scope.newCampaign.proposalComponents[3].componentId = linkedDeliberation.componentId;
        if (linkedVoting)
          $scope.newCampaign.proposalComponents[4].componentId = linkedVoting.componentId;
        if (linkedImplementation)
          $scope.newCampaign.proposalComponents[5].componentId = linkedImplementation.componentId;
      }

      /**
       * Populates the list of optional themes according to the parent assembly
       */
      $scope.initializeAssemblyOptionThemes = function () {
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
      $scope.refreshTimeframe = function (months) {
        privateRefreshTimeframe(months);
      }

      /**
       * Updates the value of a milestone based on a new date
       * @param date
       * @param index
       */
      $scope.updateMilestoneValue = function (date, index) {
        var newDate = moment(date);
        var campaignStartDate = moment($scope.campaignTimeframeStartDate);
        var d = duration(campaignStartDate, newDate);
        $scope.newCampaign.milestones[index].date = date;
        $scope.newCampaign.milestones[index].value = d.days;
        $scope.newCampaign.triggerTimeframeUpdate = true;
      }

      /**
       * Opens or closes the date pickers for each milestone
       * @param $event
       * @param m
       */
      $scope.open = function ($event, m) {
        m.calOpened = true;
      };

      $scope.disabled = function (date, mode) {
        return (mode === 'day' && (date.getDay() === 0 || date.getDay() === 6));
      };

      /**
       * Scope function called to create the campaign
       * or move between stages of the creation process
       * @param step
       * @param options
       */
      $scope.createCampaign = function (step, options) {
        privateCreateCampaign(step, options);
      };
    }

    function initScopeContent() {
      $scope.user = localStorageService.get("user");

      if ($scope.user && $scope.user.language) {
        $translate.use($scope.user.language);
      }
      $scope.forms = {};
      $scope.assembly = localStorageService.get('currentAssembly');

      if (!$scope.assembly) {
        return;
      }
      $scope.assemblyID = $scope.assembly.assemblyId;
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
        var info = $scope.info = localStorageService.get("help") || {};
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
          description: "Yes, link to another campaign and use its template",
          value: "LINKED",
          subTemplateTitle: "Select a campaign from the list or search by name"
        },
        {
          description: "No, use a predefined template",
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
      var inProgressNewCampaign = localStorageService.get('newCampaign');
      $scope.newCampaign = inProgressNewCampaign ? inProgressNewCampaign : Campaigns.defaultNewCampaign();
      $scope.newCampaign.template = $scope.templateOptions[1];
      $scope.newCampaign.proposalComponents = Components.defaultProposalComponents();
      $scope.newCampaign.enableBudget = 'yes';
      $scope.newCampaign.supportingComponents = Components.defaultSupportingComponents();
      $scope.newCampaign.milestones = Components.defaultProposalComponentMilestones();
      $scope.newCampaign.linkedComponents = [];
      initializeMilestonesTimeframe();

      // in order to save new campaign configuration between wizard steps       
      $scope.$watchCollection('newCampaign', function (newVal) {
        localStorageService.set('newCampaign', newVal);
      });
    }

    /**
     * Initializes the timeframe models for milestones
     */
    function initializeMilestonesTimeframe() {
      $scope.newCampaign.campaignTimeframeInMonths = 1;
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
    function privateSetCurrentStep(step, prevStep) {
      if (step != prevStep) {
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
      var end = moment(start).add(months, 'M');
      var d = duration(start, end);
      $scope.newCampaign.campaignTimeframeInDays = d.days;
      $scope.newCampaign.campaignTimeframeEndDate = end.toDate();
      $scope.newCampaign.triggerTimeframeUpdate = true;
      console.log("Trigger Timeframe Update: " + $scope.newCampaign.triggerTimeframeUpdate);
    }

    function updateMilestoneStartDate(newValue, campaignStartDate) {
      return moment(campaignStartDate).add(newValue, 'd');
    }

    function setListOfLinkedAssemblies() {
      var assembliesRes = Assemblies.linkedAssemblies($scope.assemblyID).query();
      assembliesRes.$promise.then(
        function (assemblies) {
          $scope.linkedAssemblies = assemblies;
        },
        function (error) {
          $scope.linkedAssemblies = undefined;
        }
      );

      var featuredAssembliesRes = Assemblies.featuredAssemblies().query();
      featuredAssembliesRes.$promise.then(
        function (assemblies) {
          $scope.assemblies = assemblies;
          for (var i = 0; i < assemblies.length; i += 1) {
            var assembly = assemblies[i];
            var aCampaigns = assembly.campaigns;
            if (aCampaigns != undefined && aCampaigns != null) {
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
          var campaignEl = $scope.campaigns[0];
          var rsp = Campaigns.components($scope.assemblyID, campaignEl.campaign.campaignId);

          rsp.then(function (components) {
            campaignEl.campaign.components = components;
            $scope.initializeLinkedCampaignOptionThemes(campaignEl);
          }, function (error) {
            Notify.show('Error while trying to communicate with the server', 'error');
          });

          $scope.assembly = localStorageService.get("currentAssembly");
          if ($scope.assembly != undefined && $scope.assembly != null && $scope.assembly.assemblyId === $scope.assemblyID) {
            $scope.initializeAssemblyOptionThemes();
          } else {
            var assemblyRes = Assemblies.assembly($scope.assemblyID).get();
            assemblyRes.$promise.then(
              function (a) {
                $scope.assembly = a;
                localStorageService.set("currentAssembly", a);
                $scope.initializeAssemblyOptionThemes();
              },
              function (error) {
                $scope.templateErrors.push(error);
              }
            );
          }
        },
        function (error) {
          $scope.templateErrors.push(error);
        }
      );

      var templateRes = Campaigns.templates().query();
      templateRes.$promise.then(
        function (templates) {
          $scope.templates = templates;
          $scope.newCampaign.selectedTemplate = $scope.templates[0];
        },
        function (error) {
          $scope.templateErrors.push(error);
        }
      );
    }

    function prepareCampaignToCreate() {
      var newCampaign = {};
      newCampaign.title = $scope.newCampaign.title ? $scope.newCampaign.title : $scope.newCampaign.goal;
      newCampaign.goal = $scope.newCampaign.goal;
      newCampaign.listed = $scope.newCampaign.listed;
      newCampaign.themes = $scope.newCampaign.themes;

      var requiredFields = newCampaign.title != undefined && newCampaign.goal != undefined;

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
        for (var i = 0; i < milestones.length; i += 1) {
          var m = milestones[i];
          // TODO: change in API "start" to just "date"
          m.start = m.date;
          // TODO: remove days from milestones s
          //if (i!=(milestones.length-1))
          //	m.days = duration(moment(m.date),moment(milestones[i+1])).days;
          //else
          //	m.days = 0;
          components[m.componentIndex].milestones.push(m);

          if (m.type === "START") {
            // Set component start date to the the date of the first milestone of type "START"
            if (components[m.componentIndex].startDate) {
              var milestoneIsBefore = moment(m.date).isBefore(components[m.componentIndex].startDate);
              components[m.componentIndex].startDate =
                milestoneIsBefore ?
                  m.date : components[m.componentIndex].startDate;
            } else {
              components[m.componentIndex].startDate = m.date;
            }
          } else if (m.type === "END") {
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

        for (var i = 0; i < components.length; i += 1) {
          var component = components[i];
          if ((component.enabled && component.active) || (component.enabled && component.linked)) {
            if (component && component.key === 'Proposalmaking') {
              component.templates = [{ templateSections: component.contributionTemplate }];
            }
            newCampaign.components.push(component);
          }
          // Make sure start dates are not null
          component.startDate = component.startDate ?
            component.startDate : i - 1 > 0 ?
              components[i - 1].endDate : today().toDate();

          component.endDate = component.endDate ?
            component.endDate : i + 1 < components.length ?
              components[i + 1].startDate : moment(component.startDate).add(30, "days");

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
      if (addedThemes != undefined && addedThemes != null && addedThemes.length > 0) {
        for (var i = 0; i < addedThemes.length; i += 1) {
          var t = addedThemes[i];
          if (t.selected) {
            existingThemes.push(t);
          }
        }
      }
    }

    function addToExistingComponents(existingComponents, addedComponents, linkedCampaign) {
      if (addedComponents != undefined && addedComponents != null && addedComponents.length > 0
        && linkedCampaign != undefined && linkedCampaign != null) {
        for (var i = 0; i < addedComponents.length; i += 1) {
          var c = addedComponents[i];
          if (c.linked) {
            c.componentId = getComponentIdByKey(linkedCampaign.campaign.components, c.key);
            if (c.componentId > 0) {
              existingComponents.push(c.componentId);
            }
          }
        }
      }

    }

    function getComponentIdByKey(components, key) {
      for (var i = 0; i < components.length; i += 1) {
        var c = components[i];
        if (c.key === key) {
          return c.componentId;
        }
      }
      return -1;
    }
    function privateCreateCampaign(step, options) {
      if (step === 'done') {
        var postCampaign = prepareCampaignToCreate();
        if (postCampaign.error === undefined) {
          var campaignRes = Campaigns.newCampaign($scope.assemblyID).save(postCampaign);
          campaignRes.$promise.then(
            function (data) {
              $scope.newCampaign = data;
              localStorageService.remove('newCampaign');
              $location.url('/v2/assembly/' + $scope.assemblyID + '/campaign/' + $scope.newCampaign.campaignId);
            },
            function (error) {
              Notify.show('Error in the creation of the Campaign: ' + JSON.stringify(error.statusMessage))
            }
          );
        } else {
          $scope.errors.push(postCampaign.error);
          Notify.show('Error. Could not create the campaign: ' + JSON.stringify(postCampaign.error.statusMessage));
          postCampaign.error = undefined;
        }
      } else {
        localStorageService.set('newCampaign', $scope.newCampaign);
        $state.go(step);
      }
    }

    function internalCheckParentValue(parent, child) {
      return parent.value === child.dependsOfValue;
    }
  }
} ());
