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


class OBJGroup
{
    constructor( name, first_vertex_index, first_tcc_index )
    {
        this.name       = name
        this.num_verts  = 0
        this.num_tris   = 0
        this.num_tcc    = 0
        this.first_vi   = first_vertex_index  // first vertex index in global list of indexes
        this.first_tcci = first_tcc_index
        this.coords     = []  // array with 'Float32Array', each one has a vertex coords (deleted after creating coords_data)
        this.tris       = []  // array with 'Uint32Array', each one has a triangle (deleted after creating triangles_data)
        this.tcc        = []  // array with 'Float32Array', each one a texture coordinates (2 floats) 
        this.coords_data    = null     // Float32Array with vertex coordinates 
        this.triangles_data = null     // Uint32Array with triangles indexes
    }
}

class OBJParser
{
    
    // -------------------------------------------------------------------------------------------------

    /**
     * Constructor. Parses the lines of an OBJ file, this version 
     *   - parser multigroup OBJ (file  optionally may have more than one 'g' commands)
     *   - considers just 'v','vt' and 'f' commands
     *   - ignores empty lines or lines starting with '#'
     * 
     * the built object includes these properties
     *   - parse_ok           {bool} -- true iif there where no errors
     *   - parse_message      {string} -- resulting message, if 'parse_ok' is 'fals', contains error description.
     *   - parse_message_line {string}  -- for some parse errors, the erroneous line
     *   - groups             {Array} -- array of groups, each group is an 'OBJGroup' instance           
     */
    constructor( lines )
    {
        
        const fname = 'OBJParser.constructor():'
        Log(`${fname} begins.`)

        // initialize object
        this.lines              = lines
        this.parse_ok           = false,    // parsing is erroneous excepto when 'parse_ok' is set to true 
        this.parse_message      = 'no errors found so far' ,
        this.parse_message_line = '(line text is not available for this error)'
        this.groups             = []  // groups array, each group is a separate mesh ???
        this.total_num_verts    = 0  // total number of vertexes, in all groups
        this.total_num_tris     = 0  // idem triangles
        this.total_num_tcc      = 0  // idem texture coordinates

        let curr_group = null  // current group being processed
        
        for( let ln = 0 ; ln < lines.length ; ln++ )
        {
            const tokens = lines[ln].trim().split(/\s+/)   // split the line into tokens, separated by one or more spaces
            this.parse_message_line = `at line # ${ln} == '${lines[ln]}'`

            if ( tokens.length === 0 )
                continue 
            else if ( tokens[0].substring(0,1) == '#' )
            {
                Log(`${fname} comments: ${lines[ln]}`)
                continue
            }

            // if first 'v','vt' or 'f' line comes before any 'g' line, create 'default' group 
            if ( ['v','vt','f'].includes( tokens[0] ) )
            if ( curr_group == null )
            {   curr_group = new OBJGroup( 'default', this.total_num_verts, this.total_num_tcc )
                this.groups.push( curr_group )
            }

            // process the line according to command in the first token
            
            if ( tokens[0] == 'g' )
            {
                if ( tokens.length < 2 )
                {   this.parse_message = "group name not found after 'g' line"
                    return
                }
                curr_group = new OBJGroup( tokens[1], this.total_num_verts, this.total_num_tcc )

                for( let i = 2 ; i < tokens.length ; i++ )
                    curr_group.name += `/${tokens[i]}`
                
                this.groups.push( curr_group )
            }
            else if ( tokens[0] == 'v' )
            {    
                // process 'v' line (we ignore values beyond the first three, so far)
                if ( tokens.length < 4 )
                {   this.parse_message = `expected at least 3 values in a 'v' line, but found just ${tokens.length-1}` 
                    return
                }
                curr_group.num_verts ++
                this.total_num_verts ++

                const 
                    cx = parseFloat( tokens[1] ),
                    cy = parseFloat( tokens[2] ),
                    cz = parseFloat( tokens[3] )

                if ( cx == NaN || cy == NaN || cz == NaN )
                {   this.parse_message = `coordinates in 'v' line cannot be parsed as floats` 
                    return
                }
                curr_group.coords.push ( new Float32Array([ cx, cy, cz ]) )
            }
            else if ( tokens[0] == 'f' )
            {    
                // process 'f' line (we only accept triangles) (just ingore vertexes beyond 3rd ......????)
                if ( tokens.length != 4 && tokens.length != 5 )
                {   this.parse_message = `expected 3 or 4 vertexes in a 'f' line, but found  ${tokens.length-1}` 
                    return
                }
                const v_indexes = new Uint32Array( tokens.length-1 )

                for( let i = 0 ; i < tokens.length-1 ; i++ )
                {   const 
                        strs = tokens[i+1].split("/"),
                        vidx = parseInt( strs[0] )

                    if ( vidx === NaN )
                    {   this.parse_message = `cannot convert string '${strs[0]}' in 'f' line to non-zero positive integer` 
                        return
                    }
                    if ( vidx <= 0 )
                    {   this.parse_message = `cannot accept 0 or negative integer in 'f' line (found ${vidx})` 
                        return
                    }
                    v_indexes[i] = vidx-1  /// indexes in the OBJ file start from 1, but every other index in the world starts at 0
                
                    // TODO: process the texture coordinates indexes after the / ......
                
                }
                if ( tokens.length == 4 )  // 3 indexes: add triangular face
                {   curr_group.tris.push( v_indexes )
                    curr_group.num_tris ++
                    this.total_num_tris ++
                }
                else // 4 indexes: found a rectangular face: add two triangles  
                {   curr_group.tris.push( new Uint32Array( [ v_indexes[0], v_indexes[1], v_indexes[2] ]) )
                    curr_group.tris.push( new Uint32Array( [ v_indexes[0], v_indexes[2], v_indexes[3] ]) )
                    curr_group.num_tris += 2
                    this.total_num_tris += 2
                }
            }
            else if ( tokens[0] == 'vt' )
            {    
                // process 'vt' line 
                if ( tokens.length != 3 && tokens.length != 4 )
                {   this.parse_message = `expected 2 or 3 values in a 'vt' line, but found  ${tokens.length-1}` 
                    return
                }
                const s    = parseFloat( tokens[1] ),
                      t    = parseFloat( tokens[2] )   
                      // we are ognoring third texture coord ...

                if ( s === NaN  || t === NaN )
                {   this.parse_message = `cannot convert strings '${tokens[1]}' or '${tokens[2]}' in 'vt' line to non-zero positive floats` 
                    return
                }
                const vtcc = new Float32Array([ s, 1-t ])   
                curr_group.tcc.push( vtcc )
                curr_group.num_tcc ++
            }
        }
        Log(`${fname} lines processed: total num_verts == ${this.total_num_verts}, ${this.total_num_tris}`)
        Log(`${fname} copying coordinates and triangles .....`)

        // create  'coords_data' and 'triangles_data' for each group (and check indexes are in range)
        for ( let group of this.groups )
        {
            Log(`${fname} group '${group.name}', num_verts == ${group.num_verts}, num_tris == ${group.num_tris}, num_tcc == ${group.num_tcc}`)
            
            
            // create and fill 'group.coords_data' from 'group.coords'
            group.coords_data    = new Float32Array( group.num_verts*3 )
            
            for( let iv = 0 ; iv < group.num_verts ; iv ++ )
                for( let j = 0 ; j < 3 ; j++ )
                    group.coords_data[ 3*iv+j ] = (group.coords[iv])[j]
            
            
            // create and fill 'group.triangles_data' from 'group.tris'

            group.triangles_data = new Uint32Array( group.num_tris*3 )
            
            for( let it = 0 ; it < group.num_tris ; it ++ )
            for( let j = 0 ; j < 3 ; j++ )
            {
                const iv = (group.tris[it])[j] - group.first_vi
                if ( iv < 0  || group.num_verts <= iv )
                {   this.parse_message = `vertex index ${iv} is out of its group range (${group.first_vi} ... ${group.first_vi+group.num_verts-1}).`
                    return
                }
                group.triangles_data[ 3*it+j ] = iv 
            }

            // create and fill 'group.texcoo_data' from 'group.tcc'
            // TODO, not so easy ......
            
            // remove no longer used arrays ( can be very large )
            group.coords = null   
            group.tris   = null   
        }
        
        // done
        this.parse_ok = true 
        Log(`${fname} END (parse ok)`)
    }

} // ends OBJParser class
