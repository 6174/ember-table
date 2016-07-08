import Ember from 'ember';
import RegisterTableComponentMixin from 'ember-table/mixins/register-table-component';
import StyleBindingsMixin from 'ember-table/mixins/style-bindings';
export default Ember.Component.extend(StyleBindingsMixin, RegisterTableComponentMixin, {
    classNames: ['ember-table-table-block', 'lazy-list-container'],
    classNameBindings: ['className'],
    styleBindings: ['width', 'height'],
    columns: null,
    content: null,
    scrollLeft: null,
    scrollTop: null,
    content: null,
    itemViewClass: null,
    rowHeight: null,
    scrollTop: null,
    startIndex: null,
    rowHeight: Ember.computed.alias('tableComponent.rowHeight'),
    height: Ember.computed(function() {
        return this.get('content.length') * this.get('rowHeight');
    }).property('content.length', 'rowHeight'),
    /**
     * [description]
     */
    onScrollLeftDidChange: Ember.observer(function() {
        this.$().scrollLeft(this.get('scrollLeft'));
    }, 'scrollLeft')
});