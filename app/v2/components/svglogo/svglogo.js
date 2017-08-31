(function () {
  'use strict';

  /**
   * @name svglogo
   * @memberof components
   *
   * @description
   *  Component that renders the AppCivist logo in svg format
   *
   * @example
   *
   *  <svglogo width="34px" height="34px"></svglogo>
   */
  appCivistApp
    .component('svglogo', {
      selector: 'svglogo',
      bindings: {
        height: '=',
        width: '='
      },
      controller: SvgLogoCtrl,
      controllerAs: 'vm',
      templateUrl: '/app/v2/components/svglogo/svglogo.html'
    });

  SvgLogoCtrl.$inject = [

  ];

  // TODO: bindings for height and width are not working, fix them so that the logo takes these values for rendering
  function SvgLogoCtrl() {
    }
}());
