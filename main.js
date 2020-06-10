
var main_debug = false

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

    const nx = Math.min( 2048, Math.max( 256, Math.floor(window.innerWidth*0.8  ) ) ),
          ny = Math.min( 2048, Math.max( 256, Math.floor(window.innerHeight*0.8 ) ) )

    canvas_container_elem.style.width   = nx.toString() + "px"
    canvas_container_elem.style.height  = ny.toString() + "px"
    if ( main_debug )
        Log(`ResizeCanvasContainer, new w = ${nx}, h = ${ny}`)
    canvas.resize()  // resizes the canvas according to div dimensions
}

// -------------------------------------------------------------------------------------------------
/* this is executed once, after the body has finished loading
*/

function OnDocumentLoad()
{
    let fname = 'OnDocumentLoad() :'
    if ( main_debug )
        Log(`${fname} begins.`)

    // create the canvas (the single instance of WebGLCanvas)
    if ( canvas != null )
        throw RangeError(`'canvas' is not null on document load`)   
    canvas = new WebGLCanvas( 'canvas_container_id' )

    // fit the canvas size to that of its container
    ResizeCanvasContainer()

    // do a sample draw, just to check everything is fine
    canvas.sampleDraw() 

    // set last modified text on the page
    let last_modified_elem = document.getElementById('last_modified_span_id')
    if ( last_modified_elem != null )
        last_modified_elem.innerHTML = document.lastModified

    // set document URL text on the page
    let uri_elem = document.getElementById('uri_span_id')
    if ( uri_elem != null )
        uri_elem.innerHTML = document.documentURI

    if ( main_debug )
        Log("OnDocumentLoad: ends")
}
// -------------------------------------------------------------------------------------------------

function OnBodyResize()
{
   ResizeCanvasContainer()
}
// -------------------------------------------------------------------------------------------------

