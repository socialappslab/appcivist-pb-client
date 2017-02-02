(function() {
  'use strict';

  angular
    .module('appCivistApp')
    .controller('v2.WorkingGroupFormCtrl', WorkingGroupFormCtrl);

  WorkingGroupFormCtrl.$inject = ['$scope', 'localStorageService', '$translate', '$routeParams', 'LocaleService',
  'Assemblies', 'WorkingGroups', 'Campaigns', 'usSpinnerService', '$state', 'logService', '$stateParams', 'configService', '$location'];

  function WorkingGroupFormCtrl($scope, localStorageService, $translate, $routeParams, LocaleService,
    Assemblies, WorkingGroups, Campaigns, usSpinnerService, $state, logService, $stateParams, configService, $location) {
    init();

    function init() {
      initScopeFunctions();
      initScopeContent();
      initializeAssembly();
      $scope.ongoingCampaigns = localStorageService.get('ongoingCampaigns');
    }

    function initScopeFunctions() {

      $scope.goToStep = function (step) {
        if (step === 1) {
          if ($stateParams.gid) {
            $location.path('/v2/assembly/' + $stateParams.aid + '/campaign/' + $stateParams.cid + '/group/' + $stateParams.gid + '/edit/description');
          } else {
            $location.path('/v2/assembly/' + $stateParams.aid + '/campaign/' + $stateParams.cid + '/group/new/description');
          }
        } else {
          if ($stateParams.gid) {
            $location.path('/v2/assembly/' + $stateParams.aid + '/campaign/' + $stateParams.cid + '/group/' + $stateParams.gid + '/edit/configuration');
          } else {
            $location.path('/v2/assembly/' + $stateParams.aid + '/campaign/' + $stateParams.cid + '/group/new/configuration');
          }
        }
      }

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

      $scope.getExistingConfigs = function() {
        var configs = configService.getWGroupConfigs("WGROUP");
        var finalConfig = [];
        _.forEach($scope.newWorkingGroup.configs, function(config) {
          _.forEach(configs, function (configAux) {
            if (config.key == configAux.key) {
              config.definition = configAux.definition;
            }
          });
          finalConfig.push(config);
        });
        return finalConfig;
      }

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
          $scope.newWorkingGroup.profile.moderators = false;
          $scope.newWorkingGroup.profile.coordinators = false;
        } else if ($scope.newWorkingGroup.profile.managementType === "COORDINATED_AND_MODERATED") {
          $scope.newWorkingGroup.profile.moderators = true; //can be all
          $scope.newWorkingGroup.profile.coordinators = true; //can be all
        } else if ($scope.newWorkingGroup.profile.managementType === "MODERATED") {
          $scope.newWorkingGroup.profile.moderators = true; //can be all
          $scope.newWorkingGroup.profile.coordinators = false;
        } else if ($scope.newWorkingGroup.profile.managementType === "COORDINATED") {
          $scope.newWorkingGroup.profile.moderators = false;
          $scope.newWorkingGroup.profile.coordinators = true; //can be all
        }

        //?
        $scope.contributions = $scope.newWorkingGroup.existingContributions;
        // add configs
        $scope.newWorkingGroup.configs = $scope.getExistingConfigs();
      }

      $scope.setModerationAndMembership = function () {
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

        console.log("Creating assembly with membership = " + $scope.newWorkingGroup.profile.supportedMembership);
        if ($scope.newWorkingGroup.profile.moderators == false && $scope.newWorkingGroup.profile.coordinators == false) {
          console.log("entro a OPEN");
          $scope.newWorkingGroup.profile.managementType = "OPEN";
        } else if ($scope.newWorkingGroup.profile.moderators == true && $scope.newWorkingGroup.profile.coordinators == true) {
          console.log("entro a COOR AND MOD");
          $scope.newWorkingGroup.profile.managementType = "COORDINATED_AND_MODERATED";
        } else if ($scope.newWorkingGroup.profile.moderators == false && $scope.newWorkingGroup.profile.coordinators == true) {
          console.log("entro a COOR");
          $scope.newWorkingGroup.profile.managementType = "COORDINATED";
        } else if ($scope.newWorkingGroup.profile.moderators == true && $scope.newWorkingGroup.profile.coordinators == false) {
          console.log("entro a MOD");
          $scope.newWorkingGroup.profile.managementType = "MODERATED";
        }
      }

      $scope.createOrUpdateWorkingGroup = function() {
        // temporal fix
        delete $scope.newWorkingGroup.resourcesResourceSpaceId;
        delete $scope.newWorkingGroup.forumResourceSpaceId;

        $scope.newWorkingGroup.existingThemes = [];
        // 1. process themes
        if ($scope.campaignThemes) {
          for (var i = 0; i < $scope.campaignThemes.length; i++) {
            if ($scope.campaignThemes[i].selected) {
              $scope.newWorkingGroup.existingThemes.push($scope.campaignThemes[i]);
            }
          }
        }

        $scope.setModerationAndMembership();

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
            localStorageService.remove("temporaryNewWGroup");
            //$location.url("/v1/assembly/" + $scope.assemblyID + "/group/" + $scope.newWorkingGroup.groupId);
            // TODO send to group page
            $state.go("v2.assembly.aid.campaign.cid", {aid: $scope.assemblyID, cid: $scope.campaignID});
          },
          function(error) {
            $scope.errors.push(error.data);
            //$rootScope.showError(error.data, "WORKING_GROUP", null);
          }
        );
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
      $scope.campaignID = $stateParams.cid;

      if ($scope.campaignID === undefined || $scope.campaignID === null) {
        $scope.selectCampaign = true;
      }
      $scope.workingGroupID = $routeParams.wid || $stateParams.gid;
      //$scope.newWorkingGroup = WorkingGroups.defaultNewWorkingGroup();

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
      //$scope.newWorkingGroup.profile.icon = $scope.defaultIcons[0].url;
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

      // temporaryWGroup manage
      var temporaryWGroup = localStorageService.get("temporaryNewWGroup");
      if ($stateParams.gid && ($state.is('v2.assembly.aid.campaign.workingGroup.gid.edit')
        || $state.is('v2.assembly.aid.campaign.workingGroup.gid.edit.description')
        || $state.is('v2.assembly.aid.campaign.workingGroup.gid.edit.configuration'))) {
        $scope.isEdit = true;
        if ((temporaryWGroup != null && temporaryWGroup.groupId != $stateParams.gid) || temporaryWGroup == null) {
          var rsp = WorkingGroups.workingGroup($stateParams.aid, $stateParams.gid).get();
          rsp.$promise.then(function(data) {
            console.log("Get WGroup with wgroupId " + $stateParams.gid);
            $scope.newWorkingGroup = data;
            localStorageService.set("temporaryNewWGroup", $scope.newWorkingGroup);
            $scope.getAttributesFromExistingWGroup();
          });
        } else {
          $scope.newWorkingGroup = temporaryWGroup;
        }
        initializeGroup();
        initializeCampaign();
      } else {
        if (temporaryWGroup != null && temporaryWGroup.workiginGroupId != null) {
          localStorageService.set("temporaryNewWGroup", null);
        }
        initializeGroup();
        initializeCampaign();
      }

      $scope.$watch("newWorkingGroup.name", function(newVal, oldval) {
        $translate('wgroup.invitation.email.text', {
          group: $scope.newWorkingGroup.name
        }).then(function(text) {
          $scope.newWorkingGroup.invitationEmail = text;
        });
      }, true);

      $scope.$watch("newWorkingGroup", function(newVal, oldval) {
        localStorageService.set("temporaryNewWGroup", newVal);
      }, true);
    }

    function initializeGroup() {
      if ($scope.newWorkingGroup === null || $scope.newWorkingGroup === undefined || $scope.newWorkingGroup === "") {
        $scope.newWorkingGroup = localStorageService.get("temporaryNewWGroup");
        if ($scope.newWorkingGroup === null || $scope.newWorkingGroup === undefined || $scope.newWorkingGroup === "") {
          $scope.newWorkingGroup = WorkingGroups.defaultNewWorkingGroup();
          $scope.newWorkingGroup.profile = {};
          $scope.newWorkingGroup.profile.icon = $scope.defaultIcons[0].url;
          // add configs and principal configs (this controller doesnt have a initializeGroup method)
          var configs = configService.getWGroupConfigs("WGROUP");
          $scope.newWorkingGroup.configs = configs;
          localStorageService.set("temporaryNewWGroup", $scope.newWorkingGroup);
        }
      } else {
        console.log("Temporary New WGroup exists in the scope")
      }

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
          $scope.newWorkingGroup.campaign = $scope.campaign;
        },
        function(error) {
          $scope.campaignThemes = [];
          $scope.errors.push(error);
        }
      );
    }
  }
}());
