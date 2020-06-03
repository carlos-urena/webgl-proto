
// -------------------------------------------------------------------------------------------------
// variable which holds the single WebGLCanvas class instance 

var canvas = null 

// -------------------------------------------------------------------------------------------------

/** Adapts the canvas container size to the window size
*/
function ResizeCanvasContainer()
{
    if ( canvas == null )
        return 

    let canvas_container_elem = BuscarElemId('canvas_container_id')

    const nx = Math.min( 2048, Math.max( 512, Math.floor(window.innerWidth*0.8  ) ) ),
          ny = Math.min( 2048, Math.max( 512, Math.floor(window.innerHeight*0.8 ) ) )

    canvas_container_elem.style.width   = nx.toString() + "px"
    canvas_container_elem.style.height  = ny.toString() + "px"
    console.log(`ResizeCanvasContainer, new w = ${nx}, h = ${ny}`)
    canvas.resize()  // resizes the canvas according to div dimensions
}

// -------------------------------------------------------------------------------------------------
/* this is executed once, after the body has finished loading
*/

function OnDocumentLoad()
{
    Log("OnDocumentLoad: begins")
    // create the canvas (the single instance of WebGLCanvas)
    if ( canvas != null )
        throw RangeError(`'canvas' is not null on document load`)   
    canvas = new WebGLCanvas( 'canvas_container_id' )

    // fit the canvas size to that of its container
    ResizeCanvasContainer()

    // do a sample draw, just to check everything is fine
    canvas.sampleDraw() 

    Log("OnDocumentLoad: ends")
}
// -------------------------------------------------------------------------------------------------

function OnBodyResize()
{
   ResizeCanvasContainer()
}
// -------------------------------------------------------------------------------------------------

