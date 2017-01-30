(function () {
  'use strict';

  angular
    .module('appCivistApp')
    .controller('v2.AssemblyFormCtrl', AssemblyFormCtrl);


  AssemblyFormCtrl.$inject = [
    '$scope', 'localStorageService', '$translate', '$routeParams', 'LocaleService', 'Assemblies',
    'usSpinnerService', '$state', '$location', '$stateParams', 'configService'
  ];

  function AssemblyFormCtrl($scope, localStorageService, $translate, $routeParams,
    LocaleService, Assemblies, usSpinnerService, $state, $location, $stateParams, configService) {

    init();

    function init() {
      initScopeFunctions();
      initScopeContent();
    }

    function initScopeFunctions() {
      $scope.goToStep = function (step) {
        if (step === 1) {
          if ($stateParams.aid) {
            $location.path('/v2/assembly/' + $stateParams.aid + '/edit/description');
          } else {
            $location.path('/v2/assembly/new/description');
          }
        } else {
          if ($stateParams.aid) {
            $location.path('/v2/assembly/' + $stateParams.aid + '/edit/configuration');
          } else {
            $location.path('/v2/assembly/new/configuration');
          }
        }
      }

      $scope.setNewAssemblyIcon = function (url, name) {
        $scope.newAssembly.profile.icon = url;
        var file = {};
        file.name = name;
        file.url = url;
        $scope.f = file;
      }

      $scope.addEmailsToList = function (emailsText) {
        if (!$scope.newAssembly.invitations) {
          $scope.newAssembly.invitations = [];
        }
        $scope.invalidEmails = [];
        console.log("Adding emails: " + emailsText);
        var emails = emailsText.split(',');
        console.log("Adding emails: " + emails);
        emails.forEach(function (email) {
          console.log("Adding email: " + email);
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
        $scope.inviteesEmails.list = "";
      }

      $scope.isValidEmail = function (email) {
        //var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
        //var re = /^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/i;
        //return re.test(email);
        return true;
      }

      $scope.removeInvalidEmail = function (index) {
        $scope.invalidEmails.splice(index, 1);
      };

      $scope.removeInvitee = function (index) {
        $scope.newAssembly.invitations.splice(index, 1);
      }

      $scope.addTheme = function (ts) {
        console.log("Adding themes: " + ts);
        var themes = ts.split(',');
        console.log("Adding themes: " + themes);
        themes.forEach(function (theme) {
          console.log("Adding theme: " + theme);
          var addedTheme = {};
          addedTheme.title = theme.trim();
          if (addedTheme.title != "") {
            $scope.newAssembly.themes.push(addedTheme);
          }
        });
        $scope.themes.list = "";
      }

      $scope.removeTheme = function (index) {
        $scope.newAssembly.themes.splice(index, 1);
      }

      $scope.findWithAttr = function (array, attr, value) {
        for (var i = 0; i < array.length; i += 1) {
          if (array[i][attr] === value) {
            return i;
          }
        }
      }

      $scope.removeByAttr = function (array, attr, value) {
        for (var i = 0; i < array.length; i += 1) {
          if (array[i][attr] === value) {
            array.splice(i, 1);
          }
        }
      }

      $scope.getExistingConfigs = function() {
        var configs1 = configService.getAssemblyConfigs("ASSEMBLY");
        var configs2 = [];
        if($state.is('v2.assembly.aid.edit') || $state.is('v2.assembly.aid.edit.description') || $state.is('v2.assembly.aid.edit.configuration')) {
          configs2 = configService.getPrincipalAssemblyConfigs("ASSEMBLY");
        }
        var configs = _.concat(configs1, configs2);
        var finalConfig = [];
        _.forEach($scope.newAssembly.configs, function(config) {
          _.forEach(configs, function (configAux) {
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
        } else if ($scope.newAssembly.profile.supportedMembership === "INVITATION" || $scope.newAssembly.profile.supportedMembership === "REQUEST"
            || $scope.newAssembly.profile.supportedMembership === "INVITATION_AND_REQUEST") {
            $scope.newAssembly.profile.membership === 'REGISTRATION';
        }

        if ($scope.newAssembly.profile.managementType === "OPEN") {
          $scope.newAssembly.profile.moderators = false;
          $scope.newAssembly.profile.coordinators = false;
        } else if ($scope.newAssembly.profile.managementType === "COORDINATED_AND_MODERATED") {
          $scope.newAssembly.profile.moderators = true; //can be all
          $scope.newAssembly.profile.coordinators = true; //can be all
        } else if ($scope.newAssembly.profile.managementType === "MODERATED") {
          $scope.newAssembly.profile.moderators = true; //can be all
          $scope.newAssembly.profile.coordinators = false;
        } else if ($scope.newAssembly.profile.managementType === "COORDINATED") {
          $scope.newAssembly.profile.moderators = false;
          $scope.newAssembly.profile.coordinators = true; //can be all
        }

        //$scope.newAssembly.config = {};
        //$scope.newAssembly.config.facetoface = $scope.newAssembly.configs[0].value;
        //$scope.newAssembly.config.messaging = $scope.newAssembly.configs[1].value;

        // add configs and principal configs
        $scope.newAssembly.configs = $scope.getExistingConfigs();
      }

      $scope.setModerationAndMembership = function () {
        if ($scope.newAssembly.profile.membership === 'OPEN') {
          $scope.newAssembly.profile.supportedMembership = "OPEN";
        } else if ($scope.newAssembly.profile.membership === 'REGISTRATION') {
          if ($scope.newAssembly.profile.registration.invitation &&
            !$scope.newAssembly.profile.registration.request) {
            $scope.newAssembly.profile.supportedMembership = "INVITATION";
          } else if (!$scope.newAssembly.profile.registration.invitation &&
            $scope.newAssembly.profile.registration.request) {
            $scope.newAssembly.profile.supportedMembership = "REQUEST";
          } else if ($scope.newAssembly.profile.registration.invitation &&
            $scope.newAssembly.profile.registration.request) {
            $scope.newAssembly.profile.supportedMembership = "INVITATION_AND_REQUEST";
          }
        }

        console.log("Creating assembly with membership = " + $scope.newAssembly.profile.supportedMembership);
        if ($scope.newAssembly.profile.moderators == false && $scope.newAssembly.profile.coordinators == false) {
          console.log("entro a OPEN");
          $scope.newAssembly.profile.managementType = "OPEN";
        } else if ($scope.newAssembly.profile.moderators == true && $scope.newAssembly.profile.coordinators == true) {
          console.log("entro a COOR AND MOD");
          $scope.newAssembly.profile.managementType = "COORDINATED_AND_MODERATED";
        } else if ($scope.newAssembly.profile.moderators == false && $scope.newAssembly.profile.coordinators == true) {
          console.log("entro a COOR");
          $scope.newAssembly.profile.managementType = "COORDINATED";
        } else if ($scope.newAssembly.profile.moderators == true && $scope.newAssembly.profile.coordinators == false) {
          console.log("entro a MOD");
          $scope.newAssembly.profile.managementType = "MODERATED";
        }
      }

      // TODO: process selected assemblies
      $scope.createOrUpdateAssembly = function (step) {
        console.log("Create or Update Assembly");
        if (step === 1) {
          console.log("Creating assembly with name = " + $scope.newAssembly.name);
          $scope.setModerationAndMembership();

          //$scope.newAssembly.configs[0].value = $scope.newAssembly.config.facetoface;
          //$scope.newAssembly.configs[1].value = $scope.newAssembly.config.messaging;
          localStorageService.set("temporaryNewAssembly", $scope.newAssembly);
          $scope.tabs[1].active = true;
        } else if (step === 2 && !$scope.userIsNew) {
          console.log("Creating new Assembly: " + JSON.stringify($scope.newAssembly.profile));
          $scope.setModerationAndMembership();
          var assemblyRes;
          if (!$scope.isEdit) {
            assemblyRes = Assemblies.assembly().save($scope.newAssembly);
          } else {
            //$scope.newAssembly.campaigns.delete;
            assemblyRes = Assemblies.assembly($scope.newAssembly.assemblyId).update($scope.newAssembly);
          }
          assemblyRes.$promise.then(
            // Success
            function (data) {
              localStorageService.set("currentAssembly", data);
              localStorageService.remove('temporaryNewAssembly');
              //redirect to manage page
              $state.go("v2.assembly.aid.edit", {aid: (data.assemblyId != null ? data.assemblyId : data.newResourceId)}, { reload: true });
            },
            // Error
            function (error) {
              var e = error.data;
              console.log("Couldn't create assembly: " + e.statusMessage);
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

      $scope.uploadFiles = function (file, errFiles) {
        $scope.f = file;
        $scope.errFile = errFiles && errFiles[0];
        if (file) {
          file.upload = Upload.upload({
            url: FileUploader.uploadEndpoint(),
            data: {
              file: file
            }
          });

          file.upload.then(function (response) {
            $timeout(function () {
              file.result = response.data;
              $scope.newAssembly.profile.icon = response.data.url;
            });
          }, function (response) {
            if (response.status > 0)
              $scope.errorMsg = response.status + ': ' + response.data;
          }, function (evt) {
            file.progress = Math.min(100, parseInt(100.0 *
              evt.loaded / evt.total));
            console.log('progress: ' + file.progress + '% ');
          });
        }
      }

      $scope.shortnameChanged = function(shortname) {
        // search shortName
        var rsp = Assemblies.assemblyByShortName(shortname).get();
        rsp.$promise.then(function(data) {
          if (data) {
            console.log("assembly shortname already existis");
            $scope.invalidShortname = true;
            $scope.newAssemblyForm1.shortname.$invalid = true;
            return;
          }
        }, function(error) {
          console.log(error);
          if (error.status == 404) {
            console.log("new assembly shortname");
            $scope.invalidShortname = false;
            $scope.newAssemblyForm1.shortname.$invalid = false;
            return;
          }
        });
      }

      $scope.createNotPrincipalAssembly = function() {
        ///#/v2/assembly/{{newAssembly.assemblyId}}/assembly/new
        $state.go("v2.assembly.aid.assembly.description", {aid: $scope.newAssembly.assemblyId}, { reload: true });
      }
    }

    function initScopeContent() {
      //temporal fix
      $scope.info = '';
      $scope.isEdit = false;
      if ($scope.info === undefined || $scope.info === null) {
        info = $scope.info = localStorageService.get("help");
      }
      $scope.user = localStorageService.get("user");
      if ($scope.user && $scope.user.language)
        $translate.use($scope.user.language);
      $scope.errors = [];

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

      $scope.userIsNew = $routeParams.userIsNew ? true : false;
      if ($scope.userIsNew) {
        $scope.newUser = {};
      }

      $scope.themes = {
        list: null
      };
      $scope.inviteesEmails = {
        list: null
      };

      // temporaryAssembly manage
      var temporaryAssembly = localStorageService.get("temporaryNewAssembly");
      if ($stateParams.aid && ($state.is('v2.assembly.aid.edit') || $state.is('v2.assembly.aid.edit.description')
        || $state.is('v2.assembly.aid.edit.configuration'))) {
        $scope.isEdit = true;
        if ((temporaryAssembly != null && temporaryAssembly.assemblyId != $stateParams.aid) || temporaryAssembly == null) {
          var rsp = Assemblies.assembly($stateParams.aid).get();
          rsp.$promise.then(function(data) {
            console.log("Get Assembly with assemblyId " + $stateParams.aid);
            $scope.newAssembly = data;
            localStorageService.set("temporaryNewAssembly", data);
            $scope.getAttributesFromExistingAssembly();
          });
        } else {
          $scope.newAssembly = temporaryAssembly;
        }
        initializeNewAssembly();
      } else {
        $scope.isEdit = false;
        if (temporaryAssembly != null && temporaryAssembly.assemblyId != null) {
          localStorageService.set("temporaryNewAssembly", null);
        }
        initializeNewAssembly();
      }

      $scope.$watch("newAssembly.name", function (newVal, oldval) {
        $translate('assembly.newAssemblystep1.text5', {
          newAssemblyName: $scope.newAssembly.name
        }).then(function (text) {
          $scope.newAssembly.invitationEmail = text;
        });
      }, true);

      $scope.$watch("newAssembly", function (newVal, oldval) {
        localStorageService.set("temporaryNewAssembly", newVal);
      }, true);
    }

    function initializeNewAssembly() {
      if ($scope.newAssembly === null || $scope.newAssembly === undefined || $scope.newAssembly === "") {
        $scope.newAssembly = localStorageService.get("temporaryNewAssembly");
        if ($scope.newAssembly === null || $scope.newAssembly === undefined || $scope.newAssembly === "") {
          $scope.newAssembly = Assemblies.defaultNewAssembly();

          // add configs and principal configs if apply
          var configs1 = configService.getAssemblyConfigs("ASSEMBLY");
          var configs2 = [];
          if($state.is('v2.assembly.new') || $state.is('v2.assembly.new.description') || $state.is('v2.assembly.new.configuration')) {
            $scope.invalidShortname = false;
            $scope.newAssembly.principalAssembly = true;
            var configs2 = configService.getPrincipalAssemblyConfigs("ASSEMBLY");
          }
          var configs = _.concat(configs1, configs2);
          $scope.newAssembly.configs = configs;

        }
      } else {
        console.log("Temporary New Assembly exists in the scope")
      }
      if ($scope.userIsNew) {
        $scope.newAssembly.newUser = {
          // username: "",
          // email: "",
          // password: "",
          // repeatPassword: "",
          themes: [] // same as assemblyThemes
        }
      }
      $scope.newAssembly.profile.icon = $scope.defaultIcons[0].url;
      var file = {};
      file.name = $scope.defaultIcons[0].name;
      file.url = $scope.defaultIcons[0].url;
      $scope.f = file;
    }

  }
} ());
