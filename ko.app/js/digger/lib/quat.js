import * as three from 'three'
class Quat extends three.Quaternion
{
    static tmp = new Quat

    static counter = 0

    static zero = new Quat(new three.Quaternion)

    static unitZ = new three.Vector3(0,0,1)

    constructor (x = 0, y = 0, z = 0, w = 1)
    {
        Quat.counter++
        if (x instanceof three.Vector3)
        {
            super()
            this.setFromUnitVectors(Quat.unitZ,x)
        }
        else if (x instanceof Quat || x instanceof three.Quaternion)
        {
            super(x.x,x.y,x.z,x.w)
        }
        else
        {
            super(x,y,z,w)
        }
        if (Number.isNaN(this.x))
        {
            throw new Error
        }
    }
}

export default Quat;