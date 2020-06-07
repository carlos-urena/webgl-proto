
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

        super( new Float32Array( vertex_coords ), new Uint16Array( triangles ) )
        this.setColorsArray( new Float32Array( vertex_colors ))
    }
}