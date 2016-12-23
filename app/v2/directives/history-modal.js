(function() {
'use strict';

appCivistApp
  .directive('historyModal',  HistoryModal);

HistoryModal.$inject = [
  'localStorageService', 'AppCivistAuth', '$state', 'Contributions', 'Space'
];

function HistoryModal(localStorageService, AppCivistAuth, $state, Contributions, Space) {

  function redirect() {
    localStorageService.clearAll();
    $state.go('v2.login', null, {reload: true}).then(function() {
      location.reload();
    });
  }

  return {
    restrict: 'E',
    scope: {
      user: '=',
      contribution: '=',
      vexInstance: '='
    },
    templateUrl: '/app/v2/partials/directives/history-modal.html',
    link: function postLink(scope, element, attrs) {
      scope.currentUser = scope.user;

      scope.$watch('user', function(newVal) {
        if(newVal){
          scope.currentUser = newVal;
        }
      });

      if(!scope.user){
        scope.currentUser = localStorageService.get('user');
      }

      scope.signout = function() {
		    var rsp = AppCivistAuth.signOut().save();
        rsp.$promise.then(redirect, redirect);
      };

      var currentAssembly = localStorageService.get('currentAssembly');
      scope.assemblyID = currentAssembly != null ? currentAssembly.assemblyId : 1;

      /*var cambio1 = {
          "creation": "2016-12-20 22:48 PM GMT",
          "lastUpdate": "2016-12-20 22:48 PM GMT",
          "lang": "en",
          "removal": null,
          "removed": false,
          "contextUserId": null,
          "contributionHistoryId": 6,
          "contributionId": 1,
          "uuid": "1b0d13cf-0768-4be8-9574-bd79811c33b4",
          "title": "Interactive Lights Project NUEVO",
          "text": "This is project is about creating a permanent interactive installation at the central civic center, where people will pass by and lights will interactively follow",
          "type": "IDEA",
          "moderationComment": null,
          "budget": null,
          "actionDueDate": null,
          "actionDone": false,
          "action": null,
          "assessmentSummary": null,
          "authors": [],
          "changes": {
              "internalChanges": [
                  "uuid",
                  "title"
              ],
              "externalChanges": [],
              "associationChanges": []
          }
      };
      var cambio2 = {
          "creation": "2016-12-20 22:52 PM GMT",
          "lastUpdate": "2016-12-20 22:52 PM GMT",
          "lang": "en",
          "removal": null,
          "removed": false,
          "contextUserId": null,
          "contributionHistoryId": 9,
          "contributionId": 1,
          "uuid": "f5603a42-71b4-4640-a6ae-faeda3526b4a",
          "title": "Interactive Lights Project CAMBIADO",
          "text": "This is project is about creating a permanent interactive installation at the central civic center, where people will pass by and lights will interactively follow",
          "type": "PROPOSAL",
          "moderationComment": null,
          "budget": null,
          "actionDueDate": null,
          "actionDone": false,
          "action": null,
          "assessmentSummary": null,
          "authors": [
              {
                  "userId": 1,
                  "uuid": "f8dbbd14-8891-47ff-94d3-42c7172c248b",
                  "uuidAsString": "f8dbbd14-8891-47ff-94d3-42c7172c248b",
                  "email": "carmen@example.com",
                  "name": "Carmen undefined",
                  "username": "carmen",
                  "language": "en-US",
                  "profilePic": {
                      "creation": "2016-12-05 03:00 AM GMT",
                      "lastUpdate": "2016-12-05 03:00 AM GMT",
                      "lang": "en",
                      "removed": false,
                      "uuid": "e79d7581-e712-4330-abf6-8eea49da62b0",
                      "url": "https://s3-us-west-1.amazonaws.com/appcivist-files/users/Carmen+Profile.jpg",
                      "urlAsString": "https://s3-us-west-1.amazonaws.com/appcivist-files/users/Carmen+Profile.jpg",
                      "confirmed": false,
                      "urlLargeString": "https://s3-us-west-1.amazonaws.com/appcivist-files/users/Carmen+Profile.jpg"
                  },
                  "active": true
              }
          ],
          "changes": {
              "internalChanges": [
                  "uuid"
              ],
              "externalChanges": [
                  {
                      "externalRef": "authors",
                      "externalRefId": 1,
                      "changeType": "ADDED"
                  }
              ],
              "associationChanges": []
          }
      };
      var cambio3 = {
          "creation": "2016-12-20 23:19 PM GMT",
          "lastUpdate": "2016-12-20 23:19 PM GMT",
          "lang": "en",
          "removal": null,
          "removed": false,
          "contextUserId": null,
          "contributionHistoryId": 20,
          "contributionId": 21,
          "uuid": "00001d9e-0c51-4174-afa1-bb0eb50f255d",
          "title": "PEPE2",
          "text": "This is project is about creating a permanent interactive installation at the central civic center, where people will pass by and lights will interactively follow",
          "type": "PROPOSAL",
          "moderationComment": null,
          "budget": null,
          "actionDueDate": null,
          "actionDone": false,
          "action": null,
          "assessmentSummary": null,
          "authors": [],
          "changes": {
              "internalChanges": [
                  "uuid"
              ],
              "externalChanges": [
                  {
                      "externalRef": "authors",
                      "externalRefId": 1,
                      "changeType": "DELETED"
                  }
              ],
              "associationChanges": [
                  {
                      "resourceSpaceId": 31,
                      "type": "WORKING_GROUP",
                      "changeType": "DELETED"
                  },
                  {
                      "resourceSpaceId": 45,
                      "type": "CAMPAIGN",
                      "changeType": "DELETED"
                  },
                  {
                      "resourceSpaceId": 46,
                      "type": "CAMPAIGN",
                      "changeType": "DELETED"
                  }
              ]
          }
      };
      scope.historyElements = [cambio1, cambio2, cambio3];*/
      var getResourceSpace = function (resourceSpaceId) {
        return Space.getSpace(resourceSpaceId).get();
      }

      scope.vm = {};
      scope.$watch('vexInstance', function (newValue, oldValue) {
        if (newValue) {
          var rsp = Contributions.contributionHistory(scope.assemblyID, scope.contribution.contributionId).query();
          rsp.$promise.then(function(response) {

            _.forEach(response, function(element) {
              _.forEach(element.changes.associationChanges, function(change) {
                change.resource = getResourceSpace(change.resourceSpaceId);
              });
            });

            scope.vm.historyElements = response;
          });
        }
      });
    }
  };
}
}());
