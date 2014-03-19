(function(undefined) {
	/**
	*  A Multipurpose button class. It is designed to have one image, and an optional text label.
	*  The button can be a normal button or a selectable button.
	*  The button functions similarly with both CreateJS and PIXI, but slightly differently in
	*  initialization and callbacks.
	*
	*  - Initialization - the parameters for initialization are different. See the documentation for initialize().
	*  - [PIXI only] Use releaseCallback and overCallback to know about button clicks and mouse overs, respectively.
	*  - [CreateJS only] Add event listeners for click and mouseover to know about button clicks and mouse overs, respectively.
	*  @class cloudkid.Button
	*  @extends createjs.Container|PIXI.DisplayObjectContainer
	*/
	var Button = function(imageSettings, label, enabled)
	{
		PIXI.DisplayObjectContainer.call(this);
		this.initialize(imageSettings, label, enabled);
	};
	
	// Reference to the prototype
	var p = Button.prototype = Object.create(PIXI.DisplayObjectContainer.prototype);
	
	/*
	*  The sprite that is the body of the button.
	*  The type of this property is dependent on which version of the OS library is used.
	*  @public
	*  @property {createjs.Bitmap|PIXI.Sprite} back
	*  @readOnly
	*/
	p.back = null;
	/*
	*  The text field of the button. The label is centered by both width and height on the button.
	*  The type of this property is dependent on which version of the OS library is used.
	*  @public
	*  @property {createjs.Text|PIXI.Text|PIXI.BitmapText} label
	*  @readOnly
	*/
	p.label = null;
	/**
	*  **[PIXI only]** The function that should be called when the button is released.
	*  @public
	*  @property {function} releaseCallback
	*/
	p.releaseCallback = null;
	/**
	*  **[PIXI only]** The function that should be called when the button is moused over.
	*  @public
	*  @property {function} overCallback
	*/
	p.overCallback = null;
	
	/**
	*  **[PIXI only]** The function that should be called when mouse leaves the button.
	*  @public
	*  @property {function} outCallback
	*/
	p.outCallback = null;
	
	//===button state variables
	/*
	* If this button is enabled.
	* @private
	* @property {Boolean} _enabled
	*/
	p._enabled = false;
	/*
	* If this button is held down.
	* @private
	* @property {Boolean} _isDown
	*/
	p._isDown = false;
	/*
	* If the mouse is over this button
	* @private
	* @property {Boolean} _isOver
	*/
	p._isOver = false;
	/*
	* If this button is selected.
	* @private
	* @property {Boolean} _isSelected
	*/
	p._isSelected = false;
	/*
	* If this button is a selectable button, and will respond to select being set.
	* @private
	* @property {Boolean} _isSelectable
	*/
	p._isSelectable = false;
	/*
	* If this button is highlighted.
	* @private
	* @property {Boolean} _isHighlighted
	*/
	p._isHighlighted = false;
	
	//===callbacks for mouse/touch events
	/*
	* Callback for mouse over, bound to this button.
	* @private
	* @property {Function} _overCB
	*/
	p._overCB = null;
	/*
	* Callback for mouse out, bound to this button.
	* @private
	* @property {Function} _outCB
	*/
	p._outCB = null;
	/*
	* Callback for mouse down, bound to this button.
	* @private
	* @property {Function} _downCB
	*/
	p._downCB = null;
	/*
	* Callback for mouse up, bound to this button.
	* @private
	* @property {Function} _upCB
	*/
	p._upCB = null;
	/**
	* [PIXI only] Callback for mouse up outside, bound to this button.
	* @private
	* @property {Function} _upOutCB
	*/
	p._upOutCB = null;
	
	//===textures for different button states
	/**
	* [PIXI only] The texture for the up state of the button
	* @private
	* @property {PIXI.Texture} _upTex
	*/
	p._upTex = null;
	/**
	* [PIXI only] The texture for the over state of the button
	* @private
	* @property {PIXI.Texture} _overTex
	*/
	p._overTex = null;
	/**
	* [PIXI only] The texture for the down state of the button
	* @private
	* @property {PIXI.Texture} _downTex
	*/
	p._downTex = null;
	/**
	* [PIXI only] The texture for the disabled state of the button
	* @private
	* @property {PIXI.Texture} _disabledTex
	*/
	p._disabledTex = null;
	/**
	* [PIXI only] The texture for the selected state of the button
	* @private
	* @property {PIXI.Texture} _selectedTex
	*/
	p._selectedTex = null;
	/**
	* [PIXI only] The texture for the highlighted state of the button
	* @private
	* @property {PIXI.Texture} _highlightedTex
	*/
	p._highlightedTex = null;
	
	/*
	* [PIXI only] An additional sprite that is made to be a 'slave' to this button. Its state is updated with the button state, from slaveSettings's art.
	* @private
	* @property {PIXI.Sprite} _slave
	* @readOnly
	*/
	p._slave = null;
	
	//===textures for different button states
	/**
	* [PIXI only] The texture for the up state of the button
	* @private
	* @property {PIXI.Texture} _slaveUpTex
	*/
	p._slaveUpTex = null;
	/**
	* [PIXI only] The texture for the over state of the button
	* @private
	* @property {PIXI.Texture} _slaveOverTex
	*/
	p._slaveOverTex = null;
	/**
	* [PIXI only] The texture for the down state of the button
	* @private
	* @property {PIXI.Texture} _slaveDownTex
	*/
	p._slaveDownTex = null;
	/**
	* [PIXI only] The texture for the disabled state of the button
	* @private
	* @property {PIXI.Texture} _slaveDisabledTex
	*/
	p._slaveDisabledTex = null;
	/**
	* [PIXI only] The texture for the selected state of the button
	* @private
	* @property {PIXI.Texture} _slaveSelectedTex
	*/
	p._slaveSelectedTex = null;
	/**
	* [PIXI only] The texture for the highlighted state of the button
	* @private
	* @property {PIXI.Texture} _slaveHighlightedTex
	*/
	p._slaveHighlightedTex = null;
	
	/*
	* The width of the button art, independent of the scaling of the button itself.
	* @private
	* @property {Number} _width
	*/
	p._width = 0;
	/*
	* The height of the button art, independent of the scaling of the button itself.
	* @private
	* @property {Number} _height
	*/
	p._height = 0;
	
	/** 
	* **[PIXI only]** Constructor for the button when using PIXI.
	* @method initialize
	* @constructor
	* @param  {Object} [imageSettings] Information about the art to be used for button states, as well as if the button is selectable or not.
	*	@param {PIXI.Texture} [imageSettings.up] The texture for the up state of the button.
	*	@param {PIXI.Texture} [imageSettings.over=null] The texture for the over state of the button. If omitted, uses the up state.
	*	@param {PIXI.Texture} [imageSettings.down=null] The texture for the down state of the button. If omitted, uses the up state.
	*	@param {PIXI.Texture} [imageSettings.disabled=null] The texture for the disabled state of the button. If omitted, uses the up state.
	*	@param {PIXI.Texture} [imageSettings.highlighted=null] The texture for the highlighted state of the button. If omitted, uses the over state.
	*	@param {PIXI.Texture} [imageSettings.selected=null] The texture for the selected state of the button. If omitted, the button is not a selectable button.
	*	@param {Number} [imageSettings.scale=1] The scale to use for the textures. This allows smaller art assets than the designed size to be used.
	* @param {Object} [label=null] Information about the text label on the button. Omitting this makes the button not use a label.
	*	@param {String} [label.type] If label.type is "bitmap", then a PIXI.BitmapText text is created, otherwise a PIXI.Text is created for the label.
	*	@param {String} [label.text] The text to display on the label.
	*	@param {Object} [label.style] The style of the text field, in the format that PIXI.BitmapText and PIXI.Text expect.
	* @param {Boolean} [enabled=true] Whether or not the button is initially enabled.
	*/
	p.initialize = function(imageSettings, label, enabled)
	{
		this.back = new PIXI.Sprite(imageSettings.up);
		this.addChild(this.back);
		
		this._overCB = this._onOver.bind(this);
		this._outCB = this._onOut.bind(this);
		this._downCB = this._onDown.bind(this);
		this._upCB = this._onUp.bind(this);
		this._upOutCB = this._onUpOutside.bind(this);
		
		this._upTex = imageSettings.up;
		this._overTex = imageSettings.over || this._upTex;
		this._downTex = imageSettings.down || this._upTex;
		this._disabledTex = imageSettings.disabled || this._upTex;
		this._highlightedTex = imageSettings.highlighted || this._overTex;
		if(imageSettings.selected)
		{
			this._isSelectable = true;
			this._selectedTex = imageSettings.selected;
		}
		if(imageSettings.slave && imageSettings.slaveSettings)
		{
			this._slave = imageSettings.slave;
			var slaveSettings = imageSettings.slaveSettings;
			this._slaveUpTex = slaveSettings.up;
			this._slaveOverTex = slaveSettings.over || this._slaveUpTex;
			this._slaveDownTex = slaveSettings.down || this._slaveUpTex;
			this._slaveDisabledTex = slaveSettings.disabled || this._slaveUpTex;
			this._slaveHighlightedTex = slaveSettings.highlighted || this._slaveOverTex;
			if(this._isSelectable)
				this._slaveSelectedTex = slaveSettings.selected || this._slaveUpTex;
		}
		if(imageSettings.scale)
		{
			var s = imageSettings.scale || 1;
			this.back.scale.x = this.back.scale.y = s;
			if(this._slave)
				this._slave.scale.x = this._slave.scale.x = s;
		}
		
		if(label)
		{
			this.label = label.type == "bitmap" ? new PIXI.BitmapText(label.text, label.style) : new PIXI.Text(label.text, label.style);
			this.addChild(this.label);
			this.label.position.x = (this.back.width - this.label.width) * 0.5;
			var h = this.label.height;
			this.label.position.y = (this.back.height - h) * 0.5 + h * 0.125;
		}
		
		this._width = this.back.width;
		this._height = this.back.height;
		
		this.enabled = enabled === undefined ? true : !!enabled;
	};
	
	/*
	*  The width of the button, based on the width of back. This value is affected by scale.
	*  @public
	*  @property {Number} width
	*/
	Object.defineProperty(p, "width", {
		get:function(){return this._width * this.scale.x;},
		set:function(value){
			this.scale.x = value / this._width;
		}
	});
	/*
	*  The height of the button, based on the height of back. This value is affected by scale.
	*  @public
	*  @property {Number} height
	*/
	Object.defineProperty(p, "height", {
		get:function(){return this._height * this.scale.y;},
		set:function(value){
			this.scale.y = value / this._height;
		}
	});
	
	/*
	*  Sets the text of the label. This does nothing if the button was not initialized with a label.
	*  @public
	*  @method setText
	*  @param {String} text The text to set the label to.
	*/
	p.setText = function(text)
	{
		if(this.label)
		{
			this.label.setText(text);
			this.label.forceUpdateText();
			this.label.position.x = (this.back.width - this.label.width) * 0.5;
			var h = this.label.height;
			this.label.position.y = (this.back.height - h) * 0.5 + h * 0.125;
		}
	};
	
	/*
	*  Whether or not the button is enabled.
	*  @public
	*  @property {Boolean} enabled
	*  @default true
	*/
	Object.defineProperty(p, "enabled", {
		get: function() { return this._enabled; },
		set: function(value)
		{
			this._enabled = value;
			this.buttonMode = value;
			this.interactive = value;
			
			//make sure interaction callbacks are properly set
			if(value)
			{
				this.mousedown = this.touchstart = this._downCB;
				this.mouseover = this._overCB;
				this.mouseout = this._outCB;
			}
			else
			{
				this.mousedown = this.touchstart = this.mouseover = this.mouseout = null;
				this.mouseup = this.touchend = this.mouseupoutside = this.touchendoutside = null;
				this._isDown = this._isOver = false;
				//also turn off pixi values so that re-enabling button works properly
				this.__isOver = false;
			}
			
			this._updateState();
		}
	});
	
	/*
	*  Whether or not the button is selected. Setting this only works if the button was given selected state when initialized.
	*  @public
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
	
	/*
	*  Whether or not the button is highlighted. The default highlighted state is the over state, but a specific texture can be supplied.
	*  @public
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
	
	/*
	*  Updates back based on the current button state.
	*  @private
	*  @method _updateState
	*/
	p._updateState = function()
	{
		if(!this.back) return;
		if(this._isHighlighted)
			this.back.setTexture(this._highlightedTex);
		else if(!this._enabled)
			this.back.setTexture(this._disabledTex);
		else if(this._isDown)
			this.back.setTexture(this._downTex);
		else if(this._isOver)
			this.back.setTexture(this._overTex);
		else if(this._isSelected)
			this.back.setTexture(this._selectedTex);
		else
			this.back.setTexture(this._upTex);
		if(this._slave)
		{
			if(this._isHighlighted)
				this._slave.setTexture(this._slaveHighlightedTex);
			else if(!this._enabled)
				this._slave.setTexture(this._slaveDisabledTex);
			else if(this._isDown)
				this._slave.setTexture(this._slaveDownTex);
			else if(this._isOver)
				this._slave.setTexture(this._slaveOverTex);
			else if(this._isSelected)
				this._slave.setTexture(this._slaveSelectedTex);
			else
				this._slave.setTexture(this._slaveUpTex);
		}
	};
	
	/**
	*  [PIXI only] The callback for when the button is moused over.
	*  @private
	*  @method _onOver
	*/
	p._onOver = function(data)
	{
		this._isOver = true;
		this._updateState();
		if(this.overCallback)
			this.overCallback(this);
	};
	
	/**
	*  [PIXI only] The callback for when the mouse leaves the button area.
	*  @private
	*  @method _onOut
	*/
	p._onOut = function(data)
	{
		this._isOver = false;
		this._updateState();
		if(this.outCallback)
			this.outCallback(this);
	};
	
	/**
	*  [PIXI only] The callback for when the button receives a mouse down event.
	*  @private
	*  @method _onDown
	*/
	p._onDown = function(data)
	{
		data.originalEvent.preventDefault();
		this._isDown = true;
		this._updateState();
		
		this.mouseup = this.touchend = this._upCB;
		this.mouseupoutside = this.touchendoutside = this._upOutCB;
	};
	
	/**
	*  [PIXI only] The callback for when the button for when the mouse/touch is released on the button
	*  - only when the button was held down initially.
	*  @private
	*  @method _onUp
	*/
	p._onUp = function(data)
	{
		data.originalEvent.preventDefault();
		this._isDown = false;
		this.mouseup = this.touchend = null;
		this.mouseupoutside = this.touchendoutside = null;
		
		this._updateState();
		if(this.releaseCallback)
			this.releaseCallback(this);
	};
	
	/**
	*  [PIXI only] The callback for when the mouse/touch is released outside the button when the button was held down.
	*  @private
	*  @method _onUpOutside
	*/
	p._onUpOutside = function(data)
	{
		this._isDown = false;
		this.mouseup = this.touchend = null;
		this.mouseupoutside = this.touchendoutside = null;
		
		this._updateState();
	};
	
	/*
	*  Destroys the button.
	*  @public
	*  @method destroy
	*/
	p.destroy = function()
	{
		this.mousedown = this.touchstart = this.mouseover = this.mouseout = null;
		this.mouseup = this.touchend = this.mouseupoutside = this.touchendoutside = null;
		this.removeChildren(true);
		this._upTex = null;
		this._overTex = null;
		this._downTex = null;
		this._disabledTex = null;
		this._selectedTex = null;
		this._highlightedTex = null;
		this.label = null;
		this.back = null;
		this.releaseCallback = null;
		this.overCallback = null;
		this.outCallback = null;
		this._slave = null;
		this._slaveUpTex = null;
		this._slaveOverTex = null;
		this._slaveDownTex = null;
		this._slaveDisabledTex = null;
		this._slaveSelectedTex = null;
		this._slaveHighlightedTex = null;
	};
	
	namespace('cloudkid').Button = Button;
}());