import Ember from 'ember';
import RegisterTableComponentMixin from 'ember-table/mixins/register-table-component';
import StyleBindingsMixin from 'ember-table/mixins/style-bindings';
export default Ember.Component.extend(
    StyleBindingsMixin, 
    RegisterTableComponentMixin, {

    classNames: 'ember-table-table-row',
    classNameBindings: ['row.isHovered:ember-table-hover', 'row.isSelected:ember-table-selected', 'row.rowStyle', 'isLastRow:ember-table-last-row'],
    row: Ember.computed.alias('content'),
    columns: Ember.computed.alias('parentView.columns'),
    itemIndex: null,
    
    /**
     * display properties
     * @type {[type]}
     */
    styleBindings: ['width', 'height', 'display', 'top'],
    width: function(){
        return this.get('tableComponent._rowWidth');
    }.property('tableComponent._rowWidth'),
    height: function() {
        return this.get('tableComponent.rowHeight');
    }.property('tableComponent.rowHeight'),
    rowHeightBinding: 'parentView.rowHeight',
    top: Ember.computed(function() {
        return this.get('itemIndex') * this.get('rowHeight');
    }).property('itemIndex', 'rowHeight'),
    display: Ember.computed(function() {
        if (!this.get('content')) {
            return 'none';
        }
    }).property('content'),

    // Use `lastItem` (set manually) instead of the array's built-in `lastObject`
    // to avoid creating a controller for last row on table initialization.  If
    // this TableRow is the last row, then the row controller should have been
    // created and set to `lastItem` in RowArrayController, otherwise `lastItem`
    // is null.
    isLastRow: Ember.computed(function() {
        return this.get('row') === this.get('tableComponent.bodyContent.lastItem');
    }).property('tableComponent.bodyContent.lastItem', 'row'),
    /**
     * mouse handler
     * @return {[type]} [description]
     */
    mouseEnter: function() {
        var row = this.get('row');
        if (row) {
            Ember.set(row, 'isHovered', true);
        }
    },
    mouseLeave: function() {
        var row = this.get('row');
        if (row) {
            Ember.set(row, 'isHovered', false);
        }
    },
    teardownContent: function() {
        var row = this.get('row');
        if (row) {
            Ember.set(row, 'isHovered', false);
        }
    }
});