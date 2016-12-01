(function () {
  'use strict';
  /**
   * wrapper for ngNotify.
   */
  appCivistApp
    .factory('Notify', Notify);

  Notify.$inject = ['ngNotify'];

  function Notify(ngNotify) {
    // configure notification helper
    ngNotify.config({
      theme: 'pitchy',
      position: 'bottom'
    });

    return {
      show: show
    };

    /**
     * Display a notification message.
     *
     * @param {string} msg - The message to display.
     * @params {string} type - info | error | success (success) | warn | grimace
     */
    function show(msg, type) {
      type = type || 'success';
      ngNotify.set(msg, type);
    }
  }
} ());
