(function() {
  'use strict';

  appCivistApp
    .directive('tagsField', TagsField)
    .filter('highlight', highlight);

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
        selected: '=',

        /**
         * Boolean value that tells the directive that when tags-field has focus it
         * should display the list of options. Default: false.
         */
        prefetch: '<',

        /**
         * attribute that indicates if tags-field is disabled.
         */
        disabled: '=',

        /**
         * true | false. Defines the posibility to add unlisted items to the list of items displayed. False by default.
         * New items are given a temporary ID that begins with "tmp-N".
         */
        canAdd: '@',

        /**
         * name for the input element
         */
        name: '=',

        /**
         * true | false. Defines if the tags field input is required in the container form
         */
        required: '=',

        /**
         * attribute of items that must be used to display in the tags
         */
        field: '@'
      },
      templateUrl: '/app/v2/partials/directives/tags-field.html',
      link: function(scope, element, attrs) {
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
        scope.fetch = fetch.bind(scope);
        scope.onFocus = onFocus.bind(scope);
        scope.onMouseLeave = onMouseLeave.bind(scope);
        scope.setupAddListener = setupAddListener.bind(scope);

        scope.field = scope.field || 'item[this.options.textField]';

        if (scope.canAdd === 'true') {
          scope.setupAddListener(element);
        }
        scope.tmpIdCount = 1;
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
      this.currentText = text;
      this.fetch(text);
    }

    /**
     * Populates the options list
     *
     * @param {string} text - The query to filter the list of options.
     */
    function fetch(text) {
      var self = this;
      var rsp = this.loadItems({ query: text });

      if (rsp && angular.isFunction(rsp.then)) {
        rsp.then(function(items) {
          self.items = items;
        });
      } else {
        self.items = rsp;
      }
    }

    /**
     * onfocus handler
     */
    function onFocus() {
      if (this.prefetch) {
        this.isSuggestionListVisible = true;
        this.fetch();
      }
    }

    /**
     * mouseleave handler
     */
    function onMouseLeave() {
      this.isSuggestionListVisible = false;
    }


    /**
     * Add an item to the list of selected items.
     *
     * @param {object} item
     */
    function select(item) {
      this.vm.query = '';
      var self = this;
      this.selected = _.uniqBy(this.selected.concat([item]), function(e) {
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
      return eval(this.field);
    }
  }


  /**
   * very simple highlight filter.
   */
  highlight.$inject = ['$sce'];

  function highlight($sce) {
    return function(text, phrase) {
      if (phrase & text) {
        text = text.replace(new RegExp('(' + phrase + ')', 'gi'),
          '<span class="highlighted">$1</span>');
      }
      return $sce.trustAsHtml(text)
    }
  }

  /**
   * Adds support for adding new elements to the list of options.
   */
  function setupAddListener(element) {
    let input = element.find('input');
    input.keypress(e => {

      if (e.keyCode === 13) {
        e.preventDefault();
        let item = {};
        item[this.options.textField] = this.currentText;
        item[this.options.idField] = `tmp-${this.tmpIdCount}`;
        this.tmpIdCount += 1;
        this.select(item);
        input.blur();
        input.focus();
      }
    });
  }
}());
