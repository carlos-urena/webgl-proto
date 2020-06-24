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
     *   - groups             {Array} -- array of groups, each group has these properties
     *        * name {string}      -- group name, 'default' for the group before any 'g' command
     *        * num_verts {number} -- number of vertexes  
     *        * num_tris  {number} -- number of faces 
     *        * num_tcc   {number} -- number of texture coordinates
     *                 
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
        
        for( let i = 0 ; i < lines.length ; i++ )
        {
            const tokens = lines[i].trim().split(/\s+/)
            this.parse_message_line = `at line # ${i} == '${lines[i]}'`

            if ( tokens.length === 0 )
                continue 
            else if ( tokens[0].substring(0,1) == '#' )
            {
                Log(`${fname} comments: ${lines[i]}`)
                continue
            }

            // when neccesary, if no 'g' command has been found so far, create the default group
            if ( ['v','vt','f'].includes( tokens[0] ) )
            if ( curr_group == null )
            {   
                curr_group = 
                {   name      : 'default', 
                    num_verts : 0,
                    num_tris  : 0,
                    num_tcc   : 0 
                }
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
                curr_group = 
                {   name      : 2 < tokens.length ? `${tokens[1]}/${tokens[2]}` : tokens[1],
                    num_verts : 0,
                    num_tris  : 0,
                    num_tcc   : 0
                }
                this.groups.push( curr_group )
            }
            else if ( tokens[0] == 'v' )
            {    
                // increase number of vertexes for this group
                curr_group.num_tris ++
            }
            else if ( tokens[0] == 'f' )
            {    
                // increase number of triangles for this group
                curr_group.num_tris ++
            }
            else if ( tokens[0] == 'vt' )
            {    
                // increase number of texture coords for this group
                curr_group.num_tcc ++
            }
        }

        for ( let group of groups )
        {
            Log(`${fname} group '${group.name}', num_verts == ${num_verts}, num_tris == ${num_tris}, num_tcc == ${num_tcc}`)
        }
        

        // done
        this.parse_ok = true 
        Log(`${fname} end (parse ok)`)
    }

} // ends OBJParser class
