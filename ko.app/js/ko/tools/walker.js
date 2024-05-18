var _k_ = {empty: function (l) {return l==='' || l===null || l===undefined || l!==l || typeof(l) === 'object' && Object.keys(l).length === 0}, list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}, in: function (a,l) {return (typeof l === 'string' && typeof a === 'string' && a.length ? '' : []).indexOf.call(l,a) >= 0}, isFunc: function (o) {return typeof o === 'function'}}

import kxk from "../../kxk.js"
let slash = kxk.slash
let ffs = kxk.ffs

import File from "./File.js"

class Walker
{
    constructor (cfg)
    {
        var _18_25_, _19_25_, _20_25_, _21_25_, _22_25_, _23_25_, _24_25_

        this.cfg = cfg
    
        this.cfg.files = []
        this.cfg.maxDepth = ((_18_25_=this.cfg.maxDepth) != null ? _18_25_ : 3)
        this.cfg.dotFiles = ((_19_25_=this.cfg.dotFiles) != null ? _19_25_ : false)
        this.cfg.maxFiles = ((_20_25_=this.cfg.maxFiles) != null ? _20_25_ : 15000)
        this.cfg.ignore = ((_21_25_=this.cfg.ignore) != null ? _21_25_ : ['node_modules','build','Build','Library','Applications'])
        this.cfg.include = ((_22_25_=this.cfg.include) != null ? _22_25_ : ['.konrad.noon','.gitignore','.npmignore'])
        this.cfg.ignoreExt = ((_23_25_=this.cfg.ignoreExt) != null ? _23_25_ : ['asar'])
        this.cfg.includeExt = ((_24_25_=this.cfg.includeExt) != null ? _24_25_ : File.sourceFileExtensions)
    }

    ignore (p)
    {}

    async start ()
    {
        var dir, ext, file, item, items, listDir, p, toWalk, _62_31_, _96_17_

        dir = this.cfg.root
        this.running = true
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
                else if (_k_.in(file,this.cfg.include))
                {
                    this.cfg.files.push(item.path)
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
                else if (_k_.in(ext,this.cfg.includeExt) || this.cfg.includeExt.indexOf('') >= 0)
                {
                    this.cfg.files.push(item.path)
                }
                if (_k_.isFunc(this.cfg.path))
                {
                    this.cfg.path(item.path)
                }
                if (item.type === 'dir')
                {
                    if (_k_.isFunc(this.cfg.dir))
                    {
                        if (!this.cfg.dir(item.path))
                        {
                            continuer
                        }
                    }
                    toWalk.push(item.path)
                }
                else
                {
                    if (_k_.in(ext,this.cfg.includeExt) || _k_.in(slash.file(item.path),this.cfg.include) || this.cfg.includeExt.indexOf('') >= 0)
                    {
                        if (_k_.isFunc(this.cfg.file))
                        {
                            this.cfg.file(item.path)
                        }
                    }
                }
                if (this.cfg.files.length > this.cfg.maxFiles)
                {
                    console.log('maxFiles reached')
                    break
                }
            }
        }
        this.running = false
        ;(typeof this.cfg.done === "function" ? this.cfg.done(this) : undefined)
        return this.cfg
    }

    stop ()
    {
        this.running = false
        return this.walker = null
    }
}

export default Walker;