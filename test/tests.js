var assert = require('assert'),
    binstruct = require('../binstruct');

// 01020304050607000f010203040f00000f010203040f000100000000000001ffff00000000ffff01020304050607080102030405060708f3ffff00ffff00ff0
// 01020304050607030f0f02030f0f02030f0f02030f0f020000000000000000000000000000000001020304050607080102030405060708f3ffff00ffff00ff0
var buf = new Buffer([1,
                      2,3,
                      4,5,6,7,
                      0,15,1,2,3,4,15,0, // d
                      0,15,1,2,3,4,15,0, // e
                      1,0,0,0,0,0,0,1, // f
                      -1,-1,0,0,0,0,-1,-1, // g
                      1,2,3,4,5,6,7,8,
                      1,2,3,4,5,6,7,8,
                      -13,    // j = 0xF3 = 243
                      -1, -1, // k = 0xffff = -1
                       0, -1, // m = 0xff00 = -256 (le) or 0x00ff = 255 (be)
                      -1,  0, // n = 0x00ff = 255 (le) or 0xff00 = -256 (be)
                      -1,  0,  0,  0, // p = 0xff (le) or 0xff000000 (be)
                       0,  0,  0, -1  // q = 0xff000000 (le) or 0xff (be)
                      ]);

// Read signed little endian values from a buffer
var ssl = binstruct.def()
	.int8('a')
	.int16le('b')
	.int32le('c')
	.int64le('d', {int64mode:binstruct.int64modes.strict})
	.int64le('e', {int64mode:binstruct.int64modes.lossy})
	.int64le('f', {int64mode:binstruct.int64modes.lossy})
	.int64le('g', {int64mode:binstruct.int64modes.lossy})
	.int64le('h', {int64mode:binstruct.int64modes.copy})
	.int64le('i', {int64mode:binstruct.int64modes.slice})
	.int8('j')
	.int16le('k')
	.int16le('m')
	.int16le('n')
	.int32le('p')
	.int32le('q');
	
[ssl.wrap(buf), ssl.unpack(buf)].forEach((sle) => {
	assert.equal(sle.a, 1);
	assert.equal(sle.b, 2 | (3 << 8));
	assert.equal(sle.c, 4 | (5 << 8) | (6 << 16) | (7 << 24));
	assert.equal(sle.d, (15 << 8) | (1 << 16) | (2 << 24) | (3 << 32) | (4 << 40) | (15 << 48));
	assert.equal(sle.e, (15 << 8) | (1 << 16) | (2 << 24) | (3 << 32) | (4 << 40) | (15 << 48));
	assert.equal(sle.f, Infinity);
	assert.equal(sle.g, -Infinity);
	assert.equal(sle.h.toString('hex'), new Buffer([1,2,3,4,5,6,7,8]).toString('hex'));
	assert.equal(sle.i.toString('hex'), new Buffer([1,2,3,4,5,6,7,8]).toString('hex'));
	assert.equal(sle.j, -13);
	assert.equal(sle.k, -1);
	assert.equal(sle.m, -256);
	assert.equal(sle.n, 255);
	assert.equal(sle.p, 255);
	assert.equal(sle.q, -16777216);
});

// Read signed big-endian values from a buffer
var ssb = binstruct.def()
	.int8('a')
	.int16be('b')
	.int32be('c')
	.int64be('d', {int64mode:binstruct.int64modes.strict})
	.int64be('e', {int64mode:binstruct.int64modes.lossy})
	.int64be('f', {int64mode:binstruct.int64modes.lossy})
	.int64be('g', {int64mode:binstruct.int64modes.lossy})
	.int64be('h', {int64mode:binstruct.int64modes.copy})
	.int64be('i', {int64mode:binstruct.int64modes.slice})
	.int8('j')
	.int16be('k')
	.int16be('m')
	.int16be('n')
	.int32be('p')
	.int32be('q');

[ssb.wrap(buf), ssb.unpack(buf)].forEach((sbe) => {
	assert.equal(sbe.a, 1);
	assert.equal(sbe.b, 3 | (2 << 8));
	assert.equal(sbe.c, 7 | (6 << 8) | (5 << 16) | (4 << 24));
	assert.equal(sbe.d, (15 << 8) | (4 << 16) | (3 << 24) | (2 << 32) | (1 << 40) | (15 << 48));
	assert.equal(sbe.e, (15 << 8) | (4 << 16) | (3 << 24) | (2 << 32) | (1 << 40) | (15 << 48));
	assert.equal(sbe.f, Infinity);
	assert.equal(sbe.g, -Infinity);
	assert.equal(sbe.h.toString('hex'), new Buffer([1,2,3,4,5,6,7,8]).toString('hex'));
	assert.equal(sbe.i.toString('hex'), new Buffer([1,2,3,4,5,6,7,8]).toString('hex'));
	assert.equal(sbe.j, -13);
	assert.equal(sbe.k, -1);
	assert.equal(sbe.m, 255);
	assert.equal(sbe.n, -256);
	assert.equal(sbe.p, -16777216);
	assert.equal(sbe.q, 255);
});

// Read unsigned little-endian values from a buffer
var ssl = binstruct.def()
	.uint8('a')
	.uint16le('b')
	.uint32le('c')
	.uint64le('d', {int64mode:binstruct.int64modes.strict})
	.uint64le('e', {int64mode:binstruct.int64modes.lossy})
	.uint64le('f', {int64mode:binstruct.int64modes.lossy})
	.uint64le('g', {int64mode:binstruct.int64modes.lossy})
	.uint64le('h', {int64mode:binstruct.int64modes.copy})
	.uint64le('i', {int64mode:binstruct.int64modes.slice})
	.uint8('j')
	.uint16le('k')
	.uint16le('m')
	.uint16le('n')
	.uint32le('p')
	.uint32le('q');
	
[ssl.wrap(buf), ssl.unpack(buf)].forEach((ule) => {
	assert.equal(ule.a, 1);
	assert.equal(ule.b, 2 | (3 << 8));
	assert.equal(ule.c, 4 | (5 << 8) | (6 << 16) | (7 << 24));
	assert.equal(ule.d, (15 << 8) | (1 << 16) | (2 << 24) | (3 << 32) | (4 << 40) | (15 << 48));
	assert.equal(ule.e, (15 << 8) | (1 << 16) | (2 << 24) | (3 << 32) | (4 << 40) | (15 << 48));
	assert.equal(ule.f, Infinity);
	assert.equal(ule.g, Infinity);
	assert.equal(ule.h.toString('hex'), new Buffer([1,2,3,4,5,6,7,8]).toString('hex'));
	assert.equal(ule.i.toString('hex'), new Buffer([1,2,3,4,5,6,7,8]).toString('hex'));
	assert.equal(ule.j, 243);
	assert.equal(ule.k, 65535);
	assert.equal(ule.m, 65280);
	assert.equal(ule.n, 255);
	assert.equal(ule.p, 255);
	assert.equal(ule.q, 0xff000000);
});

// Read unsigned big-endian values from a buffer
var ssb = binstruct.def({int64mode:'int64'})
	.byte('a')
	.uint16be('b')
	.uint32be('c')
	.uint64be('d', {int64mode:binstruct.int64modes.strict})
	.uint64be('e', {int64mode:binstruct.int64modes.lossy})
	.uint64be('f', {int64mode:binstruct.int64modes.lossy})
	.uint64be('g', {int64mode:binstruct.int64modes.lossy})
	.uint64be('h', {int64mode:binstruct.int64modes.copy})
	.uint64be('i', {int64mode:binstruct.int64modes.slice})
	.uint8('j')
	.uint16be('k')
	.uint16be('m')
	.uint16be('n')
	.uint32be('p')
	.uint32be('q');
	
[ssb.wrap(buf), ssb.unpack(buf)].forEach((ube) => {
	assert.equal(ube.a, 1);
	assert.equal(ube.b, 3 | (2 << 8));
	assert.equal(ube.c, 7 | (6 << 8) | (5 << 16) | (4 << 24));
	assert.equal(ube.d, (15 << 8) | (4 << 16) | (3 << 24) | (2 << 32) | (1 << 40) | (15 << 48));
	assert.equal(ube.e, (15 << 8) | (4 << 16) | (3 << 24) | (2 << 32) | (1 << 40) | (15 << 48));
	assert.equal(ube.f, Infinity);
	assert.equal(ube.g, Infinity);
	assert.equal(ube.h.toString('hex'), new Buffer([1,2,3,4,5,6,7,8]).toString('hex'));
	assert.equal(ube.i.toString('hex'), new Buffer([1,2,3,4,5,6,7,8]).toString('hex'));
	assert.equal(ube.j, 243);
	assert.equal(ube.k, 65535);
	assert.equal(ube.m, 255);
	assert.equal(ube.n, 0xff00);
	assert.equal(ube.p, 0xff000000);
	assert.equal(ube.q, 255);
});

// Now test some floating point numbers
// Need a comparison that allows for the fact that floats have some
// error during encoding/decoding.
assert.equalFloat = function(actual, expected, marginForError, message) {
	if(typeof(marginForError) === 'undefined') {
		marginForError = 0.000001;
	}
	// Check if we're within the margin of error
	if(Math.abs(expected-actual) <= marginForError) {
		return;
	}
	// Otherwise, pass along to assert.equal and let it throw the error
	assert.equal(actual, expected, message);
};

assert.equalFloat(binstruct.def({littleEndian:true})
		.double('val')
		.wrap(new Buffer('97d17e5afb210940', 'hex'))
		.val, 3.1415927);
assert.equalFloat(binstruct.def({littleEndian:true})
		.double('val')
		.wrap(new Buffer('295c8fc2d51cc8c0', 'hex'))
		.val, -12345.67);
assert.equalFloat(binstruct.def()
		.doublele('val')
		.wrap(new Buffer('97d17e5afb210940', 'hex'))
		.val, 3.1415927);
assert.equalFloat(binstruct.def()
		.double('val')
		.wrap(new Buffer('400921fb5a7ed197', 'hex'))
		.val, 3.1415927);
assert.equalFloat(binstruct.def()
		.doublebe('val')
		.wrap(new Buffer('400921fb5a7ed197', 'hex'))
		.val, 3.1415927);
assert.equalFloat(binstruct.def()
		.double('val')
		.wrap(new Buffer('c0c81cd5c28f5c29', 'hex'))
		.val, -12345.67);

assert.equalFloat(binstruct.def({littleEndian:true})
		.float('val')
		.wrap(new Buffer('c3f54840', 'hex'))
		.val, 3.14);
assert.equalFloat(binstruct.def({littleEndian:true})
		.float('val')
		.wrap(new Buffer('a47045c1', 'hex'))
		.val, -12.34);
assert.equalFloat(binstruct.def()
		.floatle('val')
		.wrap(new Buffer('c3f54840', 'hex'))
		.val, 3.14);
assert.equalFloat(binstruct.def()
		.float('val')
		.wrap(new Buffer('4048f5c3', 'hex'))
		.val, 3.14);
assert.equalFloat(binstruct.def()
		.floatbe('val')
		.wrap(new Buffer('4048f5c3', 'hex'))
		.val, 3.14);
assert.equalFloat(binstruct.def()
		.float('val')
		.wrap(new Buffer('c14570a4', 'hex'))
		.val, -12.34);

// Test read/write via a wrapper
var iobuf = new Buffer([1,2,3,4]);
var le32 = binstruct.def().uint32le('val').wrap(iobuf);
var be32 = binstruct.def().uint32be('val').wrap(iobuf);
le32.val = be32.val;
assert.equal('04030201', iobuf.toString('hex'));
be32.val = le32.val;
assert.equal('01020304', iobuf.toString('hex'));
var lepair = binstruct.def().uint16le('a').uint16le('b').wrap(iobuf);
var bepair = binstruct.def().uint16be('a').uint16be('b').wrap(iobuf);
lepair.a = lepair.b;
assert.equal('03040304', iobuf.toString('hex'));
bepair.a = lepair.a;
assert.equal('04030304', iobuf.toString('hex'));
bepair.b = 0x0807;
assert.equal('04030807', iobuf.toString('hex'));
lepair.a = 0x0807;
assert.equal('07080807', iobuf.toString('hex'));

// Test read/write using an object
iobuf = new Buffer([1,2,3,4,5,6,7]);
var ledef = binstruct.def().uint32le('val').uint16le('short').byte('b');
var ledata = ledef.read(iobuf);
assert.equal(0x04030201, ledata.val);
assert.equal(0x0605, ledata.short);
assert.equal(0x07, ledata.b);
ledata.val = 0x05060708;
ledata.short = 0x090a;
ledata.b = 0xb;
assert.equal('01020304050607', iobuf.toString('hex'));
ledef.write(ledata, iobuf);
assert.equal('080706050a090b', iobuf.toString('hex'));

// Read/write at an offset
var iobuf2 = new Buffer([1,2,3,4,5,6,7,8,9,10,11]);
ledef.write(ledata, iobuf2, 2);
assert.equal('0102'+iobuf.toString('hex')+'0a0b', iobuf2.toString('hex'));

// write() with no parameters creates a new buffer
assert.equal(ledef.write(ledata).toString('hex'), iobuf.toString('hex'));

// Test default values on write()
assert.equal(binstruct.def().uint32(0x01020304).write().toString('hex'),
		     '01020304');

//Test default values on writeValues() and checkValues() on a wrapper
var buf = new Buffer(2);
binstruct.def()
     .byte(1)
     .byte(2)
     .wrap(buf)
     .writeValues();
assert.equal(buf.toString('hex'), '0102');

assert.doesNotThrow(function() {
	binstruct.def().uint16(0x0102).wrap(new Buffer([1,2])).checkValues();
});
assert.throws(function() {
	binstruct.def().uint16(0x0102).wrap(new Buffer([5,6])).checkValues();
});

// Does checkSize() really check the size?
assert.doesNotThrow(function() {
	binstruct.def().uint16(0x0102).checkSize(2);
});
assert.throws(function() {
	binstruct.def().uint16(0x0102).checkSize(7);
});
