(function() {
  'use strict';

  angular
    .module('appCivistApp')
    .controller('v2.WorkingGroupFormCtrl', WorkingGroupFormCtrl);

  WorkingGroupFormCtrl.$inject = ['$scope', 'localStorageService', '$translate', '$routeParams', 'LocaleService',
  'Assemblies', 'WorkingGroups', 'Campaigns', 'usSpinnerService', '$state', 'logService', '$stateParams'];

  function WorkingGroupFormCtrl($scope, localStorageService, $translate, $routeParams, LocaleService,
    Assemblies, WorkingGroups, Campaigns, usSpinnerService, $state, logService, $stateParams) {
    init();

    function init() {
      initScopeFunctions();
      initScopeContent();
      initializeAssembly();
      //initializeCampaign();
    }

    function initScopeFunctions() {
      $scope.setNewWorkingGroupIcon = function(url, name) {
        $scope.newWorkingGroup.profile.icon = url;
        var file = {};
        file.name = name;
        file.url = url;
        $scope.f = file;
      }

      $scope.uploadFiles = function(file, errFiles) {
        $scope.f = file;
        $scope.errFile = errFiles && errFiles[0];
        $scope.iconResource = {};
        FileUploader.uploadFileAndAddToResource(file, $scope.iconResource);
      };

      $scope.addEmailsToList = function(emailsText) {
        $scope.invalidEmails = [];
        var emails = emailsText.split(',');
        emails.forEach(function(email) {
          console.log("Adding email: " + email);
          var invitee = {};
          invitee.email = email.trim();
          if ($scope.isValidEmail(invitee.email)) {
            invitee.moderator = false;
            invitee.coordinator = false;
            $scope.newWorkingGroup.invitations.push(invitee);
          } else {
            $scope.invalidEmails.push(invitee.email);
          }
        });
        $scope.inviteesEmails = "";
      }

      $scope.isValidEmail = function(email) {
        var re = /^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/i;
        return re.test(email);
      }

      $scope.removeInvalidEmail = function(index) {
        $scope.invalidEmails.splice(index, 1);
      };

      $scope.removeInvtedAssemblyMemberFromInvitees = function(email) {
        for (i = $scope.assemblyMembers.length - 1; i >= 0; i--) {
          if ($scope.assemblyMembers[i].user.email == email)
            $scope.assemblyMembers[i].invite = false;
        }
      };

      $scope.removeInvitee = function(index) {
        var email = $scope.newWorkingGroup.invitations[index].email;
        if ($scope.invitedAssemblyMembers && $scope.invitedAssemblyMembers[email])
          $scope.removeInvtedAssemblyMemberFromInvitees(email);
        $scope.newWorkingGroup.invitations.splice(index, 1);
      };

      $scope.removeInviteeByEmail = function(email) {
        for (i = $scope.newWorkingGroup.invitations.length - 1; i >= 0; i--) {
          if ($scope.newWorkingGroup.invitations[i].email == email)
            $scope.newWorkingGroup.invitations.splice(i, 1);
        }
      };

      $scope.getAttributesFromExistingWGroup = function() {
        //TODO to set default assembly
        $scope.campaignId = $scope.newWorkingGroup.campaigns[0];
        $scope.campaignThemes = $scope.newWorkingGroup.existingThemes; //?

        if ($scope.newWorkingGroup.profile.supportedMembership === 'OPEN') {
          $scope.newWorkingGroup.profile.membership = 'OPEN';
        } else if ($scope.newWorkingGroup.profile.supportedMembership === "INVITATION" || $scope.newWorkingGroup.profile.supportedMembership === "REQUEST"
            || $scope.newWorkingGroup.profile.supportedMembership === "INVITATION_AND_REQUEST") {
              $scope.newWorkingGroup.profile.registration = {};
            if ($scope.newWorkingGroup.profile.supportedMembership === "INVITATION")
              $scope.newWorkingGroup.profile.registration.invitation = true;
            if ($scope.newWorkingGroup.profile.supportedMembership === "REQUEST")
              $scope.newWorkingGroup.profile.registration.request = true;
            if ($scope.newWorkingGroup.profile.supportedMembership === "INVITATION_AND_REQUEST") {
              $scope.newWorkingGroup.profile.registration.invitation = true;
              $scope.newWorkingGroup.profile.registration.request = true;
            }
            $scope.newWorkingGroup.profile.membership = 'REGISTRATION';
        }

        // see how this can be established
        if ($scope.newWorkingGroup.profile.managementType === "OPEN") {
          $scope.newWorkingGroup.profile.moderators = 'none';
          $scope.newWorkingGroup.profile.coordinators = 'none';
        } else if ($scope.newWorkingGroup.profile.managementType = "COORDINATED_AND_MODERATED") {
          $scope.newWorkingGroup.profile.moderators = 'two'; //can be all
          $scope.newWorkingGroup.profile.coordinators = 'two'; //can be all
        } else if ($scope.newWorkingGroup.profile.managementType = "MODERATED") {
          $scope.newWorkingGroup.profile.moderators = 'two'; //can be all
          $scope.newWorkingGroup.profile.coordinators = 'none';
        } else if ($scope.newWorkingGroup.profile.managementType = "COORDINATED") {
          $scope.newWorkingGroup.profile.moderators = 'none';
          $scope.newWorkingGroup.profile.coordinators =  'two'; //can be all
        }

        $scope.contributions = $scope.newWorkingGroup.existingContributions; //?
      }

      $scope.createOrUpdateWorkingGroup = function() {
        $scope.newWorkingGroup.existingThemes = [];
        // 1. process themes
        if ($scope.campaignThemes) {
          for (var i = 0; i < $scope.campaignThemes.length; i++) {
            if ($scope.campaignThemes[i].selected) {
              $scope.newWorkingGroup.existingThemes.push($scope.campaignThemes[i]);
            }
          }
        }
        // 2. process membership
        if ($scope.newWorkingGroup.profile.membership === 'OPEN') {
          $scope.newWorkingGroup.profile.supportedMembership = "OPEN";
        } else if ($scope.newWorkingGroup.profile.membership === 'REGISTRATION') {
          if ($scope.newWorkingGroup.profile.registration.invitation &&
            !$scope.newWorkingGroup.profile.registration.request) {
            $scope.newWorkingGroup.profile.supportedMembership = "INVITATION";
          } else if (!$scope.newWorkingGroup.profile.registration.invitation &&
            $scope.newWorkingGroup.profile.registration.request) {
            $scope.newWorkingGroup.profile.supportedMembership = "REQUEST";
          } else if ($scope.newWorkingGroup.profile.registration.invitation &&
            $scope.newWorkingGroup.profile.registration.request) {
            $scope.newWorkingGroup.profile.supportedMembership = "INVITATION_AND_REQUEST";
          }
        }
        // 3. process management
        console.log("Creating assembly with membership = " + $scope.newWorkingGroup.profile.supportedMembership);
        if ($scope.newWorkingGroup.profile.moderators === 'none' && $scope.newWorkingGroup.profile.coordinators === 'none') {
          $scope.newWorkingGroup.profile.managementType = "OPEN";
        } else if ($scope.newWorkingGroup.profile.moderators === 'two' || $scope.newWorkingGroup.profile.moderators === 'all') {
          if ($scope.newWorkingGroup.profile.coordinators === 'two') {
            $scope.newWorkingGroup.profile.managementType = "COORDINATED_AND_MODERATED";
          } else if ($scope.newWorkingGroup.profile.coordinators === 'all') {
            $scope.newWorkingGroup.profile.managementType = "OPEN";
          } else {
            $scope.newWorkingGroup.profile.managementType = "MODERATED";
          }
        } else {
          if ($scope.newWorkingGroup.profile.coordinators === 'all') {
            $scope.newWorkingGroup.profile.managementType = "OPEN";
          } else {
            $scope.newWorkingGroup.profile.managementType = "COORDINATED";
          }
        }

        // 4. process brainstorming contributions
        if ($scope.contributions) {
          for (var i = 0; i < $scope.contributions.length; i++) {
            if ($scope.contributions[i].addToGroup) {
              if (!$scope.newWorkingGroup.existingContributions) $scope.newWorkingGroup.existingContributions = [];
              $scope.newWorkingGroup.existingContributions.push($scope.contributions[i]);
            }
          }
        }
        var newGroup;
        if (!$scope.isEdit) {
          newGroup = WorkingGroups.workingGroupsInCampaign($scope.assemblyID, $scope.campaignID).save($scope.newWorkingGroup);
        } else {
          newGroup = WorkingGroups.workingGroup($scope.assemblyID, $scope.newWorkingGroup.groupId).update($scope.newWorkingGroup);
        }

        newGroup.$promise.then(
          function(response) {
            $scope.newWorkingGroup = response;
            $scope.workingGroups = localStorageService.get("workingGroups");
            if ($scope.workingGroups === undefined || $scope.workingGroups === null) {
              $scope.workingGroups = [];
            }
            $scope.workingGroups.push($scope.newWorkingGroup);
            localStorageService.set("workingGroups", $scope.workingGroups);
            //$location.url("/v1/assembly/" + $scope.assemblyID + "/group/" + $scope.newWorkingGroup.groupId);
            // TODO send to group page
            $state.go("v2.assembly.aid.group.gid", {aid: $scope.assemblyID, gid: $scope.newWorkingGroup.groupId});
          },
          function(error) {
            $scope.errors.push(error.data);
            //$rootScope.showError(error.data, "WORKING_GROUP", null);
          }
        );

        logService.logAction("CREATE_WORKING_GROUP");
      }

      $scope.addAssemblyMemberToInvitationList = function(member, index) {
        var email = member.user.email;
        if (!member.invite) {
          if (!$scope.invitedAssemblyMembers) $scope.invitedAssemblyMembers = {}
          $scope.invitedAssemblyMembers[email] = false;
          $scope.removeInviteeByEmail(email);
        } else {
          $scope.addEmailsToList(email);
          if (!$scope.invitedAssemblyMembers) $scope.invitedAssemblyMembers = {}
          $scope.invitedAssemblyMembers[email] = true;
        }
      }

      $scope.contribsNumberOfPages = function() {
        return Math.ceil($scope.contributions.length / $scope.contribsPageSize);
      }

      $scope.membersNumberOfPages = function() {
        return Math.ceil($scope.assemblyMembers.length / $scope.membersPageSize);
      }

      $scope.changeCampaign = function(campaignId) {
        $scope.campaignID = campaignId;
        initializeCampaign();
      }
    }

    function initScopeContent() {
      $scope.isEdit = false;
      $scope.user = localStorageService.get("user");
      if ($scope.user && $scope.user.language)
        $translate.use($scope.user.language);
      $scope.errors = [];
      //$scope.assemblyID = $routeParams.aid;
      var currentAssembly = localStorageService.get('currentAssembly');
      $scope.assemblyID = currentAssembly != null ? currentAssembly.assemblyId : 1;
      //$scope.campaignID = $routeParams.cid;

      if ($scope.campaignID === undefined || $scope.campaignID === null) {
        $scope.selectCampaign = true;
      }

      $scope.workingGroupID = $routeParams.wid || $stateParams.gid;
      $scope.newWorkingGroup = WorkingGroups.defaultNewWorkingGroup();
      $scope.defaultIcons = [{
        "name": "Justice Icon",
        "url": "https://s3-us-west-1.amazonaws.com/appcivist-files/icons/justicia-140.png"
      }, {
        "name": "Plan Icon",
        "url": "https://s3-us-west-1.amazonaws.com/appcivist-files/icons/tabacalera-140.png"
      }, {
        "name": "Article 49 Icon",
        "url": "https://s3-us-west-1.amazonaws.com/appcivist-files/icons/article19-140.png"
      }, {
        "name": "Passe Livre Icon",
        "url": "https://s3-us-west-1.amazonaws.com/appcivist-files/icons/image74.png"
      }, {
        "name": "Skyline Icon",
        "url": "https://s3-us-west-1.amazonaws.com/appcivist-files/icons/image75.jpg"
      }];
      $scope.newWorkingGroup.profile.icon = $scope.defaultIcons[0].url;
      $scope.f = {
        "name": $scope.defaultIcons[0].name,
        "url": $scope.defaultIcons[0].url
      }

      $scope.contribsCurrentPg = 0;
      $scope.contribsPageSize = 5;
      $scope.contributions = [];

      $scope.membersCurrentPg = 0;
      $scope.membersPageSize = 5;
      $scope.assemblyMembers = [];

      if ($stateParams.gid) {
        $scope.isEdit = true;
        var rsp = WorkingGroups.workingGroup($scope.assemblyID ,$stateParams.gid).get();
        rsp.$promise.then(function(data) {
          console.log("Get WGroup with wgroupId " + $stateParams.gid);
          $scope.newWorkingGroup = data;
          $scope.getAttributesFromExistingWGroup();
        });
      }

      $scope.$watch("newWorkingGroup.name", function(newVal, oldval) {
        $translate('wgroup.invitation.email.text', {
          group: $scope.newWorkingGroup.name
        }).then(function(text) {
          $scope.newWorkingGroup.invitationEmail = text;
        });
      }, true);
    }

    function initializeAssembly() {
      $scope.assembly = Assemblies.assembly($scope.assemblyID).get();
      $scope.assembly.$promise.then(
        function(response) {
          $scope.assembly = response;
          $scope.assemblyCampaigns = $scope.assembly.campaigns;
        },
        function(error) {
          $scope.errors.push(error);
        }
      );
      $scope.assemblyMembers = Assemblies.assemblyMembers($scope.assemblyID).query();
      $scope.assemblyMembers.$promise.then(
        function(data) {
          $scope.assemblyMembers = data;
          $scope.members = data;
        },
        function(error) {}
      );

    }

    function initializeCampaign() {
      $scope.campaign = Campaigns.campaign($scope.assemblyID, $scope.campaignID).get();
      $scope.campaign.$promise.then(
        function(response) {
          $scope.campaign = response;
          $scope.contributions = $scope.campaign.contributions;
          $scope.campaignThemes = $scope.campaign.themes;
          if (!$scope.campaignThemes) {
            $scope.campaignThemes = [];
          }
        },
        function(error) {
          $scope.campaignThemes = [];
          $scope.errors.push(error);
        }
      );
    }
  }
}());
