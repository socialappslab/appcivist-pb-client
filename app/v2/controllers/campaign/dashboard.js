'use strict';

(function () {
  'use strict';

  angular.module('appCivistApp').controller('v2.CampaignDashboardCtrl', CampaignDashboardCtrl);

  CampaignDashboardCtrl.$inject = [
    '$scope',
    'Campaigns',
    '$stateParams',
    'Assemblies',
    'Contributions',
    '$filter',
    'localStorageService',
    'Notify',
    'Memberships',
    'Space',
    '$translate',
    '$rootScope',
    'WorkingGroups',
    '$compile',
    '$state',
    'Voting',
    '$sce',
    'Notifications',
    '$breadcrumb',
    'FileUploader',
    'LocaleService'
  ];

  function CampaignDashboardCtrl($scope, Campaigns, $stateParams, Assemblies, Contributions, $filter,
    localStorageService, Notify, Memberships, Space, $translate, $rootScope, WorkingGroups, $compile,
    $state, Voting, $sce, Notifications, $breadcrumb, FileUploader, LocaleService) {
    $scope.activeTab = "Public";
    $scope.changeActiveTab = function (tab) {
      if (tab == 1) $scope.activeTab = "Members";
      else $scope.activeTab = "Public";
    };

    $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams, options) {
      $('body').removeClass('modal-open');
      $('.modal-backdrop').remove();
      $('#workingGroups').modal('hide');
      $('#documents').modal('hide');
      $('#media').modal('hide');
      $('#analytics').modal('hide');
    });

    activate();

    function activate() {
      // Example http://localhost:8000/#/v2/assembly/8/campaign/56c08723-0758-4319-8dee-b752cf8004e6
      var pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      $scope.isAnonymous = false;
      $scope.isCoordinator = false;
      $scope.userIsMember = false;
      $scope.commentsSectionExpanded = false;
      $scope.showVotingButtons = false;
      $scope.votingStageIsActive = false;
      $scope.vmTimeline = {};
      $scope.filters = {};
      $scope.vmPaginated = {};
      $scope.configsLoaded = false;
      $scope.commentType = 'public';
      $scope.selectedCards = [];
      $scope.subscribed = false;

      $scope.campaignFaq = null;
      $scope.accessibilityUrl = null;
      $scope.requireGroupAuthorship = true;

      // TODO: read the following from configurations in the campaign/component
      $scope.newProposalsEnabled = false;
      $scope.newIdeasEnabled = false;

      $scope.pageSize = 12;
      $scope.showPagination = false;
      $scope.sorting = "popularity_desc";
      $scope.filters = {
        searchText: '',
        themes: [],
        groups: [],
        // date_asc | date_desc | popularity | random | most_commented | most_commented_public | most_commented_members
        sorting: $scope.sorting,
        pageSize: $scope.pageSize
      };

      $scope.membersCommentCounter = { value: 0 };
      $scope.publicCommentCounter = { value: 0 };

      $scope.insights = {
        proposalsCount: 0,
        ideasCount: 0,
        proposalCommentsCount: 0,
        ideasCommentsCount: 0
      };

      if ($stateParams.cuuid && pattern.test($stateParams.cuuid)) {
        if ($stateParams.auuid && pattern.test($stateParams.auuid)) {
          $scope.assemblyID = $stateParams.auuid;
        }
        $scope.campaignID = $stateParams.cuuid;
        $scope.isAnonymous = true;
        $scope.fromURL = 'v2/campaign/' + $scope.campaignID;
      } else {
        $scope.assemblyID = $stateParams.aid ? parseInt($stateParams.aid) : 0;
        $scope.campaignID = $stateParams.cid ? parseInt($stateParams.cid) : 0;
        $scope.isCoordinator = Memberships.isAssemblyCoordinator($scope.assemblyID);
        $scope.user = localStorageService.get('user');
        $scope.fromURL = 'v2/assembly/' + $scope.assemblyID + '/campaign/' + $scope.campaignID;

        if ($scope.user && $scope.user.language) {
          $scope.commentType = 'members';
          $translate.use($scope.user.language);
        }
      }

      $scope.toggleCommentsSection = toggleCommentsSection.bind($scope);
      $scope.toggleHideCommentsSection = toggleHideCommentsSection.bind($scope);
      $scope.loadThemes = loadThemes.bind($scope);
      $scope.loadGroups = loadGroups.bind($scope);
      $scope.openModal = openModal.bind($scope);
      $scope.closeModal = closeModal.bind($scope);
      $scope.redirectToProposal = redirectToProposal.bind($scope);
      $scope.showAssemblyLogo = showAssemblyLogo.bind($scope);
      $scope.checkJoinWGButtonVisibility = checkJoinWGButtonVisibility.bind($scope);
      $scope.checkConfigAllowAnonIdeas = checkConfigAllowAnonIdeas.bind($scope);
      $scope.checkConfigDisableComments = checkConfigDisableComments.bind($scope);
      $scope.checkConfigDisablePublicComments = checkConfigDisablePublicComments.bind($scope);
      $scope.afterComponentsLoaded = afterComponentsLoaded.bind($scope);
      $scope.loadCampaignConfigs = loadCampaignConfigs.bind($scope);
      $scope.afterLoadingCampaignConfigsSuccess = afterLoadingCampaignConfigsSuccess.bind($scope);
      $scope.afterLoadingCampaignConfigsError = afterLoadingCampaignConfigsError.bind($scope);
      $scope.afterLoadingCampaignConfigs = afterLoadingCampaignConfigs.bind($scope);
      $scope.loadVotingBallotAndCandidates = loadVotingBallotAndCandidates.bind($scope);
      $scope.afterLoadingBallotSuccess = afterLoadingBallotSuccess.bind($scope);
      $scope.afterLoadingBallotError = afterLoadingBallotError.bind($scope);
      $scope.initializeBallotTokens = initializeBallotTokens.bind($scope);
      $scope.voteOnCandidate = voteOnCandidate.bind($scope);
      $scope.loadVotingBallotAndCandidatesAfterStart = loadVotingBallotAndCandidatesAfterStart.bind($scope);
      $scope.checkVoteOnCandidate = checkVoteOnCandidate.bind($scope);
      $scope.getCandidateSummary = getCandidateSummary.bind($scope);
      $scope.saveVotes = saveVotes.bind($scope);
      $scope.finalizeVotes = finalizeVotes.bind($scope);
      $scope.loadGroupsAfterConfigs = loadGroupsAfterConfigs.bind($scope);
      $scope.afterGroupsSuccess = afterGroupsSuccess.bind($scope);
      $scope.afterGroupsError = afterGroupsError.bind($scope);
      $scope.loadCampaignBrief = loadCampaignBrief.bind($scope);
      $scope.translateDefaultBrief = translateDefaultBrief.bind($scope);
      $scope.toggleOpenAddAttachment = toggleOpenAddAttachment.bind($scope);
      $scope.toggleOpenAddAttachmentByUrl = toggleOpenAddAttachmentByUrl.bind($scope);
      $scope.deleteResource = deleteResource.bind($scope);
      $scope.joinWg = joinWg.bind($scope);
      $scope.loadThemeKeywordDescription = loadThemeKeywordDescription.bind($scope);
      $scope.subscribeNewsletter = subscribeNewsletter.bind($scope);
      $scope.unsubscribeNewsletter = unsubscribeNewsletter.bind($scope);
      $scope.checkIfSubscribed = checkIfSubscribed.bind($scope);
      $scope.resourceIsDocument = resourceIsDocument.bind($scope);
      $scope.resourceIsMedia = resourceIsMedia.bind($scope);
      $scope.resourceIsPicture = resourceIsPicture.bind($scope);
      $scope.resourceIsVideo = resourceIsVideo.bind($scope);
      $scope.documentCount = documentCount.bind($scope);
      $scope.mediaCount = mediaCount.bind($scope);
      $scope.pictureCount = pictureCount.bind($scope);
      $scope.videoCount = videoCount.bind($scope);
      $scope.createContribution = createContribution.bind($scope);
      $scope.validUrl = validUrl.bind($scope);

      // add attachment form
      $scope.submitAttachment = submitAttachment.bind($scope);
      $scope.submitAttachmentByUrl = submitAttachmentByUrl.bind($scope);
      $scope.createAttachmentResource = createAttachmentResource.bind($scope);
      $scope.toggleOpenAddAttachment = toggleOpenAddAttachment.bind($scope);
      $scope.toggleOpenAddAttachmentByUrl = toggleOpenAddAttachmentByUrl.bind($scope);
      $scope.sanitizeVideoResourceUrl = sanitizeVideoResourceUrl.bind($scope);


      if (!$scope.isAnonymous) {
        $scope.activeTab = "Members";
      }
      loadAssembly();
      loadCampaignResources();
      loadCampaigns();

      $scope.myObject = {};
      $scope.myObject.refreshMenu = function () {
        $scope.myObject.showActionMenu = !$scope.myObject.showActionMenu;
      };
      $scope.modals = {
        proposalNew: false,
      };
      $scope.displayJoinWorkingGroup = false;
      $scope.isModalOpened = isModalOpened.bind($scope);
      $scope.toggleModal = toggleModal.bind($scope);
      $scope.contributionTypeIsSupported = function (type) {
        return Campaigns.isContributionTypeSupported(type, $scope);
      };
      $scope.$on('dashboard:fireDoSearch', function () {
        $rootScope.$broadcast('pagination:fireDoSearch');
      })
      $scope.paginationWidgetListenersAreReady = false;
      $scope.mostDataLoaded = false;
      // HOTFIX: fire updateFilters if pagination is ready but data loaded faster than its linking in this controller
      $scope.$on('dashboard:paginationWidgetListenersAreReady', () => {
        if (!$scope.paginationWidgetListenersAreReady && $scope.mostDataLoaded) {
          $scope.paginationWidgetListenersAreReady = true;
          $scope.$broadcast('filters:updateFilters');
        }
      });
      $scope.$on('AddResourceForm:AddedResourceSuccess', () => {
        $scope.openAddAttachmentByUrl = false;
        $scope.openAddAttachment = false;
      });
      $scope.cm = {
        isHover: false
      };
    }

    function joinWg(groupId) {
      let member = {
        userId: $scope.user.userId,
        email: $scope.user.email,
        type: 'REQUEST',
        targetCollection: 'GROUP',
        status: 'REQUESTED'
      }
      let rsp = Memberships.membershipRequest('group', groupId).save(member);
      rsp.$promise.then(
        response => {
          Notify.show("Request completed successfully. We'll get in contact soon.", "success");
        },
        error => Notify.show(error.statusMessage, "error")
      )
    }

    function loadAssembly() {
      $scope.assembly = localStorageService.get('currentAssembly');
      // TODO: if assembly.assemblyId != $stateParams.aid or assembly.uuid != $stateParams.auuid in case of anonymous
      // get the assembly from backend
      if (($scope.assembly && $scope.assembly.assemblyId !== $stateParams.aid) || !$scope.assembly ){
        if ($scope.isAnonymous) {
          $scope.assemblyID = $stateParams.auuid;
          var assemblyRes = Assemblies.assemblyByUUID($scope.assemblyID).get();
        } else {
          $scope.assemblyID = $stateParams.aid;
          var assemblyRes = Assemblies.assembly($scope.assemblyID).get();
        }

        assemblyRes.$promise.then(
          assembly => {
            $scope.assembly = assembly;
            $scope.assemblyLabel = $scope.assembly.name;
            localStorageService.set("currentAssembly", $scope.assembly);
            verifyMembership($scope.assembly);
          },
          error => {
            console.log("Error getting assembly: " + error.statusMessage);
          }
        );
      } else {
        $scope.assemblyLabel = $scope.assembly.name;
        verifyMembership($scope.assembly);
      }
    }

    function loadAssemblyPublicProfile() {
      var assemblyShortname = $stateParams.shortname; // for the future move of paths in which everything will be preceded by the assembly shortname

      if (assemblyShortname) {
        var rsp = Assemblies.assemblyByShortName(assemblyShortname).get();
        rsp.$promise.then(function (assembly) {
          $scope.assembly = assembly;
        }, function (error) {
          Notify.show(error.statusMessage, 'error');
        });
      } else {
        var assemblyUUID = $scope.campaign ? $scope.campaign.assemblies ? $scope.campaign.assemblies[0] : null : null;

        if (assemblyUUID) {
          var rsp = Assemblies.assemblyByUUID(assemblyUUID).get();
          rsp.$promise.then(function (assembly) {
            $scope.assembly = assembly;
          }, function (error) {
            Notify.show(error.statusMessage, 'error');
          });
        }
      }
    }

    function verifyMembership(assembly) {
      $scope.userIsMember = Memberships.rolIn('assembly', assembly.assemblyId, 'MEMBER');
    }

    function loadCampaigns() {
      var res;
      if ($scope.isAnonymous) {
        res = Campaigns.campaignByUUID($scope.campaignID).get();
      } else {
        res = Campaigns.campaign($scope.assemblyID, $scope.campaignID).get();
      }

      res.$promise.then(
        function (data) {
          $scope.campaign = data;
          console.log($scope.campaign);
          if($scope.isAnonymous) {
            $translate.use($scope.campaign.lang);
            moment.locale($scope.campaign.lang);
            LocaleService.setLocale($scope.campaign.lang);
          }
          $scope.campaign.rsID = data.resourceSpaceId; // must be always id
          $scope.campaign.rsUUID = data.resourceSpaceUUID;
          $scope.campaign.frsUUID = data.forumResourceSpaceUUID;
          $scope.campaign.forumSpaceID = data.forumResourceSpaceId;
          $scope.spaceID = $scope.isAnonymous ? data.resourceSpaceUUID : data.resourceSpaceId;
          $scope.forumSpaceID = $scope.campaign.forumSpaceID ? $scope.campaign.forumSpaceID : $scope.campaign.frsUUID;
          $scope.showPagination = true;
          console.log($scope.assembly);
          $scope.logo = $scope.campaign.logo ?
            $scope.campaign.logo.url : showAssemblyLogo() ?
              $scope.assembly.profile.icon : null;
          $scope.cover = $scope.campaign.cover ? $scope.campaign.cover.url : null;
          $scope.coverStyle = $scope.cover ?
            {
              'background-image': 'url(' + $scope.cover + ')',
              'background-position': 'center center',
            }
            : {
              'background-image': 'url("../images/vallejo_header.jpg")',
              'background-position': 'center center',
            };

          $scope.campaignLabel = $scope.campaign.title;

          $scope.loadCampaignBrief();
          localStorageService.set("currentCampaign", $scope.campaign);

          loadPublicCommentCount($scope.forumSpaceID);

          Space.getSpaceBasicAnalytics($scope.campaign.rsUUID).then(
            data => {
              $scope.insights = data;
            }
          );

          Campaigns.themes($scope.assemblyID, $scope.campaignID, $scope.isAnonymous, $scope.campaignID, {}).then(
            response => {
              $scope.themes = response.filter(r => r.type == 'OFFICIAL_PRE_DEFINED');
              $scope.keywords = response.filter(r => r.type == 'EMERGENT');
            },
            error => {
              Notify.show(error.statusMessage, 'error');
            }
          );

          checkIfSubscribed($scope.campaign.rsID);
        }
      );
    }

    function loadThemeKeywordDescription(title, description, url) {
      let content = description === undefined ? 'No description available' : description;
      angular.element('#themes-keywords #description').show().html("<p><strong><a href='"+url+"' target='_blank'>"+title+"</a></strong></p><p>"+content+"</p>");
    }

    function loadCampaignBrief() {
      $scope.translateDefaultBrief();
      $rootScope.$on('$translateChangeSuccess', function(event, current, previous) {
        translateDefaultBrief();
      });
      //Campaigns.getBriefByCampaignUUID()
      let res = Campaigns.getPublicBriefByCampaignUUID($scope.campaign.uuid).get();

      res.$promise.then(
        data => {
          let briefContent = data.brief;
          $scope.campaignBriefIsUrl = data.brief.startsWith("http");
          if ($scope.campaignBriefIsUrl) {
            $scope.campaignBrief = $sce.trustAsResourceUrl(briefContent);
          } else {
            $scope.campaignBrief = $sce.trustAsHtml(briefContent);
          }
        }
      );
    }

    function translateDefaultBrief() {
      $translate('campaign.brief.default.svg-text')
        .then(
          brief => {
            $scope.campaignBriefDefault = $sce.trustAsHtml(brief);
          });
    }

    function afterComponentsLoaded() {
      this.components = this.vmTimeline.components;
      let currentComponent = this.vmTimeline.currentComponent;
      this.currentComponentType = currentComponent ? currentComponent.type ? currentComponent.type.toUpperCase() : "" : ""; ;
      this.currentComponent = currentComponent;

      // If campaign has not been loaded yet, wait until its loaded to load its configs
      if(!this.campaign || !this.campaign.rsID || !this.campaign.rsUUID) {
        this.$watch("campaign.rsID", this.loadCampaignConfigs);
        this.$watch("campaign.rsUUID", this.loadCampaignConfigs);
      } else {
        this.loadCampaignConfigs();
      }
      localStorageService.set('currentCampaign.components', this.components);
      localStorageService.set('currentCampaign.currentComponent', currentComponent);
    }

    /**
     * Load campaign configurations
     */
    function loadCampaignConfigs () {
      if(this.campaign && (this.campaign.rsID || this.campaign.rsUUID) && !this.campaignConfigs && !this.configsLoaded) {
        let rsp = null;
        if (this.isAnonymous && this.campaign && this.campaign.rsUUID && !this.campaign.rsID) {
          this.configsLoaded = true;
          rsp = Campaigns.getConfigurationPublic(this.campaign.rsUUID).get()
        } else {
          this.configsLoaded = true;
          rsp = Campaigns.getConfiguration(this.campaign.rsID).get();
        }
        rsp.$promise.then(this.afterLoadingCampaignConfigsSuccess, this.afterLoadingCampaignConfigsError);
      }
    }

    function afterLoadingCampaignConfigsSuccess(data) {
      this.campaignConfigs = data;
      this.campaign.configs = this.campaignConfigs;
      let faqUrlConfig = data['appcivist.campaign.faq-url'];
      this.requireGroupAuthorship = data['appcivist.campaign.require-group-authorship'] === 'true' ? true : false;
      this.proposalDefaultTitle = data['appcivist.campaign.contribution.default-title'];
      this.proposalDefaultDescription = data['appcivist.campaign.contribution.default-description'];
      this.proposalDefaultTitle = this.proposalDefaultTitle ? this.proposalDefaultTitle : "Create your title"; // TODO translate
      this.proposalDefaultDescription = this.proposalDefaultDescription ? this.proposalDefaultDescription : "Create a brief description"; // TODO translate
      this.allowedContributionTypes = data['appcivist.campaign.contribution-types'];
      this.themesExtendedDescription = data['appcivist.campaign.themes.extended-description-url'];

      let showAnalyticsConf = data['appcivist.campaign.toolbar.analytics'];
      let showMediaConf = data['appcivist.campaign.toolbar.media'];
      let showDocumentsConf = data['appcivist.campaign.toolbar.documents'];
      let showWorkingGroupsConf = data['appcivist.campaign.toolbar.working-groups'];

      this.showAnalytics = showAnalyticsConf ? showAnalyticsConf.toLowerCase() === 'false' ? false : true : true;
      this.showMedia = showMediaConf ? showMediaConf.toLowerCase() === 'false' ? false : true : true;
      this.showDocuments = showDocumentsConf ? showDocumentsConf.toLowerCase() === 'false' ? false : true : true;
      this.showWorkingGroups = showWorkingGroupsConf ? showWorkingGroupsConf.toLowerCase() === 'false' ? false : true : true;


      if (this.allowedContributionTypes) {
        this.enableProposals = this.allowedContributionTypes.toLowerCase().includes("proposal");
        this.enableIdeas = this.allowedContributionTypes.toLowerCase().includes("idea");
        this.enableComments = this.allowedContributionTypes.toLowerCase().includes("comment") || this.allowedContributionTypes.toLowerCase().includes("discussion");
      } else {
        this.enableProposals = true;
        this.enableIdeas = true;
        this.enableComments = true;
      }

      console.log(this.requireGroupAuthorship);
      this.campaignFaq = faqUrlConfig ? faqUrlConfig : null;
      this.accessibilityUrl = validUrl(data['appcivist.campaign.accessibility.url']);
      this.afterLoadingCampaignConfigs();
    }

    function validUrl(url) {
      var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name and extension
        '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
        '(\\:\\d+)?'+ // port
        '(\\/[-a-z\\d%@_.~+&:]*)*'+ // path
        '(\\?[;&a-z\\d%@_.,~+&:=-]*)?'+ // query string
        '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
      if(!pattern.test(url)) {
        return null;
      } else {
        return url;
      }
    }

    function afterLoadingCampaignConfigsError(data) {
      // some default configs
      this.requireGroupAuthorship = false;
      this.proposalDefaultTitle = "Create your title"; // TODO translate
      this.proposalDefaultDescription = "Create a brief description"; // TODO translate
      this.allowedContributionTypes = "IDEAS, PROPOSALS, COMMENTS, DISCUSSIONS";
      this.enableProposals = true;
      this.enableIdeas = true;
      this.enableComments = true;
      this.requireGroupAuthorship = true;
      this.campaignFaq = "#";
      Notify.show('Error while trying to fetch campaign config', 'error');
      this.afterLoadingCampaignConfigs();
    }

    function afterLoadingCampaignConfigs() {
      let currentComponent = this.currentComponent;
      this.filters.currentComponent = currentComponent;
      this.filters.pageSize = this.pageSize;
      this.filters.mode =
        currentComponent.type === 'IDEAS' ? 'idea' :
          currentComponent.type === 'VOTING' ?
            getCurrentBallotEntityType() : 'proposal';
      if (currentComponent.type === 'VOTING') {
        this.filters.status = "INBALLOT";
      }
      setSectionsButtonsVisibility(currentComponent);
      this.loadGroupsAfterConfigs();
      // TODO: check current component has not finished
      // && this.currentComponent && this.currentComponent.endDate
      if (this.currentComponentType === 'VOTING') {
        this.loadVotingBallotAndCandidates();
      }
    }

    function getCurrentBallotEntityType() {
      if ($scope.campaign && $scope.campaign.ballotIndex && $scope.campaign.currentBallot) {
        let ballot = $scope.campaign.ballotIndex[$scope.campaign.currentBallot]
        let type = ballot.entityType ? ballot.entityType === 'IDEA' ? 'idea' : 'proposal' : 'proposal';
        return type;
      } else {
        return 'proposal';
      }
    }

    function loadVotingBallotAndCandidates() {
      // Only users can vote
      if (!this.isAnonymous) {
        this.votingStageIsActive = true;
        if (this.campaign && this.campaign.currentBallot) {
          this.campaignBallot = this.campaign.ballotIndex[this.campaign.currentBallot];
          // read user's ballot paper
          let rsp = Voting.ballotPaper(this.campaign.currentBallot, this.user.uuid).get();
          rsp.$promise.then(this.afterLoadingBallotSuccess, this.afterLoadingBallotError);
        }
      } else {
        // TODO implement config for enabling anonymous voting with form registration
        this.ballotPaperNotFound = true;
        this.votingStageIsActive = this.startVotingDisabled = this.campaignConfigs ? this.campaignConfigs['component.voting.anonymous'] === "TRUE" : false;
        if (this.campaign && this.campaign.currentBallot) {
          this.campaignBallot = this.campaign.ballotIndex[this.campaign.currentBallot];
          this.ballot = this.campaignBallot;
        }
      }
    }

    function loadVotingBallotAndCandidatesAfterStart(signature) {
      this.votingSignature=signature;
      let rsp = Voting.ballotPaper(this.campaign.currentBallot, signature).get();
      rsp.$promise.then(this.afterLoadingBallotSuccess, this.afterLoadingBallotError);
    }

    function saveVotes() {
      this.savingVotes = true;
      let rsp = Voting.ballotPaper(this.campaign.currentBallot, this.votingSignature).save(this.ballotPaper);
      rsp.$promise.then(this.afterLoadingBallotSuccess, this.afterLoadingBallotError);
    }

    function finalizeVotes() {
      this.finalizingVotes = true;
      // there is a bug in the voting API by which status is not changed if present in body
      delete this.ballotPaper.vote.status;
      let rsp = Voting.ballotPaper(this.campaign.currentBallot, this.votingSignature).complete(this.ballotPaper);
      rsp.$promise.then(this.afterLoadingBallotSuccess, this.afterLoadingBallotError);
    }

    function afterLoadingBallotSuccess (data) {
      this.ballotPaperNotFound = false;
      this.startVotingDisabled = false;
      this.showVotingButtons = true;
      this.ballotPaper = data;
      if (this.ballotPaper) {
        this.ballot = this.ballotPaper.ballot; // the voting ballot, which holds voting configs
        this.ballotPassword = this.ballot.password; // the password for creating a ballotPaper
        this.voteRecord = this.ballotPaper.vote; // the ballot paper, which holds the votes of the user
        this.ballotPaperFinished = this.voteRecord.status>0;
        this.votingSignature=this.voteRecord.signature;
        if (!this.voteRecord) {
          this.voteRecord = this.ballotPaper.vote = [];
        }
        this.votes = this.voteRecord ? this.voteRecord.votes : []; // array of votes, which contains the value for each vote
        if (!this.votes || this.votes.length===0) {
          this.votesIndex = this.voteRecord.votesIndex = {};
        } else {
          this.votesIndex = this.voteRecord.votesIndex;
        }
        this.initializeBallotTokens();
      }

      if (this.savingVotes) {
        this.savingVotes = false;
        angular.element('#saveVotes').modal({show:true});
      }

      if (this.finalizingVotes) {
        this.finalizingVotes = false;
        angular.element('#finalizeVotes').modal({show:false});
        angular.element('#finalizeVotesDone').modal({show:true});
      }
    }

    function afterLoadingBallotError (error) {
      this.ballotPaperNotFound = true;
      this.startVotingDisabled = true;
      if (this.campaign && this.campaign.currentBallot) {
        this.ballot = this.campaignBallot;
        this.ballotPassword = this.ballot.password; // the password for creating a ballotPaper
      }
      console.log("Ballot paper does not exist yet. Using Ballot information in the campaign");
    }

    function initializeBallotTokens () {
      let max = this.ballot ? parseInt(this.ballot.votes_limit) : 0;
      this.ballotTokens = { "points": max, "max": max};
      let remaining = max;
      let index;
      for (index = 0; index < this.votes.length; ++index) {
        let vote = this.votes[index];
        let value = vote.value;
        let intValue = value ? parseInt(value) : 0;
        remaining > 0 ? remaining -= intValue : 0;
      }
      this.ballotTokens.points = remaining;
    }

    function voteOnCandidate(obj){
      let vote = (this && this.votes && this.votesIndex && this.votesIndex[obj.id] >= 0
        && (this.votes[this.votesIndex[obj.id]] !== null
          || this.votes[this.votesIndex[obj.id]] !== undefined)) ? this.votes[this.votesIndex[obj.id]].value : -1;
      return parseInt(vote);
    }

    function checkVoteOnCandidate(candidateId) {
      return (this && this.votes && this.votesIndex && this.votesIndex[candidateId] >= 0
                && (this.votes[this.votesIndex[candidateId]] !== null || this.votes[this.votesIndex[candidateId]] !== undefined));
    }

    function getCandidateSummary(candidateId) {

      let index;
      for (index = 0; index < this.campaignBallot.ballotCandidates; ++index) {
        let candidate = this.campaignBallot.ballotCandidates[index];
        if (candidate.id === candidateId)
          return candidate.contributionSummary;
      }

    }

    function loadGroupsAfterConfigs() {
      // get groups
      let res;
      if (!$scope.isAnonymous) {
        res = loadGroups();
        res.then(this.afterGroupsSuccess, this.afterGroupsError);
      } else {
        this.otherWorkingGroups = localStorageService.get('otherWorkingGroups');
        this.afterGroupsError();
      }
    }

    function afterGroupsSuccess (data) {
      this.groups = data;
      data.forEach(
        function (group) {
          let res = WorkingGroups.workingGroupProposals($scope.assemblyID, group.groupId).query();
          res.$promise.then(
            function (data2) {
              group.proposalsCount = data2.length;
            },
            function (error) {
              group.proposalsCount = 0;
            }
          );
        }
      );
      this.displayJoinWorkingGroup = this.checkJoinWGButtonVisibility(this.campaignConfigs);

      $scope.mostDataLoaded = true;
      if (!$scope.paginationWidgetListenersAreReady) {
        $scope.paginationWidgetListenersAreReady = true;
        // after loading everything we need, we now activate the search of contributions
        this.$broadcast('filters:updateFilters',this.filters);
        console.log('Campaign:Controller => BROADCASTED => filters:updateFilters');
      }
    }

    function afterGroupsError (error) {
      $scope.mostDataLoaded = true;
      if (!$scope.paginationWidgetListenersAreReady) {
        $scope.paginationWidgetListenersAreReady = true;
        // after loading everything we need, we now activate the search of contributions
        this.$broadcast('filters:updateFilters',this.filters);
        console.log('Campaign:Controller => BROADCASTED => filters:updateFilters');
      }
    }

    function loadPublicCommentCount(sid) {
      var res;

      if ($scope.isAnonymous) {
        res = Space.getCommentCountPublic(sid).get();
      } else {
        res = Space.getCommentCount(sid).get();
      }

      res.$promise.then(
        function (data) {
          $scope.publicCommentCounter.value = data.counter;
        },
        function (error) {
          Notify.show(error.statusMessage, 'error');
        }
      );
    }

    function loadMembersCommentCount(sid) {
      var res;
      res = Space.getCommentCount(sid).get();
      res.$promise.then(
        function (data) {
          $scope.membersCommentCounter.value = data.counter;
        },
        function (error) {
          Notify.show(error.statusMessage, 'error');
        }
      );
    }

    function loadDiscussions(campaign, isAnonymous) {
      var res = Space.getContributions(campaign, 'DISCUSSION', isAnonymous);

      res.then(
        function (response) {
          console.log(response.list[0]);
          $scope.comments = response.list;

          if (!$scope.comments) {
            $scope.comments = [];
          }
        },
        function (error) {
          Notify.show(error.statusMessage, 'error');
        });
    }

    function setSectionsButtonsVisibility(component) {
      let key = component ? component.type ? component.type.toUpperCase() : "" : ""; // In old implementation, it was key, changed to type
      $scope.currentComponentType = key;
      $scope.isIdeasSectionVisible = key === 'PROPOSAL MAKING' || key === 'IDEAS';
      if ($scope.campaignConfigs) {
        let configs = $scope.campaignConfigs
        $scope.enableComments = $scope.checkConfigDisableComments(configs);
        if ($scope.isAnonymous) {
          $scope.enableComments = $scope.checkConfigDisablePublicComments(configs);
        }
        // New Ideas are allowed if:
        // 1. current stage is of type IDEAS
        // 2. user is not logged in but campaign is configred to accept new ideas from anonymous users
        // 3. current stage is of type PROPOSALS but campaign is configured to accept ideas during proposals stage
        let allowAnonIdeas = !$scope.isAnonymous || checkConfigAllowAnonIdeas($scope.campaignConfigs);
        let allowIdeaProposals = checkConfigAllowIdeasDuringProposals($scope.campaignConfigs);
        $scope.newIdeasEnabled =
          key === 'IDEAS' && allowAnonIdeas
          || (key === 'PROPOSALS' && allowIdeaProposals && allowAnonIdeas);
      } else {
        $scope.newIdeasEnabled = false; // by default, ideas are not enabled
      }
      $scope.newProposalsEnabled = (key === 'PROPOSALS' && !$scope.isAnonymous);
    }

    function loadCampaignResources() {
      if ($scope.isAnonymous) {
        var rsp = Campaigns.publicResources($scope.campaignID).query();
      } else {
        var rsp = Campaigns.resources($scope.assemblyID, $scope.campaignID).query();
      }
      rsp.$promise.then(function (resources) {
        $scope.resources = [];
        if (resources) {
          $scope.resources = resources;
        }
      }, function (error) {
        Notify.show('Error loading campaign resources from server: '+error.statusMessage, 'error');
      });
    }

    function resourceIsDocument(resource) {
      return resource.resourceType !== 'PICTURE' && resource.resourceType !== 'VIDEO';
    }

    function resourceIsMedia(resource) {
      return resource.resourceType === 'PICTURE' || resource.resourceType === 'VIDEO';
    }

    function resourceIsPicture(resource) {
      return resource.resourceType === 'PICTURE';
    }

    function resourceIsVideo(resource) {
      return resource.resourceType === 'VIDEO';
    }

    function documentCount() {
      var selectedCount = this.resources ? this.resources.filter(resource => resource.resourceType !== 'PICTURE' && resource.resourceType !== 'VIDEO').length : 0;
      return selectedCount;
    }

    function mediaCount() {
      var selectedCount = this.resources ? this.resources.filter(resource => resource.resourceType === 'PICTURE' || resource.resourceType === 'VIDEO').length : 0;
      return selectedCount;
    }

    function pictureCount() {
      var selectedCount = this.resources ? this.resources.filter(resource => resource.resourceType === 'PICTURE').length : 0;
      return selectedCount;
    }

    function videoCount() {
      var selectedCount = this.resources ? this.resources.filter(resource => resource.resourceType === 'VIDEO').length : 0;
      return selectedCount;
    }

    function showAssemblyLogo() {
      var show = Campaigns.showAssemblyLogo($scope);
      return show;
    }

    function toggleCommentsSection() {
      $scope.commentsSectionExpanded = !$scope.commentsSectionExpanded;
      $rootScope.$broadcast('eqResize', true); // resize cards to make sure they are rendered well
    }

    function toggleHideCommentsSection() {
      $scope.commentsSectionExpanded = false;
    }

    function loadThemes(query) {
      if (!$scope.campaign) {
        return;
      }
      return Campaigns.themes($scope.assemblyID, $scope.campaignID, $scope.isAnonymous, $scope.campaignID, {query: query});
    }

    function loadGroups(query) {
      if (!$scope.campaign) {
        return;
      }
      return WorkingGroups.workingGroupsInCampaign($scope.assemblyID, $scope.campaignID).query().$promise;
    }

    /**
     * helper that checks if modal is opened
     *
     * @param {string} id - modal ID
     */
    function isModalOpened(id) {
      return this.modals[id];
    }

    /**
     * helper that toggles modal visibility
     *
     * @param {string} id - modal ID
     */
    function toggleModal(id) {
      this.modals[id] = !this.modals[id];
    }

    function defaultErrorCallback(error) {
      Notify.show('Error loading data from server', 'error');
    }

    /**
     * Open a modal using vex library
     */
    function openModal(id) {
      const modalScope = this.$new();
      this.vexInstance = vex.open({
        className: "vex-theme-plain",
        unsafeContent: $compile(document.getElementById(id).innerHTML)(modalScope)[0],
        afterClose: function () {
          // we destroy the scope, so that watchers gets destroyed.
          modalScope.$apply(() => modalScope.$destroy());
        }
      });
    }

    /**
     * Closes the currently open modal.
     */
    function closeModal() {
      this.$broadcast('pagination:reloadCurrentPage');
      this.vexInstance.close();
    }

    /**
     * Called when a new contribution is created. Redirects the current user to the
     * proposal page.
     *
     * @param {Object} contribution
     */
    function redirectToProposal(contribution) {
      // this.closeModal();
      console.log(contribution);
      let group = contribution.workingGroupAuthors && contribution.workingGroupAuthors[0];

      if (group) {
        $state.go('v2.assembly.aid.campaign.workingGroup.contribution.coid', {
          coid: contribution.contributionId,
          aid: $scope.assemblyID,
          cid: $scope.campaignID,
          gid: group.groupId,
        });
      } else {
        $state.go('v2.assembly.aid.campaign.contribution.coid', {
          coid: contribution.contributionId,
          aid: $scope.assemblyID,
          cid: $scope.campaignID
        });
      }
    }

    /**
     * Checks if "Join a Working Group to create proposals" label should be displayed.
     *
     * @param {Object[]} configs
     */
    function checkJoinWGButtonVisibility(configs) {
      if (!this.requireGroupAuthorship) {
        this.displayJoinWorkingGroup = false;
      } else {
        const ENABLE_INDIVIDUAL_PROPOSALS = configs ? configs['appcivist.campaign.enable-individual-proposals'] : null;
        if (!ENABLE_INDIVIDUAL_PROPOSALS || ENABLE_INDIVIDUAL_PROPOSALS.toUpperCase() === 'FALSE') {
          let myGroups = localStorageService.get('myWorkingGroups');
          this.displayJoinWorkingGroup = !myGroups || myGroups.length === 0;
        }
      }
      return this.displayJoinWorkingGroup;
    }

    function checkConfigDisableComments(configs) {
      const DISABLE_CAMPAIGN_COMMENTS = 'appcivist.campaign.disable-campaign-comments';
      let showComments = true;
      if (configs && configs[DISABLE_CAMPAIGN_COMMENTS] && configs[DISABLE_CAMPAIGN_COMMENTS].toUpperCase() === 'TRUE') {
        showComments = false;
      }
      return showComments;
    }

    function checkConfigDisablePublicComments(configs) {
      const DISABLE_CAMPAIGN_COMMENTS = 'appcivist.campaign.disable-public-discussions';
      let showComments = true;
      if (configs && configs[DISABLE_CAMPAIGN_COMMENTS] && configs[DISABLE_CAMPAIGN_COMMENTS].toUpperCase() === 'TRUE') {
        showComments = false;
      }
      return showComments;
    }

    function checkConfigAllowAnonIdeas(configs) {
      const ALLOW_ANON_IDEA = 'appcivist.campaign.allow-anonymous-ideas';
      let newIdeasEnabled = false;
      if ($scope.isAnonymous && configs && configs[ALLOW_ANON_IDEA] && configs[ALLOW_ANON_IDEA].toUpperCase() === 'TRUE') {
        newIdeasEnabled = true;
      }
      return newIdeasEnabled;
    }

    function checkConfigAllowIdeasDuringProposals(configs) {
      const ALLOW_NEW_IDEAS_PROPOSALS = 'appcivist.campaign.enable-ideas-during-proposals';
      let newIdeasEnabled = false;
      if (configs && configs[ALLOW_NEW_IDEAS_PROPOSALS] && configs[ALLOW_NEW_IDEAS_PROPOSALS].toUpperCase() === 'TRUE') {
        newIdeasEnabled = true;
      }
      return newIdeasEnabled;
    }

    function subscribeNewsletter() {
      // Subscribe to newsletter
      let sub = {
        spaceId: $scope.campaign.rsUUID,
        userId: $scope.user.userId,
        spaceType: "CAMPAIGN",
        subscriptionType: "NEWSLETTER"
      }
      Notifications.subscribe($scope.campaign.rsID).save(sub).$promise.then(
        response => {
          $scope.subscribed = true;
          $scope.subscription = response;
          Notify.show("Subscribed successfully! You will begin to receive newsletters every week.", "success");
        },
        error => {
          Notify.show("Error trying to subscribe. Please try again later.", "error")
        }
      );

      // Automatically create also a REGULAR subscription
      let subReg = {
        spaceId: $scope.campaign.rsUUID,
        userId: $scope.user.userId,
        spaceType: "CAMPAIGN",
        subscriptionType: "REGULAR"
      }
      Notifications.subscribe($scope.campaign.rsID).save(subReg).$promise.then(
        response => {
          $scope.subscriptionREG = response;
        },
        error => {
          Notify.show("Error trying to subscribe. Please try again later.", "error");
        }
      );
    }

    function unsubscribeNewsletter() {
      let spaceId = $scope.campaign.rsID
      let subId = $scope.subscription ? $scope.subscription.id : null;
      Notifications.unsubscribe(spaceId, subId).then(
        response => {
          $scope.subscribed = false;
          $scope.subscription = null;

          // Automatically unsubscribe from regular notifications too
          let subId = $scope.subscriptionREG ? $scope.subscriptionREG.id : null;
          Notifications.unsubscribe(spaceId, subId).then(
            response => {
              $scope.subscriptionREG = null;
              Notify.show("Unsubscribed successfully.", "success");
            },
            error => {
              Notify.show("Unsubscribed successfully from newsletters.");
            });
        },
        error => {
          Notify.show("Error trying to unsubscribe. Please try again later.", "error");
        });

    }

    function checkIfSubscribed(sid) {
      // Check newsletter subscription
      if ($scope.user && $scope.user.userId) {
        let res = Notifications.subscriptionsBySpace($scope.user.userId,sid,"NEWSLETTER").query();
        res.$promise.then(
          function (response) {
            let substatus = response.filter(sub => sub ? sub.userId == $scope.user.uuid : false)
            if (substatus.length > 0) {
              $scope.subscription = substatus[0];
              $scope.subscribed = true;
            }
          },
          function (error) {
            Notify.show(error.statusMessage, 'error');
          }
        );
        res = Notifications.subscriptionsBySpace($scope.user.userId,sid,"REGULAR").query();
        res.$promise.then(
          function (response) {
            let substatus = response.filter(sub => sub.userId == $scope.user.uuid);
            if (substatus.length > 0) {
              $scope.subscriptionREG = substatus[0];
            }
          },
          function (error) {
            Notify.show(error.statusMessage, 'error');
          }
        );
      }
    }

    /**
     * Upload the given file to the server. Also, attachs it to
     * the current contribution.
     */
    function submitAttachment() {
      var vm = this;
      this.startSpinner();
      var fd = new FormData();
      fd.append('file', this.newAttachment.file);
      $http.post(FileUploader.uploadEndpoint(), fd, {
        headers: {
          'Content-Type': undefined
        },
        transformRequest: angular.identity,
      }).then(function (response) {
        let resource = {
          name: response.data.name,
          url: response.data.url
        }
        vm.createAttachmentResource(resource, true);
      }, function (error) {
        Notify.show(error.statusMessage, 'error');
      });
    }


    /**
     * Upload the given file to the server. Also, attachs it to
     * the current contribution.
     */
    function submitAttachmentByUrl() {
      var vm = this;
      this.startSpinner();
      let resource = {
        name: this.newAttachment.name,
        url: this.newAttachment.url
      };
      vm.createAttachmentResource(resource, false);
    }
    function sanitizeVideoResourceUrl(url) {
      let ytRegex = (/(http|https):\/\/(youtube\.com|www\.youtube\.com|youtu\.be)/);
      let vimeoRegex = (/(http|https):\/\/(vimeo\.com|www\.vimeo\.com)/);
      let vimeoEmbedRegex = (/(http|https):\/\/(player\.vimeo\.com)/);

      if (ytRegex.test(url)) {
        return url.replace('watch?v=', 'embed/');
      } else if (vimeoRegex.test(url) && !vimeoEmbedRegex.test(url)) {
        return url.replace('vimeo.com','player.vimeo.com/video');
      } else {
        return url;
      }
    }

    /**
     * After the file has been uploaded, we should relate it with the contribution.
     *
     * @param {string} url - The uploaded file's url.
     */
    function createAttachmentResource(resource, isNewUploadedFile) {
      var vm = this;

      let pictureRegex = (/(gif|jpg|jpeg|tiff|png)$/i);
      let videoRegex = (/(gif|jpg|jpeg|tiff|png)$/i);
      let onlineVideoRegex = (/(http|https):\/\/(youtube\.com|www\.youtube\.com|youtu\.be|vimeo\.com|www\.vimeo\.com)/);

      let fileTypeContainingString = resource.name; // If
      let resourceName = resource.name;
      let resourceUrl = resource.url;

      let isPicture = false;
      let isVideo = false;
      let rType = "FILE";

      if (isNewUploadedFile) {
        fileTypeContainingString = this.newAttachment.file.type;
        resourceName = this.newAttachment.name;
        isPicture = pictureRegex.test(fileTypeContainingString);
        if (!isPicture)
          isVideo = videoRegex.test(fileTypeContainingString);
      } else {
        // If is not a new attachment and the resource is added by URL
        // see if it is not a youtube or vimeo video
        isVideo = onlineVideoRegex.test(resourceUrl);
        if (!isVideo)
          isPicture = pictureRegex.test(fileTypeContainingString);
        if (!isPicture && !isVideo)
          isVideo = videoRegex.test(fileTypeContainingString);
      }

      rType = isPicture ? "PICTURE" : isVideo ? "VIDEO" : "FILE";

      // TODO: change for space resource posting
      var attachment = Contributions.newAttachmentObject({ url: resourceUrl, name: resourceName, resourceType: rType});
      var rsp = Space.resources(vm.spaceID).save(attachment).$promise;
      //rsp = Contributions.contributionAttachment(this.assemblyID, this.proposalID).save(attachment).$promise;

      rsp.then(function (response) {
        var type = "Attachments";
        if (!isPicture && !isVideo) {
          if (!vm.resources)
            vm.resources = [];
          response.resourceIsDocument = true;
          vm.resources.push(response);
          vm.openAddAttachment = false;
        } else {
          if (!vm.resources)
            vm.resources = [];
          response.resourceIsMedia = true;
          vm.resources.push(response);
          type = "Media";
        }

        if (isNewUploadedFile) {
          vm.openAddAttachment = false;
        } else {
          vm.openAddAttachmentByUrl = false;
        }

        Notify.show('Attachment saved!. You can see it under "'+type+'"', 'success');
        vm.stopSpinner();
      }, function (error) {
        Notify.show(error.statusMessage, 'error');
        vm.stopSpinner();
      });
    }

    function toggleOpenAddAttachment () {
      $scope.openAddAttachment = !$scope.openAddAttachment;
      $scope.$broadcast("AddResourceForm:ToggleOpenAddAttachment");
    }

    function toggleOpenAddAttachmentByUrl () {
      $scope.openAddAttachment = !$scope.openAddAttachment;
      $scope.openAddAttachmentByUrl = !$scope.openAddAttachmentByUrl;
      $scope.$broadcast("AddResourceForm:ToggleOpenAddAttachmentByUrl");
    }

    function deleteResource(attachment) {
      Space.deleteResource(this.spaceID, attachment.resourceId).then(
        response => {
          _.remove(this.resources, { resourceId: attachment.resourceId });
          Notify.show('Attachment deleted successfully', 'success');
        } ,
        error => {
          Notify.show(error.statusMessage, 'error');
        }
      );
    }

    function createContribution(contributionType = 'PROPOSAL') {
      let payload = {};
      payload.status = "DRAFT";
      payload.title = this.proposalDefaultTitle;
      payload.text = "";
      payload.type = contributionType;
      Pace.restart();
      let rsp = Contributions.contributionInResourceSpace(this.campaign.resourceSpaceId).save(payload).$promise.then(
        contribution => {
          Pace.stop();
          Notify.show('Contribution saved', 'success');
          console.log(contribution);
          redirectToProposal(contribution);
        },
        error => {
          $translate('error.creation.contribution')
            .then(
              errorMsg => {
                let fullErrorMsg = errorMsg + error.data ? error.data.statusMessage ? error.data.statusMessage : "[empty response]" : "[empty response]";
                Notify.show(fullErrorMsg, 'error');
              });

        }
      );
    }
  }
})();
