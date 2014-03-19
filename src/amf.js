//Released under Apache 2.0 license, at https://github.com/emilkm/amfjs
//Modified by Andrew Start at CloudKid

/***
 * AMF 3 JavaScript library by Emil Malinov https://github.com/emilkm/amfjs
 * based on Surrey's R-AMF (AMF 99) implementation https://code.google.com/p/r-amf
 * For more information on R-AMF (AMF 99), including Java (Spring) R-AMF server
 * see http://www.reignite.com.au/binary-communication-using-ajax-and-amf
 */
 (function(global, undefined){
	
	// If the amf class already exists, then ignore
	if (global["amf"]) return;
	
	var amf = {

		/*CONST: {
			EMPTY_STRING : "",
			NULL_STRING : "null",
			UNDEFINED_TYPE : 0,
			NULL_TYPE : 1,
			FALSE_TYPE : 2,
			TRUE_TYPE : 3,
			INTEGER_TYPE : 4,
			DOUBLE_TYPE : 5,
			STRING_TYPE : 6,
			XML_TYPE : 7,
			DATE_TYPE : 8,
			ARRAY_TYPE : 9,
			OBJECT_TYPE : 10,
			XMLSTRING_TYPE : 11,
			BYTEARRAY_TYPE : 12,
			AMF0_AMF3 : 17,
			UINT29_MASK : 536870911,
			INT28_MAX_VALUE : 268435455,
			INT28_MIN_VALUE : -268435456,
			CLASS_ALIAS : "_explicitType"
		}*/
	};
	
	var EMPTY_STRING = "";
	var NULL_STRING = "null";
	var UNDEFINED_TYPE = 0;
	var NULL_TYPE = 1;
	var FALSE_TYPE = 2;
	var TRUE_TYPE = 3;
	var INTEGER_TYPE = 4;
	var DOUBLE_TYPE = 5;
	var STRING_TYPE = 6;
	var XML_TYPE = 7;
	var DATE_TYPE = 8;
	var ARRAY_TYPE = 9;
	var OBJECT_TYPE = 10;
	var XMLSTRING_TYPE = 11;
	var BYTEARRAY_TYPE = 12;
	var AMF0_AMF3 = 17;
	var UINT29_MASK = 536870911;
	var INT28_MAX_VALUE = 268435455;
	var INT28_MIN_VALUE = -268435456;
	var CLASS_ALIAS = "_explicitType";

	amf.Writer = function() {
		this.data = [];
		this.objects = [];
		this.traits = {};
		this.strings = {};
		this.stringCount = 0;
		this.traitCount = 0;
		this.objectCount = 0;
	};
	
	var p = amf.Writer.prototype;

	p.write = function(v) {
		this.data.push(v);
	};

	p.writeShort = function(v) {
		this.write((v >>> 8) & 255);
		this.write((v >>> 0) & 255);
	};

	p.writeUTF = function(v, asAmf) {
		var bytearr, c, i, strlen, utflen;
		strlen = v.length;
		utflen = 0;
		for (i = 0; i < strlen; i++) {
			c = v.charCodeAt(i);
			if (c > 0 && c < 128) {
				utflen++;
			} else if (c > 2047) {
				utflen += 3;
			} else {
				utflen += 2;
			}
		}
		bytearr = [];
		if (asAmf) {
			this.writeUInt29((utflen << 1) | 1);
		} else {
			bytearr.push((utflen >>> 8) & 255);
			bytearr.push(utflen & 255);
		}
		for (i = 0; i < strlen; i++) {
			c = v.charCodeAt(i);
			if (c > 0 && c < 128) {
				bytearr.push(c);
			} else if (c > 2047) {
				bytearr.push(224 | (c >> 12));
				bytearr.push(128 | ((c >> 6) & 63));
				if (asAmf) {
					bytearr.push(128 | ((c >> 0) & 63));
				} else {
					bytearr.push(128 | (c & 63));
				}
			} else {
				bytearr.push(192 | (c >> 6));
				if (asAmf) {
					bytearr.push(128 | ((c >> 0) & 63));
				} else {
					bytearr.push(128 | (c & 63));
				}
			}
		}
		this.writeAll(bytearr);
		return asAmf ? utflen : utflen + 2;
	};

	p.writeUInt29 = function(v) {
		if (v < 128) {
			this.write(v);
		} else if (v < 16384) {
			this.write(((v >> 7) & 127) | 128);
			this.write(v & 127);
		} else if (v < 2097152) {
			this.write(((v >> 14) & 127) | 128);
			this.write(((v >> 7) & 127) | 128);
			this.write(v & 127);
		} else if (v < 0x40000000) {
			this.write(((v >> 22) & 127) | 128);
			this.write(((v >> 15) & 127) | 128);
			this.write(((v >> 8) & 127) | 128);
			this.write(v & 255);
		} else {
			throw "Integer out of range: " + v;
		}
	};

	p.writeAll = function(bytes) {
		for (var i = 0; i < bytes.length; i++) {
			this.write(bytes[i]);
		}
	};

	p.writeBoolean = function(v) {
		this.write(v ? 1 : 0);
	};

	p.writeInt = function(v) {
		this.write((v >>> 24) & 255);
		this.write((v >>> 16) & 255);
		this.write((v >>> 8) & 255);
		this.write((v >>> 0) & 255);
	};

	p.writeUnsignedInt = function(v) {
		v < 0 && (v = -(v ^ 4294967295) - 1);
		v &= 4294967295;
		this.write((v >> 24) & 255);
		this.write((v >> 16) & 255);
		this.write((v >> 8) & 255);
		this.write(v & 255);
	};

	//origin unknown
	p._getDouble = function(v) {
		var r = [0,0];
		if (v != v) return r[0] = -524288, r;
		var d = v < 0 || v === 0 && 1 / v < 0 ? -2147483648 : 0, v = Math.abs(v);
		if (v === Number.POSITIVE_INFINITY) return r[0] = d | 2146435072, r;
		for (var e = 0; v >= 2 && e <= 1023;) e++, v /= 2;
		for (; v < 1 && e >= -1022;) e--, v *= 2;
		e += 1023;
		if (e == 2047) return r[0] = d | 2146435072, r;
		var i;
		e == 0 
			? (i = v * Math.pow(2, 23) / 2, v = Math.round(v * Math.pow(2, 52) / 2)) 
			: (i = v * Math.pow(2, 20) - Math.pow(2, 20), v = Math.round(v * Math.pow(2, 52) - Math.pow(2, 52)));
		r[0] = d | e << 20 & 2147418112 | i & 1048575;
		r[1] = v;
		return r;
	};

	p.writeDouble = function(v) {
		v = this._getDouble(v);
		this.writeUnsignedInt(v[0]);
		this.writeUnsignedInt(v[1])
	};

	p.getResult = function() {
		return this.data.join("");
	};

	p.reset = function() {
		this.objects = [];
		this.objectCount = 0;
		this.traits = {};
		this.traitCount = 0;
		this.strings = {};
		this.stringCount = 0;
	};

	p.writeStringWithoutType = function(v) {
		if (v.length == 0) {
			this.writeUInt29(1);
		} else {
			if (!this.stringByReference(v)) {
				this.writeUTF(v, true);
			}
		}
	};

	p.stringByReference = function(v) {
		var ref = this.strings[v];
		if (ref) {
			this.writeUInt29(ref << 1);
		} else {
			this.strings[v] = this.stringCount++;
		}
		return ref;
	};

	p.objectByReference = function(v) {
		var ref = 0;
		var found = false;
		for (var len = this.objects.length; ref < len; ref++) {
			if (this.objects[ref] === v) {
				found = true;
				break;
			}
		}
		if (found) {
			this.writeUInt29(ref << 1);
		} else {
			this.objects.push(v);
			this.objectCount++;
		}

		return found ? ref : null;
	};

	p.traitsByReference = function(v, alias) {
		var s = alias + "|";
		for ( var i = 0; i < v.length; i++) {
			s += v[i] + "|";
		}
		var ref = this.traits[s];
		if (ref) {
			this.writeUInt29((ref << 2) | 1);
		} else {
			this.traits[s] = this.traitCount++;
		}
		return ref;
	};

	p.writeAmfInt = function(v) {
		if (v >= INT28_MIN_VALUE && v <= INT28_MAX_VALUE) {
			v = v & UINT29_MASK;
			this.write(INTEGER_TYPE);
			this.writeUInt29(v);
		} else {
			this.write(DOUBLE_TYPE);
			this.writeDouble(v);
		}
	};

	p.writeDate = function(v) {
		this.write(DATE_TYPE);
		if (!this.objectByReference(v)) {
			this.writeUInt29(1);
			this.writeDouble(v.getTime());
		}
	};

	p.writeObject = function(v) {
		if (v == null) {
			this.write(NULL_TYPE);
			return;
		}
		if (v.constructor === String) {
			this.write(STRING_TYPE);
			this.writeStringWithoutType(v);
		} else if (v.constructor === Number) {
			if (v === +v && v === (v | 0)) {
				this.writeAmfInt(v);
			} else {
				this.write(DOUBLE_TYPE);
				this.writeDouble(v);
			}
		} else if (v.constructor === Boolean) {
			this.write((v
				? TRUE_TYPE
				: FALSE_TYPE));
		} else if (v.constructor === Date) {
			this.writeDate(v);
		} else {
			if (v.constructor === Array) {
				this.writeArray(v);
			} else if (CLASS_ALIAS in v) {
				this.writeCustomObject(v);
			} else {
				this.writeMap(v);
			}
		}
	};

	p.writeCustomObject = function(v) {
		this.write(OBJECT_TYPE);
		if (!this.objectByReference(v)) {
			var traits = this.writeTraits(v);
			for (var i = 0; i < traits.length; i++) {
				var prop = traits[i];
				this.writeObject(v[prop]);
			}
		}
	};

	p.writeTraits = function(v) {
		var traits = [];
		var count = 0;
		var externalizable = false;
		var dynamic = false;

		for (var t in v) {
			if (t != CLASS_ALIAS) {
				traits.push(t);
				count++;
			}
		}
		if (!this.traitsByReference(traits, v[CLASS_ALIAS])) {
			this.writeUInt29(3 | (externalizable ? 4 : 0) | (dynamic ? 8 : 0) | (count << 4));
			this.writeStringWithoutType(v[CLASS_ALIAS]);
			if (count > 0) {
				for (var prop in traits) {
					this.writeStringWithoutType(traits[prop]);
				}
			}
		}
		return traits;
	};

	/* Write map as array
	p.writeMap = function(v) {
		this.write(ARRAY_TYPE);
		if (!this.objectByReference(map)) {
			this.writeUInt29((0 << 1) | 1);
			for (var key in v) {
				if (key) {
					this.writeStringWithoutType(key);
				} else {
					this.writeStringWithoutType(EMPTY_STRING);
				}
				this.writeObject(v[key]);
			}
			this.writeStringWithoutType(EMPTY_STRING);
		}
	};*/

	p.writeMap = function(v) {
		this.write(OBJECT_TYPE);
		if (!this.objectByReference(v)) {
			this.writeUInt29(11);
			this.traitCount++; //bogus traits entry here
			this.writeStringWithoutType(EMPTY_STRING); //class name
			for (var key in v) {
				if (key) {
					this.writeStringWithoutType(key);
				} else {
					this.writeStringWithoutType(EMPTY_STRING);
				}
				this.writeObject(v[key]);
			}
			this.writeStringWithoutType(EMPTY_STRING); //empty string end of dynamic members
		}
	};

	p.writeArray = function(v) {
		this.write(ARRAY_TYPE);
		if (!this.objectByReference(v)) {
			this.writeUInt29((v.length << 1) | 1);
			this.writeUInt29(1); //empty string implying no named keys
			if (v.length > 0) {
				for (var i = 0; i < v.length; i++) {
					this.writeObject(v[i]);
				}
			}
		}
	};

	amf.Reader = function(data) {
		this.objects = [];
		this.traits = [];
		this.strings = [];
		this.data = data;
		this.pos = 0;
	};
	
	p = amf.Reader.prototype;

	p.read = function() {
		return this.data[this.pos++];
	};

	p.readUnsignedShort = function() {
		var c1 = this.read(), c2 = this.read();
		return (c1 << 8) + (c2 << 0);
	};

	p.readUInt29 = function() {
		// Each byte must be treated as unsigned
		var b = this.read() & 255;
		if (b < 128) {
			return b;
		}
		var value = (b & 127) << 7;
		b = this.read() & 255;
		if (b < 128) {
			return (value | b);
		}
		value = (value | (b & 127)) << 7;
		b = this.read() & 255;
		if (b < 128) {
			return (value | b);
		}
		value = (value | (b & 127)) << 8;
		b = this.read() & 255;
		return (value | b);
	};

	p.readFully = function(buff, start, length) {
		for (var i = start; i < length; i++) {
			buff[i] = this.read();
		}
	};

	p.readUTF = function(length) {
		var utflen = length ? length : this.readUnsignedShort();
		var chararr = [];
		var p = this.pos;
		var c1, c2, c3;

		while (this.pos < p + utflen) {
			c1 = this.read();
			if (c1 < 128) {
				chararr.push(String.fromCharCode(c1));
			} else if (c1 > 2047) {
				c2 = this.read();
				c3 = this.read();
				chararr.push(String.fromCharCode(((c1 & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63)));
			} else {
				c2 = this.read();
				chararr.push(String.fromCharCode(((c1 & 31) << 6) | (c2 & 63)));
			}
		}
		// The number of chars produced may be less than utflen
		return chararr.join("");
	};

	p.reset = function() {
		this.objects = [];
		this.traits = [];
		this.strings = [];
	};

	p.readObject = function() {
		var type = this.read();
		return this.readObjectValue(type);
	};

	p.readString = function() {
		var ref = this.readUInt29();
		if ((ref & 1) == 0) {
			return this.getString(ref >> 1);
		} else {
			var len = (ref >> 1);
			if (len == 0) {
				return EMPTY_STRING;
			}
			var str = this.readUTF(len);
			this.rememberString(str);
			return str;
		}
	};

	p.rememberString = function(v) {
		this.strings.push(v);
	};

	p.getString = function(v) {
		return this.strings[v];
	};

	p.getObject = function(v) {
		return this.objects[v];
	};

	p.getTraits = function(v) {
		return this.traits[v];
	};

	p.rememberTraits = function(v) {
		this.traits.push(v);
	};

	p.rememberObject = function(v) {
		this.objects.push(v);
	};

	p.readTraits = function(ref) {
		if ((ref & 3) == 1) {
			return this.getTraits(ref >> 2);
		} else {
			var count = (ref >> 4);
			var className = this.readString();
			var traits = {};
			if (className != null && className != "") {
				traits[CLASS_ALIAS] = className;
			}
			traits.props = [];
			for (var i = 0; i < count; i++) {
				traits.props.push(this.readString());
			}
			this.rememberTraits(traits);
			return traits;
		}
	};

	p.readScriptObject = function() {
		var ref = this.readUInt29();
		if ((ref & 1) == 0) {
			return this.getObject(ref >> 1);
		} else {
			var traits = this.readTraits(ref);
			var obj = {};
			if (CLASS_ALIAS in traits) {
				obj[CLASS_ALIAS] = traits[CLASS_ALIAS];
			}
			this.rememberObject(obj);
			for (var i in traits.props) {
				obj[traits.props[i]] = this.readObject();
			}
			if ((ref & 8) == 8) {//dynamic
				for (; ;) {
					var name = this.readString();
					if (name == null || name.length == 0)
						break;
					obj[name] = this.readObject();
				}
			}
			return obj;
		}
	};

	p.readArray = function() {
		var ref = this.readUInt29();
		if ((ref & 1) == 0) {
			return this.getObject(ref >> 1);
		}
		var len = (ref >> 1);
		var map = null, i = 0;
		while (true) {
			var name = this.readString();
			if (!name) {
				break;
			}
			if (!map) {
				map = {};
				this.rememberObject(map);
			}
			map[name] = this.readObject();
		}
		if (!map) {
			var array = new Array(len);
			this.rememberObject(array);
			for (i = 0; i < len; i++) {
				array[i] = this.readObject();
			}
			return array;
		} else {
			for (i = 0; i < len; i++) {
				map[i] = this.readObject();
			}
			return map;
		}
	};

	//origin unknown
	p.readDouble = function() {
		var c1 = this.read() & 255, c2 = this.read() & 255;
		if (c1 === 255) {
			if (c2 === 248) return Number.NaN;
			if (c2 === 240) return Number.NEGATIVE_INFINITY
		} else if (c1 === 127 && c2 === 240) return Number.POSITIVE_INFINITY;
		var c3 = this.read() & 255, c4 = this.read() & 255, c5 = this.read() & 255, c6 = this.read() & 255, c7 = this.read() & 255, c8 = this.read() & 255;
		if (!c1 && !c2 && !c3 && !c4) return 0;
		for (var d = (c1 << 4 & 2047 | c2 >> 4) - 1023, c2 = ((c2 & 15) << 16 | c3 << 8 | c4).toString(2), c3 = c2.length; c3 < 20; c3++) c2 = "0" + c2;
		c6 = ((c5 & 127) << 24 | c6 << 16 | c7 << 8 | c8).toString(2);
		for (c3 = c6.length; c3 < 31; c3++) c6 = "0" + c6;
		c5 = parseInt(c2 + (c5 >> 7 ? "1" : "0") + c6, 2);
		if (c5 == 0 && d == -1023) return 0;
		return (1 - (c1 >> 7 << 1)) * (1 + Math.pow(2, -52) * c5) * Math.pow(2, d);
	};

	p.readDate = function() {
		var ref = this.readUInt29();
		if ((ref & 1) == 0) {
			return this.getObject(ref >> 1);
		}
		var time = this.readDouble();
		var date = new Date(time);
		this.rememberObject(date);
		return date;
	};

	p.readMap = function() {
		var ref = this.readUInt29();
		if ((ref & 1) == 0) {
			return this.getObject(ref >> 1);
		}
		var length = (ref >> 1);
		var map = null;
		if (length > 0) {
			map = {};
			this.rememberObject(map);
			var name = this.readObject();
			while (name != null) {
				map[name] = this.readObject();
				name = this.readObject();
			}
		}
		return map;
	};

	p.readByteArray = function() {
		var ref = this.readUInt29();
		if ((ref & 1) == 0) {
			return this.getObject(ref >> 1);
		} else {
			var len = (ref >> 1);
			var ba = [];
			this.readFully(ba, 0, len);
			this.rememberObject(ba);
			return ba;
		}
	};

	p.readObjectValue = function(type) {
		var value = null;

		switch (type) {
			case STRING_TYPE:
				value = this.readString();
				break;
			case OBJECT_TYPE:
				try {
					value = this.readScriptObject();
				} catch (e) {
					throw "Failed to deserialize:" + e;
				}
				break;
			case ARRAY_TYPE:
				value = this.readArray();
				//value = this.readMap();
				break;
			case FALSE_TYPE:
				value = false;
				break;
			case TRUE_TYPE:
				value = true;
				break;
			case INTEGER_TYPE:
				value = this.readUInt29();
				// Symmetric with writing an integer to fix sign bits for
				// negative values...
				value = (value << 3) >> 3;
				break;
			case DOUBLE_TYPE:
				value = this.readDouble();
				break;
			case UNDEFINED_TYPE:
			case NULL_TYPE:
				break;
			case DATE_TYPE:
				value = this.readDate();
				break;
			case BYTEARRAY_TYPE:
				value = this.readByteArray();
				break;
			case AMF0_AMF3:
				value = this.readObject();
				break;
			default:
				throw "Unknown AMF type: " + type;
		}
		return value;
	};

	p.readBoolean = function() {
		return this.read() === 1;
	};

	// Make the amf class globally accessible
	global.amf = amf;
	
}(window));