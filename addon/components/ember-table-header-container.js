import Ember from 'ember';
import StyleBindingsMixin from 'ember-table/mixins/style-bindings';
import ShowHorizontalScrollMixin from 'ember-table/mixins/show-horizontal-scroll';
export default Ember.Component.extend(
	StyleBindingsMixin, ShowHorizontalScrollMixin, {
    classNames: ['ember-table-table-container', 
    			 'ember-table-fixed-table-container', 
    			 'ember-table-header-container'],
    styleBindings: ['width', 'height'],
    height: Ember.computed.alias('tableComponent._headerHeight'),
    width: Ember.computed.alias('tableComponent._tableContainerWidth')
});