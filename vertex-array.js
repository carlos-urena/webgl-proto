// -------------------------------------------------------------------------------------------------
/**
 * A class for a sequence of vertexes coordinates (and optionaly their attributes and indexes)
 * each instance is built with the coordinates data. Optionally, attributes or indexes can be added later.
 */

class VertexArray
{
    /**
     * @param {number}       num_attrs    -- num of attributes buffers this vertex array will hold, 
     *                                        (without including vertex coordinates, which are allways attribute 0)
     *                                        can be any non-negative integer, including 0
     * @param {number}       vec_len      -- length of each vector with a vertex coordinates, must be 2,3, or 4
     * @param {Float32Array} coords_data  -- vertex coordinates, its length must be multiple of 'vec_len'
     */
    constructor( num_attrs, vec_len, coords_data )
    {
        this.debug = false
        const fname  = 'VertexArray.constructor: ()'
        CheckNat( num_attrs )

        let coords_buffer   = new AttrBuffer( vec_len, coords_data )
        
        this.num_vertexes   = coords_buffer.num_vecs
        this.indexes_buffer = null               // by default, this is a non-indexed sequence
        this.attr_buffers   = [ coords_buffer ]  // array with vertexes attributes buffers (index 0 allways refers to the vertexes coordinates buffer)
        
        for( let i = 0 ; i < num_attrs ; i++ )   // add uninitialized attribute arrays
            this.attr_buffers.push( null )
    }
    // -------------------------------------------------------------------------------------------
    /**
     * sets the indexes for this vertex arry (removes previous one, if any)
     * @param {UInt32Array} indexes_data --  ( can also be a 'Unit16Array' )
     */
    setIndexesData( indexes_data )
    {
        this.indexes_buffer = new IndexesBuffer( indexes_data )
    }
    // -------------------------------------------------------------------------------------------
    
    /**
     * Sets a new vertex attribute data (other than vertex coordinates)
     * @param {number}       attr_index   -- attribute index, must be >0 (we cannot set the coordinates), and less than 'attr_buffers' length.
     * @param {number}       vec_len      -- length of each vector in 'attr_array' 
     * @param {Float32Array} attr_data    -- new attributes array (can be 'null', then the corresponding 
     *                                       attribute buffer is also set to null
     */
    setAttrData( attr_index, vec_len, attr_data )
    {
        const fname = `VertexArray.setAttrData(): `
        const nb    = this.attr_buffers.length // number of attributes buffers, including 0 == vertex coordinates

        CheckNat( attr_index )
        Check( 0 < attr_index && attr_index < nb , `${fname} 'attr_index' (==${attr_index}) must be between 1 and ${nb-1}, both included` )
        
        let attr_buffer = null 
        if ( attr_data != null )
        {
            CheckType( attr_data, 'Float32Array' )
            Check( attr_data.length/vec_len === this.num_vertexes, `${fname} attr. array length not coherent with num of vertexes of this vertex seq.`)
            attr_buffer = new AttrBuffer( vec_len, attr_data )
        }
        this.attr_buffers[attr_index] = attr_buffer  // when 'attr_data' is null, sets 'attr_buffer[i]' also to null
    }
    // ---------------------------------------------------------------------------------------------
    
    /**
     * Draws this vertex sequence
     * @param {WebGLRenderingContext} gl   -- rendering context 
     * @param {number}                mode -- mode: (triangles,lines, line_strip, points, etc...)
     */
    draw( gl, mode )
    {
        const fname = 'VertexArray.draw():'
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

        // disable attr arrays
        for( let i = 0 ; i < this.attr_buffers.length ; i++  )
            gl.disableVertexAttribArray( i )
            
        CheckGLError( gl )
        if ( this.debug ) Log(`${fname} ends.`)
        
    }
}

// -------------------------------------------------------------------------------------------------
/**
 * A simple indexed vertex sequence (with colors)
 */

class SimpleVertexArray extends VertexArray
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
        this.setAttrData( 1, 3, new Float32Array( vertex_colors ) )       
    }
}

// -------------------------------------------------------------------------------------------------
/**
 * A simple indexed vertex sequence (with colors)
 */

class SimpleIndexedVertexArray extends VertexArray
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
        this.setAttrData( 1, 3, new Float32Array( vertex_colors ))
        this.setIndexesData( new Uint16Array( indexes ))
       
    }
}
// -------------------------------------------------------------------------------------------------



