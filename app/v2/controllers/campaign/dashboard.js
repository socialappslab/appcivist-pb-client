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
    '$sce'
  ];

  function CampaignDashboardCtrl($scope, Campaigns, $stateParams, Assemblies, Contributions, $filter,
    localStorageService, Notify, Memberships, Space, $translate, $rootScope, WorkingGroups, $compile,
    $state, Voting, $sce) {
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
      $scope.ideasSectionExpanded = false;
      $scope.insightsSectionExpanded = false;
      $scope.commentsSectionExpanded = false;
      $scope.showVotingButtons = false;
      $scope.votingStageIsActive = false;
      $scope.vmTimeline = {};
      $scope.filters = {};
      $scope.vmPaginated = {};
      $scope.configsLoaded = false;

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
          $translate.use($scope.user.language);
        }
      }

      $scope.showResourcesSection = false;
      $scope.toggleResourcesSection = toggleResourcesSection.bind($scope);
      $scope.toggleIdeasSection = toggleIdeasSection.bind($scope);
      $scope.toggleInsightsSection = toggleInsightsSection.bind($scope);
      $scope.toggleCommentsSection = toggleCommentsSection.bind($scope);
      $scope.toggleHideIdeasSection = toggleHideIdeasSection.bind($scope);
      $scope.toggleHideCommentsSection = toggleHideCommentsSection.bind($scope);
      $scope.toggleHideInsightsSection = toggleHideInsightsSection.bind($scope);
      $scope.loadThemes = loadThemes.bind($scope);
      $scope.loadGroups = loadGroups.bind($scope);
      $scope.openModal = openModal.bind($scope);
      $scope.closeModal = closeModal.bind($scope);
      $scope.redirectToProposal = redirectToProposal.bind($scope);
      $scope.showAssemblyLogo = showAssemblyLogo.bind($scope);
      $scope.checkJoinWGButtonVisibility = checkJoinWGButtonVisibility.bind($scope);
      $scope.checkConfigOpenIdeasDefault = checkConfigOpenIdeasDefault.bind($scope);
      $scope.checkConfigAllowAnonIdeas = checkConfigAllowAnonIdeas.bind($scope);
      $scope.checkConfigDisableComments = checkConfigDisableComments.bind($scope);
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
      $scope.joinWg = joinWg.bind($scope);
      $scope.loadThemeKeywordDescription = loadThemeKeywordDescription.bind($scope);

      if (!$scope.isAnonymous) {
        $scope.activeTab = "Members";
        loadAssembly();
      }
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
        error => Notify.show("Error while trying to join working group", "error")
      )
    }

    function loadAssembly() {
      $scope.assembly = localStorageService.get('currentAssembly');
      // TODO: if assembly.assemblyId != $stateParams.aid or assembly.uuid != $stateParams.auuid in case of anonymous
      // get the assembly from backend
      verifyMembership($scope.assembly);
    }

    function loadAssemblyPublicProfile() {
      var assemblyShortname = $stateParams.shortname; // for the future move of paths in which everything will be preceded by the assembly shortname

      if (assemblyShortname) {
        var rsp = Assemblies.assemblyByShortName(assemblyShortname).get();
        rsp.$promise.then(function (assembly) {
          $scope.assembly = assembly;
        }, function (error) {
          Notify.show('Error while loading public profile of assembly with shortname', 'error');
        });
      } else {
        var assemblyUUID = $scope.campaign ? $scope.campaign.assemblies ? $scope.campaign.assemblies[0] : null : null;

        if (assemblyUUID) {
          var rsp = Assemblies.assemblyByUUID(assemblyUUID).get();
          rsp.$promise.then(function (assembly) {
            $scope.assembly = assembly;
          }, function (error) {
            Notify.show('Error while loading public profile of assembly by its Universal ID', 'error');
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

          if($scope.isAnonymous) {
             $translate.use($scope.campaign.lang);
          }
          $scope.campaign.rsID = data.resourceSpaceId; // must be always id
          $scope.campaign.rsUUID = data.resourceSpaceUUID;
          $scope.campaign.frsUUID = data.forumResourceSpaceUUID;
          $scope.campaign.forumSpaceID = data.forumResourceSpaceId;
          $scope.spaceID = $scope.isAnonymous ? data.resourceSpaceUUID : data.resourceSpaceId;
          $scope.forumSpaceID = $scope.campaign.forumSpaceID ? $scope.campaign.forumSpaceID : $scope.campaign.frsUUID;
          $scope.showPagination = true;
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
              Notify.show('Error loading themes from server', 'error');
            }
          );
        }
      );
    }

    function loadThemeKeywordDescription(title, content) {
      angular.element('#themes-keywords #description').show().html("<p><strong>"+title+"</strong></p><p>"+content+"</p>");
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
          $scope.campaignBrief = $sce.trustAsHtml(data.brief);
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

    function toggleOpenAddAttachment () {
      $scope.openAddAttachment = !$scope.openAddAttachment;
    }

    function toggleOpenAddAttachmentByUrl () {
      $scope.openAddAttachment = !$scope.openAddAttachment;
      $scope.openAddAttachmentByUrl = !$scope.openAddAttachmentByUrl;
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
        rsp.$promise.then( this.afterLoadingCampaignConfigsSuccess, this.afterLoadingCampaignConfigsError);
      }
    }

    function afterLoadingCampaignConfigsSuccess(data) {
      this.campaignConfigs = data;
      this.afterLoadingCampaignConfigs();
    }

    function afterLoadingCampaignConfigsError(data) {
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
          Notify.show('Error occurred while trying to load working group proposals', 'error');
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
          Notify.show('Error occurred while trying to load working group proposals', 'error');
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
          Notify.show('Error occurred while trying to load discussions', 'error');
        });
    }

    function setSectionsButtonsVisibility(component) {
      let key = component ? component.type ? component.type.toUpperCase() : "" : ""; // In old implementation, it was key, changed to type
      $scope.currentComponentType = key;
      $scope.isIdeasSectionVisible = key === 'PROPOSAL MAKING' || key === 'IDEAS';
      $scope.newProposalsEnabled = key === 'PROPOSALS' && !$scope.isAnonymous;
      if ($scope.campaignConfigs) {
        let configs = $scope.campaignConfigs
        $scope.ideasSectionExpanded = $scope.checkConfigOpenIdeasDefault(configs);
        $scope.showComments = $scope.checkConfigDisableComments(configs);
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
        $scope.ideasSectionExpanded = false; // by default, ideas section is closed
        $scope.showComments = true; // by default, comments are enabled
        $scope.newIdeasEnabled = false; // by default, ideas are not enabled
      }
    }

    function loadCampaignResources() {
      if ($scope.isAnonymous) {
        var rsp = Campaigns.publicResources($scope.campaignID).query();
      } else {
        var rsp = Campaigns.resources($scope.assemblyID, $scope.campaignID).query();
      }
      rsp.$promise.then(function (resources) {
        if (resources) {
          $scope.campaignResources = resources;
        } else {
          $scope.campaignResources = [];
        }
        $scope.documents = $scope.campaignResources.filter(resource => resource.resourceType !== 'PICTURE' && resource.resourceType !== 'VIDEO');
        $scope.media = $scope.campaignResources.filter(resource => resource.resourceType === 'PICTURE' || resource.resourceType === 'VIDEO');
      }, function (error) {
        Notify.show('Error loading campaign resources from server', 'error');
      });
    }

    function showAssemblyLogo() {
      var show = Campaigns.showAssemblyLogo($scope);
      return show;
    }

    function toggleResourcesSection() {
      $scope.showResourcesSection = !$scope.showResourcesSection;
    }

    function toggleIdeasSection() {
      $scope.ideasSectionExpanded = !$scope.ideasSectionExpanded;
      $scope.commentsSectionExpanded = false;
      $scope.insightsSectionExpanded = false;
      // $rootScope.$broadcast('eqResize', true);
    }

    function toggleInsightsSection() {
      $scope.ideasSectionExpanded = false;
      $scope.commentsSectionExpanded = false;
      $scope.insightsSectionExpanded = !$scope.insightsSectionExpanded;
    }

    function toggleCommentsSection() {
      $scope.commentsSectionExpanded = !$scope.commentsSectionExpanded;
      $scope.ideasSectionExpanded = false;
      $scope.insightsSectionExpanded = false;
      // $rootScope.$broadcast('eqResize', true);
    }

    function toggleHideIdeasSection() {
      $scope.ideasSectionExpanded = false;
    }

    function toggleHideCommentsSection() {
      $scope.commentsSectionExpanded = false;
    }

    function toggleHideInsightsSection() {
      $scope.insightsSectionExpanded = false;
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
      this.closeModal();
      let group = contribution.workingGroupAuthors && contribution.workingGroupAuthors[0];

      if (group) {
        $state.go('v2.assembly.aid.campaign.workingGroup.gid.proposal.pid', {
          pid: contribution.contributionId,
          aid: this.assemblyID,
          cid: this.campaignID,
          gid: group.groupId,
        });
      }
    }

    /**
     * Checks if "Join a Working Group to create proposals" label should be displayed.
     *
     * @param {Object[]} configs
     */
    function checkJoinWGButtonVisibility(configs) {
      const ENABLE_INDIVIDUAL_PROPOSALS = configs ? configs['appcivist.campaign.enable-individual-proposals'] : null;
      if (!ENABLE_INDIVIDUAL_PROPOSALS || ENABLE_INDIVIDUAL_PROPOSALS === 'FALSE') {
        let myGroups = localStorageService.get('myWorkingGroups');
        this.displayJoinWorkingGroup = !myGroups || myGroups.length === 0;
      }
      return this.displayJoinWorkingGroup;
    }

    function checkConfigOpenIdeasDefault(configs) {
      const OPEN_IDEA_SECTION = 'appcivist.campaign.open-idea-section-default';
      let ideasSectionExpanded = false;
      if (configs && configs[OPEN_IDEA_SECTION] && configs[OPEN_IDEA_SECTION] === 'TRUE') {
        ideasSectionExpanded = true;
      }
      return ideasSectionExpanded;
    }

    function checkConfigDisableComments(configs) {
      const DISABLE_CAMPAIGN_COMMENTS = 'appcivist.campaign.disable-campaign-comments';
      let showComments = true;
      if (configs && configs[DISABLE_CAMPAIGN_COMMENTS] && configs[DISABLE_CAMPAIGN_COMMENTS] === 'TRUE') {
        showComments = false;
      }
      return showComments;
    }

    function checkConfigAllowAnonIdeas(configs) {
      const ALLOW_ANON_IDEA = 'appcivist.campaign.allow-anonymous-ideas';
      let newIdeasEnabled = false;
      if ($scope.isAnonymous && configs && configs[ALLOW_ANON_IDEA] && configs[ALLOW_ANON_IDEA] === 'TRUE') {
        newIdeasEnabled = true;
      }
      return newIdeasEnabled;
    }

    function checkConfigAllowIdeasDuringProposals(configs) {
      const ALLOW_NEW_IDEAS_PROPOSALS = 'appcivist.campaign.enable-ideas-during-proposals';
      let newIdeasEnabled = false;
      if (configs && configs[ALLOW_NEW_IDEAS_PROPOSALS] && configs[ALLOW_NEW_IDEAS_PROPOSALS] === 'TRUE') {
        newIdeasEnabled = true;
      }
      return newIdeasEnabled;
    }
  }
})();
