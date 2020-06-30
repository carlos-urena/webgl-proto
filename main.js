// -----------------------------------------------------------------------------
// File: main.js
// Includes function ('OnDOMLoaded') excuted once after page elements are loaded
//
// MIT License 
// Copyright (c) 2020 Carlos Ureña 
// (see LICENSE file)
// -----------------------------------------------------------------------------


// set to true to debug
var main_debug = false

// variable which holds the single WebGLCanvas class instance 
var canvas = null 

// -------------------------------------------------------------------------------------------------

/** Adapts the page containers divs to window size
*/
function ResizePageElements()
{
    const fname = 'ResizePageElements():'
    let canvas_container_elem = BuscarElemId('canvas_container_id')

    // compute and set new canvas sizes (nx,ny) from window size
    let border  = Trunc( window.innerWidth*0.05, 10, 30 ),
        canv_nx = Math.floor(window.innerWidth - border),
        canv_ny = Math.floor(window.innerHeight*0.7)

    canvas_container_elem.style.width   = canv_nx.toString() + "px"
    canvas_container_elem.style.height  = canv_ny.toString() + "px"

    Log(`${fname} nx == ${canv_nx}, ny == ${canv_ny}`)

    // compute and set the new width (cont_nx) for the header and footer containers 
    let cont_upp    = BuscarElemId( 'upper_container_id' ),
        cont_low    = BuscarElemId( 'lower_container_id' ),
        cont_nx     = Trunc( 1024, 0, canv_nx ),
        cont_nx_str = cont_nx.toString() + 'px'   

    cont_upp.style.width = cont_nx_str
    cont_low.style.width = cont_nx_str

    // resizes the canvas according to the 'canvas_container' div dimensions
    // (and then redraws the frame)
    if ( canvas != null )
        canvas.resize()  
}

// -------------------------------------------------------------------------------------------------
/* this is executed once, after all the html elements are loaded (but does not waits for CSS, imgs, etc...)
*/

function OnDOMLoaded()
{
    //ShowLogWin()
    ResizePageElements()

    TestMat4()


    let fname = 'OnDocumentLoad() :'
    if ( main_debug )
        Log(`${fname} begins.`)

    // set last modified text on the page
    let last_modified_elem = document.getElementById('last_modified_span_id')
    if ( last_modified_elem != null )
        last_modified_elem.innerHTML = document.lastModified

    // set document URL text on the page
    let uri_elem = document.getElementById('uri_span_id')
    if ( uri_elem != null )
        uri_elem.innerHTML = document.documentURI

    // create the canvas (the single instance of WebGLCanvas)
    if ( canvas != null )
        throw RangeError(`'canvas' is not null on document load`)   
    canvas = new WebGLCanvas( 'canvas_container_id' )

    // resize canvas container, canvas, and redraw frame
    ResizePageElements()

    if ( main_debug )
        Log("OnDocumentLoad: ends")
}
// -------------------------------------------------------------------------------------------------

function OnBodyResize()
{
   ResizePageElements()
   
}
// -------------------------------------------------------------------------------------------------

