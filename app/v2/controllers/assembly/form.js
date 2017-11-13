(function() {
  'use strict';

  angular
    .module('appCivistApp')
    .controller('v2.AssemblyFormCtrl', AssemblyFormCtrl);


  AssemblyFormCtrl.$inject = [
    '$scope', 'localStorageService', '$translate', '$routeParams', 'LocaleService', 'Assemblies',
    'usSpinnerService', '$state', '$location', '$stateParams', 'configService', 'Notify', 'loginService',
    '$http', 'FileUploader', 'Editor'
  ];

  function AssemblyFormCtrl($scope, localStorageService, $translate, $routeParams,
    LocaleService, Assemblies, usSpinnerService, $state, $location, $stateParams,
    configService, Notify, loginService, $http, FileUploader, Editor) {

    init();

    function init() {
      initScopeFunctions();
      initScopeContent();
    }

    function initScopeFunctions() {
      $scope.goToStep = function(step) {
        var parent = $state.current.name.split('.').filter(function(e, i, parts) {
          return i < (parts.length - 1);
        }).join('.');

        if (step === 1) {
          $state.go(parent + '.description');
        } else {
          $state.go(parent + '.configuration');
        }
      }

      $scope.setNewAssemblyIcon = function(url, name) {
        $scope.newAssembly.profile.icon = url;
        localStorageService.set('temporaryNewAssembly', $scope.newAssembly);
        var file = {};
        file.name = name;
        file.url = url;
        $scope.f = file;
      }

      $scope.setNewAssemblyCoverIcon = function(url, name) {
        $scope.newAssembly.profile.cover = url;
        localStorageService.set('temporaryNewAssembly', $scope.newAssembly);
        var file = {};
        file.name = name;
        file.url = url;
        $scope.selectedCover = file;
      }

      $scope.addEmailsToList = function(emailsText) {
        if (!$scope.newAssembly.invitations) {
          $scope.newAssembly.invitations = [];
        }
        $scope.invalidEmails = [];
        var emails = emailsText.split(',');
        emails.forEach(function(email) {
          var invitee = {};
          invitee.email = email.trim();
          if ($scope.isValidEmail(invitee.email)) {
            invitee.moderator = false;
            invitee.coordinator = false;
            $scope.newAssembly.invitations.push(invitee);
          } else {
            $scope.invalidEmails.push(invitee.email);
          }
        });
        $scope.inviteesEmails.list = '';
      }

      $scope.isValidEmail = function(email) {
        return true;
      }

      $scope.removeInvalidEmail = function(index) {
        $scope.invalidEmails.splice(index, 1);
      };

      $scope.removeInvitee = function(index) {
        $scope.newAssembly.invitations.splice(index, 1);
      }

      $scope.addTheme = function(ts) {
        var themes = ts.split(',');
        themes.forEach(function(theme) {
          var addedTheme = {};
          addedTheme.title = theme.trim();
          if (addedTheme.title != '') {
            $scope.newAssembly.themes.push(addedTheme);
          }
        });
        $scope.themes.list = '';
      }

      $scope.removeTheme = function(index) {
        $scope.newAssembly.themes.splice(index, 1);
      }

      $scope.findWithAttr = function(array, attr, value) {
        for (var i = 0; i < array.length; i += 1) {
          if (array[i][attr] === value) {
            return i;
          }
        }
      }

      $scope.removeByAttr = function(array, attr, value) {
        for (var i = 0; i < array.length; i += 1) {
          if (array[i][attr] === value) {
            array.splice(i, 1);
          }
        }
      }

      $scope.getExistingConfigs = function() {
        var configs1 = configService.getAssemblyConfigs('ASSEMBLY');
        var configs2 = [];
        if ($state.is('v2.assembly.aid.edit') || $state.is('v2.assembly.aid.edit.description') || $state.is('v2.assembly.aid.edit.configuration')) {
          configs2 = configService.getPrincipalAssemblyConfigs('ASSEMBLY');
        }
        var configs = _.concat(configs1, configs2);
        var finalConfig = [];
        _.forEach($scope.newAssembly.configs, function(config) {
          _.forEach(configs, function(configAux) {
            if (config.key == configAux.key) {
              config.definition = configAux.definition;
            }
          });
          finalConfig.push(config);
        });
        return finalConfig;
      }

      $scope.getAttributesFromExistingAssembly = function() {

        if ($scope.newAssembly.profile.supportedMembership === 'OPEN') {
          $scope.newAssembly.profile.membership = 'OPEN';
        } else if ($scope.newAssembly.profile.supportedMembership === 'INVITATION' || $scope.newAssembly.profile.supportedMembership === 'REQUEST' ||
          $scope.newAssembly.profile.supportedMembership === 'INVITATION_AND_REQUEST') {
          $scope.newAssembly.profile.membership === 'REGISTRATION';
        }

        if ($scope.newAssembly.profile.managementType === 'OPEN') {
          $scope.newAssembly.profile.moderators = false;
          $scope.newAssembly.profile.coordinators = false;
        } else if ($scope.newAssembly.profile.managementType === 'COORDINATED_AND_MODERATED') {
          $scope.newAssembly.profile.moderators = true; //can be all
          $scope.newAssembly.profile.coordinators = true; //can be all
        } else if ($scope.newAssembly.profile.managementType === 'MODERATED') {
          $scope.newAssembly.profile.moderators = true; //can be all
          $scope.newAssembly.profile.coordinators = false;
        } else if ($scope.newAssembly.profile.managementType === 'COORDINATED') {
          $scope.newAssembly.profile.moderators = false;
          $scope.newAssembly.profile.coordinators = true; //can be all
        }
        // add configs and principal configs
        $scope.newAssembly.configs = $scope.getExistingConfigs();
      }

      $scope.setModerationAndMembership = function() {
        if ($scope.newAssembly.profile.membership === 'OPEN') {
          $scope.newAssembly.profile.supportedMembership = 'OPEN';
        } else if ($scope.newAssembly.profile.membership === 'REGISTRATION') {
          if ($scope.newAssembly.profile.registration.invitation &&
            !$scope.newAssembly.profile.registration.request) {
            $scope.newAssembly.profile.supportedMembership = 'INVITATION';
          } else if (!$scope.newAssembly.profile.registration.invitation &&
            $scope.newAssembly.profile.registration.request) {
            $scope.newAssembly.profile.supportedMembership = 'REQUEST';
          } else if ($scope.newAssembly.profile.registration.invitation &&
            $scope.newAssembly.profile.registration.request) {
            $scope.newAssembly.profile.supportedMembership = 'INVITATION_AND_REQUEST';
          }
        }

        if ($scope.newAssembly.profile.moderators == false && $scope.newAssembly.profile.coordinators == false) {
          $scope.newAssembly.profile.managementType = 'OPEN';
        } else if ($scope.newAssembly.profile.moderators == true && $scope.newAssembly.profile.coordinators == true) {
          $scope.newAssembly.profile.managementType = 'COORDINATED_AND_MODERATED';
        } else if ($scope.newAssembly.profile.moderators == false && $scope.newAssembly.profile.coordinators == true) {
          $scope.newAssembly.profile.managementType = 'COORDINATED';
        } else if ($scope.newAssembly.profile.moderators == true && $scope.newAssembly.profile.coordinators == false) {
          $scope.newAssembly.profile.managementType = 'MODERATED';
        }
      }

      // TODO: process selected assemblies
      $scope.createOrUpdateAssembly = function(step) {
        if (step === 1) {
          $scope.setModerationAndMembership();
          localStorageService.set('temporaryNewAssembly', $scope.newAssembly);
          $scope.tabs[1].active = true;
        } else if (step === 2 && !$scope.userIsNew) {
          $scope.setModerationAndMembership();
          var assemblyRes;

          if (!$scope.isEdit) {
            if ($state.is('v2.assembly.aid.assembly') || $state.is('v2.assembly.aid.assembly.description') || $state.is('v2.assembly.aid.assembly.configuration')) {
              assemblyRes = Assemblies.assemblyInAssembly($stateParams.aid).save($scope.newAssembly);
            } else {
              assemblyRes = Assemblies.assembly().save($scope.newAssembly);
            }
          } else {
            assemblyRes = Assemblies.assembly($scope.newAssembly.assemblyId).update($scope.newAssembly);
          }
          assemblyRes.$promise.then(
            // Success
            function(data) {
              // TODO: add support for subassembly creation. It should be redirected to /subassembly/<ID>/campaign/start
              localStorageService.remove('temporaryNewAssembly');
              var assemblyId = data.assemblyId != null ? data.assemblyId : data.newResourceId;
              Assemblies.setCurrentAssembly(assemblyId).then(function() {
                //redirect to manage page
                $state.go('v2.assembly.aid.campaign.new', { aid: assemblyId }, { reload: true });
              })
            },
            // Error
            function(error) {
              var e = error.data;
              Notify.show('Could not create assembly: ' + e.statusMessage ? e.statusMessage : ' [no message about the error]', 'error');
              $scope.errors.push(e);
            }
          );
        } else if (step === 2 && $scope.userIsNew) {
          $scope.tabs[2].active = true;
        } else if (step === 3 && $scope.userIsNew) {
          $scope.newUser.newAssembly = $scope.newAssembly;
          $scope.newUser.lang = LocaleService.getLocale();
          if (!$scope.newUser.lang) {
            $scope.newUser.lang = LOCALES.preferredLocale;
          }

          loginService.signUp($scope.newUser, $scope);
        }
      }

      /**
       * Uploads the selected file to the server
       * 
       * @param {Object} file - The file to upload
       * @param {Object[]} errFiles
       * @param {string} target - icon | cover determine if 
       */
      $scope.uploadFiles = function(file, errFiles, target) {
        $scope.f = file;
        var fd = new FormData();
        fd.append('file', file);
        $http.post(FileUploader.uploadEndpoint(), fd, {
          headers: {
            'Content-Type': undefined
          },
          transformRequest: angular.identity,
        }).then(response => {
          if (target === 'icon') {
            $scope.setNewAssemblyIcon(response.data.url, response.data.name);
          } else {
            $scope.setNewAssemblyCoverIcon(response.data.url, response.data.name);
          }
        }, error => Notify.show('Error while uploading file to the server', 'error'));
      }

      $scope.shortnameChanged = function(shortname) {
        // search shortName
        var rsp = Assemblies.assemblyByShortName(shortname).get();
        rsp.$promise.then(function(data) {
          if (data) {
            $scope.invalidShortname = true;
            $scope.newAssemblyForm1.shortname.$invalid = true;
            return;
          }
        }, function(error) {

          if (error.status == 404) {
            $scope.invalidShortname = false;
            $scope.newAssemblyForm1.shortname.$invalid = false;
            return;
          }
        });
      }
    }

    function initScopeContent() {
      //temporal fix
      $scope.info = '';
      $scope.isEdit = false;
      if ($scope.info === undefined || $scope.info === null) {
        info = $scope.info = localStorageService.get('help');
      }
      $scope.user = localStorageService.get('user');
      if ($scope.user && $scope.user.language)
        $translate.use($scope.user.language);
      $scope.errors = [];

      $scope.defaultIcons = [{
        'name': 'Justice Icon',
        'url': 'https://s3-us-west-1.amazonaws.com/appcivist-files/icons/justicia-140.png'
      }, {
        'name': 'Plan Icon',
        'url': 'https://s3-us-west-1.amazonaws.com/appcivist-files/icons/tabacalera-140.png'
      }, {
        'name': 'Barefoot Doctor Icon',
        'url': 'https://s3-us-west-1.amazonaws.com/appcivist-files/icons/barefootdoctor-140.png'
      }];

      $scope.defaultCoverIcons = [
        {
          name: 'Collaborating Icon',
          url: 'https://pb.appcivist.org/assets/images/bg-hands-collaborating.jpg'
        }
      ];
      $scope.userIsNew = $routeParams.userIsNew ? true : false;

      if ($scope.userIsNew) {
        $scope.newUser = {};
      }
      $scope.themes = { list: null };
      $scope.inviteesEmails = { list: null };
      $scope.editorOptions = Editor.getOptions($scope);
      $scope.editorOptions.height = 200;

      // temporaryAssembly manage
      var temporaryAssembly = localStorageService.get('temporaryNewAssembly');
      if ($stateParams.aid && ($state.is('v2.assembly.aid.edit') || $state.is('v2.assembly.aid.edit.description') ||
          $state.is('v2.assembly.aid.edit.configuration'))) {
        $scope.isEdit = true;
        if ((temporaryAssembly != null && temporaryAssembly.assemblyId != $stateParams.aid) || temporaryAssembly == null) {
          var rsp = Assemblies.assembly($stateParams.aid).get();
          rsp.$promise.then(function(data) {
            $scope.newAssembly = data;
            localStorageService.set('temporaryNewAssembly', data);
            $scope.getAttributesFromExistingAssembly();
          });
        } else {
          $scope.newAssembly = temporaryAssembly;
        }
        initializeNewAssembly();
      } else {
        $scope.isEdit = false;
        if (temporaryAssembly != null && temporaryAssembly.assemblyId != null) {
          localStorageService.set('temporaryNewAssembly', null);
        }
        initializeNewAssembly();
      }

      $scope.$watch('newAssembly.name', function(newVal, oldval) {
        $translate('assembly.newAssemblystep1.text5', {
          newAssemblyName: $scope.newAssembly.name
        }).then(function(text) {
          $scope.newAssembly.invitationEmail = text;
        });
      }, true);

      $scope.$watch('newAssembly', function(newVal, oldval) {
        localStorageService.set('temporaryNewAssembly', newVal);
      }, true);
    }

    function initializeNewAssembly() {
      if ($scope.newAssembly === null || $scope.newAssembly === undefined || $scope.newAssembly === '') {
        $scope.newAssembly = localStorageService.get('temporaryNewAssembly');
        if ($scope.newAssembly === null || $scope.newAssembly === undefined || $scope.newAssembly === '') {
          $scope.newAssembly = Assemblies.defaultNewAssembly();

          // add configs and principal configs if apply
          var configs1 = configService.getAssemblyConfigs('ASSEMBLY');
          var configs2 = [];
          if ($state.is('v2.assembly.new') || $state.is('v2.assembly.new.description') || $state.is('v2.assembly.new.configuration')) {
            $scope.invalidShortname = false;
            $scope.newAssembly.principalAssembly = true;
            var configs2 = configService.getPrincipalAssemblyConfigs('ASSEMBLY');
          }
          var configs = _.concat(configs1, configs2);
          $scope.newAssembly.configs = configs;

        }
      } else {
        var configs1 = configService.getAssemblyConfigs('ASSEMBLY');
        var configs = _.concat(configs1, $scope.newAssembly.configs);
        $scope.newAssembly.newConfigs = configs;
      }

      if ($scope.userIsNew) {
        $scope.newAssembly.newUser = {
          themes: [] // same as assemblyThemes
        }
      }
      $scope.newAssembly.profile.icon = $scope.newAssembly && $scope.newAssembly.profile &&
        $scope.newAssembly.profile.icon ?
        $scope.newAssembly.profile.icon : $scope.defaultIcons[0].url;
      var file = {};

      if ($scope.newAssembly && $scope.newAssembly.profile && $scope.newAssembly.profile.icon) {
        for (var i = 0; i < $scope.defaultIcons.length; i++) {
          if ($scope.newAssembly.profile.icon === $scope.defaultIcons[i].url) {
            file.name = $scope.defaultIcons[i].name;
            file.url = $scope.defaultIcons[i].url;
          }
        }

        if (!file.name) {
          file.name = $scope.newAssembly.profile.icon;
          file.url = $scope.newAssembly.profile.icon;
        }
      } else {
        file.name = $scope.defaultIcons[0].name;
        file.url = $scope.defaultIcons[0].url;
      }
      $scope.f = file;
    }
  }
}());