import Ember from 'ember';
import StyleBindingsMixin from 'ember-table/mixins/style-bindings';
export default Ember.Component.extend(StyleBindingsMixin, {
    // ---------------------------------------------------------------------------
    // API - Inputs
    // ---------------------------------------------------------------------------
    // TODO: Doc
    classNames: ['ember-table-cell'],
    classNameBindings: 'column.textAlign',
    styleBindings: ['width'],
    // ---------------------------------------------------------------------------
    // Internal properties
    // ---------------------------------------------------------------------------
    init: function() {
        this._super();
        this.contentPathDidChange();
        this.contentDidChange();
    },
    row: Ember.computed.alias('parentView.row'),
    record: Ember.computed.alias('row'),
    // It's really weird if use  alias, nothing will renderd and 
    // no warning nor errors , maybe bug from StyleBinding Mixin
    width: Ember.computed(function() {
        return this.get('column.width');
    }).property('column.width'),
    contentDidChange: function() {
        this.notifyPropertyChange('cellContent');
    },
    contentPathWillChange: Ember.beforeObserver(function() {
        var contentPath = this.get('column.contentPath');
        if (contentPath) {
            this.removeObserver("row." + contentPath, this, this.contentDidChange);
        }
    }, 'column.contentPath'),
    contentPathDidChange: Ember.beforeObserver(function() {
        var contentPath = this.get('column.contentPath');
        if (contentPath) {
            this.addObserver("row." + contentPath, this, this.contentDidChange);
        }
    }, 'column.contentPath'),
    cellContent: Ember.computed(function(key, value) {
        var row = this.get('row');
        var column = this.get('column');
        if (!row || !column) {
            return;
        }
        if (arguments.length === 1) {
            value = column.getCellContent(row);
        } else {
            column.setCellContent(row, value);
        }
        return value;
    }).property('column'),
    actions: {
        sendAction: function() {
            const table = this.get('tableComponent');
            table.sendAction.apply(table, arguments);
        }
    }
});