(function() {
'use strict';

appCivistApp
  .directive('campaignTimeline',  CampaignTimeline);

CampaignTimeline.$inject = ['Campaigns'];

function CampaignTimeline(Campaigns) {
  
  function loadCampaign(scope, aid, cid) {
    var res = Campaigns.campaign(aid, cid).get();
    res.$promise.then(function(data) {
      var currentComponent = Campaigns.getCurrentComponent(data.components);
      angular.forEach(data.components, function(c) {
        c.cssClass = getComponentCssClass(currentComponent, c);
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
  function getComponentCssClass(currentComponent, c) {
    if(c.componentId === currentComponent.componentId) {
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
      title: '@'
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
