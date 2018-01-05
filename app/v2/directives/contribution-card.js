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
        ballotTokens: '='
      },
      templateUrl: '/app/v2/partials/directives/contribution-card.html',
      link: function postLink(scope, element, attrs) {

        activate();

        function activate() {
          scope.showContextualMenu = false;
          scope.contribution.informalScore = Contributions.getInformalScore(scope.contribution);
          scope.toggleContextualMenu = toggleContextualMenu.bind(scope);
          scope.ideaExcerptStyle = scope.showIdeaBody ? { height: '120px' } : { height: '110px' };
          scope.ideaHeaderStyle = scope.showIdeaBody ? { height: '100px' } : { height: '150px' };
          setContributionType(scope);
          var assembly = localStorageService.get('currentAssembly');
          scope.campaignId = $stateParams.cid ? parseInt($stateParams.cid) : 0;
          scope.formatDate = formatDate.bind(scope);
          scope.mergedThemes = mergeThemes(scope.contribution);
          scope.verifyCampaignComponent = verifyCampaignComponent.bind(scope);

          if (scope.contribution.source !== undefined && scope.contribution.source == 'social_ideation_facebook') {
            scope.source_url = scope.contribution.source_url;
          }

          // Se contribution card header cover style

          // Prepare first WG's cover and color
          let wgCover = null;
          let wgColor = null;
          let wgCoverIsSVG = null; // TODO: make sure is one of defaults
          if (scope.contribution.workingGroupAuthors) {
            wgColor = scope.contribution.workingGroupAuthors[0].profile.color ? scope.contribution.workingGroupAuthors[0].profile.color : null;
            if (scope.contribution.workingGroupAuthors[0].profile.cover) {
              wgCover = scope.contribution.workingGroupAuthors[0].profile.cover;
              let wgCoverParts = wgCover.split("/assets/wgs/covers/");
              if (wgCoverParts && wgCoverParts.length > 1) {
                let fileName = wgCoverParts[1];
                wgCoverIsSVG = /^[1-9]\.svg$/.test(fileName);
              }
            }
          }

          // Prepare contribution's cover
          let cCover = scope.contribution.cover ? scope.contribution.cover.url : null;

          // If contribution is IDEA:
          // 1. Use the contribution's cover as cover (cCover)
          // 2. Use contribution's WG cover as background, if one of the default SVGs
          // 3. Use contribution's WG color as footer background
          if (scope.contribution.type === 'IDEA') {
            if (cCover) {
              let bkg_url = 'url(\"'+cCover+'\")';
              scope.coverPhotoStyle = { 'background-image': bkg_url, 'background-position': 'center center', 'background-size': 'cover' };
              scope.showOverlay = true;
            }
            if (wgColor) {
              scope.footerBackgroundStyle = { 'background-color': wgColor, 'background-position': 'center center', 'background-size': 'cover' };
            }
            if (wgCover && wgCoverIsSVG) {
              let bkg_url = 'url(\"'+wgCover+'\")';
              scope.footerBackgroundStyle = { 'background-image': bkg_url, 'background-position': 'center center', 'background-size': 'cover' };
            }
          }

          // If contribution is not idea, use as cover the cover of the WG
          if (scope.contribution.type!=='IDEA') {
            if (wgCover) {
              let bkg_url = 'url(\"'+wgCover+'\")';
              scope.coverPhotoStyle = { 'background-image': bkg_url, 'background-position': 'center center', 'background-size': 'cover' };
              scope.showOverlay = true;
            } else if (wgColor) {
              let bkg_url = wgColor;
              scope.coverPhotoStyle = { 'background-color': bkg_url };
              scope.showOverlay = true;
            }
          }

          if (assembly) {
            scope.assemblyId = assembly.assemblyId;
          }

          var workingGroupAuthors = scope.contribution.workingGroupAuthors;
          var workingGroupAuthorsLength = workingGroupAuthors ? workingGroupAuthors.length : 0;
          scope.group = workingGroupAuthorsLength ? workingGroupAuthors[0] : 0;
          scope.notAssigned = true;

          if (scope.group) {
            scope.notAssigned = false;
          }

          if (!scope.isAnonymous) {
            scope.groupId = workingGroupAuthorsLength ? scope.contribution.workingGroupAuthors[0].groupId : 0;
            scope.contributionId = scope.contribution.contributionId;
          } else {
            scope.auuid = $stateParams.auuid;
            scope.cuuid = $stateParams.cuuid;
            scope.groupId = scope.guuid = $stateParams.guuid ?
              $stateParams.guuid : workingGroupAuthorsLength ?
              scope.contribution.workingGroupAuthors[0].uuid : "";
            scope.contributionId = scope.contribution.uuid;
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

        function formatDate(date) {
          return moment(date, 'yyyy-MM-DD').format('YYYY/MM/DD');
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
