import Ember from 'ember';
import RegisterTableComponentMixin from 'ember-table/mixins/register-table-component';
export default Ember.Component.extend(RegisterTableComponentMixin, {
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
    attributeBindings: ['style'],
    style: Ember.computed(function() {
        const width = this.get('tableComponent._rowWidth');
        const height = this.get('tableComponent.rowHeight');
        const top = this.get('itemIndex') * height;
        const display = this.get('display');
        return `width: ${width}px; height: ${height}px; top: ${top}px; display: ${display}`;
    }).property("tableComponent._rowWidth", 'tableComponent.rowHeight', 'itemIndex', 'display'),

    /**
     * [display]
     */
    display: Ember.computed(function() {
        if (!this.get('content')) {
            return 'none';
        } else {
            return 'block';
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