(function() {
  'use strict';

  /**
   * Simple mixin to use in combination with <modal> directive.
   */
  window.ModalMixin = {

    /**
     * function that add the mixin to the given target (a $scope)
     * 
     * @param {object} target - The target scope
     */
    init: function(target) {
      target.modals = {};
      target.openModal = openModal.bind(target);
      target.closeModal = closeModal.bind(target);
    }
  };


  function openModal(id) {
    this.modals[id] = true;
  }

  function closeModal(id) {
    this.modals[id] = false;
  }
}());