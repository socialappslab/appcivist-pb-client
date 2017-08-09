(function () {
  'use strict';
  /**
   * Simple mixin to use in combination with <modal> directive.
   * 
   * Usage: just include it in your controller and do the following
   * 
   * @example
   * 
   * ```js
   *  ModalMixin.init($scope);
   * ```
   * 
   * which adds the following methods to the target object:
   * 
   *  @{linkcode ModalMixin#openModal}
   *  @{linkcode ModalMixin#closeModal}
   * 
   */
  var ModalMixin = {

    /**
     * function that add the mixin to the given target (a $scope)
     * 
     * @param {object} target - The target scope
     */
    init: function (target) {
      target.modals = {};
      target.openModal = openModal.bind(target);
      target.closeModal = closeModal.bind(target);
    }
  };


  /**
   * Opens the modal
   * 
   * @param {Number} id - The modal ID
   */
  function openModal(id) {
    this.modals[id] = true;
  }

  /**
   * Closes the modal
   * 
   * @param {Number} id - The modal ID
   */
  function closeModal(id) {
    this.modals[id] = false;
  }

  window.ModalMixin = ModalMixin;
}());