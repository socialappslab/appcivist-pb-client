'use strict';

(function () {
  'use strict';

  /**
   * @name associatedContributions
   * @memberof components
   *
   * @description
   *  Component that renders allows to search for ideas and associate them to a resource space.
   *
   * @example
   *
   *  <associated-ideas></associated-ideas>
   */

  appCivistApp.component('associatedContributionsForm', {
    selector: 'associatedContributionsForm',
    bindings: {
      contributionType: '=',
      spaceId: '=',
      space: '=',
      assemblyId: '=',
      campaignId: '=',
      campaignSpaceId: '=',
      groupId: '=',
      parentContributionId: '=',
      spaceIsGroup: '='

    },
    controller: associatedContributionsCtrl,
    controllerAs: 'vm',
    templateUrl: '/app/v2/components/associated-contributions-form/associated-contributions-form.html'
  });

  associatedContributionsCtrl.$inject = ['$scope','Space', 'usSpinnerService'];

  function associatedContributionsCtrl($scope, Space, usSpinnerService) {
    this.activate = activate.bind(this);

    /**
     * Initialization method.
     */
    this.$onInit = () => {
      $scope.$watch('vm.campaignSpaceId', space => {
        if (!space ) {
          return;
        }
        this.activate();
      });
    };

    function activate() {
      this.searchContributionsInSpace = searchContributionsInSpace.bind(this);
      this.associateContributionToSpace = associateContributionToSpace.bind(this);
      this.removeContributionFromSpace = removeContributionFromSpace.bind(this);
      this.startSpinner = startSpinner.bind(this);
      this.stopSpinner = stopSpinner.bind(this);
      this.filters = {
        searchText: "",
        mode: this.contributionType,
        sorting: 'date_desc',
        status: "PUBLISHED,INBALLOT,SELECTED"
      };
      this.filteredContributions = [];
      this.spinnerOptions = {
        radius:10,
        width:4,
        length: 10,
        top: '75%',
        left: '50%',
        zIndex: 1
      };
      $scope.$on('AssociatedContributionForm:RemoveRelatedContribution',
        (event, idea) => {
          this.removeContributionFromSpace(idea);
        }
      );
    }

    function startSpinner () {
      this.spinnerActive = true;
      usSpinnerService.spin('associated-ideas-spinner');
    }

    function stopSpinner () {
      usSpinnerService.stop('associated-ideas-spinner');
      this.spinnerActive = false;
    }


    function searchContributionsInSpace () {
      if (this.filters.searchText){
        console.log(this.filters);
        this.startSpinner();
        Space.doSearch({rsID:this.campaignSpaceId}, false, this.filters).then(
          data => {
            let contributions = data ? data.list || [] : [];
            this.filteredContributions = contributions;
            this.stopSpinner();
          });
      }
    }

    function associateContributionToSpace (item) {
      this.startSpinner();

      if (this.spaceIsGroup) {
        Space.assignContributionToGroupResourceSpace(this.assemblyId, this.campaignId, this.groupId, [item.contributionId]).then(
          data => {
            this.space.relatedContributions.push(item);
            this.filteredContributions = [];
            this.stopSpinner();
          }
        )
      } else {
        Space.addContributionToResourceSpace(this.assemblyId, item.contributionId, this.spaceId, item).then(
          data => {
            this.space.relatedContributions.push(item);
            this.filteredContributions = [];
            this.stopSpinner();
          }
        )
      }
    }

    function removeContributionFromSpace(item) {
      this.startSpinner();
      Space.removeContributionFromResourceSpace(this.assemblyId, item.contributionId, this.spaceId).then(
        data => {
          _.remove(this.space.relatedContributions, { contributionId: item.contributionId });
          this.filteredContributions = [];
          this.stopSpinner();
        }
      )
    }
  }
})();
