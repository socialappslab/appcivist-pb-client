(function () {
  'use strict';

  angular
    .module('appCivistApp')
    .controller('v2.ContributionPageCtrl', ContributionPageCtrl);



  ContributionPageCtrl.$inject = [
    '$scope', 'WorkingGroups', '$stateParams', 'Assemblies', 'Contributions', '$filter',
    'localStorageService', 'Memberships', 'Etherpad', 'Notify', '$translate',
    'Space', '$http', 'FileUploader', '$sce', 'Campaigns', 'Voting'
  ];

  function ContributionPageCtrl($scope, WorkingGroups, $stateParams, Assemblies, Contributions,
    $filter, localStorageService, Memberships, Etherpad, Notify,
    $translate, Space, $http, FileUploader, $sce, Campaigns, Voting) {

    $scope.setAddContext = setAddContext.bind($scope);
    $scope.loadThemes = loadThemes.bind($scope);
    $scope.loadThemesOrAuthor = loadThemesOrAuthor.bind($scope);
    $scope.currentAddQueryChange = currentAddQueryChange.bind($scope);
    $scope.currentAddGetText = currentAddGetText.bind($scope);
    $scope.currentAddOnSelect = currentAddOnSelect.bind($scope);
    $scope.deleteTheme = deleteTheme.bind($scope);
    $scope.addThemeToProposal = addThemeToProposal.bind($scope);
    $scope.loadAuthors = loadAuthors.bind($scope);
    $scope.addAuthorToProposal = addAuthorToProposal.bind($scope);
    $scope.deleteAuthor = deleteAuthor.bind($scope);
    $scope.loadValues = loadValues.bind($scope);
    $scope.loadProposal = loadProposal.bind($scope);
    $scope.toggleCustomFieldsSection = toggleCustomFieldsSection.bind($scope);
    $scope.deleteAttachment = deleteAttachment.bind($scope);
    $scope.loadFeedback = loadFeedback.bind($scope);
    $scope.loadBallotPaper = loadBallotPaper.bind($scope);
    $scope.afterLoadingBallotSuccess = afterLoadingBallotSuccess.bind($scope);
    $scope.initializeBallotTokens = initializeBallotTokens.bind($scope);

    activate();

    function activate() {
      ModalMixin.init($scope);
      $scope.updateFeedback = updateFeedback.bind($scope);
      $scope.submitAttachment = submitAttachment.bind($scope);
      $scope.createAttachmentResource = createAttachmentResource.bind($scope);
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
      // if the param is uuid then is an anonymous user, use endpoints with uuid
      var pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
        $scope.userIsCoordinator = Memberships.isAssemblyCoordinator($scope.assemblyID);
        $scope.userIsAdmin = Memberships.userIsAdmin();
      }
      $scope.etherpadLocale = Etherpad.getLocale();
      $scope.loadProposal($scope);
      $scope.showActionMenu = true;
      $scope.myObject = {};
      $scope.myObject.refreshMenu = function () {
        scope.showActionMenu = !scope.showActionMenu;
      };
      // Read user contribution feedback
      $scope.userFeedback = $scope.userFeedback || { 'up': false, 'down': false, 'fav': false, 'flag': false };
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

      var feedback = Contributions.userFeedback($scope.assemblyID, $scope.campaignID, $scope.proposalID).update($scope.userFeedback);
      feedback.$promise.then(
        function (newStats) {
          $scope.proposal.stats = newStats;
          $scope.proposal.informalScore = Contributions.getInformalScore($scope.proposal);
        },
        function (error) {
          Notify.show('Error when updating user feedbac', 'error');
        }
      );
    };

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
          $scope.proposal.frsUUID = data.forumResourceSpaceUUID;
          var workingGroupAuthors = data.workingGroupAuthors;
          var workingGroupAuthorsLength = workingGroupAuthors ? workingGroupAuthors.length : 0;
          $scope.group = workingGroupAuthorsLength ? data.workingGroupAuthors[0] : null;
          scope.contributionType = $scope.proposal.type;
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
            $scope.extendedTextIsEtherpad = data.extendedTextPad.resourceType === 'PAD';
            $scope.extendedTextIsGdoc = data.extendedTextPad.resourceType === 'GDOC';
            if ($scope.extendedTextIsEtherpad) {
              $scope.etherpadReadOnlyUrl = Etherpad.embedUrl(data.extendedTextPad.readOnlyPadId, data.publicRevision, data.extendedTextPad.url) + "&userName=" + $scope.userName + '&showControls=false&lang=' + $scope.etherpadLocale;
            } else if ($scope.extendedTextIsGdoc) {
              $scope.gdocUrl = data.extendedTextPad.url;
              $scope.gdocUrlMinimal = $scope.gdocUrl +"?rm=minimal";
            }
          } else {
            console.warn('Proposal with no PAD associated');
          }

          if (!scope.isAnonymous) {
            var rsp = Campaigns.components($scope.assemblyID, $scope.campaignID);
            rsp.then(function (components) {
              var currentComponent = Campaigns.getCurrentComponent(components);
              currentComponent = currentComponent ? currentComponent : {}; // make sure currentComponent var is null-safe
              localStorageService.set('currentCampaign.currentComponent', currentComponent);
              // we always show readonly etherpad url if current component type is not IDEAS nor PROPOSALS
              if (currentComponent.type === 'IDEAS' || currentComponent.type === 'PROPOSALS') {
                verifyAuthorship(scope.proposal, true);
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
              Notify.show('Error while trying to fetch campaign components', 'error');
            });
            vm.loadValues(vm.proposal.resourceSpaceId);
          } else {
            vm.loadValues(vm.proposal.resourceSpaceUUID, true);
          }
          loadRelatedContributions();
          loadRelatedStats();
          loadCampaign();
          loadResources();
        },
        function (error) {
          Notify.show('Error occured when trying to load contribution: ' + JSON.stringify(error), 'error');
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
     * @param {boolean} checkEtherpad - whether we should verify read/write etherpad URL.
     */
    function verifyAuthorship(proposal, checkEtherpad) {
      // Check Authorship
      // 1. Check if user is in the list of authors
      $scope.userIsAuthor = Contributions.verifyAuthorship($scope.user, proposal);

      // 2. If is not in the list of authorships, check if the user is member of one of the responsible groups
      if (!$scope.userIsAuthor && $scope.group && $scope.group.groupId) {
        var authorship = Contributions.verifyGroupAuthorship($scope.user, proposal, $scope.group).get();
        authorship.$promise.then(function (response) {
          $scope.userIsAuthor = response.responseStatus === 'OK';
          if ($scope.userIsAuthor && checkEtherpad) {
            loadEtherpadWriteUrl(proposal);
          }
        });
      } else if ($scope.userIsAuthor && checkEtherpad) {
        if ($scope.extendedTextIsEtherpad) {
          loadEtherpadWriteUrl(proposal);
        } else if ($scope.extendedTextIsGdoc) {
          // TODO: load the write embed url for gdoc
          $scope.writegDocUrl = $scope.gdocUrl+"/edit?rm=full";
        }
      }
    }

    function loadEtherpadWriteUrl(proposal) {
      if (proposal.extendedTextPad) {
        var etherpadRes = Etherpad.getReadWriteUrl($scope.assemblyID, proposal.contributionId).get();
        etherpadRes.$promise.then(function (pad) {
          $scope.etherpadReadWriteUrl = Etherpad.embedUrl(pad.padId) + '&userName=' + $scope.userName + '&lang=' + $scope.etherpadLocale;
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
          $scope.relatedContributions = related;
        },
        function (error) {
          Notify.show('Error loading contributions from server', 'error');
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
      var fd = new FormData();
      fd.append('file', this.newAttachment.file);
      $http.post(FileUploader.uploadEndpoint(), fd, {
        headers: {
          'Content-Type': undefined
        },
        transformRequest: angular.identity,
      }).then(function (response) {
        vm.createAttachmentResource(response.data.url);
      }, function (error) {
        Notify.show('Error while uploading file to the server', 'error');
      });
    }

    /**
     * After the file has been uploaded, we should relate it with the contribution.
     *
     * @param {string} url - The uploaded file's url.
     */
    function createAttachmentResource(url) {
      var vm = this;
      var attachment = Contributions.newAttachmentObject({ url: url, name: this.newAttachment.name });
      var rsp = Contributions.contributionAttachment(this.assemblyID, this.proposalID).save(attachment).$promise;
      rsp.then(function (response) {

        if (!vm.proposal.attachments) {
          vm.proposal.attachments = [];
        }
        vm.proposal.attachments.push(response);
        vm.closeModal('addAttachmentForm');
        Notify.show('Attachment saved!', 'success');
      }, function (error) {
        Notify.show('Error while uploading file to the server', 'error');
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
        }, function (error) {
          Notify.show('Error while trying to fetch campaign', 'error');
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
        $scope.resources = data;
        loadPictureResources();
        loadDocuments();
        loadMedia();
      }, function(error) {
        Notify.show('Error while trying to fetch resources', 'error');
      });
    }

    function loadPictureResources() {
      $scope.resourcePictures = [];
      if ($scope.resources.length > 0) {
        for (let i in $scope.resources) {
          if ($scope.resources[i].resourceType == 'PICTURE') {
            $scope.resourcePictures.push($scope.resources[i]);
          }
        }
      }
    }

    function loadDocuments() {
      $scope.documents = $scope.resources.filter(resource => resource.resourceType !== 'PICTURE' && resource.resourceType !== 'VIDEO');
    }

    function loadMedia() {
      $scope.media = $scope.resources.filter(resource => resource.resourceType === 'PICTURE' || resource.resourceType === 'VIDEO');
    }

    function loadCampaignConfig() {
      if ($scope.campaign && $scope.campaign.rsID) {
        var rsp = Campaigns.getConfiguration($scope.campaign.rsID).get();
        rsp.$promise.then(function (data) {
          $scope.campaignConfigs = data;
          loadBallotPaper();
        }, function (error) {
          loadBallotPaper();
          Notify.show('Error while trying to fetch campaign config', 'error');
        });
      }
    }

    /**
     * Sets the context of add button y page header.
     * @param {string} ctx AUTHORS | THEMES
     */
    function setAddContext(ctx) {
      this.currentAdd.context = ctx;
    }

    function currentAddQueryChange() {
      this.currentAdd.suggestionsVisible = this.currentAdd.query.length > 0;
      this.loadThemesOrAuthor();
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
          <span style="margin-left: 15px;">${item.name}</span>`);
      } else {
        return $sce.trustAsHtml(`<span style="padding-top: 15px; display: inline-block;">${item.title}</span>`);
      }
    }

    /**
     * on-select handler.
     *
     * @param {Object} item
     */
    function currentAddOnSelect(item) {
      this.currentAdd.suggestionsVisible = false;
      this.currentAdd.query = '';

      if (this.currentAdd.context === 'AUTHORS') {
        this.addAuthorToProposal(item);
      } else if (this.currentAdd.context === 'THEMES') {
        this.addThemeToProposal(item);
      } else {
        this.addThemeToProposal(item);
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
          Notify.show('Error while trying to fetch themes from server', 'error');
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
          Notify.show('Error while trying to delete theme from the contribution', 'error');
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
          Notify.show('Error while trying to delete author from the contribution', 'error');
        }
      );
    }

    function addThemeToProposal(theme) {
      this.proposal.themes = this.proposal.themes || [];
      this.proposal.themes.push(theme);

      Contributions.addTheme(this.proposal.uuid, { themes: this.proposal.themes }).then(
        response => Notify.show('Theme added successfully', 'success'),
        error => {
          this.deleteTheme(theme, true);
          Notify.show('Error while trying to add theme to the contribution', 'error');
        }
      );
    }

    function loadAuthors(query) {
      let rsp = Assemblies.assemblyMembers(this.assemblyID).query().$promise;
      rsp.then(
        data => {
          let items = data.filter(d => d.status === 'ACCEPTED').map(d => d.user);
          items = $filter('filter')(items, { $: query });
          this.currentAdd.items = items;
        },
        function (error) {
          Notify.show('Error while trying to fetch assembly members from the server', 'error');
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
          Notify.show('Error while trying to add author to the contribution', 'error');
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
          this.fieldsValues = fieldsValues;
        },
        error => {
          Notify.show('Error while trying to get field values from resource space', 'error');
        }
      );
    }

    function toggleCustomFieldsSection() {
      this.isCustomFieldSectionVisible = !this.isCustomFieldSectionVisible;
    }

    function deleteAttachment(attachment) {
      _.remove(this.proposal.attachments, { resourceId: attachment.resourceId });

      Space.deleteResource(this.proposal.resourceSpaceId, attachment.resourceId).then(
        response => Notify.show('Attachment deleted successfully', 'success'),
        error => {
          Notify.show('Error while trying to delete attachment from the contribution', 'error');
        }
      );
    }

    function loadFeedback(uuid) {
      let rsp = Contributions.publicFeedbacks(uuid).query().$promise;
      rsp.then(
        feedbacks => this.feedbacks = feedbacks,
        error => Notify.show('Error while trying to fetch contribution feedback', 'error')
      );
    }
  }
}());
