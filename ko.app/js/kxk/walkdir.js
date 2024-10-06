var _k_ = {empty: function (l) {return l==='' || l===null || l===undefined || l!==l || typeof(l) === 'object' && Object.keys(l).length === 0}, list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}, in: function (a,l) {return (typeof l === 'string' && typeof a === 'string' && a.length ? '' : []).indexOf.call(l,a) >= 0}, isFunc: function (o) {return typeof o === 'function'}}

import slash from "./slash.js"
import ffs from "./ffs.js"

class walkdir
{
    constructor (cfg)
    {
        var _16_25_, _17_25_, _18_25_, _19_25_, _20_25_

        this.cfg = cfg
    
        this.cfg.files = []
        this.cfg.maxDepth = ((_16_25_=this.cfg.maxDepth) != null ? _16_25_ : 3)
        this.cfg.dotFiles = ((_17_25_=this.cfg.dotFiles) != null ? _17_25_ : false)
        this.cfg.maxFiles = ((_18_25_=this.cfg.maxFiles) != null ? _18_25_ : 15000)
        this.cfg.ignore = ((_19_25_=this.cfg.ignore) != null ? _19_25_ : ['node_modules'])
        this.cfg.ignoreExt = ((_20_25_=this.cfg.ignoreExt) != null ? _20_25_ : ['asar'])
    }

    ignore (p)
    {}

    async start ()
    {
        var dir, ext, file, item, items, listDir, p, toWalk, _57_31_, _78_17_

        dir = this.cfg.root
        toWalk = [dir]
        while (!_k_.empty(toWalk))
        {
            listDir = toWalk.shift()
            items = await ffs.list(listDir)
            var list = _k_.list(items)
            for (var _a_ = 0; _a_ < list.length; _a_++)
            {
                item = list[_a_]
                file = item.file
                ext = slash.ext(file)
                p = item.path
                if ((typeof this.cfg.filter === "function" ? this.cfg.filter(p) : undefined))
                {
                    this.ignore(p)
                    continue
                }
                else if (_k_.in(file,['.DS_Store','Icon\r']) || _k_.in(ext,['pyc']))
                {
                    this.ignore(p)
                    continue
                }
                else if (_k_.in(file,this.cfg.ignore))
                {
                    this.ignore(p)
                    continue
                }
                else if (file.startsWith('.'))
                {
                    if (this.cfg.dotFiles)
                    {
                        this.cfg.files.push(item.path)
                    }
                    else
                    {
                        this.ignore(p)
                        continue
                    }
                }
                else if (_k_.in(ext,this.cfg.ignoreExt))
                {
                    this.ignore(p)
                    continue
                }
                if (item.type === 'dir')
                {
                    if (_k_.isFunc(this.cfg.dir))
                    {
                        if (!this.cfg.dir(item.path))
                        {
                            continue
                        }
                    }
                    toWalk.push(item.path)
                }
                if (this.cfg.files.length > this.cfg.maxFiles)
                {
                    console.log('maxFiles reached')
                    break
                }
            }
        }
        ;(typeof this.cfg.done === "function" ? this.cfg.done(this) : undefined)
        return this.cfg
    }
}

export default async function (cfg)
{
    var w

    w = new walkdir(cfg)
    return await w.start()
};