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
    constructor()
    {
        this.name      = 'default' 
        this.num_verts = 0
        this.num_tris  = 0
        this.num_tcc   = 0
        this.coords    = []   // array with 'Float32Array', each one has a vertex coords (deleted after creating coords_data)
        this.tris      = []   // array with 'Uint32Array', each one has a triangle (deleted after creating triangles_data)
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
        this.total_num_verts    = 0
        this.total_num_tris     = 0

        let curr_group = null  // current group being processed
        
        for( let ln = 0 ; ln < lines.length ; ln++ )
        {
            const tokens = lines[ln].trim().split(/\s+/)
            this.parse_message_line = `at line # ${ln} == '${lines[ln]}'`

            if ( tokens.length === 0 )
                continue 
            else if ( tokens[0].substring(0,1) == '#' )
            {
                Log(`${fname} comments: ${lines[ln]}`)
                continue
            }

            // when neccesary, if no 'g' command has been found so far, create the default group
            if ( ['v','vt','f'].includes( tokens[0] ) )
            if ( curr_group == null )
            {   
                curr_group = new OBJGroup()
                this.groups.push( curr_group )
            }
            // process 
            if ( tokens[0] == 'g' )
            {
                if ( tokens.length < 2 )
                {   
                    this.parse_message = "group name not found after 'g' line"
                    return
                }
                curr_group      = new OBJGroup()
                curr_group.name = tokens[1]

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
                {
                    const 
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
                // increase number of texture coords for this group
                curr_group.num_tcc ++
            }
        }
        Log(`${fname} lines processed: total num_verts == ${this.total_num_verts}, ${this.total_num_tris}`)
        Log(`${fname} copying coordinates and triangles .....`)

        // create  'coords_data' and 'triangles_data' for each group
        for ( let group of this.groups )
        {
            Log(`${fname} group '${group.name}', num_verts == ${group.num_verts}, num_tris == ${group.num_tris}, num_tcc == ${group.num_tcc}`)
            
            group.coords_data    = new Float32Array( group.num_verts*3 )
            group.triangles_data = new Uint32Array( group.num_tris*3 )

            let p = 0
            for( let iv = 0 ; iv < group.num_verts ; iv ++ )
            {
                group.coords_data[ p+0 ] = (group.coords[iv])[0]
                group.coords_data[ p+1 ] = (group.coords[iv])[1]
                group.coords_data[ p+2 ] = (group.coords[iv])[2]
                p += 3
            }

            p = 0
            for( let it = 0 ; it < group.num_tris ; it ++ )
            {
                group.coords_data[ p+0 ] = (group.tris[it])[0]
                group.coords_data[ p+1 ] = (group.tris[it])[1]
                group.coords_data[ p+2 ] = (group.tris[it])[2]
                p += 3
            }

            group.coords = null   // remove group coords
            group.tris   = null   // remove group triangles

        }
        

        // done
        this.parse_ok = true 
        Log(`${fname} END (parse ok)`)
    }

} // ends OBJParser class
