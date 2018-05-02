(function () {
  'use strict';

  angular
    .module('appCivistApp')
    .controller('v2.ContributionPageCtrl', ContributionPageCtrl);



  ContributionPageCtrl.$inject = [
    '$scope', 'WorkingGroups', '$stateParams', 'Assemblies', 'Contributions', '$filter',
    'localStorageService', 'Memberships', 'Etherpad', 'Notify', '$rootScope', '$translate',
    'Space', '$http', 'FileUploader', '$sce', 'Campaigns', 'Voting', 'usSpinnerService', 'Notifications', '$timeout', '$interval'
  ];

  function ContributionPageCtrl($scope, WorkingGroups, $stateParams, Assemblies, Contributions,
    $filter, localStorageService, Memberships, Etherpad, Notify, $rootScope,
    $translate, Space, $http, FileUploader, $sce, Campaigns, Voting, usSpinnerService, Notifications, $timeout, $interval) {

    $scope.setAddContext = setAddContext.bind($scope);
    $scope.loadThemes = loadThemes.bind($scope);
    $scope.loadThemesOrAuthor = loadThemesOrAuthor.bind($scope);
    $scope.currentAddQueryChange = currentAddQueryChange.bind($scope);
    $scope.currentAddQueryChangeOnClick = currentAddQueryChangeOnClick.bind($scope);
    $scope.currentAddGetText = currentAddGetText.bind($scope);
    $scope.currentAddOnSelect = currentAddOnSelect.bind($scope);
    $scope.deleteTheme = deleteTheme.bind($scope);
    $scope.addThemeToProposal = addThemeToProposal.bind($scope);
    $scope.loadAuthors = loadAuthors.bind($scope);
    $scope.addAuthorToProposal = addAuthorToProposal.bind($scope);
    $scope.deleteAuthor = deleteAuthor.bind($scope);
    $scope.loadFields = loadFields.bind($scope);
    $scope.loadValues = loadValues.bind($scope);
    $scope.loadCustomFields = loadCustomFields.bind($scope);
    $scope.loadProposal = loadProposal.bind($scope);
    $scope.toggleCustomFieldsSection = toggleCustomFieldsSection.bind($scope);
    $scope.deleteAttachment = deleteAttachment.bind($scope);
    $scope.loadFeedback = loadFeedback.bind($scope);
    $scope.loadBallotPaper = loadBallotPaper.bind($scope);
    $scope.afterLoadingBallotSuccess = afterLoadingBallotSuccess.bind($scope);
    $scope.initializeBallotTokens = initializeBallotTokens.bind($scope);
    $scope.seeHistory = seeHistory.bind($scope);
    $scope.loadUserFeedback = loadUserFeedback.bind($scope);
    $scope.toggleOpenAddAttachment = toggleOpenAddAttachment.bind($scope);
    $scope.toggleOpenAddAttachmentByUrl = toggleOpenAddAttachmentByUrl.bind($scope);
    $scope.sanitizeVideoResourceUrl = sanitizeVideoResourceUrl.bind($scope);
    $scope.toggleAssociateIdea = toggleAssociateIdea.bind($scope);
    $scope.removeContributingIdea = removeContributingIdea.bind($scope);
    $scope.loadReadOnlyEtherpadHTML = loadReadOnlyEtherpadHTML.bind($scope);
    $scope.embedPadGdoc = embedPadGdoc.bind($scope);
    $scope.embedPadPeerDoc = embedPadPeerDoc.bind($scope);
    $scope.loadCampaignResources = loadCampaignResources.bind($scope);
    $scope.filterCustomFields = filterCustomFields.bind($scope);
    $scope.follow = follow.bind($scope);
    $scope.unfollow = unfollow.bind($scope);
    $scope.loadViewsConfig = loadViewsConfig.bind($scope);
    $scope.showSearch = showSearch.bind($scope);
    $scope.hideSearch = hideSearch.bind($scope);
    $scope.authorsChangeOnClick = authorsChangeOnClick.bind($scope);
    $scope.themesChangeOnClick = themesChangeOnClick.bind($scope);
    $scope.keywordsChangeOnClick = keywordsChangeOnClick.bind($scope);
    $scope.loadAllThemes = loadAllThemes.bind($scope);
    $scope.selectTheme = selectTheme.bind($scope);
    $scope.deleteSelectedTheme = deleteSelectedTheme.bind($scope);
    $scope.loadAssemblyConfig = loadAssemblyConfig.bind($scope);
    $scope.currentAddGetTextLdap = currentAddGetTextLdap.bind($scope);
    $scope.descriptionToggleEdit = descriptionToggleEdit.bind($scope);
    $scope.titleToggleEdit = titleToggleEdit.bind($scope);
    $scope.saveDescription = saveDescription.bind($scope);
    $scope.saveTitle = saveTitle.bind($scope);
    $scope.getEditorOptions = getEditorOptions.bind($scope);
    $scope.addNonMemberAuthorToProposal = addNonMemberAuthorToProposal.bind($scope);
    $scope.deleteNonMemberAuthor = deleteNonMemberAuthor.bind($scope);
    $scope.changeStatus = changeStatus.bind($scope);
    $scope.checkCustomHeader = checkCustomHeader.bind($scope);
    $scope.syncProposalWithPeerdoc = syncProposalWithPeerdoc.bind($scope);

    activate();

    function activate() {
      ModalMixin.init($scope);
      $scope.updateFeedback = updateFeedback.bind($scope);
      $scope.submitAttachment = submitAttachment.bind($scope);
      $scope.submitAttachmentByUrl = submitAttachmentByUrl.bind($scope);
      $scope.createAttachmentResource = createAttachmentResource.bind($scope);
      $scope.updateStatusService = updateStatusService.bind($scope);
      $scope.activeTab = 'Public';
      $scope.feedbackBar = false;
      $scope.currentAdd = {
        suggestionsVisible: false,
        context: 'THEMES'
      };
      $scope.toggleFeedbackBar = function (x) {
        $scope.feedbackBar = !$scope.feedbackBar;
      };
      $scope.newAttachment = {};
      $scope.changeActiveTab = function (tab) {
        if (tab == 1) {
          $scope.activeTab = 'Members';
        } else if (tab == 2) {
          $scope.activeTab = 'Public';
        } else {
          $scope.activeTab = 'Feedbacks';
        }
      }
      $scope.isAnonymous = false;
      $scope.userIsMember = false;
      $scope.ideasSectionExpanded = false;
      $scope.commentsSectionExpanded = true;
      $scope.commentType = 'public';
      $scope.openAddAttachment = false;
      // if the param is uuid then is an anonymous user, use endpoints with uuid
      var pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      $scope.startSpinner = startSpinner.bind($scope);
      $scope.stopSpinner = stopSpinner.bind($scope);
      $scope.spinnerOptions = {
        radius:10,
        width:4,
        length: 10,
        top: '75%',
        left: '50%',
        zIndex: 1
      };

      if (pattern.test($stateParams.couuid) === true) {
        $scope.proposalID = $stateParams.couuid;
        $scope.campaignID = $stateParams.cuuid;
        $scope.assemblyID = $stateParams.auuid;
        $scope.groupID = $stateParams.guuid;
        $scope.isAnonymous = true;
        $scope.loadFeedback($scope.proposalID);
      } else if (pattern.test($stateParams.puuid) === true) {
        $scope.proposalID = $stateParams.puuid;
        $scope.campaignID = $stateParams.cuuid;
        $scope.assemblyID = $stateParams.auuid;
        $scope.groupID = $stateParams.guuid;
        $scope.isAnonymous = true;
        $scope.loadFeedback($scope.proposalID);
      } else {
        $scope.assemblyID = ($stateParams.aid) ? parseInt($stateParams.aid) : localStorageService.get('currentAssembly').assemblyId;
        $scope.groupID = ($stateParams.gid) ? parseInt($stateParams.gid) : 0;
        if ($stateParams.coid) {
          $scope.proposalID = parseInt($stateParams.coid);
        } else if ($stateParams.pid) {
          $scope.proposalID = parseInt($stateParams.pid);
        } else {
          $scope.proposalID = 0;
        }
        $scope.campaignID = $stateParams.cid ? parseInt($stateParams.cid) : 0;
        $scope.user = localStorageService.get('user');

        if ($scope.user && $scope.user.language) {
          $translate.use($scope.user.language);
          $scope.userName = $scope.user.name;
        } else {
          const locale = LocaleService.getLocale();
          $translate.use(locale);
        }
        // user is member of Assembly
        $scope.userIsMember = Memberships.isMember("assembly",$scope.assemblyID);
        $scope.userIsGroupMember = Memberships.isMember("group",$scope.groupID);
        $scope.userIsCoordinator = Memberships.isAssemblyCoordinator($scope.assemblyID);
        $scope.userIsAdmin = Memberships.userIsAdmin();

        if ($scope.userIsGroupMember || $scope.userIsCoordinator || $scope.userIsAdmin) {
          $scope.commentType = 'members';
        }
      }
      $scope.etherpadLocale = Etherpad.getLocale();
      $scope.loadProposal($scope);
      $scope.showActionMenu = true;
      $scope.myObject = {};
      $scope.myObject.refreshMenu = function () {
        scope.showActionMenu = !scope.showActionMenu;
      };
      // Read user contribution feedback
      $scope.loadUserFeedback($scope.assemblyID, $scope.campaignID, $scope.proposalID);
      $scope.toggleIdeasSection = toggleIdeasSection.bind($scope);
      $scope.toggleCommentsSection = toggleCommentsSection.bind($scope);
      $scope.cm = {
        isHover: false
      };
      $scope.trustedHtml = function (html) {
        return $sce.trustAsHtml(html);
      };
      $scope.contributionTypeIsSupported = function (type) {
        return Campaigns.isContributionTypeSupported(type, $scope);
      }

      $scope.$watch('commentType', function(value) {
        if (value == 'public') {
          $scope.showCommentType = 'public';
        } else {
          $scope.showCommentType = 'members';
        }
      });
      $scope.resources = {};
      $scope.newDocUrl = "";
      $scope.following = false;

      // Toolbar buttons visibility default
      $scope.showContributingIdeas = true;
      $scope.showHistory = true;
      $scope.showCommentCount = true;
      $scope.showAttachments = true;
      $scope.showFeedback = true;
      $scope.showMedia = true;
      $scope.showUpVote = true;
      $scope.showDownVote = true;

      $scope.authorQuery = "";
      $scope.authorsList = [];
      $scope.authorsSuggestionsVisible = false;
      $scope.themeQuery = "";
      $scope.themesList = [];
      $scope.themesSuggestionsVisible = false;
      $scope.themesLimit = null;
      $scope.keywordQuery = "";
      $scope.keywordsList = [];
      $scope.keywordsSuggestionsVisible = false;

      $scope.allThemes = [];
      $scope.selectedTheme = null;

      $scope.assemblyConfig = []
      $scope.ldap = false;
      $scope.ldapList = [];

      $scope.isDescriptionEdit = false;
      $scope.isTitleEdit = false;
      $scope.isTitleEditable = true;
      $scope.descriptionBackup = null;
      $scope.titleBackup = null;

      $scope.customHeaderFields = [];
      $scope.customHeaderValues = {};

      $scope.tinymceOptions = $scope.getEditorOptions();
      $scope.editIconHTML = "<i class='fa fa-edit smalledit'></i>";
    }

    function toggleOpenAddAttachment () {
      $scope.openAddAttachment = !$scope.openAddAttachment;
    }

    function toggleOpenAddAttachmentByUrl () {
      $scope.openAddAttachment = !$scope.openAddAttachment;
      $scope.openAddAttachmentByUrl = !$scope.openAddAttachmentByUrl;
    }

    function showSearch(id) {
      $('#'+id).show();
      $('#'+id+'Close').show();
    }

    function hideSearch(id) {
      $('#'+id).hide();
      $('#'+id+'Close').hide();
      let ctx = id.replace('Search', '');
      eval('this.'+ctx+'sSuggestionsVisible = false');
    }

    function changeStatus(newValue, oldValue) {
      console.log(this.proposal.status);
      console.log(this.proposal.contributionId);
      console.log(this.assemblyID);
      this.statusBeforeUpdate = oldValue;

      // TODO 1: make a nice modal instead of the alert
      // TODO 2: check if the campaign has a config with the same key as the translation for each alert message. If there is a config, use the text suggested by the config

      if (this.proposal.status === "DRAFT") {
        $translate("contribution.status.private-draft.description").then(
          translation => {
            let customTranslation = this.campaignConfigs['contribution.status.private-draft.description'];
            let confirmation = window.confirm(customTranslation ? customTranslation : translation);
            if (confirmation) this.updateStatusService();
            else this.proposal.status = this.statusBeforeUpdate;
          }
        );
      } else if (this.proposal.status === "PUBLIC_DRAFT") {
        $translate("contribution.status.public-draft.description").then(
          translation => {
            let customTranslation = this.campaignConfigs['contribution.status.public-draft.description'];
            let confirmation = window.confirm(customTranslation ? customTranslation : translation);
            if (confirmation) this.updateStatusService();
            else this.proposal.status = this.statusBeforeUpdate;
          }
        );
      } else if (this.proposal.status === "PUBLISHED") {
        $translate("contribution.status.published.description").then(
          translation => {
            let customTranslation = this.campaignConfigs['contribution.status.published.description'];
            let confirmation = window.confirm(customTranslation ? customTranslation : translation);
            if (confirmation) this.updateStatusService();
            else this.proposal.status = this.statusBeforeUpdate;
          }
        );
      }
    }

    function updateStatusService() {
      let rsp = Contributions.updateStatus(this.assemblyID, this.proposal.contributionId, this.proposal.status).update().$promise;
      console.log(rsp);
      rsp.then(
        rs => {
          console.log(rs);
          Notify.show('Status updated successfully', 'success');
        },
        error => {
          this.proposal.status = this.statusBeforeUpdate;
          Notify.show(error.data ? error.data.statusMessage ? error.data.statusMessage : '' : '', 'error')
        }
      );
    }

    function startSpinner () {
      this.spinnerActive = true;
      usSpinnerService.spin('contributions-page');
    }

    function stopSpinner () {
      usSpinnerService.stop('contributions-page');
      this.spinnerActive = false;
    }
    // Feedback update
    function updateFeedback(value) {
      //console.log(value);
      if (value === 'up') {
        $scope.userFeedback.up = true;
        $scope.userFeedback.down = false;
      } else if (value === 'down') {
        $scope.userFeedback.up = false;
        $scope.userFeedback.down = true;
      } else if (value === 'fav') {
        $scope.userFeedback.fav = true;
      } else if (value === 'flag') {
        $scope.userFeedback.flag = true;
      }

      // Delete the id of the user feedback if there is one
      delete $scope.userFeedback.id;

      var feedback = Contributions.userFeedback($scope.assemblyID, $scope.campaignID, $scope.proposalID).update($scope.userFeedback);
      feedback.$promise.then(
        function (newStats) {
          $scope.proposal.stats = newStats;
          $scope.proposal.informalScore = Contributions.getInformalScore($scope.proposal);
          $scope.upSum = $scope.proposal.stats.ups;
          $scope.downSum = $scope.proposal.stats.downs;
          $scope.flagSum = $scope.proposal.stats.flags;
          // average of need, feasibility, benefict
          $scope.needAvg = $scope.proposal.stats.averageNeed;
          $scope.feasibilityAvg = $scope.proposal.stats.averageFeasibility;
          $scope.benefictAvg = $scope.proposal.stats.averageBenefit;
          $scope.totalComments = $scope.proposal.commentCount + $scope.proposal.forumCommentCount;
        },
        function (error) {
          Notify.show(error.data ? error.data.statusMessage ? error.data.statusMessage : '' : '', 'error');
        }
      );
    };

    function loadReadOnlyEtherpadHTML() {
      let rsp;
      if ($scope.isAnonymous) {
        rsp = Etherpad.getReadOnlyHtmlPublic(this.proposalID).get();
      } else {
        rsp = Etherpad.getReadOnlyHtml(this.assemblyID, this.campaignID, this.proposalID).get();
      }

      rsp.$promise.then(
        data => {
          $scope.padHTML = data;
          angular.element(document).ready(function () {
            let iframe = document.getElementById('etherpadHTML');
            let iframedoc = iframe.contentDocument || iframe.contentWindow.document;
            iframedoc.body.innerHTML = $scope.padHTML.text;
          });
        },
        error => Notify.show(error.data ? error.data.statusMessage ? error.data.statusMessage : '' : '', 'error')
      )
    }

    function loadProposal(scope) {
      let vm = this;
      var rsp;

      if (scope.isAnonymous) {
        rsp = Contributions.getContributionByUUID(scope.proposalID).get();
      } else {
        rsp = Contributions.contribution(scope.assemblyID, scope.proposalID).get();
      }
      rsp.$promise.then(
        function (data) {
          data.informalScore = Contributions.getInformalScore(data);
          $scope.proposal = data;
          console.log($scope.proposal);
          //$scope.proposal.status = $scope.proposal.status.replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.substr(1).toLowerCase());
          localStorageService.set('currentContribution',$scope.proposal);
          $scope.proposal.frsUUID = data.forumResourceSpaceUUID;
          var workingGroupAuthors = data.workingGroupAuthors;
          var workingGroupAuthorsLength = workingGroupAuthors ? workingGroupAuthors.length : 0;
          $scope.group = workingGroupAuthorsLength ? data.workingGroupAuthors[0] : null;
          scope.contributionType = $scope.proposal.type;
          scope.associatedContributionsType = 'IDEA';
          $scope.wg = $scope.group;

          if ($scope.group) {
            $scope.group.profilePic = {
              urlAsString: $scope.group.profile.icon
            }
          }

          if (scope.isAnonymous) {
            const campaignIds = data.campaignUuids;
            const campaignIdsLength = campaignIds ? campaignIds.length : 0;
            $scope.campaignID = campaignIdsLength ? campaignIds[0] : 0;
            $translate.use($scope.proposal.lang);
          }

          if (data.extendedTextPad) {
            console.log("Document is "+data.extendedTextPad.resourceType);
            $scope.extendedTextIsEtherpad = data.extendedTextPad.resourceType === 'PAD';
            $scope.extendedTextIsGdoc = data.extendedTextPad.resourceType === 'GDOC';
            $scope.extendedTextIsPeerDoc = data.extendedTextPad.resourceType === 'PEERDOC';
            if ($scope.extendedTextIsEtherpad) {
              $scope.etherpadReadOnlyUrl = $sce.trustAsResourceUrl(
                Etherpad.embedUrl(data.extendedTextPad.readOnlyPadId, data.publicRevision, data.extendedTextPad.url)
                  + "&userName=" + $scope.userName + '&showControls=false&lang=' + $scope.etherpadLocale);
              $scope.loadReadOnlyEtherpadHTML();
            } else if ($scope.extendedTextIsGdoc) {
              $scope.gdocUrl = $sce.trustAsResourceUrl(data.extendedTextPad.url);
              $scope.gdocUrlMinimal = $sce.trustAsResourceUrl($scope.gdocUrl +"?rm=minimal");
            } else if ($scope.extendedTextIsPeerDoc) {
              $scope.peerDocUrlMinimal = $sce.trustAsResourceUrl(data.extendedTextPad.url+"?embed=true");
              $scope.peerDocUrl = $sce.trustAsResourceUrl(data.extendedTextPad.url+"&embed=true");
              $timeout(() => {
                $interval(() => {
                  $scope.syncProposalWithPeerdoc();
                }, 10000);
              }, 6000);
              // $scope.gdocUrlMinimal = $scope.gdocUrl +"?rm=minimal";
            }
          } else {
            console.warn('Proposal with no PAD associated');
          }

          if (!scope.isAnonymous) {
            var rsp = Campaigns.components($scope.assemblyID, $scope.campaignID);
            rsp.then(function (components) {
              var currentComponent = Campaigns.getCurrentComponent(components);
              currentComponent = currentComponent ? currentComponent : {}; // make sure currentComponent var is null-
              localStorageService.set('currentCampaign.currentComponent', currentComponent);
              // we always show readonly etherpad url if current component type is not IDEAS nor PROPOSALS
              if (currentComponent.type === 'IDEAS' || currentComponent.type === 'PROPOSALS') {
                verifyAuthorship(scope.proposal, $scope.extendedTextIsEtherpad);
              } else {
                verifyAuthorship(scope.proposal, false);
              }
              if (currentComponent.type == 'PROPOSALS' || currentComponent.type == 'IDEAS') {
                scope.isProposalIdeaStage = true;
              } else {
                scope.isProposalIdeaStage = false;
                if (currentComponent.type == 'VOTING') {
                  scope.isVotingStage = true;
                }
              }

              scope.$broadcast("ContributionPage:CurrentComponentReady", scope.isProposalIdeaStage);
            }, function (error) {
              Notify.show(error.data ? error.data.statusMessage ? error.data.statusMessage : '' : '', 'error');
            });
            vm.loadValues(vm.proposal.resourceSpaceId);
          } else {
            var rsp = Campaigns.componentsByCampaignUUID($scope.campaignID).query().$promise;

            rsp.then(function (components) {
              var currentComponent = Campaigns.getCurrentComponent(components);
              currentComponent = currentComponent ? currentComponent : {}; // make sure currentComponent var is null-
              localStorageService.set('currentCampaign.currentComponent', currentComponent);
              // we always show readonly etherpad url if current component type is not IDEAS nor PROPOSALS
              if (currentComponent.type == 'PROPOSALS' || currentComponent.type == 'IDEAS') {
                scope.isProposalIdeaStage = true;
              } else {
                scope.isProposalIdeaStage = false;
                if (currentComponent.type == 'VOTING') {
                  scope.isVotingStage = true;
                }
              }

              scope.$broadcast("ContributionPage:CurrentComponentReady", scope.isProposalIdeaStage);
            }, function (error) {
              Notify.show(error.data ? error.data.statusMessage ? error.data.statusMessage : '' : '', 'error');
            });
            vm.loadValues(vm.proposal.resourceSpaceUUID, true);
          }
          loadRelatedContributions();
          loadRelatedStats();
          loadCampaign();
          loadAssemblyConfig();
          loadResources();
          $scope.loadCampaignResources();
        },
        function (error) {
          Notify.show('Error occured when trying to load contribution: ' + error.data ? error.data.statusMessage ? error.data.statusMessage : '' : '', 'error');
        }
      );
    }

    function loadBallotPaper() {
      // Only users can vote
      if (!$scope.isAnonymous) {
        if ($scope.campaign && $scope.campaign.currentBallot) {
          $scope.campaignBallot = $scope.campaign.ballotIndex[$scope.campaign.currentBallot];
          $scope.votingSignature = $scope.user.uuid;
          // read user's ballot paper
          let rsp = Voting.ballotPaper($scope.campaign.currentBallot, $scope.user.uuid).get();
          rsp.$promise.then($scope.afterLoadingBallotSuccess, $scope.afterLoadingBallotError);
        } else {
          $scope.ballotPaperNotFound = true;
        }
      } else {
          $scope.ballotPaperNotFound = true;
      }
    }

    function afterLoadingBallotSuccess (data) {
      this.ballotPaperNotFound = false;
      this.ballotPaper = data;
      if (this.ballotPaper) {
        this.ballot = this.ballotPaper.ballot; // the voting ballot, which holds voting configs
        this.candidates = this.ballot ? this.ballot.candidates : null;

        // if no candates, disable voting
        if(this.candidates) {
          this.candidatesIndex = this.ballot ? this.ballot.candidatesIndex : null;
          this.voteRecord = this.ballotPaper.vote; // the ballot paper, which holds the votes of the user
          this.ballotPaperFinished = this.voteRecord.status>0;
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

          let candidateIdx = this.candidatesIndex[this.proposal.uuid];
          let candidate = this.candidates[candidateIdx];
          let candidateId = candidate.id;
          if (candidateId) {
            let voteIndex = this.votesIndex[candidateId];
            if (voteIndex>=0) {
              this.vote = this.votes[voteIndex];
            } else {
              this.vote = {
                "candidate_id": candidateId,
                "value": this.ballot.voting_system_type === "PLURALITY" ? "" : 0
              }
            }
          } else {
            this.noCandidate = true;
          }
        } else {
          this.noCandidate = true;
        }
      }
    }

    function afterLoadingBallotError (error) {
      this.ballotPaperNotFound = true;
      this.noCandidate = true;
      console.log("Ballot paper does not exist yet. Using Ballot information in the campaign");
    }

    function initializeBallotTokens () {
      let max = this.ballot ? parseInt(this.ballot.votes_limit) : 0;
      this.ballotTokens = { "points": max, "max": max};
      let remaining = max;
      let index;
      for (index = 0; index < this.votes.length; ++index) {
        let value = this.votes[index].value;
        let intValue = value ? parseInt(value) : 0;
        remaining > 0 ? remaining -= intValue : 0;
      }
      this.ballotTokens.points = remaining;
    }

    /**
     * Verify current user authorship status.
     *
     * @param {Object} proposal
     * @param {boolean} extendedTextIsPad - whether we should verify read/write etherpad URL.
     */
    function verifyAuthorship(proposal, extendedTextIsPad) {
      // Check Authorship
      // 1. Check if user is in the list of authors
      $scope.userIsAuthor = Contributions.verifyAuthorship($scope.user, proposal);

      // 2. If is not in the list of authorships, check if the user is member of one of the responsible groups
      if (!$scope.userIsAuthor && $scope.group && $scope.group.groupId) {
        // From 2017-11-01, group editing is only possible if config GROUP_EDITING is true
        $scope.userIsGroupMember = Memberships.isMember("group",$scope.group.groupId);
        //
        let groupMembershipEnabledConfig = $scope.campaignConfigs ? $scope.campaignConfigs['appcivist.campaign.enable-group-authorship'] : null;
        if (groupMembershipEnabledConfig) {
          if (groupMembershipEnabledConfig === "TRUE") {
            $scope.userIsAuthor = $scope.userIsGroupMember;
            if (extendedTextIsPad)
              loadEtherpadWriteUrl(proposal);
          }
        }
      } else if ($scope.userIsAuthor && extendedTextIsPad) {
        if ($scope.extendedTextIsEtherpad) {
          loadEtherpadWriteUrl(proposal);
        }
      } else if ($scope.userIsAuthor && $scope.extendedTextIsGdoc) {
        // TODO: load the write embed url for gdoc
        $scope.writegDocUrl = $scope.gdocUrl+"/edit?rm=full";
      } else if ($scope.userIsAuthor && $scope.extendedTextIsPeerDoc) {
        // TODO: load the write embed url for gdoc
        $scope.writePeerDocUrl = $scope.peerDocUrl;//+"/edit?rm=full";
      }
    }

    function loadEtherpadWriteUrl(proposal) {
      if (proposal.extendedTextPad) {
        var etherpadRes = Etherpad.getReadWriteUrl($scope.assemblyID, proposal.contributionId).get();
        etherpadRes.$promise.then(function (pad) {
          $scope.etherpadReadWriteUrl = Etherpad.embedUrl(pad.padId,null,proposal.extendedTextPad.url, true) + '&userName=' + $scope.userName + '&lang=' + $scope.etherpadLocale;
        });
      }
    }

    $scope.createArray = function (num) {
      var total = 4;
      var arr = [];
      for (var i = 0; i < num; i++) {
        arr.push("star-filled");
      }
      for (var i = num; i <= 4; i++) {
        arr.push("star-empty");
      }
      return arr;
    }

    function loadRelatedContributions() {
      $scope.proposal.rsUUID = $scope.proposal.resourceSpaceUUID;
      $scope.proposal.rsID = $scope.proposal.resourceSpaceId;
      var rsp = Space.getContributions($scope.proposal, 'IDEA', $scope.isAnonymous);
      rsp.then(
        function (data) {
          var related = [];
          angular.forEach(data.list, function (r) {
            if (r.contributionId === $scope.proposalID) {
              return;
            }
            related.push(r);
          });
          $scope.resources.relatedContributions = related;
        },
        function (error) {
          Notify.show(error.data ? error.data.statusMessage ? error.data.statusMessage : '' : '', 'error');
        }
      );
    }

    function loadRelatedStats() {
      var contrib = $scope.proposal;
      // sum of ups, downs and flags
      $scope.upSum = contrib.stats.ups;
      $scope.downSum = contrib.stats.downs;
      $scope.flagSum = contrib.stats.flags;
      // average of need, feasibility, benefict
      $scope.needAvg = contrib.stats.averageNeed;
      $scope.feasibilityAvg = contrib.stats.averageFeasibility;
      $scope.benefictAvg = contrib.stats.averageBenefit;
      $scope.totalComments = contrib.commentCount + contrib.forumCommentCount;
    }

    function loadIndividualFeedbacks() {
      var contrib = $scope.proposal;
      // prepare query based on review conditions
    }

    function toggleIdeasSection() {
      $scope.ideasSectionExpanded = !$scope.ideasSectionExpanded;
      $scope.commentsSectionExpanded = !$scope.commentsSectionExpanded;
    }

    function toggleCommentsSection() {
      $scope.commentsSectionExpanded = !$scope.commentsSectionExpanded;
      $scope.ideasSectionExpanded = !$scope.ideasSectionExpanded;
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
        Notify.show(error.data ? error.data.statusMessage ? error.data.statusMessage : '' : '', 'error');
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

    function toggleAssociateIdea() {
      $scope.openAssociateIdeaForm = !$scope.openAssociateIdeaForm;
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

      var attachment = Contributions.newAttachmentObject({ url: resourceUrl, name: resourceName, resourceType: rType});
      var rsp = Contributions.contributionAttachment(this.assemblyID, this.proposalID).save(attachment).$promise;

      rsp.then(function (response) {
        var type = "Attachments";
        if (!isPicture && !isVideo) {
          if (!vm.resources.documents)
            vm.resources.documents = [];
          vm.resources.documents.push(response);
          vm.openAddAttachment = false;
        } else {
          if (!vm.resources.media)
            vm.resources.media = [];
          vm.resources.media.push(response);
          type = "Media";
          if (isPicture) {
            if (!vm.resources.pictures)
              vm.resources.pictures = [];
            vm.resources.pictures.push(response);
          }
        }

        if (isNewUploadedFile) {
          vm.openAddAttachment = false;
        } else {
          vm.openAddAttachmentByUrl = false;
        }

        Notify.show('Attachment saved!. You can see it under "'+type+'"', 'success');
        vm.stopSpinner();
      }, function (error) {
        Notify.show(error.data ? error.data.statusMessage ? error.data.statusMessage : '' : '', 'error');
        vm.stopSpinner();
      });
    }

    function textAsHtml() {
      var vm = this;
      return $sce.trustAsHtml(vm.contribution ? vm.contribution.text : "");
    }

    function textAsHtmlLimited(limit) {
      var vm = this;
      if (vm.contribution && vm.contribution.text) {
        var limitedText = limitToFilter(vm.contribution.text, limit)
        if (vm.contribution.text.length > limit) {
          limitedText += "...";
        }

        vm.trustedHtmlText = $sce.trustAsHtml(limitedText);
      }

      return vm.trustedHtmlText;
    }

    function loadCampaign() {
      $scope.campaign = localStorageService.get('currentCampaign');

      if ($scope.campaign && $scope.campaign.campaignID === $scope.campaignID) {
        $scope.campaign.rsID = $scope.campaign.resourceSpaceId;
        loadCampaignConfig();
        loadCustomFields();
        checkIfFollowing($scope.campaign.rsID);
      } else {
        var res;
        if ($scope.isAnonymous) {
          res = Campaigns.campaignByUUID($scope.campaignID).get();
        } else {
          res = Campaigns.campaign($scope.assemblyID, $scope.campaignID).get();
        }

        res.$promise.then(function (data) {
          $scope.campaign = data;
          $scope.campaign.rsID = data.resourceSpaceId;
          // update current campaign reference
          localStorageService.set('currentCampaign', data);
          loadCampaignConfig();
          loadCustomFields();
          checkIfFollowing($scope.campaign.rsID);
        }, function (error) {
          Notify.show(error.data ? error.data.statusMessage ? error.data.statusMessage : '' : '', 'error');
        });
      }
    }

    function loadResources() {
      var res;
      if ($scope.isAnonymous) {
        res = Space.resourcesByUUID($scope.proposal.resourceSpaceUUID).query();
      } else {
        res = Space.resources($scope.proposal.resourceSpaceId).query();
      }
      res.$promise.then(function (data) {
        $scope.resources.all = data || [];
        loadPictureResources();
        loadDocuments();
        loadMedia();
      }, function(error) {
        Notify.show(error.data ? error.data.statusMessage ? error.data.statusMessage : '' : '', 'error');
      });
    }

    function loadPictureResources() {
      $scope.resources.pictures = $scope.resources.all.filter(resource => resource.resourceType !== 'PICTURE');
      if ($scope.proposal.cover) {
        $scope.resources.pictures.push($scope.proposal.cover);
      }
    }

    function loadDocuments() {
      $scope.resources.documents = $scope.resources.all.filter(resource => resource.resourceType !== 'PICTURE' && resource.resourceType !== 'VIDEO');
    }

    function loadMedia() {
      $scope.resources.media = $scope.resources.all
        .filter(resource => resource.resourceType === 'PICTURE' || resource.resourceType === 'VIDEO')
        .map((obj) => {
          if (obj.resourceType === 'VIDEO') {
            obj.embedUrl = $scope.sanitizeVideoResourceUrl(obj.url);
          }
          return obj;
        });
    }

    function loadCampaignConfig() {
      let rsp;
      if ($scope.campaign && $scope.campaign.rsID) {
        rsp = Campaigns.getConfiguration($scope.campaign.rsID).get();
      } else {
        rsp = Campaigns.getConfigurationPublic($scope.campaign.resourceSpaceUUID).get();
      }
      rsp.$promise.then(function (data) {
        $scope.campaignConfigs = data;
        $scope.themesLimit = $scope.campaignConfigs['appcivist.campaign.themes-number-limit'] ? $scope.campaignConfigs['appcivist.campaign.themes-number-limit'] : -1;
        if ($scope.themesLimit == 1) {
          loadAllThemes();
          $scope.selectedTheme = $scope.proposal.themes ? $scope.proposal.themes[0] : null;
        }
        loadBallotPaper();
        loadViewsConfig();
      }, function (error) {
        loadBallotPaper();
        Notify.show(error.data ? error.data.statusMessage ? error.data.statusMessage : '' : '', 'error');
      });
    }

    function loadAssemblyConfig() {
      let vm = $scope;
      let rsp = Assemblies.assembly($scope.assemblyID).get().$promise;
      rsp.then(
        assembly => {
          let ans = Space.configsByUUID(assembly.resourcesResourceSpaceUUID).get();
          ans.$promise.then(function(data){
            vm.assemblyConfig = data;
            vm.ldap = data['appcivist.assembly.authentication.ldap'] ? data['appcivist.assembly.authentication.ldap'].toLowerCase() === 'true' : false;
          }, function(error) {
            Notify.show(error.data ? error.data.statusMessage ? error.data.statusMessage : '' : '', 'error');
          });
        }, error => {
          Notify.show(error.data ? error.data.statusMessage ? error.data.statusMessage : '' : '', 'error');
        }
      )
    }

    function loadAllThemes() {
      let filters = {
        query: '',
        themeType: 'OFFICIAL_PRE_DEFINED'
      }
      let rsp = Campaigns.themes($scope.assemblyID, $scope.campaign.campaignId, $scope.isAnonymous, $scope.campaign.uuid, filters);
      rsp.then(
        themes => {
          $scope.allThemes = themes;
        },
        error => {
          Notify.show(error.data ? error.data.statusMessage ? error.data.statusMessage : '' : '', 'error');
        }
      );
    }

    function deleteSelectedTheme() {
      let vm = this;
      let keywords = this.proposal.themes.filter(v => v.type == 'EMERGENT');
      this.proposal.themes = keywords;
      Contributions.deleteTheme(this.proposal.uuid, this.selectedTheme.themeId).then(
        response => {
          Notify.show('Theme deleted successfully', 'success')
          vm.selectedTheme = null;
        },
        error => {
          Notify.show(error.data ? error.data.statusMessage ? error.data.statusMessage : '' : '', 'error');
        }
      );
    }

    function loadViewsConfig() {
      let showContributingIdeasConf = $scope.campaignConfigs['appcivist.campaign.contribution.toolbar.contributing-ideas'];
      let showHistoryConf = $scope.campaignConfigs['appcivist.campaign.contribution.toolbar.history'];
      let showCommentCountConf = $scope.campaignConfigs['appcivist.campaign.contribution.toolbar.comment-count'];
      let showAttachmentsConf = $scope.campaignConfigs['appcivist.campaign.contribution.toolbar.attachments'];
      let showFeedbackConf = $scope.campaignConfigs['appcivist.campaign.contribution.toolbar.feedback'];
      let showMediaConf = $scope.campaignConfigs['appcivist.campaign.contribution.toolbar.media'];
      let showUpVoteConf = $scope.campaignConfigs['appcivist.campaign.contribution.toolbar.up-vote'];
      let showDownVoteConf = $scope.campaignConfigs['appcivist.campaign.contribution.toolbar.down-vote'];
      let showProposalIntroInfoConf = $scope.campaignConfigs['appcivist.campaign.contribution.body.proposal-info'];
      let showBodyDescriptionConf = $scope.campaignConfigs['appcivist.campaign.contribution.body.description'];
      let showBodyDescriptionTitleConf = $scope.campaignConfigs['appcivist.campaign.contribution.body.description.title'];
      let showBodyProposalConf = $scope.campaignConfigs['appcivist.campaign.contribution.body.proposal'];
      let showBodyProposalTitleConf = $scope.campaignConfigs['appcivist.campaign.contribution.body.proposal.title'];
      let showCustomFieldsConf = $scope.campaignConfigs['appcivist.campaign.contribution.custom-fields'];
      let showCustomFieldsTitleConf = $scope.campaignConfigs['appcivist.campaign.contribution.custom-fields.title'];
      let showCustomFieldsHeaderConf = $scope.campaignConfigs['appcivist.campaign.contribution.custom-fields.header'];
      let showMediaCarouselConf = $scope.campaignConfigs['appcivist.campaign.contribution.media-carousel'];
      let showDescriptionRichTextEditConf = $scope.campaignConfigs['appcivist.campaign.contribution.description.richtext-editor'];
      let allowChangeStatusConf = $scope.campaignConfigs['appcivist.campaign.contribution.status.change-enabled'];
      let showInstructionsConf = $scope.campaignConfigs['appcivist.campaign.components.display-instructions'];

      $scope.showContributingIdeas  = showContributingIdeasConf ? showContributingIdeasConf.toLowerCase()  === 'false' ? false : true : true;
      $scope.showHistory = showHistoryConf ? showHistoryConf.toLowerCase()  === 'false' ? false : true : true;
      $scope.showCommentCount = showCommentCountConf ? showCommentCountConf.toLowerCase()  === 'false' ? false : true : true;
      $scope.showAttachments = showAttachmentsConf ? showAttachmentsConf.toLowerCase()  === 'false' ? false : true : true;
      $scope.showFeedback = showFeedbackConf ? showFeedbackConf.toLowerCase()  === 'false' ? false : true : true;
      $scope.showMedia = showMediaConf ? showMediaConf.toLowerCase()  === 'false' ? false : true : true;
      $scope.showUpVote = showUpVoteConf ? showUpVoteConf.toLowerCase()  === 'false' ? false : true : true;
      $scope.showDownVote = showDownVoteConf ? showDownVoteConf.toLowerCase()  === 'false' ? false : true : true;
      $scope.showProposalIntroInfo = showProposalIntroInfoConf ? showProposalIntroInfoConf.toLowerCase() === 'false' ? false : true : true;
      $scope.showBodyDescription = showBodyDescriptionConf ? showBodyDescriptionConf.toLowerCase() === 'false' ? false : true : true;
      $scope.showBodyDescriptionTitle = showBodyDescriptionTitleConf ? showBodyDescriptionTitleConf.toLowerCase() === 'false' ? false : true : true;
      $scope.showBodyProposal = showBodyProposalConf ? showBodyProposalConf.toLowerCase() === 'false' ? false : true : true;
      $scope.showBodyProposalTitle = showBodyProposalTitleConf ? showBodyProposalTitleConf.toLowerCase() === 'false' ? false : true : true;
      $scope.showCustomFields = showCustomFieldsConf ? showCustomFieldsConf.toLowerCase() === 'false' ? false : true : true;
      $scope.showCustomFieldsTitle = showCustomFieldsTitleConf ? showCustomFieldsTitleConf.toLowerCase() === 'false' ? false : true : true;
      $scope.showCustomFieldsHeader = showCustomFieldsHeaderConf ? showCustomFieldsHeaderConf.toLowerCase() === 'false' ? false : true : true;
      $scope.showMediaCarousel = showMediaCarouselConf ? showMediaCarouselConf.toLowerCase() === 'false' ? false : true : true;
      $scope.showDescriptionRichTextEdit = showDescriptionRichTextEditConf ? showDescriptionRichTextEditConf.toLowerCase() === 'false' ? false : true : true;
      $scope.allowChangeStatus = allowChangeStatusConf ? allowChangeStatusConf.toLowerCase() === 'false' ? false : true : true;
      $scope.showInstructions = showInstructionsConf ? showInstructionsConf.toLowerCase() === 'false' ? false : true : true;
    }

    function seeHistory() {
      console.log('Fired event: "ContributionPage:SeeHistory"');
      $scope.$broadcast('ContributionPage:SeeHistory');
    }
    /**
     * Sets the context of add button y page header.
     * @param {string} ctx AUTHORS | THEMES
     */
    function setAddContext(ctx) {
      this.currentAdd.context = ctx;
    }

    function currentAddQueryChangeOnClick() {
      this.currentAdd.suggestionsVisible = !this.currentAdd.suggestionsVisible;
      if (this.currentAdd.query === undefined || this.currentAdd.query === null || this.currentAdd.query === "") {
        this.currentAdd.query = "";
        this.loadThemesOrAuthor();
      }
    }

    function currentAddQueryChange() {
      this.currentAdd.suggestionsVisible = this.currentAdd.query.length > 0;
      this.loadThemesOrAuthor();
    }

    function authorsChangeOnClick() {
      this.setAddContext('AUTHORS');
      this.authorsSuggestionsVisible = true;
      let vm = this;
      let rsp = Assemblies.assemblyMembers(this.assemblyID, this.ldap, this.authorQuery).get().$promise;
      rsp.then(
        data => {
          let items = data.members.filter(d => d.status === 'ACCEPTED').map(d => d.user);
          items = $filter('filter')(items, { $: vm.authorQuery });
          vm.authorsList = items;
          if (this.ldap) {
            let items = data.ldap;
            items = $filter('filter')(items, { $: vm.authorQuery });
            vm.ldapList = items;
          }
        },
        function (error) {
          Notify.show(error.data ? error.data.statusMessage ? error.data.statusMessage : '' : '', 'error');
        }
      );
    }

    function themesChangeOnClick() {
      this.setAddContext('THEMES');
      this.themesSuggestionsVisible = true;
      let vm = this;
      let filters = {
        query: vm.themeQuery,
        themeType: 'OFFICIAL_PRE_DEFINED'
      }
      let rsp = Campaigns.themes(this.assemblyID, this.campaign.campaignId, this.isAnonymous, this.campaign.uuid, filters);
      rsp.then(
        themes => {
          vm.themesList = $filter('filter')(themes, queryThemes(vm.themeQuery));
        },
        error => {
          Notify.show(error.data ? error.data.statusMessage ? error.data.statusMessage : '' : '', 'error');
        }
      );
    }

    function keywordsChangeOnClick() {
      this.setAddContext('KEYWORDS');
      this.keywordsSuggestionsVisible = true;
      let vm = this;
      let filters = {
        query: vm.keywordsQuery,
        themeType: 'EMERGENT'
      }
      let rsp = Campaigns.themes(this.assemblyID, this.campaign.campaignId, this.isAnonymous, this.campaign.uuid, filters);
      rsp.then(
        keywords => {
          vm.keywordsList = $filter('filter')(keywords, queryThemes(vm.keywordsQuery));
        },
        error => {
          Notify.show(error.data ? error.data.statusMessage ? error.data.statusMessage : '' : '', 'error');
        }
      );
    }

    /**
     * Returns the text to display in the suggestion list.
     *
     * @param {Object} item
     */
    function currentAddGetText(item) {
      if (this.currentAdd.context === 'AUTHORS') {
        return $sce.trustAsHtml(`
          <img src="${item.profilePic ? item.profilePic.url ? item.profilePic.url : '../assets/images/avatar.png' : '../assets/images/avatar.png'}" style="height: 30px; width: 30px; border-radius: 50px;">
          <span style="margin-left: 15px;vertical-align:super">${(item.name === null || item.name === undefined || item.name === "" || item.name === " ") ? item.email : item.name}</span>`);
      } else {
        return $sce.trustAsHtml(`<span style="padding-top: 15px; display: inline-block;">${item.title}</span>`);
      }
    }

    function currentAddGetTextLdap(item) {
      if (this.currentAdd.context === 'AUTHORS') {
        return $sce.trustAsHtml(`
          <img src="${item.profilePic ? item.profilePic.url ? item.profilePic.url : '../assets/images/avatar.png' : '../assets/images/avatar.png'}" style="height: 30px; width: 30px; border-radius: 50px;">
          <span style="margin-left: 15px;vertical-align:super">${(item.cn === null || item.cn === undefined || item.cn === "" || item.cn === " ") ? item.mail : item.cn}</span>`);
      } else {
        return $sce.trustAsHtml(`<span style="padding-top: 15px; display: inline-block;">${item.title}</span>`);
      }
    }

    /**
     * on-select handler.
     *
     * @param {Object} item
     */
    function currentAddOnSelect(item, ldap = false) {
      this.currentAdd.suggestionsVisible = false;
      this.currentAdd.query = '';

      if (this.currentAdd.context === 'AUTHORS') {
        if (!ldap) this.addAuthorToProposal(item);
        else this.addNonMemberAuthorToProposal(item);
        this.authorsSuggestionsVisible = false;
        $("#authorSearch").hide();
        $('#authorSearchClose').hide();
      } else if (this.currentAdd.context === 'THEMES') {
        this.addThemeToProposal(item);
        this.themesSuggestionsVisible = false;
        $('#themeSearch').hide();
        $('#themeSearchClose').hide();
      } else {
        this.addThemeToProposal(item);
        this.keywordsSuggestionsVisible = false;
        $('#keywordSearch').hide();
        $('#keywordSearchClose').hide();
      }
    }

    function loadThemesOrAuthor() {
      if (this.currentAdd.context === 'AUTHORS') {
        this.loadAuthors(this.currentAdd.query);
      } else if (this.currentAdd.context === 'THEMES') {
        this.loadThemes(this.currentAdd.query, 'OFFICIAL_PRE_DEFINED');
      } else {
        this.loadThemes(this.currentAdd.query, 'EMERGENT');
      }
    }

    /**
     * Loads the available themes for the contribution.
     * @param {string} query
     */
    function loadThemes(query, type) {
      let vm = this;
      let filters = {
        query: query,
        themeType: type
      }
      let rsp = Campaigns.themes(this.assemblyID, this.campaign.campaignId, this.isAnonymous, this.campaign.uuid, filters);
      rsp.then(
        themes => {
          vm.currentAdd.items = $filter('filter')(themes, queryThemes(query));
        },
        error => {
          Notify.show(error.data ? error.data.statusMessage ? error.data.statusMessage : '' : '', 'error');
        }
      );
      console.log(rsp);
    }

    function queryThemes(query) {
      return function (value, index, array) {
        var lowerTitle = value.title.toLowerCase();
        var lowerQuery = query.toLowerCase();
        return lowerTitle.indexOf(lowerQuery) >= 0 && (value.type == 'EMERGENT' || value.type == 'OFFICIAL_PRE_DEFINED');
      }
    }

    /**
     * Deletes the given theme.
     *
     * @param {Object} theme
     * @param {boolean} local - just delete in-memory theme instance.
     */
    function deleteTheme(theme, local) {
      _.remove(this.proposal.themes, { themeId: theme.themeId });

      if (local) {
        return;
      }
      Contributions.deleteTheme(this.proposal.uuid, theme.themeId).then(
        response => Notify.show('Theme deleted successfully', 'success'),
        error => {
          Notify.show(error.data ? error.data.statusMessage ? error.data.statusMessage : '' : '', 'error');
        }
      );
    }

    /**
     * Deletes the given author.
     *
     * @param {Object} author
     * @param {boolean} local - just delete in-memory author instance.
     */
    function deleteAuthor(author, local) {
      _.remove(this.proposal.authors, { userId: author.userId });

      if (local) {
        return;
      }
      Contributions.deleteAuthor(this.proposal.uuid, author.uuid).then(
        response => Notify.show('Author deleted successfully', 'success'),
        error => {
          Notify.show(error.data ? error.data.statusMessage ? error.data.statusMessage : '' : '', 'error');
        }
      );
    }

    function deleteNonMemberAuthor(author, local) {
      _.remove(this.proposal.nonMemberAuthors, { id: author.id });

      if (local) {
        return;
      }
      Contributions.deleteNonMemberAuthor(this.proposal.uuid, author.id).then(
        response => Notify.show('Author deleted successfully', 'success'),
        error => {
          Notify.show(error.data ? error.data.statusMessage ? error.data.statusMessage : '' : '', 'error');
        }
      );
    }

    function addThemeToProposal(theme) {
      this.proposal.themes = this.proposal.themes || [];
      if (this.themesLimit > 1) {
        if (this.proposal.themes.length >= this.themesLimit) {
          Notify.show("Can't add more themes", 'error');
          return;
        }
      }
      this.proposal.themes.push(theme);
      Contributions.addTheme(this.proposal.uuid, { themes: this.proposal.themes }).then(
        response => Notify.show('Theme added successfully', 'success'),
        error => {
          this.deleteTheme(theme, true);
          Notify.show(error.data ? error.data.statusMessage ? error.data.statusMessage : '' : '', 'error');
        }
      );
    }

    function selectTheme() {
     if (this.proposal.themes == undefined) {
       this.proposal.themes = [];
       this.proposal.themes.push(this.selectedTheme);
     } else {
      let keywords = this.proposal.themes.filter(v => v.type == 'EMERGENT');
      let themes = [];
      themes.push(this.selectedTheme);
      this.proposal.themes = keywords.concat(themes);
     }
     Contributions.addTheme(this.proposal.uuid, { themes: this.proposal.themes }).then(
        response => Notify.show('Theme changed successfully', 'success'),
        error => {
          Notify.show(error.data ? error.data.statusMessage ? error.data.statusMessage : '' : '', 'error');
        }
      );
    }

    function loadAuthors(query) {
      let rsp = Assemblies.assemblyMembers(this.assemblyID).get().$promise;
      rsp.then(
        data => {
          let items = data.members.filter(d => d.status === 'ACCEPTED').map(d => d.user);
          items = $filter('filter')(items, { $: query });
          this.currentAdd.items = items;
        },
        function (error) {
          Notify.show(error.data ? error.data.statusMessage ? error.data.statusMessage : '' : '', 'error');
        }
      );
    }

    function addAuthorToProposal(author) {
      this.proposal.authors = this.proposal.authors || [];
      this.proposal.authors.push(author);
      Contributions.addAuthor(this.proposal.uuid, author).then(
        response => Notify.show('Author added successfully', 'success'),
        error => {
          this.deleteAuthor(author, true);
          Notify.show(error.data ? error.data.statusMessage ? error.data.statusMessage : '' : '', 'error');
        }
      );
    }

    function addNonMemberAuthorToProposal(author) {
      let payload = {
        name: author.cn,
        email: author.mail,
        source: 'ldap',
        sourceUrl: author.user
      }
      this.proposal.nonMemberAuthors = this.proposal.nonMemberAuthors || [];
      this.proposal.nonMemberAuthors.push(payload);
      Contributions.addNonMemberAuthor(this.proposal.uuid, payload).then(
        response => Notify.show('Author added successfully', 'success'),
        error => {
          this.deleteAuthor(author, true);
          Notify.show(error.data ? error.data.statusMessage ? error.data.statusMessage : '' : '', 'error');
        }
      );
    }

    /**
     * Loads contribution's custom fields values.
     *
     * @param {number} sid - resource space ID
     * @param {boolean} anonymous - whether page is in public or authenticated mode
     */
    function loadValues(sid, anonymous) {
      let rsp;

      if (anonymous) {
        rsp = Space.fieldValuePublic(sid).query().$promise;
      } else {
        rsp = Space.fieldValue(sid).query().$promise;
      }
      return rsp.then(
        fieldsValues => {
          $scope.fieldsValues = fieldsValues;
          if ($scope.fieldsValues && $scope.fieldsValues.length > 0) {
            $scope.fieldsValuesDict = $scope.fieldsValues.reduce(function (map, obj) {
              map[obj.customFieldDefinition.customFieldDefinitionId] = obj;
              return map;
            }, {});
            $scope.fieldsValuesIdsDict = $scope.fieldsValues.reduce(function (map, obj) {
              map[obj.customFieldDefinition.customFieldDefinitionId] = obj.customFieldValueId;
              return map;
            }, {});
          } else {
            $scope.fieldsValuesDict = {};
            $scope.fieldsValuesIdsDict = {};
          }
        },
        error => {
          Notify.show(error.data ? error.data.statusMessage ? error.data.statusMessage : '' : '', 'error');
        }
      );
    }

    function toggleCustomFieldsSection() {
      this.isCustomFieldSectionVisible = !this.isCustomFieldSectionVisible;
    }

    function deleteAttachment(attachment) {
      Space.deleteResource(this.proposal.resourceSpaceId, attachment.resourceId).then(
        response => {
          _.remove(this.resources.all, { resourceId: attachment.resourceId });
          if (attachment.resourceType==='PICTURE') {
            _.remove(this.resources.pictures, { resourceId: attachment.resourceId });
            _.remove(this.resources.media, { resourceId: attachment.resourceId });
          } else if (attachment.resourceType==='VIDEO') {
            _.remove(this.resources.media, { resourceId: attachment.resourceId });
          } else {
            _.remove(this.resources.documents, { resourceId: attachment.resourceId });
          }
          Notify.show('Attachment deleted successfully', 'success');
        } ,
        error => {
          Notify.show(error.data ? error.data.statusMessage ? error.data.statusMessage : '' : '', 'error');
        }
      );
    }

    function removeContributingIdea (idea) {
      $scope.$broadcast('AssociatedContributionForm:RemoveRelatedContribution', idea);
    }

    function loadFeedback(uuid) {
      let rsp = Contributions.publicFeedbacks(uuid).query().$promise;
      rsp.then(
        feedbacks => this.userFeedbackArray = feedbacks,
        error => Notify.show(error.data ? error.data.statusMessage ? error.data.statusMessage : '' : '', 'error')
      );
    }

    function loadUserFeedback(aid, cid, coid) {
      let rsp = Contributions.authUserFeedback(aid,cid,coid).get().$promise;
      rsp.then(
        data => this.userFeedback = data,
        error => this.userFeedback = { 'up': false, 'down': false, 'fav': false, 'flag': false }
      );
      let rsp2 = Contributions.getUserFeedback(aid, cid, coid).query().$promise;
      rsp2.then(
        data => {
          this.userFeedbackArray = data.filter(f => (f.textualFeedback != undefined && f.textualFeedback.length > 0))
          if (!$scope.userIsAuthor && !$scope.userIsAdmin) {
            this.userFeedbackArray = data.filter(f => ((f.status == 'PUBLIC' || f.type == 'TECHNICAL_ASSESSMENT') && f.textualFeedback.length > 0))
          }
        },
        error => this.userFeedbackArray = []
      )
    }

    function embedPadGdoc() {
      if ($scope.newDocUrl != "") {
        let url = $scope.newDocUrl;
        let regex = /\b\/edit/i;
        let match = url.match(regex);
        if (match != null) {
          url = url.substr(0, match.index);
        }
        let payload = {
          url: url
        }
        Etherpad.embedDocument($scope.assemblyID, $scope.campaignID, $scope.proposalID, 'gdoc', payload).then(
          response => {
            console.log(response)
          },
          error => Notify.show(error.data ? error.data.statusMessage ? error.data.statusMessage : '' : '', 'error')
        )
      } else {
        Notify.show('Error while trying to embed the document', 'error')
      }
    }

    function embedPadPeerDoc() {
      // TODO include peerdoc base url and key if provided by user
      let payload = {}
      Etherpad.embedDocument($scope.assemblyID, $scope.campaignID, $scope.proposalID, 'peerdoc', payload).then(
        response => {
          $scope.newDocUrl = $sce.trustAsResourceUrl(response.path);
          $scope.writePeerDocUrl = $sce.trustAsResourceUrl(response.path+"?embed=true");
          $scope.proposal.extendedTextPad = {resourceType:"PEERDOC"}
        },
        error => {
          var e = error.data;
          return Notify.show(e.statusMessage ? e.statusMessage : 'Server error while creating PeerDoc', 'error');
        }
      )
    }

    function syncProposalWithPeerdoc() {
      let rsp = Contributions.flatContributionInResourceSpace($scope.campaign.resourceSpaceId, $scope.proposal.contributionId).get().$promise;
      rsp.then(
        contribution => {
          if (!$scope.isTitleEdit)
            $scope.proposal.title = contribution.title;
          if (!$scope.isDescriptionEdit)
            $scope.proposal.text = contribution.text;
          $scope.proposal.lastUpdate = $filter('date')(contribution.lastUpdate.split(' ')[0], 'mediumDate');
        },
        error => Notify.show(error.statusMessage, 'error')
      )
    }

    function loadCampaignResources() {
      if ($scope.isAnonymous) {
        var rsp = Campaigns.publicResources($scope.campaignID).query();
      } else {
        var rsp = Campaigns.resources($scope.assemblyID, $scope.campaignID).query();
      }
      $scope.campaignResources = [];
      rsp.$promise.then(function (resources) {
        if (resources) {
          $scope.campaignResources = resources;
          $rootScope.$broadcast("ToContributionEmbedModal:CampaignResourcesReady", {resources: resources});
        }
      }, function (error) {
        Notify.show('Error loading campaign resources from server: '+error.data ? error.data.statusMessage ? error.data.statusMessage : '' : '', 'error');
      });
    }

    function loadFields(sid) {
      let rsp = {};
      if ($scope.isAnonymous) {
        rsp = Space.fieldsPublic(sid).query().$promise;
      } else {
        rsp = Space.fields(sid).query().$promise;
      }

      return rsp.then(
        fields => fields,
        error => {
          Notify.show(error.data ? error.data.statusMessage ? error.data.statusMessage : '' : '', 'error');
        }
      );
    }

    function filterCustomFields(fields) {
      return fields.filter(f => f.entityType === 'CONTRIBUTION' && f.entityFilterAttributeName === 'type' && f.entityFilter === $scope.proposal.type && f.entityPart !== 'HEADER');
    }

    function checkCustomHeader(definitionId) {

      let value = this.fieldsValuesDict[definitionId];
      let cfid = this.fieldsValuesIdsDict[definitionId];
      let selectedOption = value.value;
      let newFieldValue = {
        entityTargetType: this.contributionType,
        entityTargetUuid: this.proposal.uuid,
        customFieldDefinition: {customFieldDefinitionId: definitionId},
        value: selectedOption
      };

      // The custom field value already exists
      if (cfid) {
        newFieldValue.customFieldValueId = cfid;
        let rsp = Space.fieldValueResource(this.proposal.resourceSpaceId, cfid).update(newFieldValue).$promise;
        return rsp.then(
          newValue => {
            $scope.fieldsValuesDict[definitionId].value = newValue.value;
            Notify.show('Updated custom field', 'success');
          },
          error => {
            Notify.show(error.data ? error.data.statusMessage ? error.data.statusMessage : '' : '', 'error');
          }
        );
      } else {
        let rsp = Space.fieldValue(this.proposal.resourceSpaceId).save(newFieldValue).$promise;
        return rsp.then(
          newValue => {
            $scope.fieldsValuesDict[definitionId] = newValue;
            $scope.fieldsValuesIdsDict[definitionId] = newValue.customFieldValueId;
            Notify.show('Updated custom field', 'success');
          },
          error => {
            Notify.show(error.data ? error.data.statusMessage ? error.data.statusMessage : '' : '', 'error');
          }
        );
      }
    }

    function loadCustomFields() {
      let currentComponent = localStorageService.get('currentCampaign.currentComponent');
      $scope.currentComponent = currentComponent;
      if ($scope.isAnonymous) {
        $scope.campaignResourceSpaceId = $scope.campaign.resourceSpaceUUID;
        $scope.componentResourceSpaceId = currentComponent ? currentComponent.resourceSpaceUUID : null;
      } else {
        $scope.campaignResourceSpaceId = $scope.campaign.resourceSpaceId;
        $scope.componentResourceSpaceId = currentComponent ? currentComponent.resourceSpaceId : null;
      }

      if ($scope.campaignResourceSpaceId) {
        loadFields($scope.campaignResourceSpaceId).then(fields => {
          $scope.campaignFields = $scope.filterCustomFields(fields);
          $scope.customHeaderFields = fields.filter(f => f.entityPart == 'HEADER');
          console.log($scope.campaignFields);
          console.log($scope.customHeaderFields);
        });
      }
      if ($scope.componentResourceSpaceId) {
        loadFields($scope.componentResourceSpaceId).then(fields => {
          $scope.componentFields = $scope.filterCustomFields(fields);
        });
      }
      loadValues($scope.proposal.resourceSpaceId);
    }

    function follow() {
      let sub = {
        spaceId: $scope.proposal.rsID,
        userId: $scope.user.userId,
        spaceType: "CONTRIBUTION",
        subscriptionType: "REGULAR"
      }
      Notifications.subscribe(sub.spaceId).save(sub).$promise.then(
        response => {
          $scope.following = true;
          $scope.subscription = response;
          Notify.show("Subscribed successfully! You will begin to receive notifications about this from now on.", "success");
        },
        error => {
          Notify.show("Error trying to subscribe. Please try again later.", "error")
        }
      );
    }

    function unfollow() {
      let spaceId = $scope.proposal.rsID;
      let subId = $scope.subscription ? $scope.subscription.id : null;
      Notifications.unsubscribe(spaceId, subId).then(
        response => {
          $scope.following = false;
          $scope.subscription = null;
          Notify.show("Unsubscribed successfully.", "success");
        },
        error => {
          Notify.show("Error trying to unsubscribe. Please try again later.", "error")
        }
      );
    }

    function checkIfFollowing(sid) {
      if ($scope.user && $scope.user.userId) {
        let res = Notifications.subscriptionsBySpace($scope.user.userId, sid, "REGULAR").query();
        res.$promise.then(
          function (response) {
            let substatus = response.filter(sub => sub.userId == $scope.user.uuid)
            if (substatus.length > 0) {
              $scope.subscription = substatus[0];
              $scope.subscribed = true;
            }
          },
          function (error) {
            Notify.show(error.data ? error.data.statusMessage ? error.data.statusMessage : '' : '', 'error');
          }
        );
      }
    }

    function descriptionToggleEdit() {
      if (!this.isDescriptionEdit) {
        this.isDescriptionEdit = true;
        this.descriptionBackup = this.proposal.text;
        $("#descriptionEditToggle").removeClass('fa-edit');
        $("#descriptionEditToggle").addClass('fa-times-circle');
      } else {
        this.isDescriptionEdit = false;
        this.proposal.text = this.descriptionBackup;
        $("#descriptionEditToggle").addClass('fa-edit');
        $("#descriptionEditToggle").removeClass('fa-times-circle');
      }
    }

    function titleToggleEdit() {
      if ($scope.extendedTextIsPeerDoc) return;
      if (!this.isTitleEdit) {
        this.isTitleEdit = true;
        this.TitleBackup = this.proposal.text;
        $("#titleEditToggle").removeClass('fa-edit');
        $("#titleEditToggle").addClass('fa-times-circle');
      } else {
        this.isTitleEdit = false;
        this.proposal.text = this.TitleBackup;
        $("#titleEditToggle").addClass('fa-edit');
        $("#titleEditToggle").removeClass('fa-times-circle');
      }
    }

    function saveDescription() {
      let vm = this;
      let payload = _.cloneDeep($scope.proposal);
      delete payload.lastUpdate;
      payload.status = payload.status.toUpperCase();
      let rsp = Contributions.contribution($scope.assemblyID, $scope.proposal.contributionId).update(payload).$promise;

      rsp.then(
        data => {
          Notify.show('Contribution saved', 'success');
          vm.isDescriptionEdit = false;
          $("#descriptionEditToggle").addClass('fa-edit');
          $("#descriptionEditToggle").removeClass('fa-times-circle');
        },
        error => {
          Notify.show(error.data ? error.data.statusMessage ? error.data.statusMessage : '' : '', 'error');
          vm.isDescriptionEdit = true;
        }
      );
    }

    function saveTitle() {
      let vm = this;
      let payload = _.cloneDeep($scope.proposal);
      payload.status = payload.status.toUpperCase();
      let rsp = Contributions.contribution($scope.assemblyID, $scope.proposal.contributionId).update(payload).$promise;

      rsp.then(
        data => {
          Notify.show('Contribution saved', 'success');
          vm.isTitleEdit = false;
          $("#titleEditToggle").addClass('fa-edit');
          $("#titleEditToggle").removeClass('fa-times-circle');
        },
        error => {
          Notify.show(error.data ? error.data.statusMessage ? error.data.statusMessage : '' : '', 'error');
          vm.isTitleEdit = true;
        }
      );
    }

    function getEditorOptions() {
      var vm = this;
      return {
        height: 400,
        max_chars: 200,
        plugins: [
          'advlist autolink lists link charmap preview anchor',
          'searchreplace visualblocks code fullscreen',
          'insertdatetime table contextmenu paste'
        ],
        toolbar: 'insertfile undo redo | styleselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image',
        images_upload_credentials: true,
        image_advtab: true,
        image_title: true,
        statusbar: false,
        automatic_uploads: true,
        file_picker_types: 'image',
        imagetools_cors_hosts: ['s3-us-west-1.amazonaws.com'],
        images_upload_handler: function (blobInfo, success, failure) {
          var xhr, formData;
          xhr = new XMLHttpRequest();
          xhr.withCredentials = true;
          xhr.open('POST', FileUploader.uploadEndpoint());
          xhr.onload = function () {
            var json;

            if (xhr.status != 200) {
              failure('HTTP Error: ' + xhr.status);
              return;
            }
            json = JSON.parse(xhr.responseText);

            if (!json || typeof json.url != 'string') {
              failure('Invalid JSON: ' + xhr.responseText);
              return;
            }
            success(json.url);
          };
          formData = new FormData();
          formData.append('file', blobInfo.blob());
          xhr.send(formData);
        },
        file_picker_callback: function (cb, value, meta) {
          var input = document.createElement('input');
          input.setAttribute('type', 'file');
          input.setAttribute('accept', 'image/*');
          $(input).bind('change', function () {
            var file = this.files[0];
            var id = 'blobid' + (new Date()).getTime();
            var blobCache = tinymce.activeEditor.editorUpload.blobCache;
            var blobInfo = blobCache.create(id, file);
            blobCache.add(blobInfo);
            cb(blobInfo.blobUri(), { title: file.name });
          });
          input.click();
          vm.$on('$destroy', function () {
            $(input).unbind('change');
          });
        }
      };
    }
  }
}());
