(function () {
  'use strict';

  angular
    .module('appCivistApp')
    .controller('v2.AssemblyFormCtrl', AssemblyFormCtrl);


  AssemblyFormCtrl.$inject = [
    '$scope', 'localStorageService', '$translate', '$routeParams', 'LocaleService', 'Assemblies',
    'usSpinnerService', '$state', '$location'
  ];

  function AssemblyFormCtrl($scope, localStorageService, $translate, $routeParams,
    LocaleService, Assemblies, usSpinnerService, $state, $location) {

    if ($state.is('v2.assembly.new')) {
      $state.go('v2.assembly.new.step1');
    }

    init();
    initializeNewAssembly();
    initializeListOfAssembliesToFollow();

    function init() {
      $scope.user = localStorageService.get("user");
      if ($scope.user && $scope.user.language)
        $translate.use($scope.user.language);
      $scope.themes = {
        list: null
      };
      $scope.inviteesEmails = {
        list: null
      };
      //temporal fix
      $scope.info = '';

      $scope.goToStep = function (step) {
        console.log('go to step...')
        if (step === 1) {
          $state.go('v2.assembly.new.step1');
        } else {
          $state.go('v2.assembly.new.step2');
        }
      }

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
      if ($scope.info === undefined || $scope.info === null) {
        info = $scope.info = localStorageService.get("help");
      }
      $scope.errors = [];
      $scope.selectedAssemblies = [];
      $scope.userIsNew = $routeParams.userIsNew ? true : false;
      if ($scope.userIsNew) {
        $scope.newUser = {};
      }

      /*$scope.currentLocaleDisplayName = LocaleService.getLocaleDisplayName() ?
        LocaleService.getLocaleDisplayName() : LOCALES.locales[LOCALES.preferredLocale];
      $scope.localesDisplayNames = LocaleService.getLocalesDisplayNames();

      $scope.changeLanguage = function(locale) {
        LocaleService.setLocaleByDisplayName(locale);
      };

      $scope.removeErrors = function(index) {
        $scope.errors.splice(index, 1);
      }

      $scope.setCurrentStep = function(number) {
        step(number);
      }*/

      $scope.setNewAssemblyIcon = function (url, name) {
        $scope.newAssembly.profile.icon = url;
        var file = {};
        file.name = name;
        file.url = url;
        $scope.f = file;
      }

      $scope.addEmailsToList = function (emailsText) {

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

      $scope.getLinkedAssemblyById = function (id) {
        return $scope.findWithAttr($scope.newAssembly.linkedAssemblies, "assemblyId", id);
      }

      $scope.removeLinkedAssemblyById = function (id) {
        return $scope.removeByAttr($scope.newAssembly.linkedAssemblies, "assemblyId", id);
      }

      $scope.selectAssembly = function (assemblyId) {
        $scope.selectedAssemblies[assemblyId] = !$scope.selectedAssemblies[assemblyId];

        if ($scope.selectedAssemblies[assemblyId]) {
          var linked = {
            "assemblyId": assemblyId
          };
          $scope.newAssembly.linkedAssemblies.push(linked);
        } else {
          $scope.removeLinkedAssemblyById(assemblyId);
        }
      }

      // TODO: process selected assemblies
      $scope.createNewAssembly = function (step) {
        if (step === 1) {
          console.log("Creating assembly with name = " + $scope.newAssembly.name);
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

          // TODO: change moderation and coordination configurations to be stored differently
          console.log("Creating assembly with membership = " + $scope.newAssembly.profile.supportedMembership);
          if ($scope.newAssembly.profile.moderators === 'none' && $scope.newAssembly.profile.coordinators === 'none') {
            $scope.newAssembly.profile.managementType = "OPEN";
          } else if ($scope.newAssembly.profile.moderators === 'two' || $scope.newAssembly.profile.moderators === 'all') {
            if ($scope.newAssembly.profile.coordinators === 'two') {
              $scope.newAssembly.profile.managementType = "COORDINATED_AND_MODERATED";
            } else if ($scope.newAssembly.profile.coordinators === 'all') {
              $scope.newAssembly.profile.managementType = "OPEN";
            } else {
              $scope.newAssembly.profile.managementType = "MODERATED";
            }
          } else {
            if ($scope.newAssembly.profile.coordinators === 'all') {
              $scope.newAssembly.profile.managementType = "OPEN";
            } else {
              $scope.newAssembly.profile.managementType = "COORDINATED";
            }
          }

          $scope.newAssembly.configs[0].value = $scope.newAssembly.config.facetoface;
          $scope.newAssembly.configs[1].value = $scope.newAssembly.config.messaging;
          localStorageService.set("temporaryNewAssembly", $scope.newAssembly);
          $scope.tabs[1].active = true;
        } else if (step === 2 && !$scope.userIsNew) {
          console.log("Creating new Assembly: " + JSON.stringify($scope.newAssembly.profile));
          var newAssemblyRes = Assemblies.assembly().save($scope.newAssembly);
          newAssemblyRes.$promise.then(
            // Success
            function (data) {
              localStorageService.set("currentAssembly", data);
              localStorageService.set("temporaryNewAssembly", "");
              $location.url('/v1/assembly/' + data.assemblyId + "/forum");
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

      $scope.$watch("newAssembly.name", function (newVal, oldval) {
        $translate('assembly.newAssemblystep1.text5', {
          newAssemblyName: $scope.newAssembly.name
        }).then(function (text) {
          $scope.newAssembly.invitationEmail = text;
        });
      }, true);
    }

    function initializeNewAssembly() {
      if ($scope.newAssembly === null || $scope.newAssembly === undefined || $scope.newAssembly === "") {
        $scope.newAssembly = localStorageService.get("temporaryNewAssembly");
        if ($scope.newAssembly === null || $scope.newAssembly === undefined || $scope.newAssembly === "") {
          $scope.newAssembly = Assemblies.defaultNewAssembly();
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

    function initializeListOfAssembliesToFollow() {
      var sessionKey = localStorageService.get("sessionKey");
      if (sessionKey === null || sessionKey === undefined || sessionKey === "") {
        $scope.assemblies = Assemblies.assembliesWithoutLogin().query();
      } else {
        $scope.assemblies = Assemblies.assemblies().query();
      }
      $scope.assemblies.$promise.then(
        function (data) {
          $scope.assemblies = data;
          console.log("Assemblies loaded...");
        },
        function (error) {
          $scope.errors.push(error);
        }
      );
    }

    function step(number) {
      if ($scope.setCurrentStep === 1 && number === 2) {
        createNewAssembly(1);
      }
      if ($scope.setCurrentStep === 2 && number === 3) {
        createNewAssembly(2);
      }
      $scope.currentStep = number;
    }


  }
} ());
