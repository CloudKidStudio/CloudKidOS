/**
*  @module cloudkid
*/
(function(undefined) {

	"use strict";
	
	/**
	*  A Multipurpose button class. It is designed to have one image, and an optional text label.
	*  The button can be a normal button or a selectable button.
	*  The button functions similarly with both CreateJS and PIXI, but slightly differently in
	*  initialization and callbacks. Add event listeners for click and mouseover to know about 
	*  button clicks and mouse overs, respectively.
	* 
	*  @class Button (CreateJS)
	*  @extends createjs.Container
	*  @constructor
	*  @param {Object|Image|HTMLCanvasElement} [imageSettings] Information about the art to be used for button states, as well as if the button is selectable or not.
	*         If this is an Image or Canvas element, then the button assumes that the image is full width and 3 images
	*         tall, in the order (top to bottom) up, over, down. If so, then the properties of imageSettings are ignored.
	*  @param {Image|HTMLCanvasElement} [imageSettings.image] The image to use for all of the button states.
	*  @param {Object} [imageSettings.up] The rectangle information about the up state.
	*  @param {createjs.Rectangle} [imageSettings.up.src] The sourceRect for the state within the image.
	*  @param {createjs.Rectangle} [imageSettings.up.trim=null] Trim data about the state, where x & y are how many pixels were 
	*         trimmed off the left and right, and height & width are the untrimmed size of the button.
	*  @param {Object} [imageSettings.over=null] The rectangle information about the over state. If omitted, uses the up state.
	*  @param {createjs.Rectangle} [imageSettings.over.src] The sourceRect for the state within the image.
	*  @param {createjs.Rectangle} [imageSettings.over.trim=null] Trim data about the state, where x & y are how many pixels were 
	*         trimmed off the left and right, and height & width are the untrimmed size of the button.
	*  @param {Object} [imageSettings.down=null] The rectangle information about the down state. If omitted, uses the up state.
	*  @param {createjs.Rectangle} [imageSettings.down.src] The sourceRect for the state within the image.
	*  @param {createjs.Rectangle} [imageSettings.down.trim=null] Trim data about the state, where x & y are how many pixels were 
	*         trimmed off the left and right, and height & width are the untrimmed size of the button.
	*  @param {Object} [imageSettings.disabled=null] The rectangle information about the disabled state. If omitted, uses the up state.
	*  @param {createjs.Rectangle} [imageSettings.disabled.src] The sourceRect for the state within the image.
	*  @param {createjs.Rectangle} [imageSettings.disabled.trim=null] Trim data about the state, where x & y are how many pixels were 
	*         trimmed off the left and right, and height & width are the untrimmed size of the button.
	*  @param {Object} [imageSettings.highlighted=null] The rectangle information about the highlighted state. If omitted, uses the over state.
	*  @param {createjs.Rectangle} [imageSettings.disabled.src] The sourceRect for the state within the image.
	*  @param {createjs.Rectangle} [imageSettings.disabled.trim=null] Trim data about the state, where x & y are how many pixels were 
	*         trimmed off the left and right, and height & width are the untrimmed size of the button.
	*  @param {Object} [imageSettings.selected=null] The rectangle information about the over state. If omitted, the button is not a selectable button.
	*  @param {createjs.Rectangle} [imageSettings.selected.src] The sourceRect for the state within the image.
	*  @param {createjs.Rectangle} [imageSettings.selected.trim=null] Trim data about the state, where x & y are how many pixels were 
	*         trimmed off the left and right, and height & width are the untrimmed size of the button.
	*  @param {Object} [label=null] Information about the text label on the button. Omitting this makes the button not use a label.
	*  @param {String} [label.text] The text to display on the label.
	*  @param {String} [label.font] The font name and size to use on the label, as createjs.Text expects.
	*  @param {String} [label.color] The color of the text to use on the label, as createjs.Text expects.
	*  @param {String} [label.textBaseline=top] The baseline for the label text, as createjs.Text expects.
	*  @param {String} [label.stroke=null] The stroke to use for the label text, if desired, as createjs.Text expects.
	*  @param {Boolean} [enabled=true] Whether or not the button is initially enabled.
	*/
	var Button = function(imageSettings, label, enabled)
	{
		if(!imageSettings) return;
		this.initialize(imageSettings, label, enabled);
	};
	
	// Extend Container
	var p = Button.prototype = new createjs.Container();
	
	var s = createjs.Container.prototype;//super
	
	/**
	*  The sprite that is the body of the button.
	*  The type of this property is dependent on which version of the OS library is used.
	*  @public
	*  @property {createjs.Bitmap} back
	*  @readOnly
	*/
	p.back = null;

	/**
	*  The text field of the button. The label is centered by both width and height on the button.
	*  The type of this property is dependent on which version of the OS library is used.
	*  @public
	*  @property {createjs.Text} label
	*  @readOnly
	*/
	p.label = null;
	
	//===callbacks for mouse/touch events
	/**
	* Callback for mouse over, bound to this button.
	* @private
	* @property {Function} _overCB
	*/
	p._overCB = null;

	/**
	* Callback for mouse out, bound to this button.
	* @private
	* @property {Function} _outCB
	*/
	p._outCB = null;

	/**
	* Callback for mouse down, bound to this button.
	* @private
	* @property {Function} _downCB
	*/
	p._downCB = null;

	/**
	* Callback for mouse up, bound to this button.
	* @private
	* @property {Function} _upCB
	*/
	p._upCB = null;
	
	//===button state variables
	/**
	* If this button is enabled.
	* @private
	* @property {Boolean} _enabled
	*/
	p._enabled = false;

	/**
	* If this button is held down.
	* @private
	* @property {Boolean} _isDown
	*/
	p._isDown = false;

	/**
	* If the mouse is over this button
	* @private
	* @property {Boolean} _isOver
	*/
	p._isOver = false;

	/**
	* If this button is selected.
	* @private
	* @property {Boolean} _isSelected
	*/
	p._isSelected = false;

	/**
	* If this button is a selectable button, and will respond to select being set.
	* @private
	* @property {Boolean} _isSelectable
	*/
	p._isSelectable = false;

	/**
	* If this button is highlighted.
	* @private
	* @property {Boolean} _isHighlighted
	*/
	p._isHighlighted = false;

	
	//===textures for different button states
	/**
	* [CreateJS only] An object noting the rectangles for the button up state. This should have a src property
	*	and an optional trim property, both createjs.Rectangles.
	* @private
	* @property {Object} _upRects
	*/
	p._upRects = null;

	/**
	* [CreateJS only] An object noting the rectangles for the button over state. This should have a src property
	*	and an optional trim property, both createjs.Rectangles.
	* @private
	* @property {Object} _overRects
	*/
	p._overRects = null;

	/**
	* [CreateJS only] An object noting the rectangles for the button down state. This should have a src property
	*	and an optional trim property, both createjs.Rectangles.
	* @private
	* @property {Object} _downRects
	*/
	p._downRects = null;

	/**
	* [CreateJS only] An object noting the rectangles for the button disabled state. This should have a src property
	*	and an optional trim property, both createjs.Rectangles.
	* @private
	* @property {Object} _disabledRects
	*/
	p._disabledRects = null;

	/**
	* [CreateJS only] An object noting the rectangles for the button selected state. This should have a src property
	*	and an optional trim property, both createjs.Rectangles.
	* @private
	* @property {Object} _selectedRects
	*/
	p._selectedRects = null;

	/**
	* [CreateJS only] An object noting the rectangles for the button highlighted state. This should have a src property
	*	and an optional trim property, both createjs.Rectangles.
	* @private
	* @property {Object} _highlightedRects
	*/
	p._highlightedRects = null;

	/**
	* The width of the button art, independent of the scaling of the button itself.
	* @private
	* @property {Number} _width
	*/
	p._width = 0;

	/**
	* The height of the button art, independent of the scaling of the button itself.
	* @private
	* @property {Number} _height
	*/
	p._height = 0;
	
	/** 
	*  [CreateJS only] Constructor for the button when using CreateJS.
	*  @method initialize
	*  @param {Object|Image|HTMLCanvasElement} [imageSettings] See the constructor for more information
	*  {Object} [label=null] Information about the text label on the button. Omitting this makes the button not use a label.
	*  {Boolean} [enabled=true] Whether or not the button is initially enabled.
	*/
	p.initialize = function(imageSettings, label, enabled)
	{
		s.initialize.call(this);

		this.mouseChildren = false;//input events should have this button as a target, not the child Bitmap.
		
		this._downCB = this._onMouseDown.bind(this);
		this._upCB = this._onMouseUp.bind(this);
		this._overCB = this._onMouseOver.bind(this);
		this._outCB = this._onMouseOut.bind(this);
		
		var image, width, height;
		if(imageSettings.image)//is a settings object with rectangles
		{
			image = imageSettings.image;
			//each rects object has a src property (createjs.Rectangle), and optionally a trim rectangle
			this._upRects = imageSettings.up;
			if(this._upRects.trim)//if the texture is trimmed, use that for the sizing
			{
				this.upTrim = this._upRects.trim;
				width = this.upTrim.width;
				height = this.upTrim.height;
			}
			else//texture is not trimmed and is full size
			{
				width = this.upRect.src.width;
				height = this.upRect.src.height;
			}
			this._overRects = imageSettings.over || this._upRects;
			this._downRects = imageSettings.down || this._upRects;
			this._disabledRects = imageSettings.disabled || this._upRects;
			this._highlightedRects = imageSettings.highlighted || this._overRects;
			if(imageSettings.selected)
			{
				this._selectedRects = imageSettings.selected;
				this._isSelectable = true;
			}
		}
		else//imageSettings is just an image to use directly - use the old stacked images method
		{
			image = imageSettings;
			width = image.width;
			height = image.height / 3;
			this._upRects = {src:new createjs.Rectangle(0, 0, width, height)};
			this._highlightedRects = this._overRects = {src:new createjs.Rectangle(0, height, width, height)};
			this._downRects = {src:new createjs.Rectangle(0, height * 2, width, height)};
			this._disabledRects = this._upRects;
		}
		
		this.back = new createjs.Bitmap(image);
		this.addChild(this.back);
		this._width = width;
		this._height = height;
		
		if(label)
		{
			this.label = new createjs.Text(label.text, label.font, label.color);
			if(label.textBaseline)
				this.label.textBaseline = label.textBaseline;
			this.label.stroke = label.stroke;
			this.addChild(this.label);
			this.label.x = (width - this.label.getMeasuredWidth()) * 0.5;
			var h = this.label.getMeasuredLineHeight();
			this.label.y = (height - h) * 0.5;
		}
		
		this.enabled = enabled === undefined ? true : !!enabled;
	};
	
	/**
	*  The width of the button, based on the width of back. This value is affected by scale.
	*  @property {Number} width
	*/
	Object.defineProperty(p, "width", {
		get:function(){return this._width * this.scaleX;},
		set:function(value){
			this.scaleX = value / this._width;
		}
	});

	/**
	*  The height of the button, based on the height of back. This value is affected by scale.
	*  @property {Number} height
	*/
	Object.defineProperty(p, "height", {
		get:function(){return this._height * this.scaleY;},
		set:function(value){
			this.scaleY = value / this._height;
		}
	});
	
	/**
	*  Sets the text of the label. This does nothing if the button was not initialized with a label.
	*  @public
	*  @method setText
	*  @param {String} text The text to set the label to.
	*/
	p.setText = function(text)
	{
		if(this.label)
		{
			this.label.text = text;
			this.label.x = (width - this.label.getMeasuredWidth()) * 0.5;
			var h = this.label.getMeasuredLineHeight();
			this.label.y = (height - h) * 0.5;
		}
	};
	
	/**
	*  Whether or not the button is enabled.
	*  @property {Boolean} enabled
	*  @default true
	*/
	Object.defineProperty(p, "enabled", {
		get: function() { return this._enabled; },
		set: function(value)
		{
			this._enabled = value;
			
			if(this._enabled)
			{
				this.cursor = 'pointer';
				this.addEventListener('mousedown', this._downCB);
				this.addEventListener('mouseover', this._overCB);
				this.addEventListener('mouseout', this._outCB);
			}
			else
			{
				this.cursor = null;
				this.removeEventListener('mousedown', this._downCB);
				this.removeEventListener('mouseover', this._overCB);
				this.removeEventListener('mouseout', this._outCB);
				this._isDown = this._isOver = false;
			}
			
			this._updateState();
		}
	});
	
	/**
	*  Whether or not the button is selected. Setting this only works if the button was given selected state when initialized.
	*  @property {Boolean} selected
	*  @default false
	*/
	Object.defineProperty(p, "selected", {
		get: function() { return this._isSelected; },
		set: function(value)
		{
			if(this._isSelectable)
			{
				this._isSelected = value;
				this._updateState();
			}
		}
	});
	
	/**
	*  Whether or not the button is highlighted. The default highlighted state is the over state, but a specific texture can be supplied.
	*  @property {Boolean} highlighted
	*  @default false
	*/
	Object.defineProperty(p, "highlighted", {
		get: function() { return this._isHighlighted; },
		set: function(value)
		{
			this._isHighlighted = value;
			this._updateState();
		}
	});
	
	/**
	*  Updates back based on the current button state.
	*  @private
	*  @method _updateState
	*/
	p._updateState = function()
	{
		if(!this.back) return;
		var data;
		if(this._isHighlighted)
			data = this._highlightedRects;
		else if(!this._enabled)
			data = this._disabledRects;
		else if(this._isDown)
			data = this._downRects;
		else if(this._isOver)
			data = this._overRects;
		else if(this._isSelected)
			data = this._selectedRects;
		else
			data = this._upRects;
		this.back.sourceRect = data.src;
		if(data.trim)
		{
			this.back.x = data.trim.x;
			this.back.y = data.trim.y;
		}
		else
		{
			this.back.x = this.back.y = 0;
		}
	};
	
	/**
	*  [CreateJS only] The callback for when the button receives a mouse down event.
	*  @private
	*  @method _onMouseDown
	*/
	p._onMouseDown = function(e)
	{
		this.addEventListener('pressup', this._upCB);
		this._isDown = true;
		this._updateState();
	};
	
	/**
	*  The callback for when the button for when the mouse/touch is released on the button
	*  - only when the button was held down initially.
	*  @private
	*  @method _onMouseUp
	*/
	p._onMouseUp = function(e)
	{
		this.removeEventListener('pressup', this._upCB);
		this._isDown = false;
		this._updateState();
	};
	
	/**
	*  [CreateJS only] The callback for when the button is moused over.
	*  @private
	*  @method _onMouseOver
	*/
	p._onMouseOver = function(e)
	{
		this._isOver = true;
		this._updateState();
	};
	
	/**
	*  [CreateJS only] The callback for when the mouse leaves the button area.
	*  @private
	*  @method _onMouseOut
	*/
	p._onMouseOut = function(e)
	{
		this._isOver = false;
		this._updateState();
	};
	
	/**
	*  Destroys the button.
	*  @public
	*  @method destroy
	*/
	p.destroy = function()
	{
		this.removeAllChildren();
		this.removeAllEventListeners();
		this._upRects = null;
		this._overRects = null;
		this._downRects = null;
		this._disabledRects = null;
		this._selectedRects = null;
		this._highlightedRects = null;
		this._downCB = null;
		this._upCB = null;
		this._overCB = null;
		this._outCB = null;
		this.back = null;
		this.label = null;
	};

	/**
	*  Generates a desaturated up state as a disabled state, and an update with a solid colored glow for a highlighted state.
	*  @method generateDefaultStates
	*  @static
	*  @param {Image|HTMLCanvasElement} image The image to use for all of the button states, in the standard up/over/down format.
	*  @param {Object} [disabledSettings] The settings object for the disabled state. If omitted, no disabled state is created.
	*  @param {Number} [disabledSettings.saturation] The amount of saturation for the disabled state. 100 is full-color, 0 is desaturated
	*  @param {Object} [highlightSettings] The settings object for the highlight state. If omitted, no state is created.
	*  @param {Number} [highlightSettings.size] How many pixels to make the glow, eg 8 for an 8 pixel increase on each side.
	*  @param {Number} [highlightSettings.red] The red value for the glow, from 0 to 255.
	*  @param {Number} [highlightSettings.green] The green value for the glow, from 0 to 255.
	*  @param {Number} [highlightSettings.blue] The blue value for the glow, from 0 to 255.
	*/
	Button.generateDefaultStates = function(image, disabledSettings, highlightSettings)
	{
		//figure out the normal button size
		var buttonWidth = image.width;
		var buttonHeight = image.height / 3;
		//create a canvas element and size it
		var canvas = document.createElement("canvas");
		var width = buttonWidth;
		var height = image.height;
		if(disabledSettings)
		{
			height += buttonHeight;
		}
		if(highlightSettings)
		{
			width += highlightSettings.size * 2;
			height += buttonHeight + highlightSettings.size * 2;
		}
		canvas.width = width;
		canvas.height = height;
		//get the drawing context
		var context = canvas.getContext("2d");
		//draw the image to it
		context.drawImage(image, 0, 0);
		//start setting up the output
		var output = {
			image: canvas,
			up:{ src:new createjs.Rectangle(0, 0, buttonWidth, buttonHeight) },
			over:{ src:new createjs.Rectangle(0, buttonHeight, buttonWidth, buttonHeight) },
			down:{ src:new createjs.Rectangle(0, buttonHeight * 2, buttonWidth, buttonHeight) }
		};
		//set up a bitmap to draw other states with
		var drawingBitmap = new createjs.Bitmap(image);
		drawingBitmap.sourceRect = output.up.src;
		//set up a y position for where the next state should go in the canvas
		var nextY = image.height;
		if(disabledSettings)
		{
			context.save();
			//position the button to draw
			context.translate(0, nextY);
			//set up the desaturation matrix
			var matrix = new createjs.ColorMatrix().adjustSaturation(100 - disabledSettings.saturation);
			drawingBitmap.filters = [new createjs.ColorMatrixFilter(matrix)];
			//draw the state
			drawingBitmap.cache(0, 0, output.up.src.width, output.up.src.height);
			drawingBitmap.draw(context);
			//update the output with the state
			output.disabled = { src: new createjs.Rectangle(0, nextY, buttonWidth, buttonHeight) };
			nextY += buttonHeight;//set up the next position for the highlight state, if we have it
			context.restore();//reset any transformations
		}
		if(highlightSettings)
		{
			context.save();
			//calculate the size of this state
			var highlightStateWidth = buttonWidth + highlightSettings.size * 2;
			var highlightStateHeight = buttonHeight + highlightSettings.size * 2;
			//set up the color changing filter
			drawingBitmap.filters = [new createjs.ColorFilter(0,0,0,1, 
				/*r*/highlightSettings.red, /*g*/highlightSettings.green, /*b*/highlightSettings.blue, 0)];
			//size the colored highlight
			drawingBitmap.scaleX = (highlightStateWidth) / buttonWidth;
			drawingBitmap.scaleY = (highlightStateHeight) / buttonHeight;
			//position it
			drawingBitmap.x = 0;
			drawingBitmap.y = nextY;
			//draw the state
			drawingBitmap.cache(0, 0, highlightStateWidth, highlightStateHeight);
			drawingBitmap.updateContext(context);
			drawingBitmap.draw(context);
			context.restore();//reset any transformations
			//size and position it to normal
			drawingBitmap.scaleX = drawingBitmap.scaleY = 1;
			drawingBitmap.x = highlightSettings.size;
			drawingBitmap.y = nextY + highlightSettings.size;
			drawingBitmap.filters = null;
			drawingBitmap.uncache();
			//draw the up state over the highlight state glow
			drawingBitmap.updateContext(context);
			drawingBitmap.draw(context);
			//set up the trim values for the other states
			var trim = new createjs.Rectangle(
				highlightSettings.size, 
				highlightSettings.size, 
				highlightStateWidth,
				highlightStateHeight);
			output.up.trim = trim;
			output.over.trim = trim;
			output.down.trim = trim;
			if(output.disabled)
				output.disabled.trim = trim;
			//set up the highlight state for the button
			output.highlighted = {
				src:new createjs.Rectangle(0, nextY, highlightStateWidth, highlightStateHeight)
			};
		}
		return output;
	};

	namespace('cloudkid').Button = Button;
}());