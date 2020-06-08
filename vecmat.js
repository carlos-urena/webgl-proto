class Vec3
{
    constructor( obj )
    {
        const c = obj.constructor.name

        if ( c == 'Array' && obj.length == 3 )
        {
            this.v = new Float32Array(3)
            this.v[0] = obj[0]
            this.v[1] = obj[1]
            this.v[2] = obj[2]
        }
        else if ( c == 'Float32Array' && obj.length == 3 )
        {
            this.v = new Float32Array(obj)
        }
        else if ( c == 'Vec3' )
        {
            this.v = new Float32Array( obj.v )
        }
        else if ( c == 'Object' )
        {
            this.v = new Float32Array(3)
            if ( 'x' in obj && 'y' in obj && 'z' in obj )
            {
                this.v[0] = obj.x
                this.v[1] = obj.y
                this.v[2] = obj.z
            }
            else if ( 'r' in obj && 'g' in obj && 'b' in obj )
            {
                this.v[0] = obj.r
                this.v[1] = obj.g
                this.v[2] = obj.b
            }
            else if ( '0' in obj && '1' in obj && '2' in obj )
            {
                this.v[0] = obj['0']
                this.v[1] = obj['1']
                this.v[2] = obj['2']
            }
            else 
                throw new Error('Vec3.constructor(): object has no x/y/z, nor r/g/b, neither 0/1/2 properties')
        }
        else
            throw new Error('Vec3.constructor(): invalid argument type or size')

    }
    toString()  { return `(${this.v[0]},${this.v[1]},${this.v[2]})` }

    plus ( v3 ) { return new Vec3([ this.v[0]+v3.v[0], this.v[1]+v3.v[1], this.v[2]+v3.v[2] ]) }
    minus( v3 ) { return new Vec3([ this.v[0]-v3.v[0], this.v[1]-v3.v[1], this.v[2]-v3.v[2] ]) }
    scale( a  ) { return new Vec3([ a*this.v[0], a*this.v[1], a*this.v[2] ]) }
    dot  ( v3 ) { return this.v[0]*v3.v[0] + this.v[1]*v3.v[1] + this.v[2]*v3.v[2] }
     
    x() { return this.v[0] }
    y() { return this.v[1] }
    z() { return this.v[2] }
    
    r() { return this.v[0] }
    g() { return this.v[1] }
    b() { return this.v[2] }
}

// ------------------------------------------------------------------------------------------------

function TestVec3()
{
    const fname = `TestVec3() :`
    Log(`${fname} begins`)

    let a = new Vec3([ 4,6,8 ]),
        b = new Vec3( new Float32Array([4,6,8]) ),
        c = new Vec3({ x:4, y:6, z:8 })
        d = new Vec3({ r:4, g:6, b:8 })
        e = new Vec3({ 0:4, 1:6, 2:8 })
        f = new Vec3( a )

    Log(`${fname} TestVec3: a==${a}, b==${b}, c==${c}, d=${d}, e=${e}, f=${f}`)
    Log(`${fname} a+b == ${a.plus(b)}`)
    Log(`${fname} a-b == ${a.minus(b)}`)
    Log(`${fname} a*3 == ${a.scale(3)}`)
    Log(`${fname} ends`)
    
}

// ------------------------------------------------------------------------------------------------

class Mat4 extends Float32Array 
{
    toString()
    {
        let str = '\n'
        for( let i = 0 ; i<4 ; i++ )
        {   const b = i*4
            str = str + `   | ${this[b+0]}, ${this[b+1]}, ${this[b+2]}, ${this[b+3]} |\n`
        }    
        return str    
    }
}
// ------------------------------------------------------------------------------------------------

class Mat4_Identity extends Mat4
{
    constructor()
    {
        super([  1, 0, 0, 0,
                 0, 1, 0, 0,
                 0, 0, 1, 0,
                 0, 0, 0, 1 
        ])
    }
}
// ------------------------------------------------------------------------------------------------

function TestMat4()
{
    const fname = `TestMat4():`
    Log(`${fname} begins`)
    const m1 = new Mat4_Identity()
    Log(`${fname}  identity mat == ${m1}`)

    Log(`${fname} ends`)
}
// ------------------------------------------------------------------------------------------------

function Mat4f_Identity()
{
    return new Float32Array
        ([  1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1 
        ])
}

// ------------------------------------------------------------------------------------------------
// A projection for simple undistorted 2D drawings 
// Maps [-1..+1]x[-1..+1], to the center of the viewport, undistorted, with maximun size

function Mat4f_UndProj2D( sx, sy )
{
    const min = Math.min(sx,sy),
          fx  = min/sx,
          fy  = min/sy

    return new Float32Array
        ([  fx, 0,  0, 0,
            0,  fy, 0, 0,
            0,  0,  1, 0,
            0,  0,  0, 1 
        ])
}


function Mat4f_Multiply( ma, mb )
{

    CheckType( ma, 'Float32Array')
    CheckType( mb, 'Float32Array')
}


