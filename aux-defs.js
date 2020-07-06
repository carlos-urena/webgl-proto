// -----------------------------------------------------------------------------
// File: aux-defs.js
// Auxiliary functions definitions
//
// MIT License 
// Copyright (c) 2020 Carlos Ureña 
// (see LICENSE file)
// -----------------------------------------------------------------------------


function Trunc( x, min, max )
{
    if ( max < x )
        return max 
    else if ( x < min )
        return min
    else
        return x
}

// -------------------------------------------------------------------------------------------------

function BuscarElemId( id )
{
    let node = document.getElementById( id )
    if ( node === null )
    {
        const str = `Cannot find HTML element with identifier '${id}' in the page`
        Log( str )
        throw new Error(str)
    }
    return node
}

// ------------------------------------------------------------------------
/**
 * Checks if an object type or class name is equal to the expected one.
 * @param {Object} obj - any object, even undefined or null
 * @param {String} expected_type_name - a string with the expected type or constructor name  for that object
 */
 
function CheckType( obj, expected_type_name_str )
{
    if (typeof obj === 'undefined')   // this is neccesary ? (or it is allways defined?)
        throw new TypeError("object is undefined")

    if ( obj == null )
        throw new TypeError("object is 'null'")

    let obj_type_name = typeof(obj)
    if ( obj_type_name == 'object' )
        obj_type_name = obj.constructor.name
   
    if ( obj_type_name == expected_type_name_str )
        return

    let msg = `object is not a '${expected_type_name_str}', but a '${obj_type_name}'`
    throw new TypeError( msg )
}

// ------------------------------------------------------------------------
/**
 * Checks if an object is of 'number' type and has no decimal part (is integer)
 * @param {Object} num                - number
 * @param {String} expected_type_name - a string with the expected type or constructor name  for that object
 */
 
function CheckInt( num )
{
    CheckType( num, 'number' )
    if ( Math.floor(num) == num )
        return

   let msg = `number ${num} is not an integer value`
   throw new RangeError( msg )
}

// ------------------------------------------------------------------------
/**
 * Checks if an object is of 'number' type, has no decimal part, and is not negative
 * @param {Object} num                - number
 * @param {String} expected_type_name - a string with the expected type or constructor name  for that object
 */
 
function CheckNat( num )
{
    CheckInt( num )
    if ( 0 <= num )
        return

    let msg = `number ${num} is not a cero or positive integer value`
    throw new RangeError( msg )
}

// -------------------------------------------------------------------------------------------------
/**
 * Shows a (source) string with line numbers and a title
 * @param {string} title   -- the title (included as a heading)
 * @param {string} source  -- the probably multiline string to show
 */
function LogLines( title, source )
{
    let line_num = 1
    Log('-----------------------------------------------------------')
    Log(title)
    Log('-----------------------------------------------------------')

    for( let line of source.split('\n') )
    {  
       const line_num_str = line_num.toLocaleString( 'EN', { minimumIntegerDigits: 2 } ) 
       Log(`${line_num_str} : ${line}`)
       line_num ++
    }
    Log('-----------------------------------------------------------')
}



// -------------------------------------------------------------------------------------------------
/**
 * Logs a message both in the console and in the web page (when a div with id 'log_div_id' exists)
 * @param {string} msg -- message to log (can have multiple lines)
 */

 var global_log_count = 0
 var global_log_elem = null 
 var global_log_lines  = []

function Log( msg )
{    
    global_log_count++ 
    const lines    = msg.split('\n')
    let lines_elem = document.getElementById('log_lines_id')

    for ( let line of lines )
    {
        console.log( line )
        global_log_lines.push( line )
        if ( global_log_elem != null )
        if ( lines_elem != null )
            lines_elem.innerHTML += `${global_log_count}: ${msg}<br/>`
    }    
}

// -------------------------------------------------------------------------------------------------
/**
 *  Shows the log window or div on the page, if it is already shown, does nothing
 */
function ShowLogWin()
{
    // if already shown, close
    if ( global_log_elem != null )
    {
        CloseLogWin()
        return 
    }
    let contents = 
        `   <div id='log_head_id'>
                <h1>JS DEVELOPMENT LOG</h1>
                <div class='buttons_row_div_class'>
                    <hr noshade>
                    <span class='bsp_class' id='log_close_button_id'>Close</span>
                <hr noshade>
                </div>
            </div>
        `
    let log_elem       = document.createElement('div')
    log_elem.className = 'popup_style_class'
    log_elem.innerHTML = contents
    log_elem.onclick   = function() { CloseLogWin() }
    log_lines_elem     = document.createElement('div')
    log_lines_elem.id  = 'log_lines_id'
    log_lines_elem.innerHTML = ''

    let count = 1
    for( let line of global_log_lines )
    {   log_lines_elem.innerHTML += `${count}: ${line}<br/>`
        count ++ 
    }
    log_elem.appendChild( log_lines_elem )

    global_log_elem = log_elem
    document.body.appendChild( global_log_elem )
    
    ResizeLogWin()
}
// -------------------------------------------------------------------------------------------------
function CloseLogWin()
{
    if ( global_log_elem == null )
        return
    document.body.removeChild( global_log_elem )
    global_log_elem = null 
}
// -------------------------------------------------------------------------------------------------

function ResizeLogWin()
{
    if ( global_log_elem == null )
        return

    //log_elem.width  = 
    //log_elem.height = 
}


// -------------------------------------------------------------------------------------------------
/**
 * Checks that the parameter is a valid WebGLrendering context object, throws an exception otherwise
 * @param {WebGL2RenderingContext} context -- the context (it can also be a 'WebGLRenderingContext')
 */
function CheckWGLContext( context )
{
    const glclass = context.constructor.name 
    if ( glclass == 'WebGLRenderingContext' || glclass == 'WebGL2RenderingContext')
        return 

    const msg = `Context object is not a WebGL rendering context, but a '${glclass}'`
    Log( msg )
    throw new Error(msg) 
}

// -------------------------------------------------------------------------------------------------

function Check( is_ok, msg )
{
    if ( ! is_ok )
    {
        Log( msg )
        throw new Error( msg )
    }
}
// -------------------------------------------------------------------------------------------------

function CheckGLError( gl )
{
    // NOTE: it is convenient to deactivate 'getError' for production,  
    // see: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices
    // (gl.getError introduces long delays...)
    return 
    
    const err = gl.getError()
    if ( err === gl.NO_ERROR )
        return 
    
    const msg = 'An OpenGL error ocurred'
    Log( msg )
    throw new Error( msg )
}

// ----------------------------------------------

/**
 *  returns true iif parameter value is a number and power of two 
 *  taken from: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL
 *    @param   {number} value -- value to test
 *    @returns {bool}         -- true iif value is 2^n for some integer 'n', false otherwise
 */
function isPowerOf2(value) 
{
    return (value & (value - 1)) == 0;
}

// ----------------------------------------------------------------------------
// audio beep functions 
// Adapted from: https://odino.org/emit-a-beeping-sound-with-javascript/
// Notes frequencies at: https://pages.mtu.edu/~suits/notefreqs.html

// some notes frequencies

const f_A2 = 110.00,
      f_B2 = 123.47,
      f_C3 = 261.63,
      f_A4 = 440.00,
      f_B4 = 493.88,
      f_C5 = 523.25,
      f_A5 = 880.00,
      f_B5 = 987.77,
      f_C6 = 1046.50


// ----------------------------------------------------------------------------

// audio context for beeps
var audio_ctx = null

// ----------------------------------------------------------------------------
function Beep( vol, notes_array  )
{
    // create the audio context the first time this is called (after user gestures)
    // (avoids warning: https://developers.google.com/web/updates/2017/09/autoplay-policy-changes#webaudio)
    if ( audio_ctx == null )
        audio_ctx = new AudioContext()
    
    // create sequence of nodes
    for( note of notes_array )
    {
        note.src  = audio_ctx.createOscillator()
        note.gain = audio_ctx.createGain()
            
        note.src.connect( note.gain )
        note.src.frequency.value = note.freq
        note.src.type = "sine"   // https://developer.mozilla.org/en-US/docs/Web/API/OscillatorNode
        note.gain.connect( audio_ctx.destination )
        note.gain.gain.value = vol
    }
    // play sequence of nodes
    let t = audio_ctx.currentTime
    for ( let note of notes_array )
    {
        note.src.start( t )
        note.src.stop( t+note.secs )
        t += note.secs
    }
}
// ----------------------------------------------------------------------------

function HitBeep()
{
    const dur_s = 0.5
    Beep( 0.3, [ { freq:f_A5, secs: dur_s*0.1 },
                 { freq:f_B5, secs: dur_s*0.15 },
                 { freq:f_C6, secs: dur_s*0.2 } ] )
}
// ----------------------------------------------------------------------------
function NohitBeep()
{
    const dur_s = 0.12
    Beep( 0.3, [ { freq:f_C3, secs: dur_s     },
                 { freq:f_B2, secs: dur_s*0.6 },
                 { freq:f_A2, secs: dur_s*0.4 } ] )
}
// ----------------------------------------------------------------------------






