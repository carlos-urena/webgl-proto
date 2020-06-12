// -------------------------------------------------------------------------------------------------
/**
 * A class for a sequence of vertexes position (and optionaly their attributes and indexes)
 */

class VertexSeq
{
    /**
     * @param {number}       num_attrs     -- num of attributes arrays this seq. will hold, 
     *                                        (without including vertex coordinates, which are allways attribute 0)
     *                                        can be any non-negative integer
     * @param {number}       vec_len       -- length of each vector with a vertex' coordinates, must be 2,3, or 4
     * @param {Float32Array} coords_array  -- vertex coordinates, length is multiple of num.floats per vertex
     */
    constructor( num_attrs, vec_len, coords_array )
    {
        this.debug = false
        const fname  = 'VertexSeq.constructor: ()'
        CheckNat( num_attrs )

        let coords_buffer   = new AttrBuffer( vec_len, coords_array )
        
        this.num_vertexes   = coords_buffer.num_vecs
        this.indexes_buffer = null               // by default, this is a non-indexed sequence
        this.attr_buffers   = [ coords_buffer ]  // array with vertexes attributes buffers (index 0 allways refers to the vertexes coordinates buffer)
        for( let i = 0 ; i < num_attrs ; i++ )   // add uninitialized attribute arrays
            this.attr_buffers.push( null )
    }
    // -------------------------------------------------------------------------------------------
    /**
     * sets the indexes array for this vertex seq (removes previous one, if any)
     * @param {UInt32Array} indexes_array --  ( can also be a 'Unit16Array' )
     */
    setIndexes( indexes_array )
    {
        this.indexes_buffer = new IndexesBuffer( indexes_array )
    }
    // -------------------------------------------------------------------------------------------
    
    /**
     * Sets a new vertex attribute buffer (other than vertex coordinates)
     * @param {number}       attr_index   -- attribute index, must be >0 (we cannot set the coordinates), and less than 'attr_buffers' length.
     * @param {number}       vec_len      -- length of each vector in 'attr_array' 
     * @param {Float32Array} attr_array   -- new attributes array, can be 'null', then the corresponding buffer is removed from this vertex seq.
     */
    setAttrArray( attr_index, vec_len, attr_array )
    {
        const fname = `VertexSeq.setArray(): `
        const nb    = this.attr_buffers.length // number of attributes buffers, including 0 == vertex coordinates

        CheckNat( attr_index )
        Check( 0 < attr_index && attr_index < nb , `${fname} 'attr_index' (==${attr_index}) must be between 1 and ${nb-1}, both included` )
        
        let attr_buffer = null 
        if ( attr_array != null )
        {
            CheckType( attr_array, 'Float32Array' )
            Check( attr_array.length/vec_len === this.num_vertexes, `${fname} attr. array length not coherent with num of vertexes of this vertex seq.`)
            attr_buffer = new AttrBuffer( vec_len, attr_array )
        }
        this.attr_buffers[attr_index] = attr_buffer
    }
    // ---------------------------------------------------------------------------------------------
    
    /**
     * Draws this vertex sequence
     * @param {WebGLRenderingContext} gl   -- rendering context 
     * @param {number}                mode -- mode: (triangles,lines, line_strip, points, etc...)
     */
    draw( gl, mode )
    {
        const fname = 'VertexSeq.draw():'
        if ( this.debug ) Log(`${fname} begins.`)

        CheckGLError( gl )

        // enable/disable each attribute array
        for( let i = 0 ; i < this.attr_buffers.length ; i++  )
            if ( this.attr_buffers[i] != null  ) 
                this.attr_buffers[i].enable( gl, i )
            else
                gl.disableVertexAttribArray( i )
        
        if ( this.indexes_buffer  == null )
            gl.drawArrays( mode, 0, this.num_vertexes )
        else
            this.indexes_buffer.drawElements( gl, mode )
            
        CheckGLError( gl )
        if ( this.debug ) Log(`${fname} ends.`)
        
    }
}

// -------------------------------------------------------------------------------------------------
/**
 * A simple indexed vertex sequence (with colors)
 */

class SimpleVertexSeq extends VertexSeq
{
    constructor()
    {
        const vertex_coords = 
            [
                -0.9, -0.9, 0.0, 
                +0.9, -0.9, 0.0,
                +0.9, +0.9, 0.0,

                -0.9, -0.9, 0.0, 
                +0.9, +0.9, 0.0,
                -0.9, +0.9, 0.0
                
            ]
        const vertex_colors = 
            [
                1.0,  0.0, 0.0, 
                0.0,  1.0, 0.0, 
                0.0,  0.0, 1.0, 

                0.0,  1.0, 1.0,
                1.0,  0.0, 1.0,
                1.0,  1.0, 0.0
            ]

        super( 1, 3, new Float32Array( vertex_coords ) )
        this.setAttrArray( 1, 3, new Float32Array( vertex_colors ) )       
    }
}

// -------------------------------------------------------------------------------------------------
/**
 * A simple indexed vertex sequence (with colors)
 */

class SimpleVertexSeqIndexed extends VertexSeq
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

        const indexes = 
            [   0,1,3, 
                0,3,2 
            ]

        super( 1, 3, new Float32Array( vertex_coords ) )
        this.setAttrArray( 1, 3, new Float32Array( vertex_colors ))
        this.setIndexes( new Uint16Array( indexes ))
       
    }
}
// -------------------------------------------------------------------------------------------------



