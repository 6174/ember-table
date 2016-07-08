import Ember from 'ember';
import StyleBindingsMixin from 'ember-table/mixins/style-bindings';

export default Ember.Component.extend(StyleBindingsMixin, {
  classNames: ['ember-table-header-block', 'ember-table-table-block'],
  classNameBindings: ['className'],
  styleBindings: ['width', 'height'],
  columns: null,
  content: null,
  scrollLeft: null,

  /**
   * scrollLeft
   * @param  {[type]} )            {               this.$().scrollLeft(this.get('scrollLeft'));  } [description]
   * @param  {[type]} 'scrollLeft' [description]
   * @return {[type]}              [description]
   */
  onScrollLeftDidChange: Ember.observer(function() {
    this.$().scrollLeft(this.get('scrollLeft'));
  }, 'scrollLeft'),

  /**
   * columns change
   * @param  {[type]} )                 {               var _this [description]
   * @param  {[type]} 'content,columns' [description]
   * @return {[type]}                   [description]
   */
  onColumnsDidChange: Ember.observer(function() {

    var _this = this;
    Ember.run.schedule('afterRender', function() {
      if ((_this.get('_state') || _this.get('state')) !== 'inDOM') {
        return;
      }
      _this.$().scrollLeft(_this.get('scrollLeft'));
    });
  }, 'columns')
});
