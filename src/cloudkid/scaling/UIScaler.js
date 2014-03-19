(function() {
	
	/**
	*   The UI scale is responsible for scaling UI components
	*   to help easy the burden of different device aspect ratios
	*   @author Andrew Start <andrewstart@cloudkid.com>
	*   @author Matt Moore <matt@cloudkid.com>
	*/
	
	/**
	*  Create the scaler
	*  @param The UI display container
	*  @param The designed width of the UI
	*  @param The designed height of the UI
	*  @param The designed PPI of the UI
	*/
	var UIScaler = function(parent, designedWidth, designedHeight, designedPPI)
	{
		this._parent = parent;
		this._items = [];
		this._designedScreen = new cloudkid.ScreenSettings(designedWidth, designedHeight, designedPPI);
	};
	
	var p = UIScaler.prototype = {};
				
	/** The current screen settings */
	UIScaler._currentScreen = new cloudkid.ScreenSettings(0, 0, 0);
	
	/** if the screensize has been set */
	UIScaler._initialized = false;
	
	/** The UI display object to update */
	p._parent = null;
	
	/** The screen settings object, contains information about designed size */
	p._designedScreen = null;
	
	/** The configuration for each items */
	p._items = null;
	
	/** Different scale alignments */
	UIScaler.ALIGN_TOP = "top";
	UIScaler.ALIGN_BOTTOM = "bottom";
	UIScaler.ALIGN_LEFT = "left";
	UIScaler.ALIGN_RIGHT = "right";
	UIScaler.ALIGN_CENTER = "center";
	
	/**
	*  Create the scaler from JSON data
	*  @param The UI display container
	*  @param The json of the designed settings (designedWidth, designedHeight, designedPPI keys)
	*  @param The json items object
	*  @param If we should immediately cleanup the UIScaler after scaling items (default is true)
	*  @param Return the UIScaler object
	*/
	UIScaler.fromJSON = function(parent, jsonSettings, jsonItems, immediateDestroy)
	{
		if(typeof immediateDestroy != "boolean") immediateDestroy = true;
			
		var scaler = new UIScaler(
			parent, 
			jsonSettings.designedWidth,
			jsonSettings.designedHeight,
			jsonSettings.designedPPI
		);
		
		// Temp variables
		var item, i, align, vertAlign, horiAlign;
		
		// Loop through all the items and register
		// each dpending on the settings
		for(i in jsonItems)
		{
			item = jsonItems[i];
			
			if (item.align)
			{
				align = item.align.split("-");
				vertAlign = align[0];
				horiAlign = align[1];
			}
			else
			{
				vertAlign = ALIGN_CENTER;
				horiAlign = ALIGN_CENTER;
			}
			scaler.add(
				parent[i], 
				vertAlign,
				horiAlign,
				item.titleSafe || false,
				item.minScale || NaN,
				item.maxScale || NaN,
				item.centeredHorizontally || false
			);
		}
		
		// Scale the items
		scaler.resize();
		
		if (immediateDestroy)
		{
			scaler.destroy();
		}
		return scaler;
	};
	
	/**
	*   Set the current screen settings. If the stagesize changes at all, re-call this function
	*   @param The fullscreen width
	*   @param The fullscreen height
	*   @param The screen resolution density
	*/
	UIScaler.init = function(screenWidth, screenHeight, screenPPI)
	{
		UIScaler._currentScreen.width = screenWidth;
		UIScaler._currentScreen.height = screenHeight;
		UIScaler._currentScreen.ppi = screenPPI;
		UIScaler._initialized = true;
	};

	p.getScale = function()
	{
		return UIScaler._currentScreen.height / this._designedScreen.height;
	};
	
	/**
	*   Manually add an item 
	*   @param The display object item to add
	*   @param The vertical align of the item (cefault is center)
	*   @param The horizontal align of the item (default is center)
	*   @param If the item needs to be in the title safe area (default is false)
	*   @param The minimum scale amount (default, scales the same size as the stage)
	*   @param The maximum scale amount (default, scales the same size as the stage)
	*/
	p.add = function(item, vertAlign, horiAlign, titleSafe, minScale, maxScale, centeredHorizontally)
	{
		if(!vertAlign)
			vertAlign = UIScaler.ALIGN_CENTER;
		if(!horiAlign)
			horiAlign = UIScaler.ALIGN_CENTER;
		if(typeof titleSafe != "boolean")
			titleSafe = false;
		if(typeof minScale != "number")
			minScale = NaN;
		if(typeof maxScale != "number")
			maxScale = NaN;
		// Create the item settings
		var s = new cloudkid.UIElementSettings();
			s.vertAlign = vertAlign;
			s.horiAlign = horiAlign;
			s.titleSafe = titleSafe;
			s.maxScale = maxScale;
			s.minScale = minScale;
			s.centeredHorizontally = centeredHorizontally;
				
		this._items.push(new cloudkid.UIElement(item, s, this._designedScreen));
	};
	
	/**
	*   Scale a single background image according to the UIScaler.width and height
	*   @param The bitmap to scale
	*/
	UIScaler.resizeBackground = function(b)
	{
		if(!UIScaler._initialized) return;
		
		var h = b.height / b.scale.y;
		var w = b.width / b.scale.x;
		//scale the background
		var scale = UIScaler._currentScreen.height / h;
		b.scale.x = b.scale.y = scale;
		
		//center the background
		b.position.x = (UIScaler._currentScreen.width - b.width) * 0.5;
	};
	
	/**
	*   Convenience function to scale a collection of backgrounds
	*   @param The vector of bitmap images
	*/
	UIScaler.resizeBackgrounds = function(bs)
	{
		for(var i = 0, len = bs.length; i < len; ++i)
		{
			resizeBackground(bs[i]);
		}
	};
	
	/**
	*   Scale the UI items that have been registered
	*/
	p.resize = function()
	{
		if (this._items.length > 0)
		{
			for(var i = 0, len = this._items.length; i < len; ++i)
			{
				this._items[i].resize(UIScaler._currentScreen);
			}
		}
	};
	
	/**
	*   Destroy the scaler object
	*/
	p.destroy = function()
	{
		if (this._items.length > 0)
		{
			for(var i = 0, len = this._items.length; i < len; ++i)
			{
				this._items[i].destroy();
			}
		}
		
		this._parent = null;
		this._designedScreen = null;
		this._items = null;
	};
	
	namespace('cloudkid').UIScaler = UIScaler;
}());