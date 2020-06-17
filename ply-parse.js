
// -------------------------------------------------------------------------------------------------

/**
 * Parses the lines of a PLY file, this version 
 *   - expects each vertex line to include vertex coords and vertex color 
 *   - the color is a RGBA 4-tuple, each value is an integer in 0..255
 *   - it only handles triangular meshes
 * returns an object with 3 arrays: vertex cooordinates, vertexes colors, and faces (indexes)
 * 
 * @param {Array<string>} lines -- the lines of a ply file. 
 * @returns {object} -- the object includes:
 *                        - parse_ok {bool} -- true iif there where no errors
 *                        - parse_message {string} -- resulting message, if ! parse_ok, error description.
 *                        - vertex_coords {Float32Array}
 *                        - vertex_colors {Float32Array}
 *                        - triangles_data {Uint32Array}
 */
function ParsePLYLines_VC( lines )
{
    const fname = 'MeshFromPLYLines.parseLines():'
    if ( debug_mesh ) 
        Log(`${fname} begins.`)
    let result = { parse_ok: false, parse_message: 'no errors found so far' }
    
    result.parse_ok      = false 
    result.parse_message = '(no message, remember this is WIP)'

    if ( lines.length < 3 )
    {   
        result.parse_message = "Invalid file, it has less than 3 lines"
        return result
    }
    if ( lines[0] != 'ply' )
    {   
        result.parse_message = "Invalid header: first line is not exactly 'ply'"
        return result
    }
    if ( lines[1] != 'format ascii 1.0' )
    {
        result.parse_message = "Invalid header: second line is not exactly 'format ascii 1.0'"
        return result
    }

    // seek for 'end_header' line
    let ehl = 2    // end header line num
    while( ehl < lines.length && lines[ehl] != 'end_header'   )
        ehl ++ 

    if ( lines.length == ehl )
    {
        result.parse_message = "end of header not found"
        return result 
    }
    
    // get number of vertexes and number of triangles
    let num_verts      = 0,  
        num_tris       = 0,
        num_verts_line = 0,
        num_tris_line  = 0

    for( let l = 3 ; l < ehl ; l++ )
    {
        const tokens = lines[l].trim().split(' ')

        if ( tokens.length == 0 )
            continue 
        if ( tokens[0] == 'comment' )
            continue

        if ( tokens[0] == 'element')
        {
            if ( tokens.length < 3 )
            {
                result.parse_message = "line starting with 'element' has invalid format (missing element name or number)"
                return result
            }
            if ( tokens[1] == 'vertex' )
            {
                num_verts = parseInt( tokens[2], 10 )
                num_verts_line = l 
                if ( num_verts <= 0 )
                {
                    result.parse_message = `number of vertexes is not a positive integer (it is '${tokens[2]}')`
                    return result
                }
                
            }
            else if ( tokens[1] == 'face')
            {
                num_tris = parseInt( tokens[2], 10 )
                num_tris_line = l
                if ( num_tris  <= 0 )
                {
                    result.parse_message = `number of triangles is not a positive integer (it is '${tokens[2]}')`
                    return result
                }
            }
            else
            {
                result.parse_message = "expected just 'vertex' or 'face' after 'element'"
                return result
            }
        }
    }

    if ( num_tris_line < num_verts_line )
    {
        result.parse_message = "'element face' before 'element vertex' (must be the other way around)"
        return result
    }
    if ( num_verts < 3 )
    {
        result.parse_message = `number of vertexes must be 3 at least (it is ${num_verts})`
        return result
    }
    if ( lines.length < ehl + num_tris + num_verts )
    {
        result.parse_message = `the number of lines is smaller than the required for header + vertexes + faces`
        return result
    }

    //// TODO: check properties are as expected .......
    
    // we assume the header is ok. lets load 

    if ( debug_mesh ) 
    {
        Log(`${fname} num_verts == ${num_verts}`)
        Log(`${fname} num_tris  == ${num_tris}`)
    }
    // const max_num_tris = -1 // 100000
    // if (  max_num_tris > 0 && num_tris >  max_num_tris )  // truncate number of vertexes .....??
    //     num_tris = max_num_tris

    coords_data     = new Float32Array( 3*num_verts )
    triangles_data  = new Uint32Array( 3*num_tris )
    colors_data     = new Float32Array( 3*num_verts )
    
    // load vertexes coords and  vertex colors

    let iv = 0  // vertex index

    for( let l = ehl+1 ; l < ehl+1+num_verts ; l++ )
    {
        const tokens = lines[l].trim().split(' ')
        if ( tokens.length != 7 )
        {
            result.parse_message =  `vertex at line ${l}: expected 7 numbers but found ${tokens.length}\n`
            result.parse_message += `line ${l} is: '${lines[l]}'`
            return result
        }
        const 
            x = -parseFloat( tokens[0] ),
            y = parseFloat( tokens[2] ),   //// flip Y <-> Z ???
            z = parseFloat( tokens[1] ),    //// flip and negate ???
            r = parseInt( tokens[3] ),
            g = parseInt( tokens[4] ),
            b = parseInt( tokens[5] ),
            a = parseInt( tokens[6] )

        const p = 3*iv 
        
        coords_data[p+0] = x 
        coords_data[p+1] = y
        coords_data[p+2] = z 

        colors_data[p+0] = r/255.0
        colors_data[p+1] = g/255.0
        colors_data[p+2] = b/255.0

        iv++ 
    }

    let it = 0  // triangle number

    for( let l = ehl+1+num_verts ; l < ehl+1+num_verts+num_tris ; l++ )
    {
        const tokens = lines[l].trim().split(' ')
        if ( tokens.length != 4 )
        {
            result.parse_message = `face at line ${l}: expected 4 numbers but found ${tokens.length}\n`
            result.parse_message += `line ${l} is: '${lines[l]}'`
            return result
        }
        const nv = parseInt( tokens[0] )
        if ( nv != 3 )
        {
            result.parse_message = `face at line ${l}: expected a face with 3 vertexes but found ${nv}\n`
            result.parse_message += `line ${l} is: '${lines[l]}'`
            return result
        }
        const 
            i0 = parseInt( tokens[1] ),
            i1 = parseInt( tokens[2] ),
            i2 = parseInt( tokens[3] )

        if ( i0 < 0 || num_verts < i0  || 
             i1 < 0 || num_verts < i1  || 
             i2 < 0 || num_verts < i2  )
        {
            result.parse_message = `face at line ${l}: a vertex index is out of range (indexes are: ${i0}, ${i1}, ${i2}), num verts is ${num_verts}\n`
            result.parse_message += `line ${l} is: '${lines[l]}'`
            return result
        }
        const p = 3*it 

        triangles_data[p+0] = i0 
        triangles_data[p+1] = i1
        triangles_data[p+2] = i2 
        
        it++ 
    }

    const normalize_coords = true
    
    if ( normalize_coords )
    {
        // normalize coordinates to -1 to +1 
        let   bbox   = ComputeBBox( coords_data )
        const maxdim = Math.max( bbox.xmax-bbox.xmin, bbox.ymax-bbox.ymin, bbox.zmax-bbox.zmin ),
              center = [ 0.5*(bbox.xmax+bbox.xmin), 0.5*(bbox.ymax+bbox.ymin), 0.5*(bbox.zmax+bbox.zmin) ],
              scale  = 2.0/maxdim

        if ( debug_mesh )
        {  
            Log( `${fname}: maxdim == ${maxdim}` )
            Log( `${fname}: center == ${center}` )
        }
        for( let iv = 0 ; iv < num_verts ; iv++ )
        {
            const p = 3*iv
            for( let ic = 0 ; ic < 3 ; ic++ )
                coords_data[p+ic] = scale*( coords_data[p+ic] - center[ic] )
        }
    }
    // done
    result.coords_data = coords_data
    result.colors_data = colors_data
    result.triangles_data = triangles_data
    result.parse_ok   = true // done!

    return result
}

// -------------------------------------------------------------------------------------------------

/**
 * Parses the lines of a PLY file, this version 
 *   - expects face texture coordinates (FTCC) (each vertex has its own t.cc. for each face)
 *   - it only handles triangular meshes
 * returns an object with 3 arrays: vertex cooordinates, vertexes colors, and faces (indexes)
 * (at this development stage, this directly transfers colors from faces to vertexes, THIS IS A HACK)
 * 
 * @param {Array<string>} lines -- the lines of a ply file. 
 * @returns {object} -- the object includes the followinf properties
 *       - parse_ok        {bool} -- true iif there where no errors
 *       - parse_message   {string} -- resulting message, if ! parse_ok, error description.
 *       - coords_data     {Float32Array} - vertex coordinates  (length is 3*num verts)
 *       - texcoo_data     {Float32Array} - vertex texture coordinates (length is 2*num_verts)
 *       - triangles_data  {Uint32Array} - indexes in each face (length is 3*num_verts)
 */
function ParsePLYLines_FTCC( lines )
{
    const fname = 'ParsePLYLines_FTCC():'
    if ( debug_mesh ) 
        Log(`${fname} begins.`)
    let result = { parse_ok: false, parse_message: 'no errors found so far' }
    
    result.parse_ok      = false 
    result.parse_message = '(no message, remember this is WIP)'

    if ( lines.length < 3 )
    {   
        result.parse_message = "Invalid file, it has less than 3 lines"
        return result
    }
    if ( lines[0] != 'ply' )
    {   
        result.parse_message = "Invalid header: first line is not exactly 'ply'"
        return result
    }
    if ( lines[1] != 'format ascii 1.0' )
    {
        result.parse_message = "Invalid header: second line is not exactly 'format ascii 1.0'"
        return result
    }

    // seek for 'end_header' line
    let ehl = 2    // end header line num
    while( ehl < lines.length && lines[ehl] != 'end_header'   )
        ehl ++ 

    if ( lines.length == ehl )
    {
        result.parse_message = "end of header not found"
        return result 
    }
    
    // get number of vertexes and number of triangles
    let num_verts      = 0,  
        num_tris       = 0,
        num_verts_line = 0,
        num_tris_line  = 0

    for( let l = 3 ; l < ehl ; l++ )
    {
        const tokens = lines[l].trim().split(' ')

        if ( tokens.length == 0 )
            continue 
        if ( tokens[0] == 'comment' )
            continue

        if ( tokens[0] == 'element')
        {
            if ( tokens.length < 3 )
            {
                result.parse_message = "line starting with 'element' has invalid format (missing element name or number)"
                return result
            }
            if ( tokens[1] == 'vertex' )
            {
                num_verts = parseInt( tokens[2], 10 )
                num_verts_line = l 
                if ( num_verts <= 0 )
                {
                    result.parse_message = `number of vertexes is not a positive integer (it is '${tokens[2]}')`
                    return result
                }
                
            }
            else if ( tokens[1] == 'face')
            {
                num_tris = parseInt( tokens[2], 10 )
                num_tris_line = l
                if ( num_tris  <= 0 )
                {
                    result.parse_message = `number of triangles is not a positive integer (it is '${tokens[2]}')`
                    return result
                }
            }
            else
            {
                result.parse_message = "expected just 'vertex' or 'face' after 'element'"
                return result
            }
        }
    }

    if ( num_tris_line < num_verts_line )
    {
        result.parse_message = "'element face' before 'element vertex' (must be the other way around)"
        return result
    }
    if ( num_verts < 3 )
    {
        result.parse_message = `number of vertexes must be 3 at least (it is ${num_verts})`
        return result
    }
    if ( lines.length < ehl + num_tris + num_verts )
    {
        result.parse_message = `the number of lines is smaller than the required for header + vertexes + faces`
        return result
    }

    //// TODO: check properties are as expected .......
    
    // we assume the header is ok. lets load 

    if ( debug_mesh ) 
    {
        Log(`${fname} num_verts == ${num_verts}`)
        Log(`${fname} num_tris  == ${num_tris}`)
    }
    
    let 
        coords_data     = new Float32Array( 3*num_verts ),
        triangles_data  = new Uint32Array( 3*num_tris ),
        texcoo_data     = new Float32Array( 2*num_verts )
    
    // load vertexes coords and  vertex colors

    let iv = 0  // vertex index

    for( let l = ehl+1 ; l < ehl+1+num_verts ; l++ )
    {
        const tokens = lines[l].trim().split(' ')
        if ( tokens.length != 3 )
        {
            result.parse_message =  `vertex at line ${l}: expected 3 numbers but found ${tokens.length}\n`
            result.parse_message += `line ${l} is: '${lines[l]}'`
            return result
        }
        const p = 3*iv 
        coords_data[p+0] = -parseFloat( tokens[0] ),  /// negate X ?
        coords_data[p+1] =  parseFloat( tokens[2] ),   //// flip Y <-> Z ???
        coords_data[p+2] =  parseFloat( tokens[1] )
        iv++ 
    }

    let it = 0  // triangle number

    for( let l = ehl+1+num_verts ; l < ehl+1+num_verts+num_tris ; l++ )
    {
        const tokens = lines[l].trim().split(' ')
        if ( tokens.length != 11 )
        {
            result.parse_message = `face at line ${l}: expected 11 numbers but found ${tokens.length}\n`
            result.parse_message += `line ${l} is: '${lines[l]}'`
            return result
        }
        const nv = parseInt( tokens[0] )
        if ( nv != 3 )
        {
            result.parse_message = `face at line ${l}: expected a face with 3 vertexes but found ${nv}\n`
            result.parse_message += `line ${l} is: '${lines[l]}'`
            return result
        }

        // check and get the three vertex indexes for this face
        const 
            i0 = parseInt( tokens[1] ),
            i1 = parseInt( tokens[2] ),
            i2 = parseInt( tokens[3] )

        if ( i0 < 0 || num_verts < i0  || 
             i1 < 0 || num_verts < i1  || 
             i2 < 0 || num_verts < i2  )
        {
            result.parse_message = `face at line ${l}: a vertex index is out of range (indexes are: ${i0}, ${i1}, ${i2})\n`
            result.parse_message += `line ${l} is: '${lines[l]}'`
            return result
        }
        const p = 3*it 

        triangles_data[p+0] = i0 
        triangles_data[p+1] = i1
        triangles_data[p+2] = i2 
        
        it++ 

        // check and get the 3 pairs with texture coordinates

        const nct = parseInt( tokens[4] )  
        if ( nct != 6 )
        {
            result.parse_message = `face at line ${l}: expected a face with 6 texture coord numbers, but found ${nct}\n`
            result.parse_message += `line ${l} is: '${lines[l]}'`
            return result
        }

        const p0 = 2*i0, 
              p1 = 2*i1, 
              p2 = 2*i2

        texcoo_data[p0+0] = parseFloat( tokens[5] ); texcoo_data[p0+1] = 1.0-parseFloat( tokens[6] )
        texcoo_data[p1+0] = parseFloat( tokens[7] ); texcoo_data[p1+1] = 1.0-parseFloat( tokens[8] )
        texcoo_data[p2+0] = parseFloat( tokens[9] ); texcoo_data[p2+1] = 1.0-parseFloat( tokens[10] )
    }

    const normalize_coords = true
    
    if ( normalize_coords )
    {
        // normalize coordinates to -1 to +1 
        let   bbox   = ComputeBBox( coords_data )
        const maxdim = Math.max( bbox.xmax-bbox.xmin, bbox.ymax-bbox.ymin, bbox.zmax-bbox.zmin ),
              center = [ 0.5*(bbox.xmax+bbox.xmin), 0.5*(bbox.ymax+bbox.ymin), 0.5*(bbox.zmax+bbox.zmin) ],
              scale  = 2.0/maxdim

        if ( debug_mesh )
        {  
            Log( `${fname}: maxdim == ${maxdim}` )
            Log( `${fname}: center == ${center}` )
        }
        for( let iv = 0 ; iv < num_verts ; iv++ )
        {
            const p = 3*iv
            for( let ic = 0 ; ic < 3 ; ic++ )
                coords_data[p+ic] = scale*( coords_data[p+ic] - center[ic] )
        }
    }
    // done
    result.coords_data    = coords_data
    result.texcoo_data    = texcoo_data
    result.triangles_data = triangles_data
    result.parse_ok       = true // done!

    return result
}

