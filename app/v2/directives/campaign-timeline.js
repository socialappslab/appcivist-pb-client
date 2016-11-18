(function() {
'use strict';

appCivistApp
  .directive('campaignTimeline',  CampaignTimeline);

CampaignTimeline.$inject = ['Campaigns', 'localStorageService'];

function CampaignTimeline(Campaigns, localStorageService) {

  function loadCampaign(scope, aid, cid) {
    scope.user = localStorageService.get('user');
    var res;
    if (scope.user) {
      res = Campaigns.campaign(aid, cid).get();
    } else {
      res = Campaigns.campaignByUUID(cid).get();
    }
    res.$promise.then(function(data) {
      var currentComponent = Campaigns.getCurrentComponent(data.components);
      angular.forEach(data.components, function(c) {
        c.cssClass = getComponentCssClass(scope, currentComponent, c);
      });
      scope.components = data.components;
    });
  }

  /**
   * Set timeline stage status.
   *
   * @param currentComponent {Component} the current component.
   * @param c {Component} the timeline component.
   **/
  function getComponentCssClass(scope, currentComponent, c) {
    var idField = scope.user ? 'componentId' : 'uuid';

    if(c[idField] === currentComponent[idField]) {
      return 'active';
    }

    if(c.position < currentComponent.position) {
      return 'inactive';
    }
    return 'future';
  }

  return {
    restrict: 'E',
    scope: {
      assemblyId: '=',
      campaignId: '=',
      title: '@',
      onlyLabel: '='
    },
    templateUrl: '/app/v2/partials/directives/campaign-timeline.html',
    link: function postLink(scope, element, attrs) {

      if(!scope.campaignId){
        scope.$watch('campaignId', function(cid) {
          loadCampaign(scope, scope.assemblyId, cid);
        });
      }else{
        loadCampaign(scope, scope.assemblyId, scope.campaignId);
      }
    }
  };
}
}());
