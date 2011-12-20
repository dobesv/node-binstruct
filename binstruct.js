
//
// int64/uint64 support is limited in javascript.  Each struct can specify
// a strategy for handling 64-bit values that occur in the data definition
// by passing the int64mode option.
//
// strict: Create a js 'number'; throw Error if the 64-bit number doesn't fit
// lossy: Create a js 'number'; use Infinity or -Infinity if it doesn't fit
// copy: Read 64-bit number into an 8-byte buffer
// slice: Return an 8-byte "slice" of the original buffer
// skip: Ignore 64-bit fields altogether
//
var int64modes = exports.int64modes = {
	strict:'strict number',
	lossy:'lossy number',
	copy:'copy buffer',
	slice:'slice buffer',
	int64:'int64',
	skip:'skip'
};

//
// Create a struct def
//
function StructDef(opts) {
	this.name = opts && opts.name;
	this.fields = [];
	this.size = 0;
	this.littleEndian = !!(opts && opts.littleEndian);
	this.noAssert = !!(opts && opts.noAssert);
	if(opts && 'int64mode' in opts) {
		this.int64mode = opts.int64mode;
	} else {
		this.int64mode = int64modes.strict;
	}
	this.Wrapper = function BufferWrapper(buf) {
		Object.defineProperty(this, '_buffer', {value:buf});
	};
	Object.defineProperty(this.Wrapper.prototype,
			'_def', {value:this,writable:false});
	Object.defineProperty(this.Wrapper.prototype,
			'_fields', {get:function() { return this._def.fields; }});

	// Check if each field equals its default value
	this.Wrapper.prototype.checkValues = function() {
		var wrapper = this;
		var assert = require('assert');
		this._fields.forEach(function(f) {
			if('value' in f) {
				assert.equal(wrapper[f.name], f.value, f.name);
			}
		});
		return this;
	};

	// Write default values into the fields
	this.Wrapper.prototype.writeValues = function() {
		var wrapper = this;
		this._fields.forEach(function(f) {
			if('value' in f) {
				wrapper[f.name] = f.value;
			}
		});
		return this;
	};
}

StructDef.prototype.field = function defineField(f) {
	var offset = f.offset = this.size;
	this.size += f.size;
	this.fields.push(f);
	var desc = {
		enumerable:true
	};
	var name = f.name;
	var readImpl = f.read;
	if(readImpl) {
		desc.get = function() {
			return readImpl.apply(this._buffer, [offset, this.noAssert, this, f]);
		};
	}
	var writeImpl = f.write;
	if(writeImpl) {
		desc.set = function(value) {
			return writeImpl.apply(this._buffer, [value, offset, this.noAssert, this, f]);
		};
	}
	Object.defineProperty(this.Wrapper.prototype, name, desc);
	Object.defineProperty(this, name, {value:f});
	return this;
};

function createInt64Reader(signed, littleEndian) {
	var reader;
	reader = function readInt64AsNumber(offset, noAssert, def, field) {
		// "this" should be a Buffer
		if(!Buffer.isBuffer(this)) throw new Error('Should be applied to a buffer!');
		if(!noAssert && offset + 8 > this.length) {
			throw new Error('Field runs beyond the length of the buffer.');
		}
		var int64mode = field.int64mode || def.int64mode || int64modes.strict;
		if(int64mode === 'lossy number' || int64mode === 'strict number') {
			var hi, lo;

			if(littleEndian) {
				hi = this.readUInt32LE(offset+4, noAssert);
				lo = this.readUInt32LE(offset+0, noAssert);
			} else {
				hi = this.readUInt32BE(offset+0, noAssert);
				lo = this.readUInt32BE(offset+4, noAssert);
			}

			// Does it fit in a the 53-bits supported by javascript numbers?
			// hi contains the upper 32 bits, only 21 of which can be used,
			// or 20 for unsigned numbers.
			var lostBits = hi & 0xFFF00000;
			// If the lost bits are all zero we're OK
			// Also for a signed negative number the lost bits can be all
			// one and we're OK
			if(lostBits !== 0 && (!signed || lostBits !== 0xFFF00000)) {
				// If the mode is "strict" then verify we don't lose any bits when
				// we truncate the number to fit into a floating point number.
				if(int64mode === 'strict number') {
					// Data will be lost ... !
					throw new Error('64-bit number too large for javascript number data type; bytes: '+this.toString('hex', offset, offset+8)+(littleEndian?' (little endian)':' (big endian)'));
				} else {
					if(!signed || (hi & 0x80000000) == 0) {
						return Infinity;
					} else {
						return -Infinity;
					}
				}
			}

			return ((hi & 0x001FFFFF) << 32) | lo & 0xFFFFFFFF;
		} else if(int64mode === 'slice buffer') {
			return this.slice(offset, offset+8);
		} else if(int64mode === 'copy buffer') {
			var result = new Buffer(8);
			this.copy(result, 0, offset, offset+8);
			return result;
		} else if(int64mode === 'skip') {
		} else {
			throw new Error('Unsupported int64mode: '+int64mode);
		}
	};
	return reader;
};

function createInt64Writer(signed, littleEndian) {
	var writer = function writeInt64(val, offset, noAssert) {
		// "this" is a Buffer
		if(val instanceof 'number') {
			var hi = val >> 32;
			var lo = val & 0xFFFFFFFF;

			this.writeUInt32(hi, offset+(littleEndian?4:0), noAssert);
			this.writeUInt32(lo, offset+(littleEndian?0:4), noAssert);
		} else if(Buffer.isBuffer(val)) {
			if(val.length != 8) {
				throw new Error('Buffer used as int64 field must be 8 bytes long!');
			}
			val.copy(this, offset);
		}
	};
	return writer;
};

function setupDefiners() {
	function defNumberTypeDefaultEndian(nameNoEndian) {
		// Add one without the le/be suffix that uses the
		// default endian.  Both le and be definers should
		// be set up when this is called.
		var beDefiner = StructDef.prototype[nameNoEndian + 'be'];
		var leDefiner = StructDef.prototype[nameNoEndian + 'le'];
		StructDef.prototype[nameNoEndian] = function defineIntFieldDefaultEndian() {
			var args = Array.prototype.slice.call(arguments);
			var fn = this.littleEndian?leDefiner:beDefiner;
			fn.apply(this, args);
			return this;
		};
	}
	function defNumberType(upperCaseTypeName, size, reader, writer) {
		var readImpl = reader || Buffer.prototype['read'+upperCaseTypeName];
		var writeImpl = writer || Buffer.prototype['write'+upperCaseTypeName];
		var lowerCaseTypeName = upperCaseTypeName.toLowerCase();
		var definer = function defineIntField() {
			var f = {
				type:lowerCaseTypeName,
				name:this.fields.length,
				size:size,
				read:readImpl,
				write:writeImpl
			};
			for(var i=0; i < arguments.length; i++) {
				var arg = arguments[i];
				if(!arg) {
					// Ignore null, false, etc I guess ...
				} else if(Buffer.isBuffer(arg) || typeof(arg) === 'number') {
					f.value = arg;
				} else if(typeof(arg) === 'string') {
					f.name = arg;
				} else if(typeof(arg) === 'object') {
					Object.keys(arg).forEach(function(k) {
						f[k] = arg[k];
					});
				} else {
					throw new Error('Unexpected argument '+arg);
				}
			}
			this.field(f);
			return this;
		};
		StructDef.prototype[lowerCaseTypeName] = definer;
		if(lowerCaseTypeName === 'uint8')
			StructDef.prototype.byte = definer;
	}

	var intBits = [8, 16, 32, 64];
	for(var i=0; i < 16; i++) {
		var bits = intBits[(i>>2) % 4];
		var signed = (i & 1) === 1;
		var littleEndian = (i & 2) === 2;
		if(littleEndian && bits === 8)
			continue; // No endian-ness on single bytes
		var upperCaseTypeName = (signed?"":"U")+"Int"+bits+(bits === 8?"":littleEndian?"LE":"BE");
		var reader = null;
		var writer = null;
		if(bits == 64) {
			reader = createInt64Reader(signed, littleEndian);
			writer = createInt64Writer(signed, littleEndian);
		}
		defNumberType(upperCaseTypeName, bits >> 3, reader, writer);

		// If we've now done both little and big endian, add the
		// method that has no be/le suffix and uses the default
		// endian-ness for this structure.
		if(littleEndian) {
			defNumberTypeDefaultEndian(upperCaseTypeName.slice(0, upperCaseTypeName.length-2).toLowerCase());
		}
	}

	// Add float and double
	for(var i=0; i < 4; i++) {
		var littleEndian = (i & 1) === 1;
		var double = (i >> 1) & 1 === 1;
		var name = double ? "Double" : "Float";
		var bits = double ? 64 : 32;
		var upperCaseTypeName = name+(littleEndian?"LE":"BE");
		defNumberType(upperCaseTypeName, bits >> 3);
		if(littleEndian) {
			defNumberTypeDefaultEndian(name.toLowerCase());
		}
	}
}

setupDefiners();

StructDef.prototype.checkSize = function(expectedSize) {
	if(expectedSize !== this.size) {
		require('assert').fail(this.size, this.expectedSize, 'Wrong size', '!==');
	}
	return this;
};

StructDef.prototype.wrap = function wrapBuf(buf) {
	var wrapper = new (this.Wrapper)(buf);
	return wrapper;
};

StructDef.prototype.unpack = StructDef.prototype.read = function readFieldsFromBuf(buf, offset, noAssert) {
	var data = {};
	if(typeof(noAssert) === 'undefined') {
		noAssert = this.noAssert;
	}
	if(typeof(offset) === 'undefined') {
		offset = 0;
	}
	this.fields.forEach(function readField(f) {
		var readImpl = f.read;
		if(readImpl) {
			data[f.name] = readImpl.apply(buf, [offset + f.offset, noAssert]);
		}
	});
	return data;
};

StructDef.prototype.pack = StructDef.prototype.write = function writeFieldsIntoBuf(data, buf, offset, noAssert) {
	if(typeof(noAssert) === 'undefined') {
		noAssert = this.noAssert;
	}
	if(typeof(offset) === 'undefined') {
		offset = 0;
	}
	if(typeof(buf) === 'undefined') {
		buf = new Buffer(this.size + offset);
	}
	if(typeof(data) == 'undefined') {
		data = {}; // Write all zeroes and defaults
	}
	this.fields.forEach(function writeField(f) {
		var writeImpl = f.write;
		if(writeImpl) {
			var value = (f.name in data ? data[f.name] : f.value) || 0;
			writeImpl.apply(buf, [value, offset + f.offset, noAssert]);
		}
	});
	return buf;
};

exports.def = function createNewStructDef(opts) {
	var def = new StructDef(opts);

	return def;
};

