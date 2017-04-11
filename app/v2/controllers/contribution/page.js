(function() {
  'use strict';

  angular
    .module('appCivistApp')
    .controller('v2.ProposalPageCtrl', ProposalPageCtrl);



  ProposalPageCtrl.$inject = [
    '$scope', 'WorkingGroups', '$stateParams', 'Assemblies', 'Contributions', '$filter',
    'localStorageService', 'Memberships', 'Etherpad', 'Notify', '$translate',
    'Space', '$http', 'FileUploader', '$sce', 'Campaigns'
  ];

  function ProposalPageCtrl($scope, WorkingGroups, $stateParams, Assemblies, Contributions,
    $filter, localStorageService, Memberships, Etherpad, Notify,
    $translate, Space, $http, FileUploader, $sce, Campaigns) {

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
        context: 'AUTHORS'
      };
      $scope.toggleFeedbackBar = function(x) {
        $scope.feedbackBar = !$scope.feedbackBar;
      };
      $scope.newAttachment = {};
      $scope.changeActiveTab = function(tab) {
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
      // if the param is uuid then is an anonymous user, use endpoints with uuid
      var pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (pattern.test($stateParams.pid) === true) {
        $scope.proposalID = $stateParams.pid;
        $scope.isAnonymous = true;
        $scope.loadFeedback($scope.proposalID);
      } else {
        $scope.assemblyID = ($stateParams.aid) ? parseInt($stateParams.aid) : localStorageService.get('currentAssembly').assemblyId;
        $scope.groupID = ($stateParams.gid) ? parseInt($stateParams.gid) : 0;
        $scope.proposalID = ($stateParams.pid) ? parseInt($stateParams.pid) : 0;
        $scope.user = localStorageService.get('user');

        if ($scope.user && $scope.user.language) {
          $translate.use($scope.user.language);
          $scope.userName = $scope.user.name;
        } else {
          const locale = LocaleService.getLocale();
          $translate.use(locale);
        }
        // user is member of Assembly
        $scope.userIsMember = true;
      }
      $scope.etherpadLocale = Etherpad.getLocale();
      $scope.loadProposal($scope);
      $scope.showActionMenu = true;
      $scope.myObject = {};
      $scope.myObject.refreshMenu = function() {
        scope.showActionMenu = !scope.showActionMenu;
      };
      // Read user contribution feedback
      $scope.userFeedback = $scope.userFeedback || { 'up': false, 'down': false, 'fav': false, 'flag': false };
      $scope.toggleIdeasSection = toggleIdeasSection.bind($scope);
      $scope.cm = {
        isHover: false
      };
      $scope.trustedHtml = function(html) {
        return $sce.trustAsHtml(html);
      };
      $scope.contributionTypeIsSupported = function(type) {
        return Campaigns.isContributionTypeSupported(type, $scope);
      }
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
        function(newStats) {
          $scope.proposal.stats = newStats;
          $scope.proposal.informalScore = Contributions.getInformalScore($scope.proposal);
        },
        function(error) {
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
        function(data) {
          data.informalScore = Contributions.getInformalScore(data);
          $scope.proposal = data;
          $scope.proposal.frsUUID = data.forumResourceSpaceUUID;
          var workingGroupAuthors = data.workingGroupAuthors;
          var workingGroupAuthorsLength = workingGroupAuthors ? workingGroupAuthors.length : 0;
          $scope.group = workingGroupAuthorsLength ? data.workingGroupAuthors[0] : null;

          if ($scope.group) {
            $scope.group.profilePic = {
              urlAsString: $scope.group.profile.icon
            }
          }
          var campaignIds = []

          if (scope.isAnonymous) {
            campaignIds = data.campaignUuids;
          } else {
            campaignIds = data.campaignIds;
          }
          var campaignIdsLength = campaignIds ? campaignIds.length : 0;
          $scope.campaignID = campaignIdsLength ? campaignIds[0] : 0;

          if (data.extendedTextPad) {
            $scope.etherpadReadOnlyUrl = Etherpad.embedUrl(data.extendedTextPad.readOnlyPadId, data.publicRevision) + "&userName=" + $scope.userName + '&showControls=false&lang=' + $scope.etherpadLocale;
          } else {
            console.warn('Proposal with no PAD associated');
          }

          if (!scope.isAnonymous) {
            var rsp = Campaigns.components($scope.assemblyID, $scope.campaignID);
            rsp.then(function(components) {
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
              }
            }, function(error) {
              Notify.show('Error while trying to fetch campaign components', 'error');
            });
            vm.loadValues(vm.proposal.resourceSpaceId);
          } else {
            vm.loadValues(vm.proposal.resourceSpaceUUID, true);
          }
          loadRelatedContributions();
          loadRelatedStats();
          loadCampaign();
        },
        function(error) {
          Notify.show('Error occured when trying to load proposal: ' + JSON.stringify(error), 'error');
        }
      );
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
        authorship.$promise.then(function(response) {
          $scope.userIsAuthor = response.responseStatus === 'OK';
          if ($scope.userIsAuthor && checkEtherpad) {
            loadEtherpadWriteUrl(proposal);
          }
        });
      } else if ($scope.userIsAuthor && checkEtherpad) {
        loadEtherpadWriteUrl(proposal);
      }
    }

    function loadEtherpadWriteUrl(proposal) {
      if (proposal.extendedTextPad) {
        var etherpadRes = Etherpad.getReadWriteUrl($scope.assemblyID, proposal.contributionId).get();
        etherpadRes.$promise.then(function(pad) {
          $scope.etherpadReadWriteUrl = Etherpad.embedUrl(pad.padId) + '&userName=' + $scope.userName + '&lang=' + $scope.etherpadLocale;
        });
      }
    }

    $scope.createArray = function(num) {
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
        function(data) {
          var related = [];
          angular.forEach(data.list, function(r) {
            if (r.contributionId === $scope.proposalID) {
              return;
            }
            related.push(r);
          });
          $scope.relatedContributions = related;
        },
        function(error) {
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
      this.ideasSectionExpanded = !this.ideasSectionExpanded;
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
      }).then(function(response) {
        vm.createAttachmentResource(response.data.url);
      }, function(error) {
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
      rsp.then(function(response) {

        if (!vm.proposal.attachments) {
          vm.proposal.attachments = [];
        }
        vm.proposal.attachments.push(response);
        vm.closeModal('addAttachmentForm');
        Notify.show('Attachment saved!', 'success');
      }, function(error) {
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

        res.$promise.then(function(data) {
          $scope.campaign = data;
          $scope.campaign.rsID = data.resourceSpaceId;
          // update current campaign reference
          localStorageService.set('currentCampaign', data);
          loadCampaignConfig();
        }, function(error) {
          Notify.show('Error while trying to fetch campaign', 'error');
        });
      }
    }

    function loadCampaignConfig() {
      if ($scope.campaign && $scope.campaign.rsID) {
        var rsp = Campaigns.getConfiguration($scope.campaign.rsID).get();
        rsp.$promise.then(function(data) {
          $scope.campaignConfigs = data;
        }, function(error) {
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
      } else {
        this.addThemeToProposal(item);
      }
    }

    function loadThemesOrAuthor() {
      if (this.currentAdd.context === 'AUTHORS') {
        this.loadAuthors(this.currentAdd.query);
      } else {
        this.loadThemes(this.currentAdd.query);
      }
    }

    /**
     * Loads the available themes for the contribution.
     * @param {string} query
     */
    function loadThemes(query) {
      let vm = this;
      let rsp = Campaigns.themes(this.assemblyID, this.campaign.campaignId);
      rsp.then(
        themes => {
          vm.currentAdd.items = $filter('filter')(themes, { title: query });
        },
        error => {
          Notify.show('Error while trying to fetch themes from server', 'error');
        }
      );
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
        function(error) {
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