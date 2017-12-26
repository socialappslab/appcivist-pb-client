(function () {
  'use strict';

  angular
    .module('appCivistApp')
    .controller('v2.ContributionPageCtrl', ContributionPageCtrl);



  ContributionPageCtrl.$inject = [
    '$scope', 'WorkingGroups', '$stateParams', 'Assemblies', 'Contributions', '$filter',
    'localStorageService', 'Memberships', 'Etherpad', 'Notify', '$rootScope', '$translate',
    'Space', '$http', 'FileUploader', '$sce', 'Campaigns', 'Voting', 'usSpinnerService'
  ];

  function ContributionPageCtrl($scope, WorkingGroups, $stateParams, Assemblies, Contributions,
    $filter, localStorageService, Memberships, Etherpad, Notify, $rootScope,
    $translate, Space, $http, FileUploader, $sce, Campaigns, Voting, usSpinnerService) {

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
    $scope.loadCampaignResources = loadCampaignResources.bind($scope);
    $scope.filterCustomFields = filterCustomFields.bind($scope);

    activate();

    function activate() {
      ModalMixin.init($scope);
      $scope.updateFeedback = updateFeedback.bind($scope);
      $scope.submitAttachment = submitAttachment.bind($scope);
      $scope.submitAttachmentByUrl = submitAttachmentByUrl.bind($scope);
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
//      $scope.userFeedback = $scope.userFeedback || { 'up': false, 'down': false, 'fav': false, 'flag': false };
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
    }

    function toggleOpenAddAttachment () {
      $scope.openAddAttachment = !$scope.openAddAttachment;
    }

    function toggleOpenAddAttachmentByUrl () {
      $scope.openAddAttachment = !$scope.openAddAttachment;
      $scope.openAddAttachmentByUrl = !$scope.openAddAttachmentByUrl;
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
          Notify.show('Error when updating user feedback', 'error');
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
        error => Notify.show('Error while trying to load proposals etherpad text', 'error')
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
            if ($scope.extendedTextIsEtherpad) {
              $scope.etherpadReadOnlyUrl = Etherpad.embedUrl(data.extendedTextPad.readOnlyPadId, data.publicRevision, data.extendedTextPad.url) + "&userName=" + $scope.userName + '&showControls=false&lang=' + $scope.etherpadLocale;
              $scope.loadReadOnlyEtherpadHTML();
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
          $scope.loadCampaignResources();
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
        Notify.show('Error while uploading file to the server', 'error');
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
        Notify.show('Error while uploading file to the server', 'error');
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
        $scope.resources.all = data || [];
        loadPictureResources();
        loadDocuments();
        loadMedia();
      }, function(error) {
        Notify.show('Error while trying to fetch resources', 'error');
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
        loadBallotPaper();
      }, function (error) {
        loadBallotPaper();
        Notify.show('Error while trying to fetch campaign config', 'error');
      });
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
          $scope.fieldsValues = fieldsValues;
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
          Notify.show('Error while trying to delete attachment from the contribution', 'error');
        }
      );
    }

    function removeContributingIdea (idea) {
      $scope.$broadcast('AssociatedContributionForm:RemoveRelatedContribution', idea);
    }

    function loadFeedback(uuid) {
      let rsp = Contributions.publicFeedbacks(uuid).query().$promise;
      rsp.then(
        feedbacks => this.feedbacks = feedbacks,
        error => Notify.show('Error while trying to fetch contribution feedback', 'error')
      );
    }

    function loadUserFeedback(aid, cid, coid) {
      let rsp = Contributions.authUserFeedback(aid,cid,coid).get().$promise;
      rsp.then(
        data => this.userFeedback = data,
        error => this.userFeedback = { 'up': false, 'down': false, 'fav': false, 'flag': false }
      );
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
          error => Notify.show('Error while trying to embed the document', 'error')
        )
      } else {
        Notify.show('Error while trying to embed the document', 'error')
      }
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
        Notify.show('Error loading campaign resources from server: '+error.statusMessage, 'error');
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
          Notify.show('Error while trying to get fields from resource space', 'error');
        }
      );
    }
  
    function filterCustomFields(fields) {
      return fields.filter(f => f.entityType === 'CONTRIBUTION' && f.entityFilterAttributeName === 'type' && f.entityFilter === this.type);
    }
  
    function loadCustomFields() {
      let currentComponent = localStorageService.get('currentCampaign.currentComponent');
      $scope.currentComponent = currentComponent;
      if ($scope.isAnonymous) {
        $scope.campaignResourceSpaceId = $scope.campaign.resourceSpaceUUID;
        $scope.componentResourceSpaceId = currentComponent.resourceSpaceUUID;
      } else {
        $scope.campaignResourceSpaceId = $scope.campaign.resourceSpaceId;
        $scope.componentResourceSpaceId = currentComponent.resourceSpaceId;
      }
  
      loadFields($scope.campaignResourceSpaceId).then(fields => {
          $scope.campaignFields = $scope.filterCustomFields(fields);
          console.log($scope.campaignFields);
      });
      loadFields($scope.componentResourceSpaceId).then(fields => {
          $scope.componentFields = $scope.filterCustomFields(fields);
          console.log($scope.componentFields);
      });
      console.log($scope.proposal);
      loadValues($scope.proposal.resourceSpaceId);
    }
  }
}());
