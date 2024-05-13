import kxk from "../../kxk.js"
let slash = kxk.slash
let post = kxk.post

class DirWatch
{
    static watches = {}

    static watch (dir)
    {
        var _17_30_

        DirWatch.watches[dir] = ((_17_30_=DirWatch.watches[dir]) != null ? _17_30_ : 0)
        return DirWatch.watches[dir]++
    }

    static unwatch (dir)
    {
        DirWatch.watches[dir]--
        if (DirWatch.watches[dir] <= 0)
        {
            return delete DirWatch.watches[dir]
        }
    }

    static onChange (change, path, isDir)
    {
        var dir, k, v

        if (isDir)
        {
            dir = path
        }
        else
        {
            dir = slash.dir(path)
        }
        for (k in DirWatch.watches)
        {
            v = DirWatch.watches[k]
            if (k === dir)
            {
                post.emit('dirChanged',{change:change,path:path,dir:dir})
                return
            }
        }
    }
}

post.on('fs.change',DirWatch.onChange)
export default DirWatch;