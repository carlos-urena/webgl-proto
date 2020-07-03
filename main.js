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
    let canvas_container_elem = BuscarElemId('canvas_container_id'),
        right_panel_elem      = BuscarElemId('right_panel_id'),
        low_cont_elem         = BuscarElemId('lower_container_id'),
        upp_cont_elem         = BuscarElemId('upper_container_id')

    const rightp_min_width_px = 200

    // compute and set new canvas sizes (nx,ny) from window size
    let 
        //border  = Trunc( window.innerWidth*0.05, 10, 30 ),
        border    = 4,
        canv_nx   = Math.floor( 0.75*window.innerWidth - border ),  // 75% of available space for the canvas
        rightp_nx = window.innerWidth - border - canv_nx,         // the remaining space for the right panel
        canv_ny   = Math.ceil( window.innerHeight - low_cont_elem.offsetHeight - upp_cont_elem.offsetHeight*1.6 )
        //Math.floor( window.innerHeight*0.7 )

    if ( rightp_nx <= rightp_min_width_px )
    {
        rightp_nx = rightp_min_width_px
        canv_nx = ( window.innerWidth - border - rightp_nx )
    }

    const 
        sx_str = canv_nx.toString() + "px",
        sy_str = canv_ny.toString() + "px"

    canvas_container_elem.style.width   = sx_str
    canvas_container_elem.style.height  = sy_str 
    right_panel_elem.style.width        = rightp_nx.toString() + "px"
    right_panel_elem.style.height       = sy_str


    //Log(`${fname} convas container style dimensions set to  ${sx_str} x ${sy_str}`)

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
    ResizePageElements() // this is done so elements are shown on startup (check it?)

    //TestMatrices()


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

