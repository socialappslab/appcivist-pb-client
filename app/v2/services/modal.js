(function () {
  'use strict';
  /**
   * wrapper for vex modal library.
   */
  appCivistApp
    .factory('Modal', Modal);

  Modal.$inject = ['$compile'];

  function Modal($compile) {
    vex.defaultOptions.className = 'vex-theme-plain';

    return {
      open: open
    };


    /**
     * Wrapps de element with the given ID in a modal element.
     *
     * @param {string} id - element ID.
     */
    function open(id, scope) {
      // TODO: currently not working
      var html = document.querySelector('#' + id).innerHTML;
      if(scope) {
        var content = $compile(html)(scope);
        html = '';
        angular.forEach(content, function(c) {
          html += c.outerHTML;
        });

      }
      vex.open({
        unsafeContent: html
      });
    }
  }
}());
