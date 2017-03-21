(function () {
  'use strict';

  angular
    .module('appCivistApp')
    .directive('paginationWidget', paginationWidget);

  paginationWidget.$inject = ['$state', 'Contributions', 'Notify'];

  function paginationWidget($state, Contributions, Notify) {
    var directive = {
      //required: '^^wizard',
      restrict: 'E',
      scope: {
        //page: '=',
        pageSize: '=',
        space: '=',
        resource: '=',
        type: '=',
        isAnonymous: '=',
        isCoordinator: '='
      },
      templateUrl: '/app/v2/partials/directives/pagination-widget.html',
      link: function postLink(scope) {
        var vm = this;

        getResultsPage(1);
        scope.pagination = {
            current: 1
        };

        scope.pageChanged = function(newPage) {
            getResultsPage(newPage);
        };

        function getResultsPage(pageNumber) {
            var rsp;
            var query = { type: scope.type.toUpperCase() };
            if (scope.isAnonymous == "true") {
              rsp = Contributions.contributionInResourceSpaceByUUID(scope.space, pageNumber, scope.pageSize).get(query);
            } else {
              rsp = Contributions.contributionInResourceSpace(scope.space, pageNumber, scope.pageSize).get(query);
            }
            rsp.$promise.then(
              function (data) {
                var contributions = data.list;

                if (!contributions) {
                  contributions = [];
                }
                scope.contributions = contributions;
                scope.totalContributions = data.total; //get from response
                scope.pagination.current = pageNumber;
              },
              function (error) {
                Notify.show('Error loading proposals from server', 'error');
              }
            );
        }

        scope.paginationTop = {};
        scope.paginationBottom = {};

        scope.paginationVisible = function (pag, visible) {
          if (scope.paginationTop.visible) {
            scope.paginationBottom.style = { display: 'none' };
            return;
          }
          pag.visible = visible;
          pag.style = visible ? {} : { display: 'none' };
        };

      }
    };

    return directive;
  }

} ());
