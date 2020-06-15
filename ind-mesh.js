
// -------------------------------------------------------------------------------------------------
/**
 * A class for an indexed triangles mesh
 */

class IndexedTrianglesMesh
{
    // ----------------------------------------------------------------------------------

    /**
     * initializes the mesh from coordinates and triangles data
     * (if both parameters are null, this creates an empty mesh with 0 vertexes and a single property (this.n_verts, ==0))
     * @param {Float32Array} coords_data    -- vertex coordinates (length must be multiple of 3) 
     * @param {Uint32Data}   triangles_data -- vertex indexes for each triangle (length must be multiple of 3)
     */
    constructor( coords_data, triangles_data )
    {
        const fname = `Mesh.constructor():`

        if ( coords_data == null && triangles_data == null )
        {
            this.n_verts = 0
            return
        }
        CheckType( coords_data, 'Float32Array' )
        let ind_class = triangles_data.constructor.name 
        
        if (! ['Uint16Array','Uint32Array'].includes( ind_class ))
        {   const msg = `${fname} 'indexes_array' is of class '${ind_class}', but must be either 'Uint32Array' or 'Uint16Array'`
            throw Error(msg)
        }
        const vl = coords_data.length,
              tl = triangles_data.length

        Check( 0 < vl && 0 < tl,          `${fname} either the vertex array or the indexes array is empty` )
        Check( Math.floor(vl/3) == vl/3 , `${fname} vertex array length must be multiple of 3 (but it is ${vl})` )
        Check( Math.floor(tl/3) == tl/3 , `${fname} indexes array length must be multiple of 3 (but it is ${tl})` )

        this.n_verts         = vl/3
        this.n_tris          = tl/3
        this.coords_data     = coords_data
        this.triangles_data  = triangles_data
        this.colors_data     = null
        this.normals_data    = null
        this.text_coord_data = null
        

        // create the vertex array with all the data
        this.vertex_array    = new VertexArray ( 3, 3, coords_data )  // Note: 3 attributes: positions, colors, normals
        this.vertex_array.setIndexesData( triangles_data )
    }
    // ----------------------------------------------------------------------------------

    /**
     * returns true iif data array length is multiple of 3 and type is 'Float32Array'
     * @param {string}       fname     -- function calling this
     * @param {Float32Array} attr_data -- reference to the data
     */
    checkAttrData( fname, attr_data )
    {
        Check( this.n_verts >  0 )   // fails if this is an empty mesh...
        CheckType( attr_data, 'Float32Array' )
        const l = attr_data.length
        Check( l === 3*this.n_verts, `${fname} attribute array length (== ${l}) must be 3 times num.verts. (== ${3*this.n_verts})`)
    }
    // ----------------------------------------------------------------------------------

    /**
     * specify a new vertexes colors for the Mesh
     * @param {Float32Array} colors_data -- new vertexes colors (length must be 3*num.vertexes)
     */
    setColorsData( colors_data )
    {
        this.checkAttrData(`Mesh.setColorsData():`, colors_data )
        this.colors_data = colors_data
        this.vertex_array.setAttrData( 1, 3, colors_data )
    }
    // ----------------------------------------------------------------------------------

    /**
     * specify a new vertexes normals for the Mesh
     * @param {Float32Array} normals_data -- new vertexes normals (length must be 3*num.vertexes)
     */
    setNormalsData( normals_data )
    {
        this.checkAttrData(`Mesh.setNormalsData():`, normals_data )
        this.normals_data = normals_data
        this.vertex_array.setAttrData( 2, 3, normals_data )
    }
    // ----------------------------------------------------------------------------------

    draw( gl )
    {
        Check( this.n_verts >  0 )   // fails if this is an empty mesh...
        this.vertex_array.draw( gl, gl.TRIANGLES )
    }
    // ----------------------------------------------------------------------------------
}

// -------------------------------------------------------------------------------------------------
/**
 * A simple planar (z=0) mesh used to test the 'Mesh' class
 */

class Simple2DMesh extends IndexedTrianglesMesh 
{
    constructor()
    {
        const vertex_coords = 
            [
                -0.9, -0.9, 0.0, 
                +0.9, -0.9, 0.0,
                -0.9, +0.9, 0.0,
                +0.9, +0.9, 0.0
            ]
        const vertex_colors = 
            [
                1.0,  0.0, 0.0, 
                0.0,  1.0, 0.0, 
                0.0,  0.0, 1.0, 
                1.0,  1.0, 1.0
            ]

        const vertex_normals = 
            [
                0.0,  1.0, 0.0, 
                0.0,  1.0, 0.0, 
                0.0,  1.0, 0.0, 
                0.0,  1.0, 0.0
            ]

        const triangles = 
            [   0,1,3, 
                0,3,2 
            ]

        super( new Float32Array( vertex_coords ), new Uint32Array( triangles ) )
        this.setColorsData( new Float32Array( vertex_colors ))
        this.setNormalsData( new Float32Array( vertex_normals ))
    }
}


// -------------------------------------------------------------------------------------------------
/**
 * A mesh built by sampling a parametric surface (a map from [0,1]^2 to R^3)
 */
class ParamSurfaceMesh extends IndexedTrianglesMesh
{
    constructor( ns, nt, param_func )
    {
        CheckNat( ns )
        CheckNat( nt )
        Check( 1 < ns && 1 < nt , "'nu' and 'nv' must be at least 2 each.")

        // create the coordinates (and colors) array
        const nver = (ns+1)*(nt+1) 

        let coords  = new Float32Array( 3*nver ),
            colors  = new Float32Array( 3*nver ),
            normals = new Float32Array( 3*nver )

        for( let i = 0 ; i <= ns ; i++ )
        for( let j = 0 ; j <= nt ; j++ )
        {
            const s    = i/ns,
                  t    = j/ns,
                  vert = param_func( s, t ),  // includes vert.pos, vert.nor, ver.cct
                  b    = 3* (i + j*(ns+1))

            for( let k = 0 ; k < 3 ; k++ )
            {   coords[b+k]  = vert.pos[k]
                normals[b+k] = vert.nor[k]
            } 
            
            // sample colors
            colors[b+0] = ( i%2 == 0 ) ? 0.6 : 0.3
            colors[b+1] = ( j%2 == 0 ) ? 0.6 : 0.3
            colors[b+2] = ( (i+j)%2 == 0 ) ? 0.6 : 0.3
        }

        // create the indexes (triangles) array  (2 triangles for each vertex except for last vertexes row/col)
        const ntri = 2*ns*nt
        let triangles = new Uint32Array( 3*ntri )

        for( let i = 0 ; i < ns ; i++ )
        for( let j = 0 ; j < nt ; j++ )
        {
            const 
                i00 = i + j*(ns+1) ,   
                i10 = i00 + 1,         
                i01 = i00 + (ns+1),    
                i11 = i01 + 1,         
                b   = 6*(i+(j*ns))

            // first triangle
            triangles[b+0] = i00 
            triangles[b+1] = i10
            triangles[b+2] = i11 
            
            // second triangle 
            triangles[b+3] = i00
            triangles[b+4] = i11
            triangles[b+5] = i01
        }
        // initialize the base Mesh instance
        super( coords, triangles )
        this.setColorsData( colors )
        this.setNormalsData( normals )
    }
}

// -------------------------------------------------------------------------------------------------

class SphereMesh extends ParamSurfaceMesh
{   constructor( ns, nt )
    {   super
        ( ns, nt, (s,t) => 
            {
                const
                    a  = s*2.0*Math.PI, b  = (t-0.5)*Math.PI,
                    ca = Math.cos(a),   sa = Math.sin(a),
                    cb = Math.cos(b),   sb = Math.sin(b),
                    v  = new Vec3([ ca*cb, sb, sa*cb ])

                return { pos: v, nor: v }
            } 
        )
    }
}

// -------------------------------------------------------------------------------------------------

class CylinderMesh extends ParamSurfaceMesh
{   constructor( ns, nt )
    {   super
        ( ns, nt, (s,t) => 
            {   const
                    a  = s*2.0*Math.PI, 
                    ca = Math.cos(a),   
                    sa = Math.sin(a),
                    p  = new Vec3([ ca, t, sa ] ),
                    n  = new Vec3([ ca, 0, sa ])

                return { pos: p, nor: n }
            } 
        )
    }
}

// -------------------------------------------------------------------------------------------------

class ConeMesh extends ParamSurfaceMesh
{   constructor( ns, nt )
    {   super
        ( ns, nt, (s,t) => 
            {   const
                    a  = s*2.0*Math.PI, 
                    ca = Math.cos(a),   
                    sa = Math.sin(a),
                    p  = new Vec3([ (1-t)*ca, t, (1-t)*sa ] ),
                    n  = new Vec3([ ca, 1, sa ])

                return { pos: p, nor: n.normalized() }
            } 
        )
    }
}


const simple_vertex_coords = 
            [
                -0.9, -0.9, 0.0, 
                +0.9, -0.9, 0.0,
                -0.9, +0.9, 0.0,
                +0.9, +0.9, 0.0
            ]
        

        const simple_triangles = 
            [   0,1,3, 
                0,3,2 
            ]

// -------------------------------------------------------------------------------------------------

class TriMeshFromPLYLines extends IndexedTrianglesMesh
{
    /**
     * Buids an indexed mesh from a strings array with the lines from an ascii PLY file.
     * Sets 'parse_ok' and 'parse_message'
     * 
     * @param {Array<string>} lines -- array with lines
     */
    constructor( lines )
    {
        const fname = 'MeshFromPLYLines.constructor():'
        console.log(`${fname} begins.`)
        super( null, null )

        this.parse_ok      = false 
        this.parse_message = '(no message, remember this is WIP)'

        if ( lines.length < 3 )
        {   
            this.parse_message = "Invalid file, it has less than 3 lines"
            return 
        }
        if ( lines[0] != 'ply' )
        {   
            this.parse_message = "Invalid header: first line is not exactly 'ply'"
            return 
        }
        if ( lines[1] != 'format ascii 1.0' )
        {
            this.parse_message = "Invalid header: second line is not exactly 'format ascii 1.0'"
            return
        }

        // seek for 'end_header' line
        let ehl = 2    // end header line num
        while( ehl < lines.length && lines[ehl] != 'end_header'   )
            ehl ++ 

        if ( lines.length == ehl )
        {
            this.parse_message = "end of header not found"
            return 
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
                    this.parse_message = "line starting with 'element' has invalid format (missing element name or number)"
                    return
                }
                if ( tokens[1] == 'vertex' )
                {
                    num_verts = parseInt( tokens[2], 10 )
                    num_verts_line = l 
                    if ( num_verts <= 0 )
                    {
                        this.parse_message = `number of vertexes is not a positive integer (it is '${tokens[2]}')`
                        return
                    }
                    
                }
                else if ( tokens[1] == 'face')
                {
                    num_tris = parseInt( tokens[2], 10 )
                    num_tris_line = l
                    if ( num_tris  <= 0 )
                    {
                        this.parse_message = `number of triangles is not a positive integer (it is '${tokens[2]}')`
                        return
                    }
                }
                else
                {
                    this.parse_message = "expected just 'vertex' or 'face' after 'element'"
                    return
                }
            }
        }

        if ( num_tris_line < num_verts_line )
        {
            this.parse_message = "'element face' before 'element vertex' (must be the other way around)"
            return
        }
        if ( num_verts < 3 )
        {
            this.parse_message = `number of vertexes must be 3 at least (it is ${num_verts})`
            return
        }
        if ( lines.length < ehl + num_tris + num_verts )
        {
            this.parse_message = `the number of lines is smaller than the required for header + vertexes + faces`
            return
        }

        //// TODO: check properties are as expected .......
        
        // we assume the header is ok. lets load 

        console.log(`${fname} num_verts == ${this.n_verts}`)
        console.log(`${fname} num_tris  == ${this.n_tris}`)

        this.n_verts         = num_verts
        this.n_tris          = num_tris
        this.coords_data     = new Float32Array( num_verts )
        this.triangles_data  = new Uint32Array( num_tris )
        this.colors_data     = new Float32Array( num_verts )
        this.normals_data    = null
        this.text_coord_data = null

        // load vertexes coords and  vertex colors

        let iv = 0  // vertex index

        for( let l = ehl+1 ; l < ehl+1+num_verts ; l++ )
        {
            const tokens = lines[l].trim().split(' ')
            if ( tokens.length != 7 )
            {
                this.parse_message = `vertex at line ${l}: expected 7 numbers but found ${tokens.length}\n`
                this.parse_message += `line ${l} is: '${lines[l]}'`
                return
            }
            const 
                x = parseFloat( tokens[0] ),
                y = parseFloat( tokens[1] ),
                z = parseFloat( tokens[2] ),
                r = parseInt( tokens[3] ),
                g = parseInt( tokens[4] ),
                b = parseInt( tokens[5] ),
                a = parseInt( tokens[6] )

            const p = 3*iv 
            
            this.coords_data[p+0] = x 
            this.coords_data[p+1] = y
            this.coords_data[p+2] = z 

            this.colors_data[p+0] = r/255.0
            this.colors_data[p+1] = g/255.0
            this.colors_data[p+2] = b/255.0

            iv++ 
        }

        let it = 0  // triangle number

        for( let l = ehl+1+num_verts ; l < ehl+1+num_verts+num_tris ; l++ )
        {
            const tokens = lines[l].trim().split(' ')
            if ( tokens.length != 4 )
            {
                this.parse_message = `face at line ${l}: expected 4 numbers but found ${tokens.length}\n`
                this.parse_message += `line ${l} is: '${lines[l]}'`
                return
            }
            const nv = parseInt( tokens[0] )
            if ( nv != 3 )
            {
                this.parse_message = `face at line ${l}: expected a face with 3 vertexes but found ${nv}\n`
                this.parse_message += `line ${l} is: '${lines[l]}'`
                return
            }
            const 
                i0 = parseInt( tokens[4] ),
                i1 = parseInt( tokens[5] ),
                i2 = parseInt( tokens[6] )

            if ( i0 < 0 || num_tris < i0  || 
                 i1 < 0 || num_tris < i1  || 
                 i2 < 0 || num_tris < i2  )
            {
                this.parse_message = `face at line ${l}: a vertex index is out of range (indexes are: ${i0}, ${i1}, ${i2})\n`
                this.parse_message += `line ${l} is: '${lines[l]}'`
                return
            }
            const p = 3*it 

            this.triangles_data[p+0] = i0 
            this.triangles_data[p+0] = i1 
            this.triangles_data[p+0] = i2 
            
            it++ 
        }
        
        this.parse_message = 'parsing has been ok so far'

        // create the vertex array with all the data
        this.vertex_array    = new VertexArray ( 3, 3, this.coords_data )  // Note: 3 attributes: positions, colors, normals
        this.vertex_array.setIndexesData( this.triangles_data )

        this.parse_ok = true // done!

    }
}

