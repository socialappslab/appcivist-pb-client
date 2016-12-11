(function () {
  'use strict';

  appCivistApp
    .directive('tagsField', TagsField);

  TagsField.$inject = [];

  function TagsField() {

    return {
      restrict: 'E',
      scope: {
        /**
         * Function called when tags-input need to fill its suggestion list.
         *
         * @returns {Promise|Array}
         */
        loadItems: '&',
        /**
         * object that accepts the following configuration parameters:
         *
         * textField: property of the item object used as a display value. Default value 'text'.
         * idField: property of the item object used as an index value. Default value 'id'.
         */
        options: '<',
        /**
         * Selected items reference.
         */
        selected: '='
      },
      templateUrl: '/app/v2/partials/directives/tags-field.html',
      link: function (scope, element, attrs) {
        scope.vm = {
          query: ''
        };
        var defaults = { textField: 'text', idField: 'id' };
        scope.options = scope.options || defaults;
        scope.$watch('vm.query', queryTextObserver.bind(scope));
        scope.isSuggestionListVisible = false;
        scope.select = select.bind(scope);
        scope.remove = remove.bind(scope);
        scope.getText = getText.bind(scope);
      }
    };

    /**
     * Observes changes to query textbox and calls loadItems
     *
     * @param {string} newVal
     */
    function queryTextObserver(newVal) {
      var text = newVal.trim();
      var self = this;
      self.isSuggestionListVisible = text.length > 0;

      if (!self.isSuggestionListVisible) {
        return;
      }
      var rsp = self.loadItems({ query: text });

      if (angular.isFunction(rsp.then)) {
        rsp.then(function (items) {
          self.items = items;
        })
      } else {
        self.items = rsp;
      }
    }

    /**
     * Add an item to the list of selected items.
     *
     * @param {object} item
     */
    function select(item) {
      this.vm.query = '';
      var self = this;
      this.selected = _.uniqBy(this.selected.concat([item]), function (e) {
        return e[self.options.idField];
      });
    }

    /**
     * Removes an item from the selected items list.
     *
     * @param {object} item
     * @param {object} event
     */
    function remove(item, event) {
      event.preventDefault();
      var toRemove = {};
      toRemove[this.options.idField] = item[this.options.idField];
      _.remove(this.selected, toRemove);
    }

    /**
     * Return the display value of the item
     *
     * @param {object} item
     */
    function getText(item) {
      return item[this.options.textField];
    }
  }
} ());
