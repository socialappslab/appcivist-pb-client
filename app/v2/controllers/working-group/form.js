(function() {
  'use strict';

  angular
    .module('appCivistApp')
    .controller('v2.WorkingGroupFormCtrl', WorkingGroupFormCtrl);

  WorkingGroupFormCtrl.$inject = [
    '$scope', 'localStorageService', '$translate', '$routeParams', 'LocaleService', 'Assemblies',
    'WorkingGroups', 'Campaigns', 'usSpinnerService', '$state', 'logService', '$stateParams',
    'configService', '$location', 'Notify', 'Space'
  ];

  function WorkingGroupFormCtrl($scope, localStorageService, $translate, $routeParams, LocaleService,
    Assemblies, WorkingGroups, Campaigns, usSpinnerService, $state, logService, $stateParams,
    configService, $location, Notify, Space) {

    init();

    function init() {
      initScopeFunctions();
      initScopeContent();
      initializeAssembly();
      $scope.ongoingCampaigns = localStorageService.get('ongoingCampaigns');
    }

    function initScopeFunctions() {
      $scope.onSuccess = onSuccess.bind($scope);
      $scope.saveConfigurations = saveConfigurations.bind($scope);

      $scope.goToStep = function(step) {
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

      $scope.setNewWorkingGroupCover = function(url, name) {
        $scope.newWorkingGroup.profile.cover = url;
        var file = {};
        file.name = name;
        file.url = url;
        $scope.g = file;
      }

      $scope.setNewWorkingGroupColor = function(color) {
        $scope.newWorkingGroup.profile.color = color;
        $scope.h = color;
      }

      /**
       * Uploads the selected file to the server
       *
       * @param {Object} file - The file to upload
       * @param {Object[]} errFiles
       */
      $scope.uploadFiles = function(file, errFiles) {
        $scope.f = file;
        var fd = new FormData();
        fd.append('file', file);
        $http.post(FileUploader.uploadEndpoint(), fd, {
          headers: {
            'Content-Type': undefined
          },
          transformRequest: angular.identity,
        }).then(
          response => $scope.setNewWorkingGroupIcon(response.data.url, response.data.name),
          error => Notify.show('Error while uploading file to the server', 'error'));
      }

      $scope.addEmailsToList = function(emailsText) {
        $scope.invalidEmails = [];
        var emails = emailsText.split(',');
        emails.forEach(function(email) {
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
        $scope.inviteesEmails = '';
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

      /**
       * Get the final list of working groups configurations. It merges the given
       * configuration list with the default configurations.
       *
       * @param {Object[]} configs - configuration already loaded.
       */
      $scope.getConfigurations = function(configs) {
        let defaults = configService.getWGroupConfigs();

        if (!configs) {
          return defaults;
        }
        let configurations = [];
        defaults.forEach(defaultConfig => {
          let config = _.find(configs, { key: defaultConfig.key });

          if (config) {
            config.definition = defaultConfig.definition;
            configurations.push(config);
          } else {
            configurations.push(defaultConfig);
          }
        });
        return configurations;
      }

      $scope.getAttributesFromExistingWGroup = function() {
        $scope.campaignThemes = $scope.newWorkingGroup.existingThemes; //?

        if ($scope.newWorkingGroup.profile.supportedMembership === 'OPEN') {
          $scope.newWorkingGroup.profile.membership = 'OPEN';
        } else if ($scope.newWorkingGroup.profile.supportedMembership === 'INVITATION' || $scope.newWorkingGroup.profile.supportedMembership === 'REQUEST' ||
          $scope.newWorkingGroup.profile.supportedMembership === 'INVITATION_AND_REQUEST') {
          $scope.newWorkingGroup.profile.registration = {};
          if ($scope.newWorkingGroup.profile.supportedMembership === 'INVITATION') {
            $scope.newWorkingGroup.profile.registration.invitation = true;
          }

          if ($scope.newWorkingGroup.profile.supportedMembership === 'REQUEST') {
            $scope.newWorkingGroup.profile.registration.request = true;
          }

          if ($scope.newWorkingGroup.profile.supportedMembership === 'INVITATION_AND_REQUEST') {
            $scope.newWorkingGroup.profile.registration.invitation = true;
            $scope.newWorkingGroup.profile.registration.request = true;
          }
          $scope.newWorkingGroup.profile.membership = 'REGISTRATION';
        }

        // see how this can be established
        if ($scope.newWorkingGroup.profile.managementType === 'OPEN') {
          $scope.newWorkingGroup.profile.moderators = false;
          $scope.newWorkingGroup.profile.coordinators = false;
        } else if ($scope.newWorkingGroup.profile.managementType === 'COORDINATED_AND_MODERATED') {
          $scope.newWorkingGroup.profile.moderators = true; //can be all
          $scope.newWorkingGroup.profile.coordinators = true; //can be all
        } else if ($scope.newWorkingGroup.profile.managementType === 'MODERATED') {
          $scope.newWorkingGroup.profile.moderators = true; //can be all
          $scope.newWorkingGroup.profile.coordinators = false;
        } else if ($scope.newWorkingGroup.profile.managementType === 'COORDINATED') {
          $scope.newWorkingGroup.profile.moderators = false;
          $scope.newWorkingGroup.profile.coordinators = true; //can be all
        }
        $scope.contributions = $scope.newWorkingGroup.existingContributions;

        if ($scope.isEdit) {
          // load configurations
          let rsp = Space.configs($scope.newWorkingGroup.resourcesResourceSpaceId).get().$promise;
          rsp.then(
            configs => $scope.newWorkingGroup.configs = $scope.getConfigurations(configs),
            error => Notify.show('Error while trying to load working group configurations', 'error')
          );
        } else {
          $scope.newWorkingGroup.configs = $scope.getConfigurations($scope.newWorkingGroup.configs);
        }
      }

      $scope.setModerationAndMembership = function() {
        if ($scope.isTopic) {
          console.log("Is Topic");
          $scope.newWorkingGroup.profile.supportedMembership = 'OPEN';
        }

        if ($scope.newWorkingGroup.profile.membership === 'OPEN') {
          $scope.newWorkingGroup.profile.supportedMembership = 'OPEN';
        } else if ($scope.newWorkingGroup.profile.membership === 'REGISTRATION') {
          if ($scope.newWorkingGroup.profile.registration.invitation &&
            !$scope.newWorkingGroup.profile.registration.request) {
            $scope.newWorkingGroup.profile.supportedMembership = 'INVITATION';
          } else if (!$scope.newWorkingGroup.profile.registration.invitation &&
            $scope.newWorkingGroup.profile.registration.request) {
            $scope.newWorkingGroup.profile.supportedMembership = 'REQUEST';
          } else if ($scope.newWorkingGroup.profile.registration.invitation &&
            $scope.newWorkingGroup.profile.registration.request) {
            $scope.newWorkingGroup.profile.supportedMembership = 'INVITATION_AND_REQUEST';
          }
        }

        if ($scope.newWorkingGroup.profile.moderators == false && $scope.newWorkingGroup.profile.coordinators == false) {
          $scope.newWorkingGroup.profile.managementType = 'OPEN';
        } else if ($scope.newWorkingGroup.profile.moderators == true && $scope.newWorkingGroup.profile.coordinators == true) {
          $scope.newWorkingGroup.profile.managementType = 'COORDINATED_AND_MODERATED';
        } else if ($scope.newWorkingGroup.profile.moderators == false && $scope.newWorkingGroup.profile.coordinators == true) {
          $scope.newWorkingGroup.profile.managementType = 'COORDINATED';
        } else if ($scope.newWorkingGroup.profile.moderators == true && $scope.newWorkingGroup.profile.coordinators == false) {
          $scope.newWorkingGroup.profile.managementType = 'MODERATED';
        }
      }

      $scope.createOrUpdateWorkingGroup = function() {
        // const resourceSpaceId = $scope.newWorkingGroup.resourcesResourceSpaceId;
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
        let rsp;
        let configs;
        let payload;

        if (!$scope.isEdit) {
          rsp = WorkingGroups.workingGroupsInCampaign($scope.assemblyID, $scope.campaignID).save($scope.newWorkingGroup).$promise;
        } else {
          payload = _.cloneDeep($scope.newWorkingGroup);
          // configs will be save separately
          configs = payload.configs;
          delete payload.ballots;
          delete payload.campaign;
          delete payload.configs;
          delete payload.existingThemes;
          rsp = WorkingGroups.workingGroup($scope.assemblyID, $scope.newWorkingGroup.groupId).update(payload).$promise;
        }

        rsp.then(
          response => {
            if ($scope.isEdit) {
              // we need to save configurations
              $scope.saveConfigurations(resourceSpaceId, configs)
                .then(
                  res => $scope.onSuccess(response),
                  error => Notify.show('Error while trying to save working group\'s configurations', 'error')
                );
            } else {
              $scope.onSuccess(response);
            }
          },
          error => {
            $scope.errors.push(error.data);
            Notify.show('Error while trying to safe working group', 'error');
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
      $scope.errors = [];
      var currentAssembly = localStorageService.get('currentAssembly');
      $scope.assemblyID = currentAssembly != null ? currentAssembly.assemblyId : 1;
      $scope.campaignID = $stateParams.cid;

      if ($scope.campaignID === undefined || $scope.campaignID === null) {
        $scope.selectCampaign = true;
      }
      $scope.workingGroupID = $routeParams.wid || $stateParams.gid;
      $scope.defaultIcons = [{
        'name': 'Justice Icon',
        'url': 'https://s3-us-west-1.amazonaws.com/appcivist-files/icons/justicia-140.png'
      }, {
        'name': 'Plan Icon',
        'url': 'https://s3-us-west-1.amazonaws.com/appcivist-files/icons/tabacalera-140.png'
      }, {
        'name': 'Article 49 Icon',
        'url': 'https://s3-us-west-1.amazonaws.com/appcivist-files/icons/article19-140.png'
      }, {
        'name': 'Passe Livre Icon',
        'url': 'https://s3-us-west-1.amazonaws.com/appcivist-files/icons/image74.png'
      }, {
        'name': 'Skyline Icon',
        'url': 'https://s3-us-west-1.amazonaws.com/appcivist-files/icons/image75.jpg'
      }];
      $scope.defaultCovers = [
        {"name":"Geo 1", "url":"/assets/wgs/covers/1.svg"},
        {"name":"Geo 2", "url":"/assets/wgs/covers/2.svg"},
        {"name":"Geo 3", "url":"/assets/wgs/covers/3.svg"},
        {"name":"Geo 4", "url":"/assets/wgs/covers/4.svg"},
        {"name":"Geo 5", "url":"/assets/wgs/covers/5.svg"},
        {"name":"Geo 6", "url":"/assets/wgs/covers/6.svg"},
        {"name":"Geo 7", "url":"/assets/wgs/covers/7.svg"},
        {"name":"Geo 8", "url":"/assets/wgs/covers/8.svg"},
        {"name":"Geo 9", "url":"/assets/wgs/covers/9.svg"},
        {"name":"Geo 10", "url":"/assets/wgs/covers/10.svg"},
      ]
      $scope.defaultColors = [
        {"color":"#302C5D"},
        {"color":"#009ADF"},
        {"color":"#1E9D46"},
        {"color":"#F36D1E"},
        {"color":"#FFC109"},
        {"color":"#D7382E"}
      ]
      $scope.f = {
        'name': $scope.defaultIcons[0].name,
        'url': $scope.defaultIcons[0].url
      }
      $scope.g = {
        'name': $scope.defaultCovers[0].name,
        'url': $scope.defaultCovers[0].url
      }
      $scope.h = $scope.defaultColors[2].color;
      $scope.contribsCurrentPg = 0;
      $scope.contribsPageSize = 5;
      $scope.contributions = [];
      $scope.membersCurrentPg = 0;
      $scope.membersPageSize = 5;
      $scope.assemblyMembers = [];

      // temporaryWGroup manage
      let temporaryWGroup = localStorageService.get('temporaryNewWGroup');
      if ($stateParams.gid && ($state.is('v2.assembly.aid.campaign.workingGroup.gid.edit') ||
          $state.is('v2.assembly.aid.campaign.workingGroup.gid.edit.description') ||
          $state.is('v2.assembly.aid.campaign.workingGroup.gid.edit.configuration'))) {
        $scope.isEdit = true;

        if ((temporaryWGroup != null && temporaryWGroup.groupId != $stateParams.gid) || temporaryWGroup == null) {
          let rsp = WorkingGroups.workingGroup($stateParams.aid, $stateParams.gid).get();
          rsp.$promise.then(function(data) {
            $scope.newWorkingGroup = data;
            localStorageService.set('temporaryNewWGroup', $scope.newWorkingGroup);
            $scope.getAttributesFromExistingWGroup();
          });
        } else {
          $scope.newWorkingGroup = temporaryWGroup;
        }
        initializeGroup();
        initializeCampaign();
      } else {

        if (temporaryWGroup != null && temporaryWGroup.workiginGroupId != null) {
          localStorageService.set('temporaryNewWGroup', null);
        }
        initializeGroup();
        initializeCampaign();
      }

      $scope.$watch('newWorkingGroup.name', function(newVal, oldval) {
        if (!$scope.newWorkingGroup) {
          return;
        }
        $translate('wgroup.invitation.email.text', {
          group: $scope.newWorkingGroup.name
        }).then(function(text) {
          $scope.newWorkingGroup.invitationEmail = text;
        });
      }, true);

      $scope.$watch('newWorkingGroup', function(newVal, oldval) {
        localStorageService.set('temporaryNewWGroup', newVal);
      }, true);
    }

    function initializeGroup() {
      let wg = localStorageService.get('temporaryNewWGroup');

      if (!wg) {
        $scope.newWorkingGroup = WorkingGroups.defaultNewWorkingGroup();
        $scope.newWorkingGroup.profile = {};
        $scope.newWorkingGroup.profile.icon = $scope.defaultIcons[0].url;
        var configs = configService.getWGroupConfigs();
        $scope.newWorkingGroup.configs = configs;
        localStorageService.set('temporaryNewWGroup', $scope.newWorkingGroup);
      } else {
        $scope.newWorkingGroup = wg;
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

    /**
     * Working group on-success callback.
     *
     * @param {Object} response
     */
    function onSuccess(response) {
      Notify.show('Working group saved');
      localStorageService.remove('temporaryNewWGroup');
      $state.go('v2.assembly.aid.campaign.workingGroup.gid.dashboard', {
        aid: $scope.assemblyID,
        cid: $scope.campaignID,
        gid: response.newResourceId
      });
    }

    /**
     * Save the given working group configurations.
     *
     * @param {number} sid - resource space ID
     * @param {Object[]} configs
     */
    function saveConfigurations(sid, configs) {
      let payload = {};
      configs.forEach(config => payload[config.key] = config.value);
      return Space.configs(sid).update(payload).$promise;
    }
  }
}());
