
// -------------------------------------------------------------------------------------------------
/**
 * A class for an indexed triangle mesh
 */

class Mesh
{
    // ----------------------------------------------------------------------------------
    constructor( coords_array, triangles_array )
    {
        const fname = `Mesh.constructor():`
        CheckType( coords_array, 'Float32Array' )
        let ind_class = triangles_array.constructor.name 
        
        if (! ['Uint16Array','Uint32Array'].includes( ind_class ))
        {   const msg = `${fname} 'indexes_array' is of class '${ind_class}', but must be either 'Uint32Array' or 'Uint16Array'`
            throw Error(msg)
        }
        const vl = coords_array.length,
              tl = triangles_array.length

        Check( 0 < vl && 0 < tl,          `${fname} either the vertex array or the indexes array is empty` )
        Check( Math.floor(vl/3) == vl/3 , `${fname} vertex array length must be multiple of 3 (but it is ${vl})` )
        Check( Math.floor(tl/3) == tl/3 , `${fname} indexes array length must be multiple of 3 (but it is ${tl})` )

        this.n_verts          = vl/3
        this.n_tris           = tl/3
        this.coords_array     = coords_array
        this.colors_array     = null
        this.normals_array    = null
        this.text_coord_array = null
        this.triangles_array  = triangles_array
        this.vertex_seq       = new VertexSeq ( 3, 3, coords_array )
        this.vertex_seq.setIndexes( triangles_array )
    }
    // ----------------------------------------------------------------------------------

    checkAttrArray( fname, attr_array )
    {
        CheckType( attr_array, 'Float32Array' )
        const l = attr_array.length
        Check( l === 3*this.n_verts, `${fname} attribute array length (== ${l}) must be 3 times num.verts. (== ${3*this.n_verts})`)
    }
    // ----------------------------------------------------------------------------------

    setColorsArray( colors_array )
    {
        this.checkAttrArray(`Mesh.setColorsArray():`, colors_array )
        this.colors_array = colors_array
        this.vertex_seq.setAttrArray( 1, 3, colors_array )
    }
    // ----------------------------------------------------------------------------------

    draw( gl )
    {
        this.vertex_seq.draw( gl, gl.TRIANGLES )
    }
    // ----------------------------------------------------------------------------------
}

// -------------------------------------------------------------------------------------------------
/**
 * A simple planar (z=0) mesh used to test the 'Mesh' class
 */

class Simple2DMesh extends Mesh 
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

        const triangles = 
            [   0,1,3, 
                0,3,2 
            ]

        super( new Float32Array( vertex_coords ), new Uint32Array( triangles ) )
        this.setColorsArray( new Float32Array( vertex_colors ))
    }
}



class ParamSurfaceMesh extends Mesh
{
    constructor( ns, nt, param_func )
    {
        CheckNat( ns )
        CheckNat( nt )
        Check( 1 < ns && 1 < nt , "'nu' and 'nv' must be at least 2 each.")

        // create the coordinates (and colors) array
        const nver = (ns+1)*(nt+1) 

        coords = new Float32Array( nver )
        colors = new Float32Array( nver )

        for( let i = 0 ; i <= ns ; i++ )
        for( let j = 0 ; j <= nt ; j++ )
        {
            const vpos = param_func( i/ns, j/nt ),
                  b    = i*(nt+1) + j

            for( let k = 0 ; k < 3 ; k++ )
                coords[b+k] = vpos[k] 
            
            colors[b+0] = ( i%2 == 0 ) ? 1.0 : 0.6
            colors[b+1] = ( j%2 == 0 ) ? 1.0 : 0.6
            colors[b+2] = 1.0
        }

        // create the indexes (triangles) array  (2 triangles for each vertex except for last vertexes row/col)
        const ntri = 2*ns*nt
        triangles = new Uint32Array( 3*ntri )

        for( let i = 0 ; i < ns ; i++ )
        for( let j = 0 ; j < nt ; j++ )
        {
            const 
                i00 = i*(nt+1) + j,
                i10 = i00 + 1,
                i11 = i00 + (nt+1),
                i01 = i10 + 1,
                b   = 2*3*i00

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
        this.setColorsArray( colors )
    }
}


class SphereMesh extends ParamSurfaceMesh
{
    constructor( ns, nt )
    {
        super( ns, nt, (s,t) => 
        {
            return new Vec3([1.2*s,1.2*t,0.4] )   // just testing
        } )
    }
}