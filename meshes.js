

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

        const pre = 'DataTable constructor: '
        CheckType( num_items, 'number' )
        Check( num_items > 0 , pre+"'num_items' cannot be cero")
        Check( Math.floor(num_items) == num_items, pre+"'num_items' must be an integer number")
        Check( data != null,   pre+"'data' cannot be 'null'" )
       
        const data_type_str = data.constructor.name
        Check( data_type_str == 'Uint32Array' || data_type_str == 'Float32Array', pre+"invalid data type" )

        const data_length = data.length  
        Check( data_length > 0 , pre+"'data' cannot have 0 length" )

        const num_vals_item = data_length/num_items 
        Check( Math.floor( num_vals_item ) == num_vals_item, pre+" data length is not divisible by 'num_items'" )
        if ( data_type_str == 'Uint32Array' )
            Check( num_vals_item == 1, pre+"'num_items' must be equal to 'data.length' for indexes table" )
        else
            Check( num_vals_item <= 4, pre+"num of elems per item must be between 2 and 4" )

        const bytes_per_value = 4   // either floats or uints use 4 bytes pe value
        
        this.data           = data
        this.data_type_str  = data_type_str
        this.is_index_table = data_type_str == 'Uint32Array'
        this.num_items      = num_items 
        this.num_vals_item  = num_vals_item 
        this.buffer         = null
        this.size_bytes     = num_items * num_vals_item * bytes_per_value  // overflow???? precision lost ??
        
    }
    // -------------------------------------------------------------------------------------------
    /**
     * Enables this data table for a vertex attribute index in a rendering context 
     * @param {WebGLRenderingContext} gl  -- rendering context
     * @param {GLuint} attr_index         -- vertex attribute index
     */
    enable( gl, attr_index )
    {
        let fname = null 
        if ( this.debug )
            fname = `DataTable.enable( gl, ${attr_index} ):`
        
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
            if ( this.debug )
                console.log(`${fname} buffer created.`)
        }
        else
            // just bind the buffer when it is already created
            gl.bindBuffer(  target, this.buffer )

        // for positions or other attributes, enable and set the pointer to the table
        if ( ! this.is_index_table )
        {
            gl.vertexAttribPointer( attr_index, this.num_vals_item, gl.FLOAT, false, 0, 0  )
            gl.enableVertexAttribArray( attr_index )
        }

        CheckGLError( gl )
        if ( this.debug )
            console.log(`${fname} buffer enabled.`)
    }
}

// -------------------------------------------------------------------------------------------------
/**
 * A class for a sequence of vertexes position (and optionaly their attributes and indexes)
 */

class VertexSeq
{
    /**
     * @param {Number} num_floats_per_vertex -- must be 2 or 3
     * @param {Float32Array} vertexes        -- vertex positions, length is multiple of num.floats per vertex
     */
    constructor( num_floats_per_vertex, vertex_array )
    {
        CheckType( vertex_array, "Float32Array" )

        Check( 2 <= num_floats_per_vertex && num_floats_per_vertex <= 4, "num of floats per vertex must be 2 or 3")
   
        const fname = 'VertexSeq constructor:'
        console.log(`${fname} v.a.length == ${vertex_array.length}, num.f.x v. == ${num_floats_per_vertex}`)
        const num_vertexes = vertex_array.length/num_floats_per_vertex
        console.log(`num_ver == ${num_vertexes}`)
        Check( 1 <= num_vertexes, "vertex array length is too small" )
        Check( Math.floor( num_vertexes ) == num_vertexes, "vertex array length is not multiple of num of floats per vertex")
       
        this.num_vertexes = num_vertexes 
        this.vertexes     = new DataTable( num_vertexes, vertex_array )
        this.colors       = null
        this.indexes      = null 
    }
    // -------------------------------------------------------------------------------------------
    setIndexes( indexes )
    {
        CheckType( indexes, 'Uint32Array' )
        Check( 0 < indexes.length, 'VertexSeq.setIndexes(): cannot use an empty indexes array' )
        this.indexes = new DataTable( indexes.length, indexes )
    }
    // -------------------------------------------------------------------------------------------
    setColors( colors )
    {
        CheckType( colors, 'Float32Array' )
        Check( 0 < colors.length, 'VertexSeq.setColors(): cannot use an empty indexes array' )
        Check( colors.length == this.num_vertexes*3, 'VertexSeq.setColors(): incoherent color array length (must be 3*num_vertexes)')
        this.colors = new DataTable( this.num_vertexes, colors )
    }
    // ---------------------------------------------------------------------------------------------

    draw( gl, mode )
    {
        CheckWGLContext( gl )
        CheckGLError( gl )

        this.vertexes.enable( gl, 0 )
        
        if ( this.colors != null )
            this.colors.enable( gl, 1 )
        else
            gl.disableVertexAttribArray( 1 )

        CheckGLError( gl )

        if ( this.indexes == null )
            gl.drawArrays( mode, 0, this.num_vertexes )
        else
        {
            this.indexes.enable( gl, 0 ) // attr index 0 is not used
            const count = this.indexes.length
            gl.drawElements( mode, this.indexes.length, gl.UNSIGNED_INT, 0 )
        }
        CheckGLError( gl )
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
        //this.setIndexes( new Uint32Array( indexes ))
       
    }
}
// -------------------------------------------------------------------------------------------------



