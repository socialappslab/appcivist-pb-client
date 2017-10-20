(function () {
  'use strict';

  /**
   * @name siteThumbnail
   * @memberof components
   *
   * @description
   *  Component that renders siteThumbnail information.
   *
   * @example
   *
   *  <site-thumbnail></site-thumbnail>
   */
  appCivistApp
    .component('siteThumbnail', {
      selector: 'siteThumbnail',
      bindings: {
        url: '='
      },
      controller: siteThumbnailCtrl,
      controllerAs: 'vm',
      templateUrl: '/app/v2/components/site-thumbnail/site-thumbnail.html'
    });

  siteThumbnailCtrl.$inject = [

  ];

  function siteThumbnailCtrl() {
    console.log("Site thumbnail added: "+this.url);
    }
}());
