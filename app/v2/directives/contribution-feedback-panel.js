(function() {
  'use strict';

  appCivistApp
    .directive('contributionFeedbackPanel', ContributionFeedbackPanel);

  ContributionFeedbackPanel.$inject = [
    'localStorageService', '$anchorScroll', '$location', 'Contributions', 'Notify', '$filter',
    'Space', 'Memberships', '$stateParams', 'Captcha', '$rootScope', '$sce'
  ];

  function ContributionFeedbackPanel(localStorageService, $anchorScroll, $location, Contributions,
    Notify, $filter, Space, Memberships, $stateParams, Captcha, $rootScope, $sce) {

    return {
      restrict: 'E',
      scope: {
        contribution: '=',
        publicBoard: '@'
      },
      templateUrl: '/app/v2/partials/directives/contribution-feedback-panel.html',
      link: function(scope, element, attrs) {
        activate();

        function activate() {
          scope.vm = {};
          scope.editOnlyText = true;
          scope.user = localStorageService.get('user');
          scope.isAnonymous = !scope.user;
          scope.modals = {};
          scope.openModal = openModal.bind(scope);
          scope.closeModal = closeModal.bind(scope);

          if (scope.user) {
            // get public and private feedbacks
            var hasRol = Memberships.hasRol;
            var assembly = localStorageService.get('currentAssembly');
            scope.assemblyId = assembly.assemblyId;
            var groupMembershipsHash = localStorageService.get('groupMembershipsHash');
            var assemblyMembershipsHash = localStorageService.get('assemblyMembershipsHash');
            var assemblyRols = assemblyMembershipsHash[assembly.assemblyId];
            scope.isCoordinator = assemblyRols != undefined ? hasRol(assemblyRols, 'COORDINATOR') : false;

            if (!scope.isCoordinator) {
              var groupId = $stateParams.gid ? parseInt($stateParams.gid) : 0;
              var groupRols = groupMembershipsHash[groupId];
              scope.isCoordinator = groupRols != undefined ? hasRol(groupRols, 'COORDINATOR') : false;
              scope.isWGroup = true;
            }
          } else {
            // get public feedbacks
          }
          loadFeedbacks(scope, scope.contribution);

          scope.formatDate = function(date) {
            return moment(date, 'YYYY-MM-DD HH:mm').local().format('LLL');
          };

          scope.trustedHtml = function(html) {
            return $sce.trustAsHtml(html);
          };

          $rootScope.$on('refreshList', function(event, index) {
            loadFeedbacks(scope, scope.contribution);
          });

          scope.refreshFeedbacks = function (type, event) {
            scope.type = type;
            loadFeedbacks(scope, scope.contribution);
          }

          scope.setFeedback = function(feedback) {
            scope.currentFeedback = feedback;
          }

        }

      }
    };

    function loadFeedbacks(scope, contrib) {
      var query;
      var rsp;
      if (scope.type) {
        query = { type: scope.type };
      }

      var rsp;
      if (!scope.user) {
        rsp = Contributions.publicFeedbacks(contrib.uuid).query(query);
      } else {
        if (scope.isWGroup) {
          rsp = Contributions.userFeedbackWithGroupId(scope.assemblyId, scope.groupId, contrib.contributionId).query(query);
        } else {
          rsp = Contributions.userFeedback(scope.assemblyId, contrib.contributionId).query(query);
        }
      }
      rsp.$promise.then(
        function(data) {
          scope.feedbacks = data;
        },
        function(error) {
          Notify.show('Error loading feedbacks from server', 'error');
        }
      );
      return rsp.$promise;
    }

    function openModal(id) {
      this.modals[id] = true;
    }

    function closeModal(id) {
      this.modals[id] = false;
    }

  }
}());
