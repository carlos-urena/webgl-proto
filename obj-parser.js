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
    constructor( name )
    {
        this.name = name
        this.in_num_coords  = 0
        this.in_num_texcoo  = 0
        this.in_num_faces   = 0

        this.out_num_verts = 0
        this.num_verts      = 0  // output number of vertexes  (out_coords.length)
        this.num_tris       = 0  // output number of triangles (out_triangles.length)

         // vertex map: used to convert from input pairs to output vertex indexes
        //  - the keys are strings like '123/456' as found in 'f' lines (vertex index / text.coord. index)
        //  - the values are integer output vertexes indexes (generated sequencially, starting at 0 for each group )
        this.v_map  = new Map() 

        // output arrays with generated mesh
        this.out_coords    = []  // array of Float32Array, (3 floats per output vertex)
        this.out_texcoo    = []  // array of Float32Array, (2 floats per output vertex)
        this.out_triangles = []  // array of Uint32Array, (3 integers per output triangle)

        // output buffers created from the output arrays (usable for OpenGL VAOs)
        this.coords_data    = null     // Float32Array with vertex coordinates  (3 floats per output vertex)
        this.texcoo_data    = null     // Float32Array with vertex texture coords (2 floats per ouput vertex)
        this.triangles_data = null     // Uint32Array with triangles indexes (3 integers per output face)
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
        this.parse_ok           = false,    // parsing is erroneous excepto when 'parse_ok' is explicitly set to true at the end
        this.parse_message      = 'no errors found so far' 
        this.parse_message_line = '(line text is not available for this error)'
        this.groups             = []  // groups array, each group is a separate mesh ???
        this.input_coords       = []  // array of Float32Arrays (3 floats per cell): raw vertex coordinates as found in the source lines
        this.input_texcoo       = []  // array of Float32Arrays (2 floats per cell): raw texture coordinates, as found in the source lines

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
            {   curr_group = new OBJGroup( 'default' )
                this.groups.push( curr_group )
            }

            // process the line according to command in the first token
            
            if ( tokens[0] == 'g' )
            {
                if ( tokens.length < 2 )
                {   this.parse_message = "group name not found after 'g' line"
                    return
                }
                curr_group = new OBJGroup( tokens[1]  )

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
                const cx = parseFloat( tokens[1] ),
                      cy = parseFloat( tokens[2] ),
                      cz = parseFloat( tokens[3] )
                if ( cx == NaN || cy == NaN || cz == NaN )
                {   this.parse_message = `coordinates in 'v' line cannot be parsed as floats` 
                    return
                }
                this.input_coords.push( new Float32Array([ cx, cy, cz ]) )
                curr_group.in_num_coords ++
            }
            else if ( tokens[0] == 'vt' )
            {    
                // process 'vt' line (a line with a texture coordinates tuple)
                if ( tokens.length != 3 && tokens.length != 4 )
                {   this.parse_message = `expected 2 or 3 values in a 'vt' line, but found  ${tokens.length-1}` 
                    return
                }
                const s  = parseFloat( tokens[1] ),
                      t  = parseFloat( tokens[2] )     // we are ignoring third texture coord ...
                if ( s === NaN  || t === NaN )
                {   this.parse_message = `cannot convert strings '${tokens[1]}' or '${tokens[2]}' in 'vt' line to non-zero positive floats` 
                    return
                }
                this.input_texcoo.push( new Float32Array([ s, 1-t ]) )
                curr_group.in_num_texcoo ++
            }
            else if ( tokens[0] == 'f' )
            {    
                // process 'f' line (both triangles and quads are accepted)
                if ( tokens.length != 4 && tokens.length != 5 )
                {   this.parse_message = `expected 3 or 4 vertexes in a 'f' line, but found  ${tokens.length-1}` 
                    return
                }
                let ovi = []   // array with 2 or 3 output vertex indexes, corresponding to this face

                // loop over each vertex in this face, the vertex is specified as a string ("123/456"), where: 
                //  first number is an input vertex index, second number is an input text.coords. index

                for( let i = 0 ; i < tokens.length-1 ; i++ )
                {   
                    const index_pair_str = tokens[i+1]
                    const index_strings  = index_pair_str.split("/")

                    if ( index_strings.length != 2 )
                    {   this.parse_message = `invalid 'f' line, expected just 2 integers per face vertex  (found this '${tokens[i+1]}')`
                        return
                    }
                    
                    // compute 'out_v_idx' 
                    let out_v_idx = -1
                    if ( curr_group.v_map.has( index_pair_str ) )
                    {
                        // pair already seen in this group, get output vertex index
                        out_v_idx = curr_group.v_map.get( index_pair_str ) 
                    }
                    else 
                    {
                        // the pair is new in this group: create new output vertex index and add it to map
                        out_v_idx = curr_group.out_num_verts 
                        curr_group.out_num_verts ++
                        curr_group.v_map.set( index_pair_str, out_v_idx )

                        // get and check the input vertex and tex.coo. indexes (in_vc_ind, in_tc_ind)
                        let in_vcc_ind = parseInt( index_strings[0] ),
                              in_tcc_ind = parseInt( index_strings[1] )
              
                        if ( in_vcc_ind === NaN || in_vcc_ind <= 0 ||   // 0 is not allowed, as indexes start at 1 according to the standard
                            in_tcc_ind === NaN  || in_tcc_ind <= 0  )  
                        {   
                            this.parse_message = `invalid integer value in 'f' line ('${index_strs[i+1]}')`
                            return
                        }
                        in_vcc_ind --  /// indexes in the OBJ file start from 1, but our arrays indexes start from '0'
                        in_tcc_ind --  // idem

                        if (  this.input_coords.length <= in_vcc_ind  ||  this.input_texcoo.length <= in_tcc_ind )
                        {
                            this.parse_message = `found forward reference to a still-not-seen input coords or tex.coords (in a 'f' line) ...`
                            return 
                        }

                        // gather coords. and texture coords. from input array and copy them onto output array
                        curr_group.out_coords.push( new Float32Array( this.input_coords[in_vcc_ind] ) )
                        curr_group.out_texcoo.push( new Float32Array( this.input_texcoo[in_tcc_ind] ) )
                    }

                    // add the index to 'ovi'
                    ovi.push( out_v_idx )
                } 

                // add 1 or 2 triangles to current's group output triangles
                if ( ovi.length == 3 )
                {
                    curr_group.out_triangles.push( new Uint32Array([ ovi[0], ovi[1], ovi[2] ]) ) 
                }
                else // ovi.length must be 4
                {
                    curr_group.out_triangles.push( new Uint32Array([ ovi[0], ovi[1], ovi[2] ]) ) 
                    curr_group.out_triangles.push( new Uint32Array([ ovi[0], ovi[2], ovi[3] ]) ) 
                    
                }

                curr_group.in_num_faces ++

            }
        }
        Log(`${fname} lines processed: total num_verts == ${this.total_num_verts}, ${this.total_num_tris}`)
        Log(`${fname} copying coordinates and triangles .....`)

        // create  'coords_data' and 'triangles_data' for each group (and check indexes are in range)
        for ( let group of this.groups )
        {
            const onv = group.out_coords.length,
                  ont = group.out_triangles.length 

            group.num_verts = onv
            group.num_tris  = ont 

            Log(`${fname} group '${group.name}' input:  coords = ${group.in_num_coords}, n.faces = ${group.in_num_faces}, num.tex.coo == ${group.in_num_texcoo}, `)
            Log(`${fname} group '${group.name}' output: n.vert = ${onv}, n.tris  = ${ont}  (check n.t.cc=${group.out_texcoo.length})`)
            
             
            // create and fill 'group.coords_data' from 'group.out_coords'
            group.coords_data  = new Float32Array( onv*3 )
            group.texcoo_data  = new Float32Array( onv*2 )
            for( let iv = 0 ; iv < onv ; iv ++ )
            {
                for( let j = 0 ; j < 3 ; j++ )
                   group.coords_data[ 3*iv+j ] = (group.out_coords[iv])[j]
                for( let k = 0 ; k < 2 ; k++ )
                    group.texcoo_data[ 3*iv+k ] = (group.out_texcoo[iv])[k]
            }    
            
            // create and fill 'group.triangles_data' from 'group.tris'

            group.triangles_data = new Uint32Array( ont*3 )
            for( let it = 0 ; it < ont ; it ++ )
            for( let j = 0 ; j < 3 ; j++ )
            {
                const iv = (group.out_triangles[it])[j] 
                if ( iv < 0  || onv <= iv )
                {   this.parse_message = `vertex index ${iv} is out of its group range (0..${onv-1})`
                    return
                }
                group.triangles_data[ 3*it+j ] = iv 
            }

            // remove no longer used arrays ( can be very large )
            //delete group.out_coords
            //delete group.out_texcoo 
            //delete group.out_triangles
        }
        
        // done
        this.parse_ok = true 
        Log(`${fname} END (parse ok)`)
    }

} // ends OBJParser class
