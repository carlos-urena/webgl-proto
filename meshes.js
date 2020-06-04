
function Check( is_ok, msg )
{
    if ( ! is_ok )
    {
        alert(msg)
        throw msg
    }
    
}

// -------------------------------------------------------------------------------------------------
/**
 * A class for a table containing a sequence of integer or float values, for vertex positions, normals,
 * colors, texture coords and indexes in indexed sequences. 
 */

class DataTable
{
    constructor( attr_index, num_items, data )
    {
        const pre = 'DataTable constructor: '
        Check( num_items > 0 , pre+"'num_items' cannot be cero")
        Check( Math.floor(num_items) == num_items, pre+"'num_items' must be an integer number")
        Check( data != null,   pre+"'data' cannot be 'null'" )
        CheckType( attr_index, "Number" )
        Check( attr_index > 0 && Math.floor( attr_index )== attr_index , "invalid 'attr_index'")

        const data_type = data.constructor.name
        Check( data_type == 'Uint32Array' || data_type == 'Float32Array', pre+"invalid data type" )

        const data_length = data.length  
        Check( data_length > 0 , pre+"'data' cannot have 0 length" )

        const num_elems_item = data_length/num_items 
        Check( Math.floor( num_elems_item ) == num_elems_item, pre+" data length is not divisible by 'num_items'" )
        if ( data_type == 'Uint32Array' )
            Check( num_elems_item == 1, pre+"'num_items' must be equal to 'data.length' for indexes table" )
        else
            Check( num_elems_item <= 4, pre+"num of elems per item cannot be larger than 4" )

        const bytes_per_elem = 4   // either floats or uints use 4 bytes each
        const target = this.data_type == 'Uint32Array' ? gl.ELEMENT_ARRAY_BUFFER : gl.ARRAY_BUFFER ;

        this.data           = data
        this.data_type      = data_type
        this.attr_index     = GLUint( attr_index )
        this.num_items      = num_items 
        this.num_elems_item = GLint( num_elems_item )
        this.buffer         = null
        this.size_bytes     = GLSizeiptr( num_items*bytes_per_elem )
        this.target         = target
    }

    /*** C/C++ 'enable' 
      
        // check preconditions
        assert( size_in_bytes > 0 );
        assert( cpu_data != nullptr );
        CheckGLError();

        // if the VBO is not created, create and bind it, and send data to GPU
        // otherwise just bind
        if ( vbo_name == 0 )
        {
            glGenBuffers( 1, &vbo_name );  assert( 0 < vbo_name );
            glBindBuffer( table_type, vbo_name );
            glBufferData( table_type, size_in_bytes, cpu_data, GL_DYNAMIC_DRAW );
        }
        else
            glBindBuffer( table_type, vbo_name );

        CheckGLError();

        // for attributes tables, enable and set pointer to data in th GPU
        if ( table_type == GL_ARRAY_BUFFER )
        {
            glEnableVertexAttribArray( attr_index );
            glVertexAttribPointer( attr_index, values_per_tuple, values_type, GL_FALSE, 0, 0 );
            CheckGLError();
        } 
    */

    enable( gl )
    {
        const fname = "DataTable.enable(): "
        CheckType( attr_num, "Number" )

        if ( this.buffer == null )
        {
            this.buffer = gl.createBuffer()
            Check( gl.isBuffer( this.buffer ), fname+'unable to create a buffer for vertex data')
            gl.bindBuffer( this.buffer )
            gl.bufferData( target, this.size_bytes, gl.STATIC_DRAW )
        }
        else
            gl.bindBuffer( this.buffer )

        

    }
}




// -------------------------------------------------------------------------------------------------
/**
 * A class for a sequence of vertexes position (and optionaly their attributes and indexes)
 */

class VertexSeq
{
    constructor()
    {
        this.vertexes = null
        this.indexes  = null 
    }
    // ---------------------------------------------------------------------------------------------

    draw( gl, mode )
    {
        CheckWGLContext( gl )
        CheckType( mode, 'GLEnum' )

        if ( this.vertexes == null  )
        {
            let msg = 'Error: trying to draw an empty mesh with no vertexes'
            Log( msg )
            throw msg
        }
        gl.vertexAttribPointer( 0, 2, )
        if ( this.indexes == null )   // non indexed sequence
            gl.drawArrays( mode, 0, num_vertexes )
    }
}

// -------------------------------------------------------------------------------------------------
/**
 * A simple sequence of two vertex across the diagonal, used for testing
 */

class SimpleVertexSeq extends VertexSeq
{
    constructor()
    {
        super()
        this.vertexes       = new Float32Array(4)
        this.num_components = 2
        this.type           = gl.FLOAT
        this.stride         = 0
        this.offset         = 0

        // https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/vertexAttribPointer
        // work here on Tabledescriptor objects , this is very WIP
        let v = this.vertexes

        v[0] = 0.1 ; v[1] = 0.1 
        v[2] = 0.9 ; v[2] = 0.9
     }
}
// -------------------------------------------------------------------------------------------------



