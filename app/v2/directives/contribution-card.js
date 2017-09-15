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
        isTopicGroup: '='
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

          if (scope.contribution.cover) {
            let bkg_url = 'url(\"'+scope.contribution.cover.url+'\")';
            scope.coverPhotoStyle = { 'background-image': bkg_url, 'background-position': 'center center', 'background-size': 'cover' };
            scope.showOverlay = true;
          }

          if (assembly) {
            scope.assemblyId = assembly.assemblyId;
          }

          if (!scope.isIdea) {
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
        }


        scope.$watch(function() { return scope.components; },verifyCampaignComponent());
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
                this.showVotingButtons = true;
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
