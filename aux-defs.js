

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
        const str = `No encuentro en el documento el elemento con identificador'${id}' (ver consola)`
        Log( msg )
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
    console.log('-----------------------------------------------------------')
    console.log(title)
    console.log('-----------------------------------------------------------')

    for( let line of source.split('\n') )
    {  console.log(`${line_num} : ${line}`)
       line_num ++
    }
    console.log('-----------------------------------------------------------')
}
// -------------------------------------------------------------------------------------------------
/**
 * Logs a message both in the console and in the web page (when a div with id 'log_div_id' exists)
 * @param {string} msg -- message to log. 
 */
function Log( msg )
{
    console.log( msg )
    // let log_elem = document.getElementById('log_div_id')
    // if ( log_elem == null )
    //     return
    // const str = msg+'<br/>'
    // log_elem.innerHTML = log_elem.innerHTML + str
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
    return ; // deactivate 'getError' for production, see: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices
    const err = gl.getError()
    if ( err === gl.NO_ERROR )
        return 
    
    const msg = 'An OpenGL error ocurred'
    Log( msg )
    throw new Error( msg )
}
