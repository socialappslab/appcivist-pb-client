(function() {
  'use strict';

  window.ModalMixin = {
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