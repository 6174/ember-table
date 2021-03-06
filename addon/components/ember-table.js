import Ember from 'ember';
import StyleBindingsMixin from 'ember-table/mixins/style-bindings';
import ResizeHandlerMixin from 'ember-table/mixins/resize-handler';
import ColumnDefinition from 'ember-table/models/column-definition';
import Row from 'ember-table/controllers/row';
const keys = Object.keys;
const {
    get,
    set,
    getWithDefault,
    setProperties,
    getProperties,
    computed,
    observer,
    isNone,
    A,
    on,
    defineProperty,
    compare,
    typeOf,
    run,
    Component,
    assert,
    String: S,
    Object: O
} = Ember;
/**
 * Default filter-function used in the filter by columns
 *
 * @param {string} cellValue value in the table cell
 * @param {string} filterString needed substring
 * @returns {boolean}
 */
function defaultFilter(cellValue, filterString) {
    return -1 !== cellValue.indexOf(filterString);
}

const createContentPlaceholder = function() {
    return {
            __rowHolder: true
    }
};

export default Ember.Component.extend(StyleBindingsMixin, ResizeHandlerMixin, {
    /**
     * =====================================================================
     *
     *                      Component Attributes
     * 
     * =====================================================================
     */
    /**
     * column definition
     */
    columns: [],
    /**
     * table data
     */
    content: [],
    /**
     * The number of fixed columns on the left side of the table.  
     */
    numFixedColumns: 0,
    /**
     * The number of fixed columns on the right side of the table.  
     */
    numRightFixedColumns: 0,
    /**
     * content filter
     */
    filterString: '',
    /**
     * The row height in pixels. 
     */
    rowHeight: 30,
    /**
     * The minimum header height in pixels. Headers will grow in height if given
     * more content than they can display.
     */
    minHeaderHeight: 30,
    /**
     * [hasHeader description]
     * @type {Boolean}
     */
    hasHeader: true,
    /**
     * Enables or disables the footer block.
     */
    hasFooter: true,

    /**
     * [filteringIgnoreCase description]
     * @type {Boolean}
     */
    filteringIgnoreCase: true,

    /**
     * pageSize
     */
    pageSize: 20,
    /**
     * [showIndexNumber description]
     * @type {Boolean}
     */
    showIndexNumber: false,
    /**
     * [indexNumberBase description]
     * @type {Number}
     */
    indexNumberBase: 1,
    /**
     * [currentPageNumber description]
     * @type {Number}
     */
    currentPageNumber: 1,
    /**
     * [sortProperties description]
     * @type {[type]}
     */
    sortProperties: A(['__index']),

    /**
     * =====================================================================
     *
     *                     Component Confs And LifeCycle Methods
     * 
     * =====================================================================
     */

    classNames: ['ember-table-tables-container'],
    styleBindings: ['height'],
    isEmberTable: true,
    columnsFillTable: true,

    /**
     * component initialization setup
     */
    setup: on('init', function() {
        this._super();

        /**
         * jquery ui check
         */
        if (!Ember.$.ui) {
            throw 'Missing dependency: jquery-ui';
        }
        if (!Ember.$().mousewheel) {
            throw 'Missing dependency: jquery-mousewheel';
        }
        if (!Ember.$().antiscroll) {
            throw 'Missing dependency: antiscroll.js';
        }

        /**
         * initial scroll
         */
        this.set('_tableScrollTop', 0);
    }),

    /**
     * [didInsertElement description]
     * @return {[type]} [description]
     */
    didInsertElement: function() {
        this._super();
        this.elementSizeDidChange();
        Ember.run.later(() => {
            this.doForceFillColumns();
        }, 10);
    },

    /**
     * [willDestroyElement description]
     * @return {[type]} [description]
     */
    willDestroyElement: function() {
        var antiscrollElements = this.$('.antiscroll-wrap');
        var antiscroll;
        antiscrollElements.each(function(i, antiscrollElement) {
            antiscroll = Ember.$(antiscrollElement).data('antiscroll');
            if (antiscroll) {
                antiscroll.destroy();
                Ember.$(antiscrollElement).removeData('antiscroll');
            }
        });
        this._super();
    },

    /**
     * =====================================================================
     *
     *                     Content Preprocess
     * 
     * =====================================================================
     */
    /**
     * inner columns definition
     */
    processedColumns: Ember.computed(function() {
        const columns = this.get('columns');
        return columns.map((col) => {
            col.headerCellName = col.title;
            col.contentPath = col.propertyName;
            col.getCellContent = (row) => {
                return Ember.get(row, col.propertyName);
            }
            const ret = ColumnDefinition.create(col);
            return ret;
        });
    }).property('columns.[]'),

    /**
     * [description]
     * @param  {[type]} ) {               } [description]
     * @return {[type]}   [description]
     */
    filteredContent: computed('filterString', 'content.[]', 'processedColumns', function() {
        const {
            processedColumns,
            content,
            filteringIgnoreCase
        } = getProperties(this, 'processedColumns', 'content', 'filteringIgnoreCase');

        let filterString = get(this, 'filterString');

        if (!content) {
            return A([]);
        }

        /**
         * add index number for content
         * @type {[type]}
         */
        const indexNumberBase = this.get('indexNumberBase') || 0;
        const showIndexNumber = this.get('showIndexNumber');
        content.forEach((it, index) => {
            set(it, '__index', index + indexNumberBase);
        });

        /**
         * filter every rows and columns
         */
        const filteredContent = content.filter(function(row) {
            return processedColumns.length ? processedColumns.any(c => {
                const propertyName = get(c, 'propertyName');
                if (propertyName) {
                    let cellValue = '' + get(row, propertyName);
                    if (filteringIgnoreCase) {
                        cellValue = cellValue.toLowerCase();
                        filterString = filterString.toLowerCase();
                    }
                    return -1 !== cellValue.indexOf(filterString);
                }
                return false;
            }) : true;
        });

        return A(filteredContent);
    }),

    /**
     * content pagination 
     */
    visibleContent: computed('filteredContent.[]', 'pageSize', 'currentPageNumber', function() {
        const {
            filteredContent,
            pageSize,
            currentPageNumber
        } = getProperties(this, 'filteredContent', 'pageSize', 'currentPageNumber');

        const startIndex = pageSize * (currentPageNumber - 1);

        if (get(filteredContent, 'length') < pageSize) {
            return filteredContent;
        }
        return A(filteredContent.slice(startIndex, startIndex + pageSize));
    }),

    /**
     * An array of Ember.Table.Row computed based on `content`
     */
    bodyContent: computed('visibleContent.[]', function() {
        const {
            pageSize,
            visibleContent
        } = getProperties(this, 'visibleContent', 'pageSize');

        let newContent = visibleContent.copy();
        let counter = visibleContent.length;
        while (counter < pageSize) {
            newContent.pushObject(createContentPlaceholder());
            counter ++;
        }
        return A(newContent.map((it) => {
            return {...it,
                target: this,
                parentController: this,
                container: this.get('container'),
                itemController: Row
            }
        }));
    }),

    /**
     * fixed columns on the left
     */
    fixedColumns: Ember.computed(function() {
        var columns = this.get('processedColumns');
        if (!columns) {
            return Ember.A();
        }
        var numFixedColumns = this.get('numFixedColumns') || 0;
        return columns.slice(0, numFixedColumns) || [];
    }).property('processedColumns.[]', 'numFixedColumns'),

    /** 
     * fixed columns on the right
     */
    rightFixedColumns: Ember.computed(function() {
        var columns = this.get('processedColumns');
        if (!columns) {
            return Ember.A();
        }
        var numRightFixedColumns = this.get('numRightFixedColumns') || 0;
        return columns.slice(columns.length - numRightFixedColumns, columns.length) || [];
    }).property('processedColumns.[]', 'numRightFixedColumns'),

    /**
     * main columns of the table
     */
    tableColumns: Ember.computed(function() {
        var columns = this.get('processedColumns');
        if (!columns) {
            return Ember.A();
        }
        const numFixedColumns = this.get('numFixedColumns') || 0;
        const numRightFixedColumns = this.get('numRightFixedColumns') || 0;
        return columns.slice(numFixedColumns, columns.get('length') - numRightFixedColumns) || [];
    }).property('processedColumns.[]', 'numFixedColumns', 'numRightFixedColumns'),

    /**
     * =====================================================================
     *
     *                      Content Filtering 
     * 
     * =====================================================================
     */

    /**
     * True if all processedColumns are hidden by <code>isHidden</code>
     *
     * @type {boolean}
     * @name ModelsTable#allColumnsAreHidden
     */
    allColumnsAreHidden: computed('processedColumns.@each.isHidden', function() {
        const processedColumns = get(this, 'processedColumns');
        return processedColumns.length > 0 && processedColumns.isEvery('isHidden', true);
    }),
 
    /**
     * =====================================================================
     *
     *                      Table Layout And Resize 
     * 
     * =====================================================================
     */
    /**
     * [onResizeEnd description]
     * @return {[type]} [description]
     */
    onResizeEnd: function() {
        // We need to put this on the run loop, because resize event came from
        // window. Otherwise, we get this warning when used in tests. You have
        // turned on testing mode, which disabled the run-loop's autorun. You
        // will need to wrap any code with asynchronous side-effects in an
        // Ember.run
        if (this.tableWidthNowTooSmall()) {
            this.set('columnsFillTable', true);
        }
        Ember.run(this, this.elementSizeDidChange);
    },
    /**
     * [elementSizeDidChange description]
     * @return {[type]} [description]
     */
    elementSizeDidChange: function() {
        if ((this.get('_state') || this.get('state')) !== 'inDOM') {
            return;
        }
        this.set('_width', this.$().parent().width());
        this.set('_height', this.$().parent().height());
        // we need to wait for the table to be fully rendered before antiscroll can
        // be used
        Ember.run.next(this, this.updateLayout);
    },
    /**
     * [tableWidthNowTooSmall description]
     * @return {[type]} [description]
     */
    tableWidthNowTooSmall: function() {
        if ((this.get('_state') || this.get('state')) !== 'inDOM') {
            return false;
        }
        var oldTableWidth = this.get('_width');
        var newTableWidth = this.$().parent().width();
        // TODO(azirbel): This should be 'columns', I believe. Fix separately.
        var totalColumnWidth = this._getTotalWidth(this.get('tableColumns'));
        return (oldTableWidth > totalColumnWidth) && (newTableWidth < totalColumnWidth);
    },
    /**
     * [updateLayout description]
     * @return {[type]} [description]
     */
    updateLayout: function() {
        if ((this.get('_state') || this.get('state')) !== 'inDOM') {
            return;
        }
        // updating antiscroll
        this.$('.antiscroll-wrap').antiscroll().data('antiscroll').rebuild();
        if (this.get('columnsFillTable')) {
            this.doForceFillColumns();
        }
    },
    /**
     * Resizes a column, and returns whether or not the column is now at it's
     * minimum or maximum.
     *
     * @private
     * @param {ColumnDefinition} column The column to be resized
     * @param {number} totalResizableWidth The total width of the table that
     *   can be resized
     * @param {number} availableWidth The total width available in the table
     * @returns {boolean}
     */
    _resizeColumn: function(column, totalResizableWidth, availableWidth) {
        var newWidth = Math.floor(column.get('width') * (availableWidth / totalResizableWidth));
        var minWidth = column.get('minWidth');
        var maxWidth = column.get('maxWidth');
        if (newWidth < minWidth) {
            column.set('width', minWidth);
            return true;
        } else if (newWidth > maxWidth) {
            column.set('width', maxWidth);
            return true;
        } else {
            column.set('width', newWidth);
            return false;
        }
    },

    /**
     * Iteratively adjusts column widths to adjust to a changed table width.
     * Attempts to scale columns proportionally. However, if a column hits a min
     * or max width after scaling proportionally, we need to respect that setting.
     * In that case, keep iterating until all column widths are set to the best
     * they can be. Note that this may fail to arrive at the table width if the
     * resizable columns are all restricted by min/max widths.
     */
    doForceFillColumns: function() {
        var allColumns = this.get('processedColumns');
        var columnsToResize = allColumns.filterBy('canAutoResize');
        var unresizableColumns = allColumns.filterBy('canAutoResize', false);
        var availableWidth = this.get('_width') - this._getTotalWidth(unresizableColumns);
        var continueResizingColumns = true;
        while (continueResizingColumns) {
            var totalResizableWidth = this._getTotalWidth(columnsToResize);
            var nextColumnsToResize = [];
            continueResizingColumns = false;
            for (var i = 0; i < columnsToResize.get('length'); ++i) {
                var column = columnsToResize[i];
                var isColumnAtExtremum = this._resizeColumn(column, totalResizableWidth, availableWidth);
                if (isColumnAtExtremum) {
                    continueResizingColumns = true;
                    availableWidth -= column.get('width');
                } else {
                    nextColumnsToResize.pushObject(column);
                }
            }
            columnsToResize = nextColumnsToResize;
        }
    },
    /** 
     * onBodyContentLengthDidChange
     */
    onBodyContentLengthDidChange: Ember.observer(function() {
        Ember.run.next(this, function() {
            Ember.run.once(this, this.updateLayout);
        });
    }, 'bodyContent.length'),
    
    /**
     * =====================================================================
     *
     *                      Component Scroll And Size 
     * 
     * =====================================================================
     */
    
    /**
     * table scroll
     */
    _tableScrollTop: 0,
    _tableScrollLeft: 0,
    _hasVerticalScrollbar: Ember.computed(function() {
        var height = this.get('_height');
        var contentHeight = this.get('_tableContentHeight') + this.get('_headerHeight') + this.get('_footerHeight');
        return height < contentHeight;
    }).property('_height', '_tableContentHeight', '_headerHeight', '_footerHeight'),
    _hasHorizontalScrollbar: Ember.computed(function() {
        var contentWidth = this.get('_tableColumnsWidth');
        var tableWidth = this.get('_width') - this.get('_fixedColumnsWidth');
        return contentWidth > tableWidth;
    }).property('_tableColumnsWidth', '_width', '_fixedColumnsWidth'),

    /**
     * visible items count
     */
    _numItemsShowing: Ember.computed(function() {
        return Math.floor(this.get('_bodyHeight') / this.get('rowHeight'));
    }).property('_bodyHeight', 'rowHeight'),

    _startIndex: Ember.computed(function() {
        var numContent = this.get('bodyContent.length');
        var numViews = this.get('_numItemsShowing');
        var rowHeight = this.get('rowHeight');
        var scrollTop = this.get('_tableScrollTop');
        var index = Math.floor(scrollTop / rowHeight);
        if (index + numViews >= numContent) {
            index = numContent - numViews;
        }
        return Math.max(index, 0);
    }).property('bodyContent.length', '_numItemsShowing', 'rowHeight', '_tableScrollTop'),

    /**
     * table width
     */
    _width: null,

    _fixedLeftBlockWidthBinding: '_fixedLeftColumnsWidth',

    _fixedRightBlockWidthBinding: '_fixedRightColumnsWidth',

    _fixedLeftColumnsWidth: Ember.computed(function() {
        return this._getTotalWidth(this.get('fixedColumns'));
    }).property('fixedColumns.@each.width'),

    _fixedRightColumnsWidth: Ember.computed(function() {
        return this._getTotalWidth(this.get('rightFixedColumns'));
    }).property('rightFixedColumns.@each.width'),

    _fixedColumnsWidth: Ember.computed(function() {
        return this.get('_fixedLeftColumnsWidth') + this.get('_fixedRightColumnsWidth');
    }).property('_fixedLeftColumnsWidth', '_fixedRightColumnsWidth'),

    // Hack: We add 3px padding to the right of the table content so that we can
    // reorder into the last column.
    _tableColumnsWidth: Ember.computed(function() {
        var contentWidth = this._getTotalWidth(this.get('tableColumns')) + 3;
        var availableWidth = this.get('_width') - this.get('_fixedColumnsWidth');
        return Math.max(contentWidth, availableWidth);
    }).property('tableColumns.@each.width', '_width', '_fixedColumnsWidth'),

    _rowWidth: Ember.computed(function() {
        var columnsWidth = this.get('_tableColumnsWidth');
        var nonFixedTableWidth = this.get('_tableContainerWidth') - this.get('_fixedColumnsWidth');
        return Math.max(columnsWidth, nonFixedTableWidth);
    }).property('_fixedColumnsWidth', '_tableColumnsWidth', '_tableContainerWidth'),

    _tableBlockWidth: Ember.computed(function() {
        return this.get('_width') - this.get('_fixedColumnsWidth');
    }).property('_width', '_fixedColumnsWidth'),

    _tableContainerWidth: Ember.computed(function() {
        return this.get('_width');
    }).property('_width'),

    _scrollContainerWidth: Ember.computed(function() {
        return this.get('_width') - this.get('_fixedColumnsWidth');
    }).property('_width', '_fixedColumnsWidth'),

    _getTotalWidth: function(columns, columnWidthPath) {
        if (columnWidthPath == null) {
            columnWidthPath = 'width';
        }
        if (!columns) {
            return 0;
        }
        var widths = columns.getEach(columnWidthPath) || [];
        return widths.reduce((function(total, w) {
            return total + w;
        }), 0);
    },

    /**
     * table height
     */
    height: Ember.computed.alias('_tablesContainerHeight'),
    _height: null,
    _contentHeaderHeight: null,
    _tablesContainerHeight: Ember.computed(function() {
        var height = this.get('_height');
        var contentHeight = this.get('_tableContentHeight') + this.get('_headerHeight') + this.get('_footerHeight');
        if (!contentHeight) {
            return height;
        }
        return Math.min(contentHeight, height);
    }).property('_height', '_tableContentHeight', '_headerHeight', '_footerHeight'),

    _headerHeight: Ember.computed(function() {
        var minHeight = this.get('minHeaderHeight');
        var contentHeaderHeight = this.get('_contentHeaderHeight');
        return Math.max(contentHeaderHeight, minHeight);
    }).property('_contentHeaderHeight', 'minHeaderHeight'),

    _footerHeight: Ember.computed(function() {
        return this.get('hasFooter') ? this.get('footerHeight') : 0;
    }).property('footerHeight', 'hasFooter'),

    _bodyHeight: Ember.computed(function() {
        var bodyHeight = this.get('_tablesContainerHeight');
        if (this.get('hasHeader')) {
            bodyHeight -= this.get('_headerHeight');
        }
        if (this.get('hasFooter')) {
            bodyHeight -= this.get('footerHeight');
        }
        return bodyHeight;
    }).property('_tablesContainerHeight', '_hasHorizontalScrollbar', '_headerHeight', 'footerHeight', 'hasHeader', 'hasFooter'),

    _tableContentHeight: Ember.computed(function() {
        return this.get('rowHeight') * this.get('bodyContent.length');
    }).property('rowHeight', 'bodyContent.length'),

    /**
     * =====================================================================
     *
     *                      Table Content Selection
     * 
     * =====================================================================
     */
    // lastSelected: null,
    // isSelected: function(row) {
    //     switch (this.get('selectionMode')) {
    //         case 'none':
    //             return false;
    //         case 'single':
    //             return this.get('selection') === row.get('content');
    //         case 'multiple':
    //             return this.get('selection').contains(row.get('content'));
    //     }
    // },
    // setSelected: function(row, val) {
    //     this.persistSelection();
    //     var item = row.get('content');
    //     if (val) {
    //         return this.get('persistedSelection').addObject(item);
    //     } else {
    //         return this.get('persistedSelection').removeObject(item);
    //     }
    // },
    // // items that were selected directly or as part of a previous
    // // range selection (shift-click)
    // persistedSelection: Ember.computed(function() {
    //     return Ember.A();
    // }),
    // // items that are part of the currently editable range selection
    // rangeSelection: Ember.computed(function() {
    //     return Ember.A();
    // }),
    // // TODO: Handle click event in the row view
    // click: function(event) {
    //     var row = this.getRowForEvent(event);
    //     if (!row || !row.get('content')) {
    //         return;
    //     }
    //     var item = row.get('content');
    //     switch (this.get('selectionMode')) {
    //         case 'none':
    //             break;
    //         case 'single':
    //             this.get('persistedSelection').clear();
    //             this.get('persistedSelection').addObject(item);
    //             break;
    //         case 'multiple':
    //             if (event.shiftKey) {
    //                 this.get('rangeSelection').clear();
    //                 var lastIndex = this.rowIndex(this.get('lastSelected'));
    //                 // If the last selected row is no longer in the table, use the
    //                 // first row in the table
    //                 if (lastIndex === -1) {
    //                     lastIndex = 0;
    //                 }
    //                 var curIndex = this.rowIndex(this.getRowForEvent(event));
    //                 var minIndex = Math.min(lastIndex, curIndex);
    //                 var maxIndex = Math.max(lastIndex, curIndex);
    //                 this.get('rangeSelection').addObjects(this.get('bodyContent').slice(minIndex, maxIndex + 1).mapBy('content'));
    //             } else {
    //                 if (!event.ctrlKey && !event.metaKey) {
    //                     this.get('persistedSelection').clear();
    //                     this.get('rangeSelection').clear();
    //                 } else {
    //                     this.persistSelection();
    //                 }
    //                 if (this.get('persistedSelection').contains(item)) {
    //                     this.get('persistedSelection').removeObject(item);
    //                 } else {
    //                     this.get('persistedSelection').addObject(item);
    //                 }
    //                 this.set('lastSelected', row);
    //             }
    //             break;
    //     }
    // },
    // findRow: function(content) {
    //     // TODO(azirbel): Replace with filter
    //     this.get('bodyContent').forEach(function(row) {
    //         if (row.get('content') === content) {
    //             return row;
    //         }
    //     });
    //     return null;
    // },
    // rowIndex: function(row) {
    //     if (!this.get('bodyContent')) {
    //         return null;
    //     }
    //     return this.get('bodyContent').indexOf(row);
    // },
    // persistSelection: function() {
    //     this.get('persistedSelection').addObjects(this.get('rangeSelection'));
    //     this.get('rangeSelection').clear();
    // },
    // getRowForEvent: function(event) {
    //     var $rowView = Ember.$(event.target).parents('.ember-table-table-row');
    //     var view = Ember.View.views[$rowView.attr('id')];
    //     if (view) {
    //         return view.get('row');
    //     }
    //     return null;
    // },
    // selection: Ember.computed(function(key, val) {
    //     var selectionMode = this.get('selectionMode');
    //     if (arguments.length > 1 && val) {
    //         this.get('persistedSelection').clear();
    //         this.get('rangeSelection').clear();
    //         switch (selectionMode) {
    //             case 'single':
    //                 this.get('persistedSelection').addObject(val);
    //                 break;
    //             case 'multiple':
    //                 this.get('persistedSelection').addObjects(val);
    //         }
    //     }
    //     var selection = this.get('persistedSelection').copy().addObjects(this.get('rangeSelection'));
    //     switch (selectionMode) {
    //         case 'none':
    //             return null;
    //         case 'single':
    //             return selection[0] || null;
    //         case 'multiple':
    //             return selection;
    //     }
    // }).property('persistedSelection.[]', 'rangeSelection.[]', 'selectionMode'),
    actions: {
        addColumn: Ember.K,
        sortByColumn: Ember.K
    }
});