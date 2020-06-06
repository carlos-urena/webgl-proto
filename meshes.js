

// -------------------------------------------------------------------------------------------------
/**
 * A class for a table containing a sequence of integer or float values, for vertex positions, normals,
 * colors, texture coords and indexes in indexed sequences. 
 * A single WebGL buffer is created for each 'DataTable' instance.
 */

class DataTable
{
    constructor( num_items, data )
    {
        this.debug = false

        const pre           = 'DataTable constructor(): '
        const data_type_str = data.constructor.name
        const is_float      = ['Float32Array'].includes( data_type_str )
        const is_uint       = ['Uint32Array','Uint16Array'].includes( data_type_str ) 
        
        CheckType( num_items, 'number' )
        Check( num_items > 0 , pre+"'num_items' cannot be cero")
        Check( Math.floor(num_items) == num_items, pre+"'num_items' must be an integer number")
        Check( data != null,   pre+"'data' cannot be 'null'" )
        Check( is_float || is_uint , `${pre} data array with invalid type '${data_type_str}'` )
        
        const data_length   = data.length
        const num_vals_item = data_length/num_items  
        
        Check( data_length > 0 , pre+"'data' cannot have 0 length" )
        Check( Math.floor( num_vals_item ) == num_vals_item, pre+" data length is not divisible by 'num_items'" )

        if ( is_uint ) Check( num_vals_item == 1, pre+"'num_items' must be equal to 'data.length' for indexes table" )
        else           Check( num_vals_item <= 4, pre+"num of elems per item must be between 2 and 4" )

        this.data           = data
        this.data_type_str  = data_type_str
        this.is_index_table = is_uint
        this.is_index_u32   = data_type_str == 'Uint32Array'
        this.num_items      = num_items 
        this.num_vals_item  = num_vals_item 
        this.buffer         = null
        
    }
    // -------------------------------------------------------------------------------------------
    /**
     * Enables this data table for a vertex attribute index in a rendering context 
     * @param {WebGLRenderingContext} gl  -- rendering context
     * @param {GLuint} attr_index         -- vertex attribute index (only used when 'is_index_table' == false)
     */
    enable( gl, attr_index )
    {
        let fname = null 
        if ( this.debug )
            fname = `DataTable.enable( gl, ${attr_index} ):`

        if ( this.debug )
            Log(`${fname} begins, is index table == ${this.is_index_table}`)
        
        const target = this.is_index_table ? gl.ELEMENT_ARRAY_BUFFER : gl.ARRAY_BUFFER ;

        CheckGLError( gl )

        // create the buffer (if neccesary)  and bind the buffer
        if ( this.buffer == null )
        {
            // create the buffer and fill it with data from 'this.data'
            this.buffer = gl.createBuffer()
            gl.bindBuffer( target, this.buffer )
            gl.bufferData( target, this.data, gl.STATIC_DRAW )
            CheckGLError( gl )
            Check( gl.isBuffer( this.buffer ), fname+'unable to create a buffer for vertex data, or buffer is corrupted')
           
        }
        else
            // just bind the buffer when it is already created
            gl.bindBuffer(  target, this.buffer )

        CheckGLError(gl)

        // for positions or other attributes, enable and set the pointer to the table
        if ( ! this.is_index_table )
        {
            if ( this.debug )
                Log(`${fname}, num_vals_item == ${this.num_vals_item}`)
            gl.enableVertexAttribArray( attr_index )
            gl.vertexAttribPointer( attr_index, this.num_vals_item, gl.FLOAT, false, 0, 0  )
        }

        CheckGLError( gl )
        if ( this.debug )
            Log(`${fname} ends.`)
    }
}

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
        CheckNat( data.lengh/vec_len )
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
        const format = this.indexes_buffer.is_ui32 ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT
        enable( gl ) 
        gl.drawElements( mode, this.data.length, format, 0 )
        CheckGLError(gl)
    }
}



// -------------------------------------------------------------------------------------------------
/**
 * A class for a sequence of vertexes position (and optionaly their attributes and indexes)
 */

class VertexSeq
{
    /**
     * @param {number}       vec_len       -- length of each vector with a vertex' coordinates, must be 2,3, or 4
     * @param {Float32Array} coords_array  -- vertex positions, length is multiple of num.floats per vertex
     */
    constructor( vec_len, coords_array )
    {
        this.debug = false
        const fname         = 'VertexSeq constructor:'
        let coords_buffer   = new AttrBuffer( vec_len, coords_array )
        
        this.num_vertexes   = coords_buffer.num_vecs
        this.attr_buffers   = [ coords_buffer, null ]   // array with vertexes attributes buffers (index 0 allways refers to the vertexes coordinates buffer)
        this.indexes_buffer = null 
    }
    // -------------------------------------------------------------------------------------------
    
    setIndexes( indexes_array )
    {
        this.indexes_buffer = new IndexBuffer( indexes_array )
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
        CheckNat( attr_index )
        Check( 0 < attr_index && attr_index < this.buffers.length , `${fname} 'attr_index' (==${attr_index}) must be between 1 and ${this.buffers.length-1}, both included` )
        
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

    // draw( gl, mode )
    // {
    //     const fname = 'VertexSeq.draw():'
    //     if ( this.debug )
    //         Log(`${fname} begins.`)

    //     CheckWGLContext( gl )
    //     CheckGLError( gl )
    //     Check( this.vertexes != null, 'Cannot draw, no vertexes coordinates table')

    //     this.vertexes.enable( gl, 0 )
        
    //     if ( this.colors != null ) this.colors.enable( gl, 1 )
    //     else                       gl.disableVertexAttribArray( 1 )

    //     CheckGLError( gl )

        

    //     if ( this.indexes == null )
    //     {
    //         if ( this.debug )
    //             Log(`${fname} about to drawArrays: this.num_vertexes == ${this.num_vertexes}`)
    //         gl.drawArrays( mode, 0, this.num_vertexes )
    //         CheckGLError( gl )
    //     }
    //     else
    //     {
    //         if ( this.indexes.is_index_u32 ) // REVIEW
    //             throw new Error("Sorry, looks like I cannot use unsigned ints (32 bits) for indexes")
    //         this.indexes.enable( gl, 0 ) 
    //         const format = this.indexes.is_index_u32 ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT

    //         if ( this.debug )
    //             Log(`${fname} about to drawArrays: this.indexes.length == ${this.indexes.num_items}`)
    //         gl.drawElements( mode, this.indexes.num_items, format, 0 )
    //         CheckGLError( gl )
    //     }

    //     if ( this.debug )
    //         Log(`${fname} ends.`)
        
    // }
    draw( gl, mode )
    {
        const fname = 'VertexSeq.draw():'
        if ( this.debug ) Log(`${fname} begins.`)

        CheckGLError( gl )

        // enable/disable each attribute array
        for( i = 0 ; i < this.attr_buffers.length ; i++  )
        {
            let b = this.attr_buffers[i]
            if ( b != null  ) b.enable( gl, i )
            else              gl.disableVertexAttribArray( i )
        }
        
        if ( this.indexes_buffer  == null )
            gl.drawArrays( mode, 0, this.num_vertexes )
        else
            this.indexes_buffer.drawElements( mode )
            
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

        super( 3, new Float32Array( vertex_coords ) )
        this.setColors( new Float32Array( vertex_colors ) )       
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

        super( 3, new Float32Array( vertex_coords ) )
        this.setColors( new Float32Array( vertex_colors ))
        this.setIndexes( new Uint16Array( indexes ))
       
    }
}
// -------------------------------------------------------------------------------------------------



