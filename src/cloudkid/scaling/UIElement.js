(function() {
	/**
	*  A single UI item that needs to be resized
	*/
	/**
	*   Create the UI Item
	*	@param The item to affect  
	*   @param The scale settings
	*	@param The original screen the item was designed for
	*/
	var UIElement = function(item, settings, designedScreen)
	{
		this._item = item;			
		this._settings = settings;
		this._designedScreen = designedScreen;
		
		if(CONFIG_PIXI)
		{
			this.origScaleX = item.scale.x;
			this.origScaleY = item.scale.y;
		}
		else
		{
			this.origScaleX = item.scaleX;
			this.origScaleY = item.scaleY;
		}
		this.origWidth = item.width;

		//this.origBounds = item.getBounds(item);
		this.origBounds = {x:0, y:0, width:item.width, height:item.height};
		this.origBounds.right = this.origBounds.x + this.origBounds.width;
		this.origBounds.bottom = this.origBounds.y + this.origBounds.height;
		
		var UIScaler = cloudkid.UIScaler;
		switch(settings.vertAlign)
		{
			case UIScaler.ALIGN_TOP:
			{
				if(CONFIG_PIXI)
					this.origMarginVert = item.position.y + this.origBounds.y;
				else
					this.origMarginVert = item.y + this.origBounds.y;
				break;
			}
			case UIScaler.ALIGN_CENTER:
			{
				if(CONFIG_PIXI)
					this.origMarginVert = designedScreen.height * 0.5 - item.position.y;
				else
					this.origMarginVert = designedScreen.height * 0.5 - item.y;
				break;
			}
			case UIScaler.ALIGN_BOTTOM:
			{
				if(CONFIG_PIXI)
					this.origMarginVert = designedScreen.height - (item.position.y + this.origBounds.bottom);
				else
					this.origMarginVert = designedScreen.height - (item.y + this.origBounds.bottom);
				break;
			}
		}

		switch(settings.horiAlign)
		{
			case UIScaler.ALIGN_LEFT:
			{
				if(CONFIG_PIXI)
					this.origMarginHori = item.position.x + this.origBounds.x;
				else
					this.origMarginHori = item.x + this.origBounds.x;
				break;
			}
			case UIScaler.ALIGN_CENTER:
			{
				if(CONFIG_PIXI)
					this.origMarginHori = designedScreen.width * 0.5 - item.position.x;
				else
					this.origMarginHori = designedScreen.width * 0.5 - item.x;
				break;
			}
			case UIScaler.ALIGN_RIGHT:
			{
				if(CONFIG_PIXI)
					this.origMarginHori = designedScreen.width - (item.position.x + this.origBounds.right);
				else
					this.origMarginHori = designedScreen.width - (item.x + this.origBounds.right);
				break;
			}
		}
		
		//Debug.log("setup for " + item.name + ": " + item.position.x + ", " + item.position.y + "; margin: " + this.origMarginHori + ", " + this.origMarginVert);
		//Debug.log("bottom: " + this.origBounds.bottom + ", height: " + this.origBounds.height);
	};
	
	var p = UIElement.prototype = {};
		
	/** Original horizontal margin in pixels */
	p.origMarginHori = 0;

	/** Original vertical margin in pixels */
	p.origMarginVert = 0;

	/** Original width in pixels */
	p.origWidth = 0;

	/** The original scale of the item. */
	p.origScaleX = 0;

	/** The original scale of the item. */
	p.origScaleY = 0;

	/** Used to determine the distance to each edge of the item from its origin */
	p.origBounds = null;

	/** The UI Item settings */
	p._settings = null;
	
	/** The UI Item */
	p._item = null;
	
	/** The screen that the UI element was designed for */
	p._designedScreen = null;
	
	/**
	*   Adjust the item scale and position, to reflect new screen
	*   @param The current screen settings
	*/
	p.resize = function(newScreen)
	{
		var overallScale = newScreen.height / this._designedScreen.height;
		var ppiScale = newScreen.ppi / this._designedScreen.ppi;
		var letterBoxWidth = (newScreen.width - this._designedScreen.width * overallScale) / 2;

		// Scale item to the overallScale to match rest of the app, 
		// then clamp its physical size as specified 
		// then set the item's scale to be correct - the screen is not scaled

		//Full math:
		/*var physicalScale:Number = overallScale / ppiScale;
		var itemScale:Number = MathUtils.clamp(physicalScale, minScale, maxScale) / physicalScale * overallScale;*/

		//Optimized math:
		var itemScale = overallScale / ppiScale;
		if(this._settings.minScale && itemScale < this._settings.minScale)
			itemScale = this._settings.minScale;
		else if(this._settings.maxScale && itemScale > this._settings.maxScale)
			itemScale = this._settings.maxScale;
		itemScale *= ppiScale;

		if(CONFIG_PIXI)
		{
			this._item.scale.x = this.origScaleX * itemScale;
			this._item.scale.y = this.origScaleY * itemScale;
		}
		else
		{
			this._item.scaleX = this.origScaleX * itemScale;
			this._item.scaleY = this.origScaleY * itemScale;
		}

		// positioning
		var m;

		// vertical move
		m = this.origMarginVert * overallScale;
		
		var UIScaler = cloudkid.UIScaler;
		switch(this._settings.vertAlign)
		{
			case UIScaler.ALIGN_TOP:
			{
				if(CONFIG_PIXI)
					this._item.position.y = m - this.origBounds.y * itemScale;
				else
					this._item.y = m - this.origBounds.y * itemScale;
				break;
			}
			case UIScaler.ALIGN_CENTER:
			{
				if(CONFIG_PIXI)
					this._item.position.y = newScreen.height * 0.5 - m;
				else
					this._item.y = newScreen.height * 0.5 - m;
				break;
			}
			case UIScaler.ALIGN_BOTTOM:
			{
				if(CONFIG_PIXI)
					this._item.position.y = newScreen.height - m - this.origBounds.bottom * itemScale;
				else
					this._item.y = newScreen.height - m - this.origBounds.bottom * itemScale;
				break;
			}
		}

		// horizontal move
		m = this.origMarginHori * overallScale;
		
		switch(this._settings.horiAlign)
		{
			case UIScaler.ALIGN_LEFT:
			{
				if(this._settings.titleSafe)
				{
					if(CONFIG_PIXI)
						this._item.position.x = letterBoxWidth + m - this.origBounds.x * itemScale;
					else
						this._item.x = letterBoxWidth + m - this.origBounds.x * itemScale;
				}
				else
				{
					if(CONFIG_PIXI)
						this._item.position.x = m - this.origBounds.x * itemScale;
					else
						this._item.x = m - this.origBounds.x * itemScale;
				}
				break;
			}
			case UIScaler.ALIGN_CENTER:
			{
				if(this._settings.centeredHorizontally)
				{
					if(CONFIG_PIXI)
						this._item.position.x = (newScreen.width - this._item.width) * 0.5;
					else
						this._item.x = (newScreen.width - this._item.width) * 0.5;
				}
				else
				{
					if(CONFIG_PIXI)
						this._item.position.x = newScreen.width * 0.5 - m;
					else
						this._item.x = newScreen.width * 0.5 - m;
				}
				break;
			}	
			case UIScaler.ALIGN_RIGHT:
			{
				if(this._settings.titleSafe)
				{
					if(CONFIG_PIXI)
						this._item.position.x = newScreen.width - letterBoxWidth - m - this.origBounds.right * itemScale;
					else
						this._item.x = newScreen.width - letterBoxWidth - m - this.origBounds.right * itemScale;
				}
				else
				{
					if(CONFIG_PIXI)
						this._item.position.x = newScreen.width - m - this.origBounds.right * itemScale;
					else
						this._item.x = newScreen.width - m - this.origBounds.right * itemScale;
				}
				break;
			}		
		}
	};
	
	/**
	*   Destroy this item, don't use after this
	*/
	p.destroy = function()
	{
		this._item = null;
		this._settings = null;
		this._designedScreen = null;
	};
	
	namespace('cloudkid').UIElement = UIElement;
}());