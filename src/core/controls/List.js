var Scroller = require('./Scroller');
var ListCollection = require('../../data/ListCollection');
var LayoutGroup = require('./LayoutGroup');
var VerticalLayout = require('../layout/VerticalLayout');
var DefaultListItemRenderer = require('./renderer/DefaultListItemRenderer');

/**
 * The basic list
 *
 * @class List
 * @extends GOWN.List
 * @memberof GOWN
 * @constructor
 */
function List(dataProvider, theme) {
    Scroller.call(this, theme);
    this.skinName = this.skinName || List.SKIN_NAME;

    // Determines if items in the list may be selected.
    this._selectable = true;

    // The index of the currently selected item.
    this._selectedIndex = -1;

    // If true multiple items may be selected at a time.
    this._allowMultipleSelection = false;

    // The indices of the currently selected items.
    this._selectedIndices = [];

    this._itemChangeHandler = this.itemChangeHandler.bind(this);

    // create new instance of the item renderer
    this.itemRendererFactory = this._itemRendererFactory;

    // The collection of data displayed by the list.
    this.dataProvider = dataProvider;

    /**
     * properties that will be passed down to every item
     * renderer when the list validates.
     */
    this.itemRendererProperties = {};

    // TODO: itemRendererStyleName (?)

    // initialize
    if (!this.viewPort) {

        // We do not implement ListDataViewPort from feathers
        // (most of what that it does is implemented in List directly to
        //  manage the viewport)
        // and instead use the normal LayoutGroup (less abstraction, less code)
        this.viewPort = new LayoutGroup();
    }

    var layout = this._layout;

    if (!layout) {
        layout = new VerticalLayout();
        layout.padding = 0;
        layout.gap = 0;
        layout.horizontalAlign = VerticalLayout.HORIZONTAL_ALIGN_JUSTIFY;
        layout.verticalAlign = VerticalLayout.VERTICAL_ALIGN_TOP;
    }
    // use setter to set layout of the viewport
    this.layout = layout;
}

List.prototype = Object.create( Scroller.prototype );
List.prototype.constructor = List;
module.exports = List;

// name of skin that will be applied
List.SKIN_NAME = 'list';

/**
 * A function called that is expected to return a new item renderer
 */
List.prototype._itemRendererFactory = function(theme) {
    return new DefaultListItemRenderer(theme);
};

List.prototype.itemChangeHandler = function() {
    // deselect removed items
    var index = this._dataProvider.data.length;
    if (this._selectedIndex >= index) {
        this._selectedIndex = -1;
    }
    var indexCount = this._selectedIndices.length;
    for (var i = 0; i < indexCount; i++) {
        var currentIndex = this._selectedIndices[i];
        if (currentIndex >= index) {
            this._selectedIndices.splice(i, 1);
        }
    }
    // force redraw
    this.dataInvalid = true;
};


// performance increase to avoid using call.. (10x faster)
List.prototype.scrollerRedraw = Scroller.prototype.redraw;
/**
 * update before draw call
 *
 * @method redraw
 */
List.prototype.redraw = function() {
    var basicsInvalid = this.dataInvalid;
    if (basicsInvalid) {
        this.refreshRenderers();
    }
    this.scrollerRedraw();
};

List.prototype.refreshRenderers = function () {
    //TODO: update only new renderer
    //      see ListDataViewPort --> refreshInactieRenderers
    if (this.dataProvider && this.viewPort) {
        for (var i = 0; i < this.dataProvider.length; i++) {
            var item = this.dataProvider.getItemAt(i);
            var itemRenderer = this.itemRendererFactory(this.theme);
            itemRenderer.width = 100;
            itemRenderer.percentHeight = 100;
            itemRenderer.data = item;

            this.viewPort.addChild(itemRenderer);
        }
    }

    this.dataInvalid = false;
};

/**
 * set layout and ass eventlistener to it
 *
 * @property layout
 * @type LayoutAlignment
 */
Object.defineProperty(List.prototype, 'layout', {
    set: function(layout) {
        if (this._layout === layout) {
            return;
        }
        if (this.viewPort) {
            // this is different from feathers - there the viewport does not
            // know the layout (feathers uses ListDataViewPort, not LayoutGroup
            // as viewPort for List)
            this.viewPort.layout = layout;
        }
        // TODO: this.invalidate(INVALIDATION_FLAG_LAYOUT);
    },
    get: function() {
        return this._layout;
    }
});


/**
 * dataProvider for list
 * the dataProvider is a sturcture thats provides the data.
 * in its simplest form it is a array containing the data
 *
 * @property dataProvider
 * @type Array
 */
Object.defineProperty(List.prototype, 'dataProvider', {
    set: function(dataProvider) {
        if (this._dataProvider === dataProvider) {
            return;
        }
        if (!(dataProvider instanceof ListCollection || dataProvider === null)) {
            throw new Error('the dataProvider has to be a GOWN.ListCollection');
        }

        if (this._dataProvider) {
            this._dataProvider.off(ListCollection.CHANGED, this._itemChangeHandler);
            //TODO: other data handler (?)
        }
        this._dataProvider = dataProvider;

        //reset the scroll position because this is a drastic change and
        //the data is probably completely different
        this.horizontalScrollPosition = 0;
        this.verticalScrollPosition = 0;

        if (this._dataProvider) {
            this._dataProvider.on(ListCollection.CHANGED, this._itemChangeHandler);
            //TODO: other data handler (?)
        }

        this.selectedIndex = -1;
        this.dataInvalid = true;
    },
    get: function() {
        return this._dataProvider;
    }
});





/**
 * The width of the shape, setting this will redraw the component.
 * (set redraw)
 *
 * @property width
 * @type Number
 */
Object.defineProperty(List.prototype, 'width', {
    get: function() {
        return this._width;
    },
    set: function(width) {
        if (this.viewPort) {
            this.viewPort.width = width;
        }
        this._width = width;
        //originalWidth.set.call(this, width);
    }
});

//var originalHeight = Object.getOwnPropertyDescriptor(PIXI.DisplayObjectContainer.prototype, 'height');

/**
 * The height of the shape, setting this will redraw the component.
 * (set redraw)
 *
 * @property height
 * @type Number
 */
Object.defineProperty(List.prototype, 'height', {
    get: function() {
        return this._height;
    },
    set: function(height) {
        if (this.viewPort) {
            this.viewPort.height = height;
        }
        //originalHeight.set.call(this, height);
        this._height = height;
    }
});
