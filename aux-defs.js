
// -------------------------------------------------------------------------------------------------

function BuscarElemId( id )
{
    let node = document.getElementById( id )
    if ( node === null )
    {
        const str = `No encuentro en el documento el elemento con identificador'${id}' (ver consola)`
        alert(str)
        throw RangeError(str)
    }
    return node
}

// ------------------------------------------------------------------------
/**
 * Checks if an object type or class name is equal to the expected one.
 * @param {Object} obj - any object, even undefined or null
 * @param {String} expected_type_name - a string with the expected type or constructor name  for that object
 */
 
function CheckType( obj, expected_type_name )
{
   if ( obj == null )
      throw TypeError("object is 'null'")

   let obj_type_name = typeof(obj)
   if ( obj_type_name == 'object' )
      obj_type_name = obj.constructor.name
   
    if ( obj_type_name == expected_type_name )
      return

   let msg = `object is not a '${expected_type_name}', but a '${obj_type_name}'`
   throw TypeError( msg )
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
