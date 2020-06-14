
// -------------------------------------------------------------------------------------------------
/**
 * A class for an indexed triangles mesh
 */

class IndexedTrianglesMesh
{
    // ----------------------------------------------------------------------------------

    /**
     * initializes the mesh from coordinates and triangles data
     * @param {Float32Array} coords_data    -- vertex coordinates (length must be multiple of 3) 
     * @param {Uint32Data}   triangles_data -- vertex indexes for each triangle (length must be multiple of 3)
     */
    constructor( coords_data, triangles_data )
    {
        const fname = `Mesh.constructor():`
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
                    cb = Math.cos(b),   sb = Math.sin(b)
                const v = new Vec3([ ca*cb, sb, sa*cb ])
                return { pos: v, nor: v }
            } 
        )
    }
}

// -------------------------------------------------------------------------------------------------

class ConeMesh extends ParamSurfaceMesh
{   constructor( ns, nt )
    {   super
        ( ns, nt, (s,t) => 
            {
                const
                    a  = s*2.0*Math.PI, 
                    ca = Math.cos(a),   
                    sa = Math.sin(a)

                const p = new Vec3([ca,t,sa]),
                      n = new Vec3([ca,1,sa])
                return { pos: p, nor: n.normalized() }
            } 
        )
    }
}