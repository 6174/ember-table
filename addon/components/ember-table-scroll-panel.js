import Ember from 'ember';
import StyleBindingsMixin from 'ember-table/mixins/style-bindings';

export default Ember.Component.extend(
	StyleBindingsMixin, {
  classNames: ['ember-table-scroll-panel'],
  styleBindings: ['width', 'height'],
  width: Ember.computed.alias('tableComponent._tableColumnsWidth'),
  height: Ember.computed.alias('tableComponent._tableContentHeight')
});