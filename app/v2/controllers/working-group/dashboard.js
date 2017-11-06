(function () {
  'use strict';

  angular
    .module('appCivistApp')
    .controller('v2.WorkingGroupDashboardCtrl', WorkingGroupDashboardCtrl);


  WorkingGroupDashboardCtrl.$inject = [
    '$scope', 'Campaigns', 'WorkingGroups', '$stateParams', 'Assemblies', 'Contributions', '$filter',
    'localStorageService', 'Notify', 'Memberships', 'Space', '$translate', '$rootScope', '$state'
  ];

  function WorkingGroupDashboardCtrl($scope, Campaigns, WorkingGroups, $stateParams, Assemblies, Contributions,
    $filter, localStorageService, Notify, Memberships, Space, $translate, $rootScope, $state) {
    $scope.activeTab = "Public";
    $scope.changeActiveTab = function (tab) {
      if (tab == 1) {
        $scope.activeTab = "Members";
      } else {
        $scope.activeTab = "Public";
      }
    }

    activate();

    function activate() {
      ModalMixin.init($scope);
      $scope.membersCommentCounter = { value: 0 };
      $scope.publicCommentCounter = { value: 0 };
      $scope.pageSize = 12;
      $scope.type = 'proposal';
      $scope.showPagination = false;
      $scope.isTopicGroup = false;
      $scope.sorting = 'date_desc';
      $scope.filters = {
        searchText: '',
        themes: [],
        groups: [],
        // date_asc | date_desc | popularity | random | most_commented | most_commented_public | most_commented_members
        sorting: $scope.sorting,
        pageSize: $scope.pageSize,
        mode: $scope.type
      };

      $scope.associatedContributionsType = "idea";

      // if the param is uuid then it is an anonymous user
      $scope.isAnonymous = false;
      $scope.isCoordinator = false;
      $scope.insights = {
        proposalsCount: 0,
        ideasCount: 0,
        proposalCommentsCount: 0
      };
      // TODO: read the following from configurations in the campaign/component
      $scope.newProposalsEnabled = true;
      $scope.newIdeasEnabled = false;
      $scope.vmSearchFilters = {};

      var pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (pattern.test($stateParams.guuid)) {
        $scope.groupID = $stateParams.guuid;
        $scope.assemblyID = $stateParams.auuid;
        $scope.campaignID = $stateParams.cuuid;
        $scope.isAnonymous = true;
        $scope.fromURL = 'v2/group/' + $scope.groupID;
        $scope.isCoordinator = Memberships.isWorkingGroupCoordinator($scope.groupID);
      } else {
        $scope.assemblyID = ($stateParams.aid) ? parseInt($stateParams.aid) : 0;
        $scope.groupID = ($stateParams.gid) ? parseInt($stateParams.gid) : 0;
        $scope.campaignID = ($stateParams.cid) ? parseInt($stateParams.cid) : 0;
        $scope.user = localStorageService.get('user');
        $scope.fromURL = 'v2/assembly/' + $scope.assemblyID + '/group/' + $scope.groupID;
        $scope.isCoordinator = Memberships.isAssemblyCoordinator($scope.assemblyID);
      }
      loadAssembly();

      if (!$scope.isAnonymous) {
        $scope.activeTab = "Members";
      }
      $scope.activitiesLimit = 4;
      $scope.membersLimit = 5;
      $scope.ideasSectionExpanded = false;
      $scope.insightsSectionExpanded = false;
      $scope.commentsSectionExpanded = false;
      $scope.filters = {};
      $scope.toggleInsightsSection = toggleInsightsSection.bind($scope);
      $scope.toggleIdeasSection = toggleIdeasSection.bind($scope);
      $scope.toggleCommentsSection = toggleCommentsSection.bind($scope);
      $scope.toggleHideIdeasSection = toggleHideIdeasSection.bind($scope);
      $scope.toggleHideCommentsSection = toggleHideCommentsSection.bind($scope);
      $scope.toggleHideInsightsSection = toggleHideInsightsSection.bind($scope);
      $scope.loadThemes = loadThemes.bind($scope);
      $scope.toggleAllMembers = toggleAllMembers.bind($scope);
      $scope.redirectToProposal = redirectToProposal.bind($scope);
      $scope.onCampaignReady = onCampaignReady.bind($scope);
      $scope.contributionTypeIsSupported = function (type) {
        return Campaigns.isContributionTypeSupported(type, $scope);
      }

      $scope.$on('dashboard:fireDoSearch', function () {
        $rootScope.$broadcast('pagination:fireDoSearchFromGroup');
      })

      $scope.resources = {};
      // user is member of Assembly
      $scope.userIsMember = Memberships.isMember("assembly",$scope.assemblyID);
      $scope.userIsCoordinator = Memberships.isAssemblyCoordinator($scope.assemblyID);
      $scope.userIsAdmin = Memberships.userIsAdmin();
    }

    function loadAssembly() {
      if ($scope.isAnonymous) {
        var rsp = Assemblies.assemblyByUUID($scope.assemblyID).get();
      } else {
        var rsp = Assemblies.assembly($scope.assemblyID).get();
      }
      rsp.$promise.then(function (data) {
        $scope.assembly = data;
        verifyMembership();
      });
    }

    function verifyMembership() {
      $scope.userIsMember = Memberships.isMember('group', $scope.groupID);
      loadCampaign();
    }

    function loadCampaign() {
      $scope.campaign = localStorageService.get('currentCampaign');
      if ($scope.campaign) {
        $scope.campaignID = $scope.campaign.campaignId ? $scope.campaign.campaignId : $scope.campaign.uuid;
        $scope.campaign.rsID = $scope.campaign.resourceSpaceId;
        $scope.campaign.rsUUID = $scope.campaign.resourceSpaceUUID;
        $scope.onCampaignReady();
      } else {
        var rsp;
        if ($state.params.cid) {
          rsp = Campaigns.campaign($state.params.aid, $state.params.cid).get();
        } else {
          rsp = Campaigns.campaignByUUID($state.params.cuuid).get();
        }
        rsp.$promise.then(
          campaign => {
            $scope.campaign = campaign;
            $scope.campaignID = $scope.campaign.campaignId ? $scope.campaign.campaignId : $scope.campaign.uuid;
            $scope.campaign.rsID = $scope.campaign.resourceSpaceId;
            $scope.campaign.rsUUID = $scope.campaign.resourceSpaceUUID;
            localStorageService.set("currentCampaign",$scope.campaign);
            $scope.onCampaignReady();

            // var res = Campaigns.components(null, null, true, $scope.campaignID, null);
            // res.then(
            //   data => {
            //     var currentComponent = Campaigns.getCurrentComponent(data);
            //     $scope.components = data;
            //     localStorageService.set("currentCampaign.components",$scope.components);
            //     localStorageService.set("currentCampaign.currentComponent",currentComponent);
            //   }
            // );
          }
        )
      }
    }

    function onCampaignReady () {
      $scope.components = localStorageService.get('currentCampaign.components');
      let currentComponent = localStorageService.get('currentCampaign.currentComponent');
      if (!$scope.components) {
        var res;
        if (!$scope.isAnonymous) {
          res = Campaigns.components($scope.assemblyID, $scope.campaignID, false, null, null);
          loadMembersCommentCount($scope.spaceID);
        } else {
          res = Campaigns.componentsByCampaignUUID($scope.campaignID).query().$promise;
        }
        res.then(
          function (data) {
            $scope.components = data;
            let currentComponent = Campaigns.getCurrentComponent(data);
            $scope.currentComponentType = currentComponent ? currentComponent.type ? currentComponent.type.toUpperCase() : "" : ""; ;
            $scope.showVotingButtons = $scope.currentComponentType === 'VOTING' ? true : false;
            $scope.filters.currentComponent = currentComponent;
            $scope.filters.pageSize = $scope.pageSize;
            $scope.filters.mode =
              $scope.currentComponentType === 'IDEAS' ? 'idea' :
                currentComponent.type === 'VOTING' ?
                  getCurrentBallotEntityType() : 'proposal';
            $scope.currentComponent = currentComponent;
            localStorageService.set('currentCampaign.components', data);
            localStorageService.set('currentCampaign.currentComponent', currentComponent);
          },
          function (error) {
            Notify.show('Error loading data from server', 'error');
          }
        );
      } else {
        $scope.currentComponentType = currentComponent ? currentComponent.type ? currentComponent.type.toUpperCase() : "" : ""; ;
        $scope.showVotingButtons = $scope.currentComponentType === 'VOTING' ? true : false;
        $scope.filters.currentComponent = currentComponent;
        $scope.filters.pageSize = $scope.pageSize;
        $scope.filters.mode =
          $scope.currentComponentType === 'IDEAS' ? 'idea' :
            currentComponent.type === 'VOTING' ?
              getCurrentBallotEntityType() : 'proposal';
        $scope.currentComponent = currentComponent;
      }

      if($scope.isAnonymous) {
        var rsp = Campaigns.getConfigurationPublic($scope.campaign.rsUUID).get();
      } else {
        var rsp = Campaigns.getConfiguration($scope.campaign.rsID).get();
      }
      rsp.$promise.then(function (data) {
        $scope.campaignConfigs = data;

        if ($scope.campaignConfigs['appcivist.campaign.disable-working-group-comments'] && $scope.campaignConfigs['appcivist.campaign.disable-working-group-comments'] === 'TRUE') {
          $scope.showComments = false;
        } else {
          $scope.showComments = true;
        }
        loadWorkingGroup();
      }, function (error) {
        loadWorkingGroup();
        Notify.show('Error while trying to fetch campaign config', 'error');
      });
    }
    function loadWorkingGroup() {
      var res;

      if ($scope.isAnonymous) {
        res = WorkingGroups.workingGroupByUUID($scope.groupID).get();
      } else {
        res = WorkingGroups.workingGroup($scope.assemblyID, $scope.groupID).get();
      }
      res.$promise.then(
        function (data) {
          $scope.wg = data;
          localStorageService.set('currentWorkingGroup',$scope.wg);
          $scope.wg.rsID = data.resourcesResourceSpaceId;
          $scope.wg.rsUUID = data.resourcesResourceSpaceUUID;
          $scope.wg.frsUUID = data.forumResourceSpaceUUID;
          $scope.isTopicGroup = data.isTopic;
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

          if ($scope.isTopicGroup) {
            // if group is topic, then is OPEN to every assembly member.
            $scope.userIsMember = true;
          }
          loadMembers(data);

          if ($scope.isAnonymous) {
            $scope.spaceID = data.resourcesResourceSpaceUUID;
            $translate.use($scope.wg.lang);
          } else {
            $scope.forumSpaceID = data.forumResourceSpaceId;
            $scope.spaceID = data.resourcesResourceSpaceId;
            loadPublicCommentCount($scope.forumSpaceID);
            loadMembersCommentCount($scope.spaceID);
          }

          Space.getSpaceBasicAnalytics(data.resourcesResourceSpaceUUID).then(
            data => {
              $scope.insights = data;
            }
          );

          $scope.showPagination = true;
          loadLatestActivities(data);

          if ($scope.wg) {
            var rsp = $scope.isAnonymous ? Space.configsByUUID($scope.wg.rsUUID).get() : Space.configs($scope.wg.rsID).get();
            rsp.$promise.then(function (data) {
              $scope.wgConfigs = data;

              if ($scope.wgConfigs['appcivist.group.disable-working-group-comments'] && $scope.wgConfigs['appcivist.group.disable-working-group-comments'] === 'TRUE') {
                $scope.showComments = false;
              } else {
                $scope.showComments = true;
              }
              $scope.$broadcast('filters:updateFilters',$scope.filters);
            }, function (error) {
              $scope.$broadcast('filters:updateFilters',$scope.filters);
              Notify.show('Error while trying to fetch wg config', 'error');
            });

            loadRelatedContributions();
          }
        },
        function (error) {
          Notify.show('Error occured trying to initialize the working group: ' + JSON.stringify(error), 'error');
        }
      );
    }

    function loadMembers(group) {
      var aid = group.assemblyId;
      var gid = group.groupId;
      var res;

      if (group.supportedMembership && group.supportedMembership != "OPEN") {
        if ($scope.isAnonymous) {
          $scope.members = group.members
            .filter(function (m) {
              return m.status === 'ACCEPTED';
            });
        } else {
          res = WorkingGroups.workingGroupMembers($scope.assemblyID, gid, 'ALL').query();
          res.$promise.then(
            function (data) {
              $scope.members = data;
            },
            function (error) {
              Notify.show('Error occured while trying to load working group members', 'error');
            }
          );
        }
      }
    }

    function loadRelatedContributions() {
      var rsp = Space.getContributions($scope.wg, 'IDEA', $scope.isAnonymous);
      rsp.then(
        function (data) {
          var related = [];
          angular.forEach(data.list, function (r) {
            angular.forEach(r.workingGroupAuthors, function(w) {
              if (w.groupId === $scope.groupID) related.push(r);
            });
          });
          $scope.resources.relatedContributions = related;
          console.log(related);
        },
        function (error) {
          Notify.show('Error loading contributions from server', 'error');
        }
      );
    }

    function loadPublicCommentCount(sid) {
      var res;
      res = Space.getCommentCount(sid).get();
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

    // TODO: just show the latest contributions until notifications API is ready
    function loadLatestActivities(group) {
      var rsp = Space.getContributions(group, 'PROPOSAL', $scope.isAnonymous);
      rsp.then(
        function (data) {
          $scope.activities = data.list;
        },
        function (error) {
          Notify.show('Error loading working group activities from server', 'error');
        }
      );
    }

    function toggleIdeasSection() {
      $scope.ideasSectionExpanded = !$scope.ideasSectionExpanded;
      $scope.commentsSectionExpanded = false;
      $scope.insightsSectionExpanded = false;
      //$rootScope.$broadcast('eqResize', true);
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
      //$rootScope.$broadcast('eqResize', true);
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

    function toggleAllMembers() {
      if ($scope.membersLimit <= 5) {
        $scope.membersLimit = $scope.members ? $scope.members.length : 10; // TODO: instead of 10, use lenght of member list
      } else {
        $scope.membersLimit = 5;
      }
    }

    function loadThemes(query) {
      if (!this.wg) {
        return;
      }
      return this.wg.themes;
    }

    function prependPinnedContributions(data) {
      if (data && data.length > 0) {
        for (var i = 0; i < data.length; i++) {
          $scope.proposals.unshift(data[i]);
        }
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
    function redirectToProposal(contribution) {
      this.closeModal('proposalFormModal');

      $state.go('v2.assembly.aid.campaign.workingGroup.gid.proposal.pid', {
        pid: contribution.contributionId,
        aid: this.assemblyID,
        cid: this.campaignID,
        gid: this.groupID
      });
    }
  }
}());
