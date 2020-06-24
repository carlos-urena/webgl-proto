// -----------------------------------------------------------------------------
// File: obj-parser.js
// Class definition: OBJParser (parser for OBJ files with indexed triangle meshes)
//
// Info about OBJ format
// http://paulbourke.net/dataformats/obj/
//
// MIT License 
// Copyright (c) 2020 Carlos Ureña 
// (see LICENSE file)
// -----------------------------------------------------------------------------






const debug_obj_parse = true 


class OBJParser
{
    
    // -------------------------------------------------------------------------------------------------

    /**
     * Constructor. Parses the lines of a OBJ file, this version 
     *   - ....
     * 
     * the built object includes these properties
     *   - parse_ok       {bool} -- true iif there where no errors
     *   - parse_message  {string} -- resulting message, if 'parse_ok' is 'fals', contains error description.
     *   - parse_message_line {string}  -- for some parse errors, the erroneous line
     *   - ....
     */
    constructor( lines )
    {
        
        const fname = 'OBJParser.constructor():'
        if ( debug_obj_parse ) 
            Log(`${fname} begins.`)

        // initialize object
        this.lines              = lines
        this.parse_ok           = false,    // parsing is erroneous excepto when 'parse_ok' is set to true 
        this.parse_message      = 'no errors found so far' ,
        this.parse_message_line = '(line text is not available for this error)'
        
        // .... do something here ... ;-)

        // normalize coordinates between -1 and +1 (optional...)
        //NormalizeCoords( this.coords_data )

        // done
        this.parse_ok = true 
    }

} // ends OBJParser class
