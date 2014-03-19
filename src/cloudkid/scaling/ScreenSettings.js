(function() {
	
	/**
	*   Object that contains the screen settings to help scaling
	*   @param The screen width in pixels
	*   @param The screen height in pixels
	*   @param The screen pixel density (PPI)
	*/
	var ScreenSettings = function(w, h, p)
	{
		this.width = w;
		this.height = h;
		this.ppi = p;
	};
	
	ScreenSettings.prototype = {};
	
	namespace('cloudkid').ScreenSettings = ScreenSettings;
}());