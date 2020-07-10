// -----------------------------------------------------------------------------
// File: ply-parse.js
// Class definition: PLYParser (parser for PLY files with indexed triangle meshes)
//
// Info about PLY format
// http://paulbourke.net/dataformats/ply/
//
// MIT License 
// Copyright (c) 2020 Carlos Ureña 
// (see LICENSE file)
// -----------------------------------------------------------------------------


const debug_ply_parse = true 


class PLYParser
{
    /**
     * Parses the PLY header, 
     *   - reads from 'this.lines' 
     *   - adds elements to the 'this.elements' array
     *   - writes 'this.parse_ok' to true or false, if false, also sets 'this.parse_message'
     */
    parseHeader( )
    {
        const fname = 'PLYParser.parseHeader():'

        if ( debug_ply_parse )
            Log(`${fname} begins.`)

        // valid value types 
        const valid_types = [ 'char','uchar','short', 'ushort', 'int', 'uint', 'float', 'double' ]     

        // seek for 'end_header' line
        let ehl = 2    // end header line num
        while( ehl < this.lines.length && (this.lines[ehl]).trim() != 'end_header'   )
            ehl ++ 

        /// Check basic header properties
    
        if ( this.lines.length == ehl )
        {   this.parse_message = "end of header not found"
            return 
        }
        if ( this.lines.length < 3 )
        {   this.parse_message = "invalid file, it has less than 3 lines"
            return 
        }

        this.parse_message_line = this.lines[0]
        if ( this.lines[0].trim() != 'ply' )
        {   this.parse_message = "invalid PLY file: first line is not 'ply'"
            return 
        }

        this.parse_message_line = this.lines[1]
        if ( this.lines[1].trim() != 'format ascii 1.0' )
        {   this.parse_message = "invalid header: it is encoded as a binary file, cannot process it"
            return 
        }

        /// Process header lines, check it is syntactically valid

        let curr_first_line      = ehl+1  // first line number for lines corresponding to next element
        let last_element         = null
        let next_property_index  = 0

        for( let l = 3 ; l < ehl ; l++ )
        {
            const
                line     = this.lines[l].trim(), 
                tokens   = line.split(' ')

            this.parse_message_line = `line ${l}: "${line}"`
            Log(`${fname} ${this.parse_message_line}`)

            
            // allow empty lines
            if ( tokens.length == 0 )
                continue 
            if ( tokens[0] == 'comment' )
                continue

            if ( tokens[0] == 'element') // element description line
            {
                if ( tokens.length != 3 )
                {   this.parse_message = "line starting with 'element' has invalid format (not 3 words)"
                    return 
                }
                const elem_num_lines = parseInt( tokens[2], 10 )
                if ( isNaN(elem_num_lines) || elem_num_lines <= 0  )
                {   this.parse_message = "line starting with 'element' has invalid number of items"
                    return 
                }
                let element = 
                {   name       : tokens[1], 
                    num_lines  : elem_num_lines,
                    properties : new Map(),  // element properties, indexed by properties' names,
                    num_props  : 0,
                    first_line : curr_first_line,
                    last_line  : curr_first_line + elem_num_lines -1
                }
                curr_first_line += elem_num_lines
                
                if ( this.elements.has( element.name ) )
                {   this.parse_message = "duplicate element name in two lines"
                    return
                }
                this.elements.set( element.name, element )   
                last_element        = element
                next_property_index = 0
            }
            else if ( tokens[0] == 'property'  ) // property description line
            {
                let property = null 

                if ( last_element == null )
                {   this.parse_message = "there is a 'property' line before any 'element' line"
                    return
                }
                if ( tokens[1] != 'list' )  // property (not list)
                {
                    if ( tokens.length != 3 )
                    {   this.parse_message = "line starting with 'property' (not list) has invalid format (not 3 words)"
                        return
                    }
                    property = 
                    {   is_list    : false,
                        index      : next_property_index, 
                        name       : tokens[2],  
                        value_type : tokens[1]
                    }
                }
                else  // property list
                {
                    if ( tokens.length != 5 )
                    {   this.parse_message = "line starting with 'property list' has invalid format (not 5 words)"
                        return
                    }

                    // there is some ambiguity about the name of indices property, we fix it to be 'vertex_index'
                    let pname = tokens[4]
                    if ( pname === 'vertex_indices' || pname === 'vertex_indexes' )
                        pname = 'vertex_index'

                    property = 
                    {   is_list     : true,
                        name        : pname ,  
                        index       : next_property_index,
                        value_type  : tokens[3],
                        length_type : tokens[2]
                    }
                }
                if ( last_element.properties.has( property.name ) )
                {   this.parse_message = "duplicate property name in two lines of an element description in header"
                    return result
                }
                
                last_element.properties.set( property.name, property )
                last_element.num_props ++ 
                next_property_index ++ 
            }
        }
        this.parse_message_line = '(line text is not available)'
  
        // Check vertex element is valid

        if ( ! this.elements.has('vertex') )
        {   this.parse_message = "header does not include 'vertex' element"
            return 
        }
        let vep = this.elements.get('vertex').properties  // vertex element properties
        if ( ! vep.has('x') || ! vep.has('y') || ! vep.has('z') )
        {   this.parse_message = "'vertex' element has no 'x/y/z' properties"
            return result
        }
        let px = vep.get('x')
        if ( px.index != 0 )
        {   this.parse_message = "'x' property is not the first in 'vertex' element."
            return
        }

        // Check face element is valid

        if ( ! this.elements.has('face') )
        {   this.parse_message = "header does not include 'face' element"
            return
        }
        let fep = this.elements.get( 'face' ).properties
        if ( ! fep.has('vertex_index') )
        {   this.parse_message = "'face' element has no 'vertex_index' list"
            return 
        }
        let vip = fep.get( 'vertex_index' )
        if ( ! vip.is_list )
        {   this.parse_message = "'vertex_index' face property is not a list"
            return 
        }

        // done, no errors found
        this.parse_ok = true 
    }
    // -------------------------------------------------------------------------------------------------
    /**
     * Parses the 'vertex' elem (read all the lines corresponding to this element)
     * writes 'this.coords_data' (which must be already created)
     */
    parseVertexElem()
    {
        const fname = 'PLYParser.parseVertexElem():'

        let vertex_elem   = this.elements.get('vertex'),
            props         = vertex_elem.properties,
            parse_normals = false,
            normals_idx   = 0,   // position of 'nx' in vertex line, starting at 0 ('index' of the property)
            p = 0
        
        Check( vertex_elem != null )

        /// check if we have normals data in the input (properties: nx,ny,nz) 
        if ( props.has('nx') && props.has('ny') && props.has('nz'))
        {
            parse_normals     = true 
            normals_idx       = props.get('nx').index
            this.normals_data = new Float32Array( 3*this.num_verts )
            Log(`${fname} parsing normals for each vertex, pos == ${normals_idx}`)
        }

        /// Parse vertex coordinates
        p = 0 
        for( let line_num = vertex_elem.first_line ; line_num <= vertex_elem.last_line ; line_num++ )
        {
            this.parse_message_line = `line ${line_num}: "${this.lines[line_num]}"`

            const tokens = this.lines[line_num].trim().split(' ')
            if ( tokens.length != vertex_elem.num_props )
            {   this.parse_message =  `vertex coords. line: expected ${vertex_elem.num_props} numbers but found ${tokens.length}`
                return 
            }
            const 
                vc_x = parseFloat( tokens[0] ),
                vc_y = parseFloat( tokens[1] ),  
                vc_z = parseFloat( tokens[2] )

            if ( isNaN(vc_x) || isNaN(vc_y)  || isNaN(vc_z) )
            {   this.parse_message = `vertex coords. line: cannot convert vertex coordinates to floating point numbers`
                return 
            }
            /// store vertex coordinates 
            this.coords_data[p+0] = vc_x
            this.coords_data[p+1] = vc_y   
            this.coords_data[p+2] = vc_z

            if ( parse_normals )
            {
                const 
                    vn_x = parseFloat( tokens[normals_idx + 0] ),
                    vn_y = parseFloat( tokens[normals_idx + 1] ),  
                    vn_z = parseFloat( tokens[normals_idx + 2] )

                if ( isNaN(vn_x)  || isNaN(vn_y)  || isNaN(vn_z)  )
                {   this.parse_message = `vertex coords. line: cannot convert normals coordinates to floating point numbers`
                    return 
                }
                /// store normal (swap Y <-> Z and negate X)
                this.normals_data[p+0] = -vn_x
                this.normals_data[p+1] = vn_z   
                this.normals_data[p+2] = vn_y
            }
            // advance pointer to float arrays
            p += 3
        }
        this.parse_ok = true
    }
    // -------------------------------------------------------------------------------------------------
    /**
     * Parses the 'face' elem (read all the lines corresponding to this element)
     * writes 'this.triangle_data' (which must be already created)
     */
    parseFaceElem()
    {
        let fname           = 'PLYParser.parseFaceElem():',
            face_elem       = this.elements.get('face'),
            parse_texcoords = false,
            tcp             = face_elem.properties.get('texcoord')

        if ( tcp !== undefined )
        if ( tcp.is_list && tcp.value_type == 'float' )
        {
            parse_texcoords = true
            this.texcoo_data = new Float32Array( 2*this.num_verts )
            Log(`${fname} parsing texture coordinates data in face lines`)
        }

        Check( face_elem != null )

        let p = 0
        for( let line_num = face_elem.first_line ; line_num <= face_elem.last_line ; line_num++ )
        {
            this.parse_message_line = `line ${line_num}: "${this.lines[line_num]}"`
            const tokens = this.lines[line_num].trim().split(' ')

            if ( tokens.length < 4 )
            {
                this.parse_message = `face indices line: expected at least 4 numbers but found ${tokens.length}`
                return result
            }
            const nv = parseInt( tokens[0] )
            if ( nv != 3 )
            {
                this.parse_message = `face indices line: expected a face with 3 vertexes but found ${nv}`
                return 
            }
            const 
                i0 = parseInt( tokens[1] ),
                i1 = parseInt( tokens[2] ),
                i2 = parseInt( tokens[3] )

            if ( isNaN(i0)  || isNaN(i1)  || isNaN(i2) )
            {   this.parse_message = `face indices line: cannot convert indexes to integer values`
                return
            }
            if ( i0 < 0 || this.num_verts <= i0  || i1 < 0 || this.num_verts <= i1  || i2 < 0 || this.num_verts <= i2  )
            {   this.parse_message = `face indices line: a vertex index is out of range (indexes are: ${i0}, ${i1}, ${i2}), num verts is ${this.num_verts}`
                return 
            }
            this.triangles_data[p+0] = i0 
            this.triangles_data[p+1] = i1
            this.triangles_data[p+2] = i2 
            p += 3

            // parse texture coordinates (must be improved for duplicate vertexes)
            if ( parse_texcoords )
            {
                if ( tokens.length < 11 )
                {   this.parse_message = `face indices line: expected at least 11 numbers but found ${tokens.length}`
                    return
                }
                if ( parseInt( tokens[4]) != 6 )
                {   this.parse_message = `face indices line: length of texture coord list is not 6 but ${tokens[4]}`
                    return
                }

                let tcc = []
                for( let i = 0 ; i < 6 ; i++ )
                {
                    const v = parseFloat( tokens[5+i] )
                    if ( isNaN(v) )
                    {   this.parse_message = `face indices line: cannot convert texture coordinate to float`
                        return
                    }
                    tcc.push( v )
                }
                
                this.texcoo_data[ 2*i0 + 0 ] = tcc[0]
                this.texcoo_data[ 2*i0 + 1 ] = 1.0-tcc[1]

                this.texcoo_data[ 2*i1 + 0 ] = tcc[2]
                this.texcoo_data[ 2*i1 + 1 ] = 1.0-tcc[3]

                this.texcoo_data[ 2*i2 + 0 ] = tcc[4]
                this.texcoo_data[ 2*i2 + 1 ] = 1.0-tcc[5]
            }
        }
        this.parse_ok = true
    }

    // -------------------------------------------------------------------------------------------------

    /**
     * Constructor. Parses the lines of a PLY file, this version 
     *   - reads the elements and elements properties
     *   - expects at least 'vertex' elements with 'x','y','z' floating point properties
     *   - expects 'face' element with a list of integer indexes, each 'face' must have exactly 3 vertexes
     *   - is able to process texture coords, vertex colors, normals .....(this is WIP)
     * 
     * the built object includes these properties
     *   - parse_ok       {bool} -- true iif there where no errors
     *   - parse_message  {string} -- resulting message, if 'parse_ok' is 'fals', contains error description.
     *   - parse_message_line {string}  -- for some parse errors, the erroneous line
     *   - vertex_coords  {Float32Array} -- vertex coordinates  ( 3 entries per vertex)
     *   - triangles_data {Uint32Array}  --  triangle coordinates (3 entries per face)
     *   - vertex_colors  {Uint8Array}   -- vertex colors, if the ply has them   (rgb properties in vertex element)
     *   - vertex_texcoo  {Float32Array} -- texture coords, if the ply has them  (??)
     */
    constructor( lines )
    {
        
        const fname = 'PLYParser.constructor():'
        if ( debug_ply_parse ) 
            Log(`${fname} begins.`)

        // initialize object
        this.lines              = lines
        this.parse_ok           = false,    // parsing is erroneous excepto when 'parse_ok' is set to true 
        this.parse_message      = 'no errors found so far' ,
        this.parse_message_line = '(line text is not available)'
        this.elements           = new Map(),
        this.coords_data        = null,
        this.triangles_data     = null,
        this.texcoo_data        = null,
        this.normals_data       = null
        
        // parse the header, if an error ocurred, do nothing more
        this.parseHeader( )
        if ( ! this.parse_ok )
            return
        this.parse_ok = false  
        
        // get info from PLY elements descriptions (from the Map 'this.elements')
        let 
            vertex_elem     = this.elements.get('vertex'),
            face_elem       = this.elements.get('face')

        this.num_verts       = vertex_elem.num_lines,  
        this.num_tris        = face_elem.num_lines,
        this.coords_data     = new Float32Array( 3*this.num_verts ),
        this.triangles_data  = new Uint32Array( 3*this.num_tris )

        if ( debug_ply_parse ) 
        {   
            Log(`${fname} num_verts == ${this.num_verts}`)
            Log(`${fname} num_tris  == ${this.num_tris}`)
            Log(`${fname} vertex elem. num props.: ${vertex_elem.num_props}` )
        }

        // Parse vertexes
        this.parseVertexElem()
        if ( ! this.parse_ok ) return
        this.parse_ok = false

        // Parse faces 
        this.parseFaceElem()
        if ( ! this.parse_ok ) return
        this.parse_ok = false

        // done
        this.parse_ok = true 
    }

} // ends PLYParser class
