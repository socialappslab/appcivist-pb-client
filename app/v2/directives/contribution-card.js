(function () {
  'use strict';

  appCivistApp
    .directive('contributionCard', ContributionCard);

  ContributionCard.$inject = [
    'Contributions', 'Campaigns', 'localStorageService', 'Memberships', '$window', '$rootScope', 'Notify', '$compile',
    '$sce', 'limitToFilter', '$stateParams'
  ];

  function ContributionCard(Contributions, Campaigns, localStorageService, Memberships, $window, $rootScope, Notify,
    $compile, $sce, limitToFilter, $stateParams) {

    return {
      restrict: 'E',
      scope: {
        contribution: '=',
        showVotingButtons: '=',
        campaign: '=',
        components: '=',
        isAnonymous: '=',
        showIdeaBody: '@',
        isCoordinator: '=',
        isTopicGroup: '=',
        ballotPaper: '=',
        ballotTokens: '=',
        selected: '=',
        showSourceCode: '='
      },
      templateUrl: '/app/v2/partials/directives/contribution-card.html',
      link: function postLink(scope, element, attrs) {

        activate();

        function activate() {
          scope.title = scope.contribution.title;
          if(scope.showSourceCode && scope.contribution.sourceCode) {
            scope.title = '[' + scope.contribution.sourceCode  + '] ' + scope.title;
          }
          scope.showContextualMenu = false;
          scope.contribution.informalScore = Contributions.getInformalScore(scope.contribution);
          scope.toggleContextualMenu = toggleContextualMenu.bind(scope);
          scope.ideaExcerptStyle = scope.showIdeaBody ? { height: '120px' } : { height: '110px' };
          scope.ideaHeaderStyle = scope.showIdeaBody ? { height: '100px' } : { height: '150px' };
          setContributionType(scope);
          let assembly = localStorageService.get('currentAssembly');
          scope.campaignId = $stateParams.cid ? parseInt($stateParams.cid) : 0;
          scope.formatDate = formatDate.bind(scope);
          scope.mergedThemes = mergeThemes(scope.contribution);
          scope.verifyCampaignComponent = verifyCampaignComponent.bind(scope);
          scope.toggleSelection = toggleSelection.bind(scope);

          if (scope.contribution.source !== undefined && (scope.contribution.source.toLowerCase().includes('facebook'))) {
            scope.sourceIsFacebook = true;
            scope.source_url = scope.contribution.sourceUrl;
          } else if (scope.contribution.sourceUrl) {
            scope.source_url = scope.contribution.sourceUrl;
            scope.sourceIsFacebook = false;
          }

          // Prepare contribution's cover
          let cCover = scope.contribution.cover ? scope.contribution.cover.url : null;

          if (cCover) {
            let bkg_url = 'url(\"'+cCover+'\")';
            scope.coverPhotoStyle = { 'background-image': bkg_url, 'background-position': 'center center', 'background-size': 'cover' };
            scope.showOverlay = true;
          }

          if (assembly) {
            scope.assemblyId = assembly.assemblyId;
          }

          var workingGroupAuthors = scope.contribution.workingGroupAuthors;
          var workingGroupAuthorsLength = workingGroupAuthors ? workingGroupAuthors.length : 0;
          scope.group = workingGroupAuthorsLength ? workingGroupAuthors[0] : 0;
          scope.notAssigned = true;
          scope.conids = [];

          scope.authorList = []

          if (scope.contribution.authors && scope.contribution.authors.length > 0)
            scope.authorList = scope.contribution.authors;


          if (scope.contribution.nonMemberAuthors && scope.contribution.nonMemberAuthors.length > 0) {
            if (scope.authorList && scope.authorList.length > 0)
              scope.authorList.concat(scope.contribution.nonMemberAuthors);
            else
              scope.authorList = scope.contribution.nonMemberAuthors;
          }

          if (scope.group) {
            scope.notAssigned = false;
          }

          if (!scope.isAnonymous) {
            scope.groupId = workingGroupAuthorsLength ? scope.contribution.workingGroupAuthors[0].groupId : 0;
            scope.contributionId = scope.contribution.contributionId;
            scope.contributionUrl =
              "#/v2/assembly/" + scope.assemblyId
              + "/campaign/" + scope.campaignId
              + (scope.notAssigned ? "" : "/group/" + scope.groupId)
              + "/contribution/" + scope.contributionId;
          } else {
            let assembly = localStorageService.get('currentAssembly');
            scope.auuid = assembly.uuid ? assembly.uuid : $stateParams.auuid;
            scope.cuuid = scope.campaign.uuid ? scope.campaign.uuid: $stateParams.cuuid;
            scope.groupId = scope.guuid = $stateParams.guuid ?
              $stateParams.guuid : workingGroupAuthorsLength ?
              scope.contribution.workingGroupAuthors[0].uuid : "";
            scope.contributionId = scope.contribution.uuid;
            scope.contributionUrl =
              "#/v2/p/assembly/" + scope.auuid
              + "/campaign/" + scope.cuuid
              + (scope.notAssigned ? "" : "/group/"+scope.guuid)
              + "/contribution/" + scope.contribution.uuid;

          }

          // Configure style of card footer
          if (scope.contribution.status &&  scope.contribution.status.includes('ARCHIVED') ) {
            scope.footerBackgroundColorStyle = 'archived';
          } else if(scope.contribution.status
              &&  scope.contribution.status.includes('FORK')
                || scope.contribution.status.includes('MERGED') ){
            scope.footerBackgroundColorStyle = 'forked';
            if (scope.contribution.status === 'FORKED_PUBLISHED'){
              scope.footerBackgroundColorStyle = 'forked-published';
            }
            if (scope.contribution.status.includes('DRAFT')) {
              scope.footerBackgroundColorStyle = 'forked-private-draft';
              if (scope.contribution.status.includes('PUBLIC')) {
                scope.footerBackgroundColorStyle = 'forked';
              }
            }
          } else if(scope.contribution.status
            &&  scope.contribution.status.includes('DRAFT') ){
            scope.footerBackgroundColorStyle = 'private-draft';
            if (scope.contribution.status.includes('PUBLIC')) {
              scope.footerBackgroundColorStyle = 'draft';
            }
          }

        }


        scope.$watch(function() { return scope.components; },scope.verifyCampaignComponent());
        scope.$watch(function() { return scope.showVotingButtons; },function(val){
          console.log("Updated voting "+ val);
        });

        scope.showActionMenu = false;
        scope.myObject = {};
        scope.myObject.refreshMenu = function () {
          scope.showActionMenu = !scope.showActionMenu;
        };

        //change redirection
        scope.myObject.softRemoval = function () {
          Contributions.contributionSoftRemoval(scope.assemblyId, scope.contribution.contributionId).update(scope.contribution);
          $window.location.reload();
        }

        scope.myObject.publish = function () {
          Contributions.publishContribution(scope.assemblyId, scope.contribution.contributionId).update(scope.contribution);
          $window.location.reload();
        }

        scope.myObject.exclude = function () {
          Contributions.excludeContribution(scope.assemblyId, scope.contribution.contributionId).update(scope.contribution);
          $window.location.reload();
        }

        //find endpoint
        scope.myObject.assignToWG = function () {
          //Contributions.assignContributionToWG(scope.assemblyId, scope.contribution.contributionId, scope.wg).update(scope.contribution);
          $window.location.reload();
        }

        scope.myObject.seeDetail = function () {
          scope.vexInstance = vex.open({
            className: "vex-theme-plain",
            unsafeContent: $compile(document.querySelector('.contribution-detail-modal').innerHTML)(scope)[0]
          });
        }

        scope.myObject.textAsHtml = function () {
          return $sce.trustAsHtml(scope.contribution ? scope.contribution.text : "");
        }

        scope.myObject.textAsHtmlLimited = function (limit) {
          if (scope.contribution && scope.contribution.text) {
            var limitedText = limitToFilter(scope.contribution.text, limit)
            if (scope.contribution.text.length > limit) {
              limitedText += "...";
            }

            scope.trustedHtmlText = $sce.trustAsHtml(limitedText);
          }

          return scope.trustedHtmlText;
        }

        function toggleSelection(conid) {
          var idx = scope.selected.indexOf(conid);
          if (idx > -1) {
            scope.selected.splice(idx, 1);
          } else {
            scope.selected.push(conid);
          }
        }

        function formatDate(date)
        {
          return date.split(' ')[0];
        }

        function mergeThemes(contribution) {
          var themes = [];

          if (contribution.officialThemes) {
            themes = themes.concat(contribution.officialThemes);
          }

          if (contribution.emergentThemes) {
            themes = themes.concat(contribution.emergentThemes);
          }
          return themes;
        }

        function verifyCampaignComponent() {
            if (this.campaign && this.components) {
              // Verify the status of the campaign and show or not show the voting buttons
              var currentComponent = Campaigns.getCurrentComponent(this.components);
              currentComponent = currentComponent ? currentComponent : {};
              if (currentComponent.type === 'VOTING') {
                this.showVotingButtons = !this.isAnonymous;
              } else if (currentComponent.type == 'PROPOSALS' || currentComponent.type == 'IDEAS') {
                this.isProposalIdeaStage = true;
              } else {
                this.isProposalIdeaStage = false;
              }
            }
          }

        function hasRole(roles, roleName) {
          var result = false;
          angular.forEach(roles, function (role) {
            if (role.name === roleName) {
              result = true;
            }
          });
          return result;
        }

        function setContributionType(scope) {
          scope.isProposal = scope.contribution.type === 'PROPOSAL';
          scope.isIdea = scope.contribution.type === 'IDEA';
        }

        function toggleContextualMenu() {
          this.showContextualMenu = !this.showContextualMenu;
        }
      }
    };
  }
}());
