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



