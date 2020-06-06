


// -----------------------------------------------------------------------------
/**
 * A class for a OpenGL buffer containing a sequence of float values encoding a set of 
 * vectors for vertex coordinates or vertex attributes (colors,normals,t.cc.,etc...)
 */

class AttrBuffer
{
    /**
     * Builds an 'AttrBuffer', given its data. It just records the data, does not allocs GPU memory
     * 
     * @param {number}       vec_len  -- number of float values in each vector ( >1, <5 ) 
     * @param {Float32Array} data     -- typed array with float values (is interpreted a set of equal-length vectors)
     */
    constructor( vec_len, data )
    {
        this.debug   = false
        const fname  = `AttrBuffer.constructor(data,${vec_len}):`
        
        CheckType( data, 'Float32Array' )
        CheckNat( vec_len )  
        
        Check( 2 <= vec_len && vec_len <= 4 , `${fname} 'vec_len' (== ${vec_len}) must be between 2 and 4`)
        Check( 1 <= data.length/vec_len,      `${fname} 'vec_len' (== ${vec_len}) cannot be greather than 'data.length' (== ${data.length})` )

        this.data      = data
        this.num_vecs  = data.length/vec_len  
        this.vec_len   = vec_len
        this.gl_buffer = null   
    }
    // -------------------------------------------------------------------------------------------
    /**
     * Enables this data table for a vertex attribute index in a rendering context 
     * @param {WebGLRenderingContext} gl  -- rendering context
     * @param {GLuint} attr_index         -- vertex attribute index (only used when 'is_index_table' == false)
     */
    enable( gl, attr_index )
    {
        let fname = ''
        if ( this.debug )
            fname = `AttrBuffer.enable(gl, ${attr_index} ):`

        if ( this.debug )
            Log(`${fname} begins.`)
        
        CheckNat( attr_index )
        CheckGLError( gl )

        // create (if first enable) and bind the buffer
        if ( this.gl_buffer == null )
        {
            this.gl_buffer = gl.createBuffer()
            gl.bindBuffer( gl.ARRAY_BUFFER, this.gl_buffer )
            gl.bufferData( gl.ARRAY_BUFFER, this.data, gl.STATIC_DRAW )
            CheckGLError( gl )
            Check( gl.isBuffer( this.gl_buffer ), `${fname} unable to create a buffer for vertex data, or buffer is corrupted`)
        }
        else
            gl.bindBuffer( gl.ARRAY_BUFFER, this.gl_buffer )

        // enable and set the pointer to the table
        gl.enableVertexAttribArray( attr_index )
        gl.vertexAttribPointer( attr_index, this.vec_len, gl.FLOAT, false, 0, 0  )
        
        CheckGLError( gl )
        if ( this.debug )
            Log(`${fname} ends.`)
    }
    // -------------------------------------------------------------------------------------------

    disable( gl, attr_index )
    {
        CheckNat( attr_index )
        gl.disableVertexAttribArray( attr_index )
    }
}


// -------------------------------------------------------------------------------------------------
/**
 * A class for an OpenGL element buffer 
 * (an element buffer contains a sequence of integers, used as indexes for indexed vertex 
 * sequences) 
 */

class IndexesBuffer
{
    /**
     * Builds an 'IndexBuffer', given its data. It just records the data, does not allocs GPU memory
     * 
     * @param {Uint*Array} data  -- sequence of indexes, can be an Uint16Array or Uint32Array
     */
    constructor( data )
    {
        this.debug  = false
        const fname = `IndexBuffer.constructor(): `
        
        Check( data != null, `${fname} 'data' cannot be 'null'` )
        const dcn = data.constructor.name // 'data' class name
        Check( ['Uint32Array','Uint16Array'].includes( dcn ), `${fname} 'data' must an integer typed array (16 or 32 bits integers), but is '${dcn}'` )
        Check( 0 < data.length , `'data' is an empty array` )
       
        this.data       = data
        this.is_ui32    = ( dcn === 'Uint32Array' )
        this.gl_buffer  = null
    }
    // -------------------------------------------------------------------------------------------
    /**
     * Enables this data table for a vertex attribute index in a rendering context 
     * @param {WebGLRenderingContext} gl  -- rendering context
     * @param {GLuint} attr_index         -- vertex attribute index (only used when 'is_index_table' == false)
     */
    enable( gl )
    {
        let fname = `IndexBuffer.enable(): `

        if ( this.debug ) Log(`${fname} begins.`)
        
        CheckGLError( gl )

        // create (if first enable) and bind the buffer
        if ( this.gl_buffer == null )
        {
            this.gl_buffer = gl.createBuffer()
            gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, this.gl_buffer )
            gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, this.data, gl.STATIC_DRAW )
            CheckGLError( gl )
            Check( gl.isBuffer( this.gl_buffer ), `${fname} unable to create a buffer for vertex data, or buffer is corrupted`)
        }
        else
            gl.bindBuffer(  gl.ELEMENT_ARRAY_BUFFER, this.gl_buffer )

        CheckGLError(gl)
        if ( this.debug ) Log(`${fname} ends.`)
    }
    // ----------------------------------------------------------------------------------
    drawElements( gl, mode )
    {
        const format = this.is_ui32 ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT
        this.enable( gl ) 
        gl.drawElements( mode, this.data.length, format, 0 )
        CheckGLError(gl)
    }
}


