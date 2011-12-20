
## Binary Structure Helper

This module helps you work with binary structures in Buffers.
You first define the layout of your binary data and then use
that definition to convert objects to/from their binary
representation or you can wrap a buffer with an object where
getters/setters for fields update and read the buffer in place.

## Features

 - Use the same definition for reading and writing objects
 - Wrap a buffer to use getters/setters to operate directly on
   Buffer contents
 - Also able to read/write to/from objects
 - "Fluid API" structure definition is easy on the eyes
 - Customizable 64-bit integer support
 - Easy big-endian and little-endian support
 - No external dependencies or native extensions required (works in Windows!)

## Requirements

This module requires node 0.6 or better, as it uses the binary type
read/write methods on Buffer introduced with node 0.6.

## Numeric Types

Adding numeric fields to the structure definition requires calling
a method with the appropriate type name.

If a string is passed, it is used as the name of the field, otherwise
the field is basically skipped (padding).

 - int8, int16, int32, int64: Signed integers
 - byte, uint16, uint32, uint64: Unsigned integers
 - float: 32-bit IEEE floating point number
 - double: 64-bit IEEE floating point number

### Endian-ness / Byte Order

When defining a structure, the default is to use "big endian"
byte order when reading/writing numbers.  You can change the
default by specifying options to the constructor.  For example:

    var littleEndianStruct = require('binstruct')
        .def({littleEndian:true})
        .float('littleEndianFloat')
        .double('littleEndianDouble')
        .int32('littleEndianInteger');

You can also specify littleEndian by adding "le" to the type names
as you declare the structure.  For example:

    var littleEndianStruct = require('binstruct')
        .def()
        .floatle('littleEndianFloat')
        .doublele('littleEndianDouble')
        .int32le('littleEndianInteger');

This could conceivably allow you to have a mix of little and big endian
numbers in the same structure although in practice I doubt that would
ever happen.  Rather this may turn out be a shorter syntax when there
are relatively few fields - adding 'le' a few times could be less
painful than {littleEndian:true}.

### 64-bit Integers Support

Javascript doesn't normally support 64-bit numbers - all numbers are
represented as a 64-bit floating point value.  This can only represent a
53-bit signed integer, or a 52-bit unsigned integer correctly.

When reading 64-bit integers you can choose whether to convert to a
Javascript number or to store the number as a buffer.  If converting
to a number, you can choose whether an overflow should throw an error
or just set the field to Infinity or -Infinity.  If storing as a
buffer you can choose whether it should be a "slice" of the original
buffer or a copy.

 - strict: Convert to js number, throw Error on overflow.  This is the default mode.
 - lossy: Convert to js number, use Infinity/-Infinity on overflow
 - copy: Copy the literal bytes into a Buffer for the field value
 - slice: Field value is a "slice" containing the original bytes

To specify a mode, pass an options object to the initial call to
def() or as a parameter to a field definition with a property
'int64mode' mode set to a value from binstruct.int64modes.  Examples:

    var binstruct = require('binstruct');
    binstruct.def({int64mode:binstruct.int64modes.lossy});
    binstruct.def().uint64('a', {int64mode:binstruct.int64modes.copy});
    binstruct.def().int64('b', {int64mode:binstruct.int64modes.slice});

## Buffer Wrapping

The library may create a "wrapper" around a buffer which allows you
to read and write the binary fields from the buffer on the fly using
property getters and setters on the wrapper.  This allows for a
pleasant looking syntax for editing fields, and may save some time
if relatively few fields are actually used by the application.

Note, however, that this access isn't generally very fast, so it is
best to minimize the number of property reads and writes you do.

To create a wrapper call wrap() on your structure definition and
pass a buffer and an optional offset into that buffer at which to
read the structure.

    var binstruct = require('binstruct');
    var buf = new Buffer('ab');
    var twoBytes = binstruct.def()
        .byte('a')
        .byte('b')
        .wrap(buf);
    console.log(twoBytes.a, twoBytes.b); // 'a', 'b'
    twoBytes.a = 'x';
    twoBytes.b = 'y';
    console.log(buf.toString('utf8')); // 'xy'

## Pack/Unpack Buffers To/From Objects

The library allows you to 'pack' an object into a Buffer and 'unpack'
an object from a Buffer.

The 'unpack' operation goes through all the fields defined and populates
them into a new object and returns it.  Unlike with a wrapper, changes to
that object will not affect the underlying buffer.

The 'pack' operation goes through all the fields defined and encodes the
values for those fields from the provided object into the target buffer.


