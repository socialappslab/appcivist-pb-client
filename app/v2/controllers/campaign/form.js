(function() {
  'use strict';

  angular.module('appCivistApp').controller('v2.CampaignFormCtrl', CampaignFormCtrl);

  CampaignFormCtrl.$inject = [
    '$scope', '$sce', '$http', '$templateCache', '$routeParams', '$resource', '$location',
    '$timeout', 'localStorageService', 'Campaigns', 'Assemblies', 'Components',
    'Contributions', 'moment', 'modelFormatConfig', '$translate', 'Notify', '$state',
     'configService', '$stateParams'
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
  function CampaignFormCtrl($scope, $sce, $http, $templateCache, $routeParams, $resource,
    $location, $timeout, localStorageService, Campaigns, Assemblies, Components,
    Contributions, moment, modelFormatConfig, $translate, Notify, $state,
    configService, $stateParams) {

    init();

    function init() {
      initScopeFunctions();
      initScopeContent();
      // setListOfLinkedAssemblies();
      loadCampaignTemplates();
    }

    function initScopeFunctions() {
      $scope.goNext = goNext.bind($scope);
      $scope.goPrev = goPrev.bind($scope);
      $scope.componentsLoaded = componentsLoaded.bind($scope);
      $scope.vmTimeline = {};

      $scope.updateConfigOptionValue = function(config, optionValue) {
        config.value = optionValue.value;
      };

      $scope.checkOption = function(config, option) {
        console.log('Checked: ' + option.value + " for config " + config.key);
      };

      $scope.checkParentValue = function(parent, child) {
        return internalCheckParentValue(parent, child);
      };

      $scope.configIsEnabled = function(config, configs, type) {
        var typeCondition = config.type === type;
        var dependsOfIsUndefined = config.dependsOf === undefined || config.dependsOf === 0 || config.dependsOf === null;
        var dependsOfConfigValueIsSelected = !dependsOfIsUndefined && internalCheckParentValue(configs[config.dependsOf - 1], config);
        var result = typeCondition && (dependsOfIsUndefined || dependsOfConfigValueIsSelected);
        return result;
      };

      $scope.removeError = function(index) {
        $scope.errors.splice(index, 1);
      };

      $scope.removeTemplateError = function(index) {
        $scope.templateErrors.splice(index, 1);
      };

      /**
       * Add/removes themes to the list of themes in the newCampaign Model
       * @param ts
       */
      $scope.addTheme = function(ts) {
        var themes = ts.split(',');
        themes.forEach(function(theme) {
          var addedTheme = { title: theme.trim() };
          $scope.newCampaign.themes.push(addedTheme);
        });
        $scope.themes = "";
      };

      $scope.removeTheme = function(index) {
        $scope.newCampaign.themes.splice(index, 1);
      };

      $scope.addExistingTheme = function(ts) {
        var themes = ts.split(',');
        themes.forEach(function(theme) {
          var addedTheme = { title: theme.trim() };
          $scope.newCampaign.existingThemes.push(addedTheme);
        });
        $scope.themes = '';
      };

      $scope.removeExistingTheme = function(index) {
        $scope.newCampaign.existingThemes.splice(index, 1);
      };

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
      };

      $scope.removeContributionTemplateSection = function(index, component) {
        component.contributionTemplate.splice(index, 1);
      };

      /**
       * Updates the current and previous step models in the $scope
       * @param step
       * @param prevStep
       */
      $scope.setCurrentStep = function(step, prevStep) {
        privateSetCurrentStep(step, prevStep);
      };

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
            };
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
        // TODO: revisit this after discussing linked components
        // if (linkedDeliberation) {
        //   $scope.newCampaign.proposalComponents[3].componentId = linkedDeliberation.componentId;
        // }

        // if (linkedVoting) {
        //   $scope.newCampaign.proposalComponents[4].componentId = linkedVoting.componentId;
        // }

        // if (linkedImplementation) {
        //   $scope.newCampaign.proposalComponents[5].componentId = linkedImplementation.componentId;
        // }
      };

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
            };
            $scope.assemblyThemes.push(themeOption);
          }
        }
      };

      /**
       * Scope shortcut to refreshing the Timeframe slider models
       * for milestones
       * @param months
       */
      $scope.refreshTimeframe = function(months) {
        privateRefreshTimeframe(months);
      };

      /**
       * Updates the value of a milestone based on a new date
       * @param date
       * @param index
       */
      $scope.updateMilestoneValue = function(date, index) {
        var newDate = moment(date);
        var campaignStartDate = moment($scope.campaignTimeframeStartDate);
        var d = duration(campaignStartDate, newDate);
        $scope.newCampaign.milestones[index].date = date;
        $scope.newCampaign.milestones[index].value = d.days;
        $scope.newCampaign.triggerTimeframeUpdate = true;
      };

      /**
       * Opens or closes the date pickers for each milestone
       * @param $event
       * @param m
       */
      $scope.open = function($event, m) {
        m.calOpened = true;
      };

      $scope.disabled = function(date, mode) {
        return mode === 'day' && (date.getDay() === 0 || date.getDay() === 6);
      };

      /**
       * Scope function called to create the campaign
       * or move between stages of the creation process
       * @param step
       * @param options
       */
      $scope.createOrUpdateCampaign = function(step, options) {
        privateCreateCampaign(step, options);
      };

      $scope.getExistingConfigs = function() {
        var configs = configService.getCampaignConfigs('CAMPAIGN');
        var finalConfig = [];
        _.forEach($scope.newCampaign.configs, function(config) {
          _.forEach(configs, function(configAux) {
            if (config.key == configAux.key) {
              config.definition = configAux.definition;
            }
          });
          finalConfig.push(config);
        });
        return finalConfig;
      };
    }

    function initScopeContent() {
      $scope.isEdit = false;
      $scope.user = localStorageService.get('user');
      $scope.selectedComponent = {};
      $scope.selectedMilestone = {};
      $scope.componentTypes = ['IDEAS', 'PROPOSALS', 'DELIBERATION', 'VOTING', 'IMPLEMENTATION'];
      $scope.milestoneTypes = ['START', 'REMINDER', 'END'];
      $scope.onComponentClick = onComponentClick.bind($scope);
      $scope.deleteSelectedPhase = deleteSelectedPhase.bind($scope);
      $scope.addNewPhase = addNewPhase.bind($scope);
      $scope.deleteMilestone = deleteMilestone.bind($scope);
      $scope.formatDate = formatDate.bind($scope);
      $scope.addNewMilestone = addNewMilestone.bind($scope);
      $scope.dateOptions = {
        formatYear: 'yyyy'
      };
      $scope.datepicker = {
        opened: false
      };

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
        }, {
          step: 2,
          title: "Campaign milestones",
          template: "app/partials/campaign/creation/newCampaign2.html",
          info: "",
          active: false,
          disabled: false
        }, {
          step: 3,
          title: "Campaign stages",
          template: "app/partials/campaign/creation/newCampaign3.html",
          info: "",
          active: false,
          disabled: false
        }];

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
      $scope.templateOptions = [{
        description: "Yes, link to another campaign and use its template",
        value: "LINKED",
        subTemplateTitle: "Select a campaign from the list or search by name"
      }, {
        description: "No, use a predefined template",
        value: "PREDEFINED",
        subTemplateTitle: "Select a template from the list"
      }];
      $scope.dateOptions = {
        formatYear: 'yyyy',
        startingDay: 1
      };
      $scope.oneAtATime = false;
      $scope.section = {};
      var temporaryCampaign = localStorageService.get('newCampaign');
      const isCampaignFormState = $state.is('v2.assembly.aid.campaign.edit') || $state.is('v2.assembly.aid.campaign.edit.description') || $state.is('v2.assembly.aid.campaign.edit.milestones') || $state.is('v2.assembly.aid.campaign.edit.stages');

      if ($stateParams.cid && isCampaignFormState) {
        $scope.isEdit = true;

        if ((temporaryCampaign != null && temporaryCampaign.campaignId != $stateParams.cid) || temporaryCampaign == null) {
          var rsp = Campaigns.campaign($stateParams.aid, $stateParams.cid).get();
          rsp.$promise.then(function(data) {
            $scope.newCampaign = data;
            localStorageService.set('newCampaign', data);
            $scope.getExistingConfigs();
          });
        } else {
          $scope.newCampaign = temporaryCampaign;
        }
        initializeExistingCampaignModel();
      } else {
        if (temporaryCampaign != null && temporaryCampaign.campaignId != null) {
          localStorageService.set("newCampaign", null);
        }
        initializeNewCampaignModel();
      }
    }

    function initializeExistingCampaignModel() {
      var inProgressNewCampaign = localStorageService.get('newCampaign');
      $scope.newCampaign = inProgressNewCampaign ? inProgressNewCampaign : Campaigns.defaultNewCampaign();
      $scope.newCampaign.components = $scope.newCampaign.componentsByTimeline;
      $scope.newCampaign.template = $scope.templateOptions[1];
      $scope.newCampaign.enableBudget = 'yes';
      $scope.newCampaign.linkedComponents = $scope.newCampaign.linkedComponents || [];
      $scope.getExistingConfigs();

      // in order to save edit campaign configuration between wizard steps
      $scope.$watchCollection('newCampaign', function(newVal) {
        localStorageService.set('newCampaign', newVal);
      });
    }

    /**
     * Initialize the model for the New Campaign with default values
     */
    function initializeNewCampaignModel() {
      var inProgressNewCampaign = localStorageService.get('newCampaign');
      $scope.newCampaign = inProgressNewCampaign ? inProgressNewCampaign : Campaigns.defaultNewCampaign();
      $scope.newCampaign.template = $scope.templateOptions[1];
      $scope.newCampaign.proposalComponents = inProgressNewCampaign ? inProgressNewCampaign.proposalComponents : _.cloneDeep(Components.defaultComponents());;
      $scope.newCampaign.enableBudget = 'yes';
      $scope.newCampaign.supportingComponents = Components.defaultSupportingComponents();
      $scope.newCampaign.linkedComponents = [];
      var configs = configService.getCampaignConfigs("CAMPAIGN");
      $scope.newCampaign.configs = configs;

      // in order to save new campaign configuration between wizard steps
      $scope.$watchCollection('newCampaign', function(newVal) {
        localStorageService.set('newCampaign', newVal);
      });
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


    function updateMilestoneStartDate(newValue, campaignStartDate) {
      return moment(campaignStartDate).add(newValue, 'd');
    }

    function setListOfLinkedAssemblies() {
      var assembliesRes = Assemblies.linkedAssemblies($scope.assemblyID).query();
      assembliesRes.$promise.then(function(assemblies) {
        $scope.linkedAssemblies = assemblies;
      }, function(error) {
        $scope.linkedAssemblies = undefined;
      });

      var featuredAssembliesRes = Assemblies.featuredAssemblies().query();
      featuredAssembliesRes.$promise.then(function(assemblies) {
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

        rsp.then(function(components) {
          campaignEl.campaign.components = components;
          $scope.initializeLinkedCampaignOptionThemes(campaignEl);
        }, function(error) {
          Notify.show('Error while trying to communicate with the server', 'error');
        });

        $scope.assembly = localStorageService.get("currentAssembly");
        if ($scope.assembly != undefined && $scope.assembly != null && $scope.assembly.assemblyId === $scope.assemblyID) {
          $scope.initializeAssemblyOptionThemes();
        } else {
          var assemblyRes = Assemblies.assembly($scope.assemblyID).get();
          assemblyRes.$promise.then(function(a) {
            $scope.assembly = a;
            localStorageService.set("currentAssembly", a);
            $scope.initializeAssemblyOptionThemes();
          }, function(error) {
            $scope.templateErrors.push(error);
          });
        }
      }, function(error) {
        $scope.templateErrors.push(error);
      });
    }

    function loadCampaignTemplates() {
      var templateRes = Campaigns.templates().query();
      templateRes.$promise.then(function(templates) {
        $scope.templates = templates;
        $scope.newCampaign.selectedTemplate = $scope.templates[0];
      }, function(error) {
        $scope.templateErrors.push(error);
      });
    }

    function prepareCampaignPayload() {
      let newCampaign = {};

      if ($scope.isEdit) {
        newCampaign = _.cloneDeep($scope.newCampaign);
        newCampaign.transientComponents = newCampaign.proposalComponents;
        delete newCampaign.listed;
        delete newCampaign.themes;
        delete newCampaign.ballots;
        delete newCampaign.bindingBallot;
        delete newCampaign.consultiveBallot;
        delete newCampaign.forum;
        delete newCampaign.linkedCampaign;
        delete newCampaign.linkedComponents;
        delete newCampaign.selectedTemplate;
        delete newCampaign.supportingComponents;
        delete newCampaign.template;
        delete newCampaign.proposalComponents;
      } else {
        newCampaign.campaignId = $scope.newCampaign.campaignId;
        newCampaign.title = $scope.newCampaign.title ? $scope.newCampaign.title : $scope.newCampaign.goal;
        newCampaign.goal = $scope.newCampaign.goal;
        newCampaign.themes = $scope.newCampaign.themes;
        newCampaign.configs = $scope.newCampaign.configs;
        // Setup existing themes
        newCampaign.existingThemes = [];
        addToExistingThemes(newCampaign.existingThemes, $scope.assemblyThemes);

        if ($scope.newCampaign.template.value === 'LINKED') {
          addToExistingThemes(newCampaign.existingThemes, $scope.campaignThemes);
        }
      }
      const requiredFields = newCampaign.title != undefined && newCampaign.goal != undefined;

      if (requiredFields) {
        // milestones configuration
        let components = $scope.newCampaign.proposalComponents;
        angular.forEach(components, component => {
          if ($scope.isEdit) {
            delete component.templates;
          }
          const startMilestone = component.milestones.filter(m => m.type === 'START')[0];
          const endMilestone = component.milestones.filter(m => m.type === 'END')[0];

          if (startMilestone) {
            component.startDate = moment(startMilestone.date).format('YYYY-MM-DD HH:mm');
          }

          if (endMilestone) {
            component.endDate = moment(endMilestone.date).format('YYYY-MM-DD HH:mm');
          }

          angular.forEach(component.milestones, m => {
            m.date = m.date = moment(m.date).format('YYYY-MM-DD HH:mm');
          })
        });
        newCampaign.components = components;
      } else {
        newCampaign.error = 'Validation Errors in the new Campaign. No title or goal was established';
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
      if (addedComponents != undefined && addedComponents != null && addedComponents.length > 0 && linkedCampaign != undefined && linkedCampaign != null) {
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
      let payload = prepareCampaignPayload();

      if (step === 'done') {
        if (payload.error === undefined) {
          let campaignRes;

          if (!$scope.isEdit) {
            campaignRes = Campaigns.newCampaign($scope.assemblyID).save(payload);
          } else {
            campaignRes = Campaigns.campaign($scope.assemblyID, $scope.newCampaign.campaignId).update(payload);
          }
          campaignRes.$promise.then(data => {
            $scope.newCampaign = data;
            localStorageService.remove('newCampaign');
            $location.url('/v2/assembly/' + $scope.assemblyID + '/campaign/' + $scope.newCampaign.campaignId);
          }, error => Notify.show('Error. Could not save the campaign', 'error'));
        } else {
          $scope.errors.push(payload.error);
          Notify.show('Error. Could not save the campaign', 'error');
          payload.error = undefined;
        }
      } else {
        localStorageService.set('newCampaign', $scope.newCampaign);
        $state.go(step);
      }
    }

    function internalCheckParentValue(parent, child) {
      return parent.value === child.dependsOfValue;
    }

    /**
     * Handler called when user clicks on timeline component
     *
     * @param {Object} component
     */
    function onComponentClick(component) {
      // date comes formatted as '2016-05-31 21:00 PM GMT' from the backend
      // we just pick the date part.
      angular.forEach(component.milestones, function(m) {
        const parsedDate = moment(m.date, 'YYYY-MM-DD');
        m.date = parsedDate.toDate();
        // test if milestone can be removed or changed its type
        m.isMandatory = m.type === 'START' || m.type === 'END';
        // test if milestone is editable. We can edit a milestone if we do not reach it yet
        m.isEditable = parsedDate.isSameOrAfter(moment(), 'day');
        m.isRemovable = m.type !== 'START' && m.type !== 'END';

      });
      this.selectedComponent = component;
    }

    /**
     * Handler called when user clicks on delet selected phase button.
     */
    function deleteSelectedPhase() {
      _.remove(this.newCampaign.proposalComponents, { key: this.selectedComponent.key });
      this.selectedComponent = {};
    }

    /**
     * Handler called when user clicks on add new phase button.
     */
    function addNewPhase() {
      if (!this.selectedComponent.title) {
        return;
      }
      this.newCampaign.proposalComponents.push(this.selectedComponent);
      this.selectedComponent = {};
    }

    /**
     * Deletes the selected milestones
     *
     * @param {Object} milestone
     */
    function deleteMilestone(milestone) {
      if (milestone.type === 'START' || milestone.type === 'END') {
        Notify.show('Milestone of type ' + milestone.type + ' can\'t be deleted.', 'warn');
        return;
      }
      _.remove(this.selectedComponent.milestones, { position: milestone.position });
    }

    /**
     * Helper that formats the given date
     *
     * @param {Date} date
     */
    function formatDate(date) {
      return moment(date).local().format('L');
    }

    /**
     * Add a new milestone to the currently selected component.
     */
    function addNewMilestone() {
      if (!this.selectedComponent.title) {
        return;
      }
      var milestones = this.selectedComponent.milestones;
      var endMilestone = _.find(milestones, { type: 'END' });
      milestones.push({
        title: 'Milestone title',
        description: '',
        type: 'REMINDER',
        date: new Date(),
        position: endMilestone.position,
        isEditable: true,
        isMandatory: false,
        isRemovable: true
      });

      endMilestone.position += 1;
      this.selectedComponent.milestones = _.sortBy(milestones, ['position']);
    }

    /**
     * Handler for the next button click event.
     */
    function goNext() {
      const aid = this.assemblyID;
      const cid = this.newCampaign.campaignId;

      if (this.isEdit) {
        if ($state.is('v2.assembly.aid.campaign.edit.description')) {
          this.createOrUpdateCampaign('v2.assembly.aid.campaign.edit.milestones', { aid, cid, fastrack: false });
        } else if ($state.is('v2.assembly.aid.campaign.edit.milestones')) {
          this.createOrUpdateCampaign('v2.assembly.aid.campaign.edit.stages', { aid, cid, fastrack: false });
        }
      } else {
        if ($state.is('v2.assembly.aid.campaign.new.description')) {
          this.createOrUpdateCampaign('v2.assembly.aid.campaign.new.milestones', { aid, fastrack: false });
        } else if ($state.is('v2.assembly.aid.campaign.new.milestones')) {
          this.createOrUpdateCampaign('v2.assembly.aid.campaign.new.stages', { aid, fastrack: false });
        }
      }
    }

    /**
     * Handler for the previous button click event.
     */
    function goPrev() {
      const aid = this.assemblyID;
      const cid = this.newCampaign.campaignId;

      if (this.isEdit) {
        if ($state.is('v2.assembly.aid.campaign.edit.stages')) {
          this.createOrUpdateCampaign('v2.assembly.aid.campaign.edit.milestones', { aid, cid, fastrack: false });
        } else if ($state.is('v2.assembly.aid.campaign.edit.milestones')) {
          this.createOrUpdateCampaign('v2.assembly.aid.campaign.edit.description', { aid, cid, fastrack: false });
        }
      } else {
        if ($state.is('v2.assembly.aid.campaign.new.stages')) {
          this.createOrUpdateCampaign('v2.assembly.aid.campaign.new.milestones', { aid, fastrack: false });
        } else if ($state.is('v2.assembly.aid.campaign.new.milestones')) {
          this.createOrUpdateCampaign('v2.assembly.aid.campaign.new.description', { aid, fastrack: false });
        }
      }
    }

    /**
     * Called when the campaign timeline directive finishs loading the components.
     *
     * @param {Object[]} components
     */
    function componentsLoaded(components) {
      this.newCampaign.proposalComponents = components;
    }
  }
})();
