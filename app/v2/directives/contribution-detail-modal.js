(function() {
  'use strict';

  appCivistApp
    .directive('contributionDetailModal', contributionDetailModal);

  contributionDetailModal.$inject = [
    'localStorageService', 'AppCivistAuth', '$state', 'Contributions', 'Space', '$translate', '$sce'
  ];

  function contributionDetailModal(localStorageService, AppCivistAuth, $state, Contributions, Space, $translate, $sce) {

    function redirect() {
      localStorageService.clearAll();
      $state.go('v2.login', null, { reload: true }).then(function() {
        location.reload();
      });
    }

    return {
      restrict: 'E',
      scope: {
        contribution: '=',
        vexInstance: '='
      },
      templateUrl: '/app/v2/partials/directives/contribution-detail-modal.html',
      link: function postLink(scope, element, attrs) {
        scope.currentUser = localStorageService.get('user');
        scope.signout = function() {
          var rsp = AppCivistAuth.signOut().save();
          rsp.$promise.then(redirect, redirect);
        };

        activate();

        function activate() {
          scope.enableDiscussions = false;
          scope.activeTab = 'Public';
          scope.changeActiveTab = function(tab) {
            if (tab == 1) {
              scope.activeTab = 'Members';
            } else {
              scope.activeTab = 'Public';
            }
          }
          scope.userIsMember = false;
          scope.user = localStorageService.get('user');
          if (scope.user && scope.user.language) {
            $translate.use(scope.user.language);
            scope.userIsMember = true;
          }

          scope.contributionID = scope.contribution.contributionId;
          // TODO revise this logic. the idea is to avoid showing duplicates
          scope.filteredNonMemberAuthors = scope.contribution.nonMemberAuthors ?
            scope.contribution.nonMemberAuthors.filter(nma => {
              let membersSameEmail = false;
              if(scope.contribution.authors) {
                membersSameEmail = scope.contribution.authors.filter(a => {
                  return a.email = nma.email;
                })
              }
              return !nma.publishContact && nma.email != "" && nma.email !=null && (!membersSameEmail || membersSameEmail.length == 0);
            }) : null;

          scope.mergedAuthors = scope.contribution.authors ?
            scope.contribution.authors.concat(scope.filteredNonMemberAuthors)
              : scope.filteredNonMemberAuthors;
          scope.$watch('vexInstance', function(newValue, oldValue) {
            if (newValue) {
              scope.enableDiscussions = true;
            }
          });

          scope.trustedHtml = function(html) {
            return $sce.trustAsHtml(html);
          };
        }
      }
    };
  }
}());
