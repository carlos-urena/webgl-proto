// -----------------------------------------------------------------------------
// File: obj-parser.js
// Class definition: OBJParser (parser for OBJ files with indexed triangle meshes)
//
// Info about OBJ format
// http://paulbourke.net/dataformats/obj/
//
// MIT License 
// Copyright (c) 2020 Carlos Ureña 
// (see LICENSE file)
// -----------------------------------------------------------------------------


const debug_obj_parse = true 


class OBJGroup
{
    constructor()
    {
        this.name      = 'default' 
        this.num_verts = 0
        this.num_tris  = 0
        this.num_tcc   = 0
        this.coords    = [] 
    }
}

class OBJParser
{
    
    // -------------------------------------------------------------------------------------------------

    /**
     * Constructor. Parses the lines of an OBJ file, this version 
     *   - parser multigroup OBJ (file  optionally may have more than one 'g' commands)
     *   - considers just 'v','vt' and 'f' commands
     *   - ignores empty lines or lines starting with '#'
     * 
     * the built object includes these properties
     *   - parse_ok           {bool} -- true iif there where no errors
     *   - parse_message      {string} -- resulting message, if 'parse_ok' is 'fals', contains error description.
     *   - parse_message_line {string}  -- for some parse errors, the erroneous line
     *   - groups             {Array} -- array of groups, each group is an 'OBJGroup' instance           
     */
    constructor( lines )
    {
        
        const fname = 'OBJParser.constructor():'
        Log(`${fname} begins.`)

        // initialize object
        this.lines              = lines
        this.parse_ok           = false,    // parsing is erroneous excepto when 'parse_ok' is set to true 
        this.parse_message      = 'no errors found so far' ,
        this.parse_message_line = '(line text is not available for this error)'
        this.groups             = []  // groups array, each group is a separate mesh ???

        let curr_group = null  // current group being processed
        
        for( let ln = 0 ; ln < lines.length ; ln++ )
        {
            const tokens = lines[ln].trim().split(/\s+/)
            this.parse_message_line = `at line # ${ln} == '${lines[ln]}'`

            if ( tokens.length === 0 )
                continue 
            else if ( tokens[0].substring(0,1) == '#' )
            {
                Log(`${fname} comments: ${lines[ln]}`)
                continue
            }

            // when neccesary, if no 'g' command has been found so far, create the default group
            if ( ['v','vt','f'].includes( tokens[0] ) )
            if ( curr_group == null )
            {   
                curr_group = new OBJGroup()
                this.groups.push( curr_group )
            }
            // process 
            if ( tokens[0] == 'g' )
            {
                if ( tokens.length < 2 )
                {   
                    this.parse_message = "group name not found after 'g' line"
                    return
                }
                curr_group      = new OBJGroup()
                curr_group.name = tokens[1]

                for( let i = 2 ; i < tokens.length ; i++ )
                    curr_group.name += `/${tokens[i]}`
                
                this.groups.push( curr_group )
            }
            else if ( tokens[0] == 'v' )
            {    
                // process 'v' line (we ignore values beyond the first three, so far)
                if ( tokens.length < 4 )
                {   this.parse_message = `expected at least 3 values in a 'v' line, but found just ${tokens.length-1}` 
                    return
                }
                curr_group.num_verts ++
            }
            else if ( tokens[0] == 'f' )
            {    
                // process 'f' line (we only accept triangles)
                if ( tokens.length < 4 )
                {   this.parse_message = `expected at least 3 vertexes in a 'f' line, but found just ${tokens.length-1}` 
                    return
                }
                curr_group.num_tris ++
            }
            else if ( tokens[0] == 'vt' )
            {    
                // increase number of texture coords for this group
                curr_group.num_tcc ++
            }
        }

        for ( let group of this.groups )
        {
            Log(`${fname} group '${group.name}', num_verts == ${group.num_verts}, num_tris == ${group.num_tris}, num_tcc == ${group.num_tcc}`)
        }
        

        // done
        this.parse_ok = true 
        Log(`${fname} end (parse ok)`)
    }

} // ends OBJParser class
