(function () {
  'use strict';

  angular
    .module('appCivistApp')
    .controller('v2.WorkingGroupDashboardCtrl', WorkingGroupDashboardCtrl);


  WorkingGroupDashboardCtrl.$inject = [
    '$scope', 'Campaigns', 'WorkingGroups', '$stateParams', 'Assemblies', 'Contributions', 'Invitations', '$filter',
    'localStorageService', 'Notify', 'Memberships', 'Space', '$translate', '$rootScope', '$state', '$http', '$breadcrumb', 'Notifications'
  ];

  function WorkingGroupDashboardCtrl($scope, Campaigns, WorkingGroups, $stateParams, Assemblies, Contributions, Invitations,
                                     $filter, localStorageService, Notify, Memberships, Space, $translate, $rootScope,
                                     $state, $http, $breadcrumb, Notifications) {
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
      $scope.membersCommentCounter = {value: 0};
      $scope.publicCommentCounter = {value: 0};
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
        mode: $scope.type,
        status: 'PUBLISHED, PUBLIC_DRAFT'
      };
      $scope.getFromFile = getFromFile.bind($scope);
      $scope.membersFile = null;
      $scope.membersFileUrl = null;
      $scope.membersSendInvitations = null;
      $scope.commentType = 'public';
      $scope.subscribed = false;

      $scope.$watch('membersFile', $scope.getFromFile);

      function getFromFile(file) {
        if (!file) {
          return;
        }
        let reader = new FileReader();
        reader.onload = (e) => {
          $scope.$apply(() => $scope.membersFileUrl = e.target.result);
        };
        reader.readAsDataURL(file);
      }

      $scope.associatedContributionsType = "idea";

      // if the param is uuid then it is an anonymous user
      $scope.isAnonymous = false;
      $scope.isCoordinator = false;
      $scope.isWGCoordinator = false;
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
        $scope.fromURL = 'v2/group/' + $scope.groupID;
        $scope.isCoordinator = Memberships.isWorkingGroupCoordinator($scope.groupID);
        $scope.isAnonymous = true;
      } else {
        $scope.assemblyID = ($stateParams.aid) ? parseInt($stateParams.aid) : 0;
        $scope.groupID = ($stateParams.gid) ? parseInt($stateParams.gid) : 0;
        $scope.campaignID = ($stateParams.cid) ? parseInt($stateParams.cid) : 0;
        $scope.user = localStorageService.get('user');
        $scope.fromURL = 'v2/assembly/' + $scope.assemblyID + '/group/' + $scope.groupID;
        $scope.isCoordinator = Memberships.isAssemblyCoordinator($scope.assemblyID);
        $scope.isWGCoordinator = Memberships.isWorkingGroupCoordinator($scope.groupID);
        $scope.userIsMember = Memberships.isMember("assembly", $scope.assemblyID);
        $scope.userIsGroupMember = Memberships.isMember("group", $scope.groupID);
        $scope.userIsAdmin = Memberships.userIsAdmin();
        $scope.activeTab = "Members";
      }

      if ($scope.userIsGroupMember) {
        $scope.commentType = 'members';
      }

      loadAssembly();

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
      $scope.joinWg = joinWg.bind($scope);
      $scope.updateStatus = updateStatus.bind($scope);
      $scope.resendInvitation = resendInvitation.bind($scope);
      $scope.submitMembers = submitMembers.bind($scope);
      $scope.subscribeNewsletter = subscribeNewsletter.bind($scope);
      $scope.unsubscribeNewsletter = unsubscribeNewsletter.bind($scope);
      $scope.checkIfSubscribed = checkIfSubscribed.bind($scope);
      $scope.createContribution = createContribution.bind($scope);
      $scope.refreshWorkingGroupsMemberships = refreshWorkingGroupsMemberships.bind($scope);
      $scope.updateRole = updateRole.bind($scope);
      $scope.deleteMembership = deleteMembership.bind($scope);

      $scope.$on('dashboard:fireDoSearch', function () {
        $rootScope.$broadcast('pagination:fireDoSearchFromGroup');
      })

      $scope.resources = {};
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
          $translate('JoinWg successfully').then(function (successMsg) {
            Notify.show(successMsg, 'success');
            refreshWorkingGroupsMemberships()
            }
          );
          //Notify.show("Request completed successfully. We'll get in contact soon.", "success");
        },
        error => Notify.show(error.statusMessage, "error")
      )
    }

    function refreshWorkingGroupsMemberships() {
      if (!$scope.isAnonymous) {
        let rsp = Memberships.memberships($scope.user.userId).query().$promise;
        let vm = $scope;
        rsp.then(
          data => {
            let groupMembershipsHash = {};
            let membershipsInGroups = $filter('filter')(data, {membershipType: 'GROUP'});
            let myWorkingGroups = membershipsInGroups.map(function (membership) {
              groupMembershipsHash[membership.workingGroup.groupId] = membership.roles;
              return membership.workingGroup;
            });
            localStorageService.set('groupMembershipsHash', groupMembershipsHash);
            let rsp = WorkingGroups.workingGroupsInCampaign(vm.assemblyID, vm.campaignID).query().$promise;
            rsp.then(
              groups => {
                const mine = groups.filter(g => _.find(membershipsInGroups, m => m.workingGroup.groupId === g.groupId));
                const other = groups.filter(g => !_.find(membershipsInGroups, m => m.workingGroup.groupId === g.groupId));
                localStorageService.set('myWorkingGroups', mine.filter(g => g.isTopic === false));
                localStorageService.set('otherWorkingGroups', other);
                vm.myWorkingGroups = mine.filter(g => g.isTopic === false);
                vm.otherWorkingGroups = other;
           //   verifyMembership();
              }
            );
          }
        );
      }
    }

    function loadAssembly() {
      if ($scope.isAnonymous) {
        var rsp = Assemblies.assemblyByUUID($scope.assemblyID).get();
      } else {
        var rsp = Assemblies.assembly($scope.assemblyID).get();
      }
      rsp.$promise.then(function (data) {
        $scope.assembly = data;
        $scope.assemblyLabel = $scope.assembly.name;
        verifyMembership();
      });
    }

    function verifyMembership() {
      if (!$scope.isAnonymous)  {
        $scope.refreshWorkingGroupsMemberships();
        $scope.userIsMember = Memberships.isMember('group', $scope.groupID);
      }
      loadCampaign();
    }

    function loadCampaign() {
      $scope.campaign = localStorageService.get('currentCampaign');
      let loggedInWithPublicCampaign = $stateParams.cid && $scope.campaign && (!$scope.campaign.campaignId || $scope.campaign.resourceSpaceId);
      var rsp;
      if (loggedInWithPublicCampaign || ($stateParams.cid && !$scope.campaign)) {
        rsp = Campaigns.campaign($state.params.aid, $state.params.cid).get();
      } else if ($scope.campaign) {
        $scope.campaignID = $scope.campaign.campaignId ? $scope.campaign.campaignId : $scope.campaign.uuid;
        $scope.campaign.rsID = $scope.campaign.resourceSpaceId;
        $scope.campaign.rsUUID = $scope.campaign.resourceSpaceUUID;
        $scope.onCampaignReady();
      } else {
        rsp = Campaigns.campaignByUUID($state.params.cuuid).get();
      }

      if (rsp!= null && rsp!= undefined) {
        rsp.$promise.then(
          campaign => {
            $scope.campaign = campaign;
            $scope.campaignID = $scope.campaign.campaignId ? $scope.campaign.campaignId : $scope.campaign.uuid;
            $scope.campaign.rsID = $scope.campaign.resourceSpaceId;
            $scope.campaign.rsUUID = $scope.campaign.resourceSpaceUUID;
            localStorageService.set("currentCampaign",$scope.campaign);
            $scope.onCampaignReady();
          }
        )
      }
    }

    function onCampaignReady () {
      $scope.campaignLabel = $scope.campaign.title;
      $scope.components = localStorageService.get('currentCampaign.components');
      let currentComponent = localStorageService.get('currentCampaign.currentComponent');
      if (!$scope.components) {
        var res;
        if (!$scope.isAnonymous || $scope.userIsMember) {
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
            switch ($scope.currentComponent.type) {
              case "IMPLEMENTATION": $scope.filters.sorting = 'popularity_desc'; break;
              case "VOTING": $scope.filters.sorting = 'random'; break;
              case "DELIBERATION": $scope.filters.sorting = 'random'; break;
              case "IDEAS": $scope.filters.sorting = 'date_desc'; break;
              case "PROPOSALS": $scope.filters.sorting = 'date_desc'; break;
              default: $scope.filters.sorting = 'date_desc'; break;
            }
          },
          function (error) {
            Notify.show(error.statusMessage, 'error');
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
        switch ($scope.currentComponent.type) {
          case "IMPLEMENTATION": $scope.filters.sorting = 'popularity_desc'; break;
          case "VOTING": $scope.filters.sorting = 'random'; break;
          case "DELIBERATION": $scope.filters.sorting = 'random'; break;
          case "IDEAS": $scope.filters.sorting = 'date_desc'; break;
          case "PROPOSALS": $scope.filters.sorting = 'date_desc'; break;
          default: $scope.filters.sorting = 'date_desc'; break;
        }
      }

      if($scope.isAnonymous || !$scope.userIsMember) {
        var rsp = Campaigns.getConfigurationPublic($scope.campaign.rsUUID).get();
      } else {
        var rsp = Campaigns.getConfiguration($scope.campaign.rsID).get();
      }
      rsp.$promise.then(function (data) {
        $scope.campaignConfigs = data;
        $scope.campaign.configs = $scope.campaignConfigs;

        if ($scope.campaignConfigs['appcivist.campaign.use-proposal-form'] === 'TRUE') {
          $scope.useProposalForm = true;
        } else {
          $scope.useProposalForm = false;
        }

        if ($scope.campaignConfigs['appcivist.working-group.hide-assigned-ideas'] === 'TRUE') {
          $scope.hideAssignedIdeas = true;
        } else {
          $scope.hideAssignedIdeas = false;
        }

        if ($scope.campaignConfigs['appcivist.campaign.disable-working-group-comments'] && $scope.campaignConfigs['appcivist.campaign.disable-working-group-comments'] === 'TRUE') {
          $scope.showComments = false;
        } else {
          $scope.showComments = true;
        }

        if ($scope.campaignConfigs['appcivist.working-group.allow-non-members-to-post-proposals'] === 'TRUE') {
          $scope.allowNonMembersProposals = true;
        } else {
          $scope.allowNonMembersProposals = false;
        }
        loadWorkingGroup();
      }, function (error) {
        loadWorkingGroup();
        Notify.show(error.statusMessage, 'error');
      });
    }

    function loadWorkingGroup() {
      var res;

      if ($scope.isAnonymous || !$scope.userIsMember) {
        if (!$scope.userIsMember && !$scope.isAnonymous) {
          res = WorkingGroups.workingGroupPublicProfile($scope.assemblyID, $scope.groupID).get();
        } else {
          res = WorkingGroups.workingGroupByUUID($scope.groupID).get();
        }
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
          $scope.workingGroupLabel = data.name;


          // Prepare first WG's cover and color
          let wgCover = $scope.wg.profile.cover;
          let wgColor = $scope.wg.profile.color;
          let wgCoverIsSVG = null; // TODO: make sure is one of defaults
          let wgCoverParts = wgCover !=null ? wgCover.split("/assets/wgs/covers/") : null;
          if (wgCoverParts && wgCoverParts.length > 1) {
            let fileName = wgCoverParts[1];
            wgCoverIsSVG = /^[1-9]\.svg$/.test(fileName);
          }

          // if (wgColor) {
          //   scope.footerBackgroundStyle = { 'background-color': wgColor, 'background-position': 'center center', 'background-size': 'cover' };
          // }
          if (wgCover && wgCoverIsSVG) {
            var _bkg_url = 'url(\"' + wgCover + '\")';
            $scope.coverStyle = { 'background-image': _bkg_url, 'background-position': 'center center', 'background-size': 'cover' };
          }

          if ($scope.isTopicGroup) {
            // if group is topic, then is OPEN to every assembly member.
            $scope.userIsMember = true;
          }
          loadMembers(data);

          if ($scope.isAnonymous || !$scope.userIsMember) {
            $scope.spaceID = data.resourcesResourceSpaceUUID;
            $translate.use($scope.wg.lang);
          } else {
            $scope.forumSpaceID = data.forumResourceSpaceId;
            $scope.spaceID = data.resourcesResourceSpaceId;
            loadPublicCommentCount($scope.forumSpaceID);
            loadMembersCommentCount($scope.spaceID);
          }

          Space.getSpaceBasicAnalytics(data.resourcesResourceSpaceUUID, false, true, $scope.isAnonymous ? null : $scope.user.userId).then(
            data => {
              $scope.insights = data;
            }
          );

          $scope.showPagination = true;
          loadLatestActivities(data);

          if ($scope.wg) {
            var rsp = ($scope.isAnonymous || !$scope.userIsMember) ? Space.configsByUUID($scope.wg.rsUUID).get() : Space.configs($scope.wg.rsID).get();
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
              Notify.show(error.statusMessage, 'error');
            });

            loadRelatedContributions();
          }

          checkIfSubscribed($scope.wg.rsID);
        },
        function (error) {
          Notify.show('Error occured trying to initialize the working group: ' + error.statusMessage, 'error');
        }
      );
    }

    function loadMembers(group) {
      var aid = group.assemblyId;
      var gid = group.groupId;
      var res;
      const emailConcatenator = (acc, value) => {
        if (acc) acc = acc.concat(",");
        acc = acc.concat(value.user.email);
        return acc;

      };

      if (group.profile.supportedMembership) {
        if ($scope.isAnonymous || !$scope.userIsMember) {
          if (group.members) {
            $scope.members = group.members
              .filter(function (m) {
                return m.status === 'ACCEPTED';
              });
            $scope.memberRequests = group.members
              .filter(function (m) {
                return m.status === 'REQUESTED';
              });
            $scope.membersInvited = group.members
              .filter(function (m) {
                return m.status === 'INVITED';
              });
            // concatenate member emails
            if ($scope.members) {
              $scope.memberEmails = $scope.members.reduce(emailConcatenator,"");
              for (var i = 0; i < $scope.members.length; i++) {
                var m = $scope.members[i]
                m['mostRelevantRole'] = Memberships.mostRelevantRole(m);
              }
            }


          } else {
            res = WorkingGroups.workingGroupMembers($scope.assemblyID, gid, 'ACCEPTED').query();
            res.$promise.then(
              function (data) {
                if (data && data.members) {
                  $scope.members = data.members;
                  // concatenate member emails
                  $scope.memberEmails = $scope.members.reduce(emailConcatenator,"");
                  for (var i = 0; i < $scope.members.length; i++) {
                    var m = $scope.members[i]
                    m['mostRelevantRole'] = Memberships.mostRelevantRole(m);
                  }
                }
              },
              function (error) {
                Notify.show(error.statusMessage, 'error');
              }
            );
            res = WorkingGroups.workingGroupMembers($scope.assemblyID, gid, 'REQUESTED').query();
            res.$promise.then(
              function (data) {
                $scope.memberRequests = data;
              }
            );
            res = Invitations.invitations('group', gid, 'INVITED').query();
            res.$promise.then(
              function (data) {
                $scope.membersInvited = data;
              }
            );
          }
        } else {
          res = WorkingGroups.workingGroupMembers($scope.assemblyID, gid, 'ACCEPTED').query();
          res.$promise.then(
            function (data) {
              console.log('members aca');
              console.log(data);
              if (data && data.members) {
                $scope.members = data.members;
                // concatenate member emails
                $scope.memberEmails = $scope.members.reduce(emailConcatenator,"");
                for (var i = 0; i < $scope.members.length; i++) {
                  var m = $scope.members[i]
                  m['mostRelevantRole'] = Memberships.mostRelevantRole(m);
                }
              }
            },
            function (error) {
              Notify.show(error.statusMessage, 'error');
            }
          );
          res = WorkingGroups.workingGroupMembers($scope.assemblyID, gid, 'REQUESTED').query();
          res.$promise.then(
            function (data) {
              $scope.memberRequests = data;
            }
          );
          res = Invitations.invitations('group', gid, 'INVITED').query();
          res.$promise.then(
            function (data) {
              $scope.membersInvited = data;
            }
          );
        }
      }
      $scope.refreshWorkingGroupsMemberships();
    }

    function updateStatus(member, status) {
      let model = {
        userId: member.user.userId,
        email: member.user.email,
        type: 'GROUP',
        targetCollection: $scope.wg.groupId,
        status: status
      }
      let rsp = Memberships.updateStatus(member.membershipId, status).update(model);
      rsp.$promise.then(
        response => {
          switch (status) {
            case "accepted":
              $translate('Member accepted').then(function (successMsg) {
                Notify.show(successMsg, 'success');
              });
              break;
              //Notify.show("Member accepted successfully.", "success"); break;
            case "rejected":
              $translate('Member rejected').then(function (successMsg) {
                Notify.show(successMsg, 'success');
              });
              break;
              //Notify.show("Member rejected successfully.", "success"); break;
          }
        },
        error => Notify.show(error.statusMessage, "error")
      )
    }

    function resendInvitation(member) {
      let rsp = Invitations.resendInvitation(member.id);
      rsp.then(
        response => {
          $translate('resendInvitation').then(function (successMsg) {
            Notify.show(successMsg, 'success');
          });
          //Notify.show("The invitation has been sent", "success");
        },
        error => {
          Notify.show(error.statusMessage, "error");
        }
      );
    }

    function submitMembers(assemblyId) {
      console.log(assemblyId);
      $rootScope.startSpinner();
      var url = localStorageService.get('serverBaseUrl') + '/assembly/' + assemblyId + '/campaign/'+ $scope.campaignID +'/group/'+ $scope.groupID +'/member';
      var fd = new FormData();
      fd.append('file', $scope.membersFile);
      $http.post(url, fd, {
        headers: {
          'Content-Type': undefined
        },
        transformRequest: angular.identity,
        params: {
          send_invitations: $scope.membersSendInvitations
        }
      }).then(
        response => {
          $rootScope.stopSpinner();
          $translate('Members invited').then(function (successMsg) {
            Notify.show(successMsg, 'success');
          });
          //Notify.show("Members invited successfully", "success");
          loadMembers($scope.wg);
          angular.element('#addMembers button.close').trigger('click');
        },
        error => {
          Notify.show(error.data.statusMessage, "error");
          $rootScope.stopSpinner();
        }
      )
    }

    function loadRelatedContributions() {
      var rsp = Space.getContributions($scope.wg, 'IDEA', ($scope.isAnonymous || !$scope.userIsMember), null, false);
      rsp.then(
        function (data) {
          var related = [];
          if (data && data.list) {
            angular.forEach(data.list, function (r) {
              angular.forEach(r.workingGroupAuthors, function(w) {
                if (w.groupId === $scope.groupID) related.push(r);
              });
            });
          }
          $scope.resources.relatedContributions = related;
        },
        function (error) {
          console.log("Error loading PROPOSALS: " + error.statusMessage);
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

    // TODO: just show the latest contributions until notifications API is ready
    function loadLatestActivities(group) {
      console.log("loadLatestActivities: " + ($scope.isAnonymous || !$scope.userIsMember));
      var rsp = Space.getContributions(group, 'PROPOSAL', ($scope.isAnonymous || !$scope.userIsMember), null, false);
      rsp.then(
        function (data) {
          $scope.activities = data && data.list ? data.list : [];
        },
        function (error) {
          console.log("Error loading PROPOSALS: " + error.statusMessage);
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
      $scope.closeModal('proposalFormModal');

      $state.go('v2.assembly.aid.campaign.workingGroup.proposal.pid', {
        pid: contribution.contributionId,
        aid: $scope.assemblyID,
        cid: $scope.campaignID,
        gid: $scope.groupID
      });
    }

    function subscribeNewsletter() {
      // Subscribe to newsletter
      let sub = {
        spaceId: $scope.campaign.rsUUID,
        userId: $scope.user.userId,
        spaceType: "WORKING_GROUP",
        subscriptionType: "NEWSLETTER"
      }
      Notifications.subscribe($scope.campaign.rsID).save(sub).$promise.then(
        response => {
          $scope.subscribed = true;
          $scope.subscription = response;
          $translate('Subscribed newsletters successfully').then(function (successMsg) {
            Notify.show(successMsg, 'success');
          });
          //Notify.show("Subscribed successfully! You will begin to receive newsletters every week.", "success");
        },
        error => {
          Notify.show("Error trying to subscribe. Please try again later.", "error")
        }
      );

      // Automatically create also a REGULAR subscription
      let subReg = {
        spaceId: $scope.campaign.rsUUID,
        userId: $scope.user.userId,
        spaceType: "WORKING_GROUP",
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
      let spaceId = $scope.wg.rsID
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
              $translate('Unsubscribed successfully').then(function (successMsg) {
                Notify.show(successMsg, 'success');
              });
              //Notify.show("Unsubscribed successfully.", "success");
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

    function createContribution(contributionType = 'PROPOSAL') {
      let defaultTitle = $scope.campaignConfigs['appcivist.campaign.contribution.default-title'];
      let payload = {};
      payload.status = "DRAFT";
      payload.title = defaultTitle ? defaultTitle : "Create your title";
      payload.text = "";
      payload.type = contributionType;
      payload.workingGroupAuthors = [];
      payload.workingGroupAuthors[0] = this.wg;
      console.log(payload);
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

    function updateRole(member) {
      // update the role
      // 1. Delete roles that do not match the name, except MEMBER (which should always stay)
      var userHasRole = false;
      if (member.roles) {
        userHasRole = Memberships.hasRol(member.roles,member.mostRelevantRole)
        member.roles.forEach(function(role) {
          console.log("Deleting role: "+role+" for member "+member.userId);
          // If role is not MEMBER and it is NOT then one we are changing to
          if (role.name !== "MEMBER" && role.name !== member.mostRelevantRole) {
            let roleId = role.roleId;
            var index = member.roles.indexOf(role);
            if (index>-1) {
              member.roles.splice(index,1);
              var rsp = Memberships.deleteMembershipRole(member.membershipId, roleId).delete();
              rsp.$promise.then(
                response => {
                  console.log("Deleted role "+role+" for member "+member.userId);
                },
                error => {
                  let fullErrorMsg = errorMsg + error.data ? error.data.statusMessage ? error.data.statusMessage : "[empty response]" : "[empty response]";
                  Notify.show(fullErrorMsg, 'error');
                }
              );
            }
          }
        });
      }

      // if User does not have the new selected role, add it
      if (!userHasRole) {
        var newRole = {
          "roleId": 0,
          "name": member.mostRelevantRole
        };
        var rsp = Memberships.addMembershipRole(member.membershipId).save(newRole);

        rsp.$promise.then(
          response => {
            if (!member.roles)
              member.roles = [];
            member.roles = response.roles;
            Notify.show('Membership updated', 'success');
          },
          error => {
            let fullErrorMsg = error.data ? error.data.statusMessage ? error.data.statusMessage : "[empty response]" : "[empty response]";
            Notify.show(fullErrorMsg, 'error');
          }
        );
      } else {
        Notify.show('Membership updated', 'success');
      }
    }

    function deleteMembership(member) {
      $translate("Are you sure you want to proceed with this operation?").then(
        translation => {
          let confirmation = window.confirm(translation);
          if (confirmation) {
            var rsp = Memberships.deleteMembership(member.membershipId).delete();
            rsp.$promise.then(
              reponse => {
                Notify.show('Member removed', 'success');
                loadMembers($scope.wg);
              },
              error => {
                let fullErrorMsg = error.data ? error.data.statusMessage ? error.data.statusMessage : "[empty response]" : "[empty response]";
                Notify.show(fullErrorMsg, 'error');
              }
            );
          }
        }
      );
    }
  }
}());
