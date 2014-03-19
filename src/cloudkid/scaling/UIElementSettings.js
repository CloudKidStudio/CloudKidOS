(function() {
	
	/**
	*  The UI Item Settings
	*/
	var UIElementSettings = function(){};
	
	var p = UIElementSettings.prototype = {};
	
	/** What vertical screen location the item should be aligned to */
	p.vertAlign = null;
	/** What horizontal screen location the item should be aligned to */
	p.horiAlign = null;
	/** If this element should be aligned to the title safe area, not the actual screen */
	p.titleSafe = false;
	/** Maximum scale allowed in physical size */
	p.maxScale = 1;
	/** Minimum scale allowed in physical size */
	p.minScale = 1;
	
	p.centeredHorizontally = false;
	
	namespace('cloudkid').UIElementSettings = UIElementSettings;
}());