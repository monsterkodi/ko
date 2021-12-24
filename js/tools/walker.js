// monsterkodi/kode 0.212.0

var _k_ = {in: function (a,l) {return (typeof l === 'string' && typeof a === 'string' && a.length ? '' : []).indexOf.call(l,a) >= 0}}

var File, kerror, os, slash, walkdir

kerror = require('kxk').kerror
os = require('kxk').os
slash = require('kxk').slash
walkdir = require('kxk').walkdir

File = require('./file')
class Walker
{
    constructor (cfg)
    {
        var _19_25_, _20_25_, _21_25_, _22_25_, _23_25_, _24_25_, _25_25_, _26_25_

        this.cfg = cfg
    
        this.cfg.files = []
        this.cfg.stats = []
        this.cfg.maxDepth = ((_19_25_=this.cfg.maxDepth) != null ? _19_25_ : 3)
        this.cfg.dotFiles = ((_20_25_=this.cfg.dotFiles) != null ? _20_25_ : false)
        this.cfg.includeDirs = ((_21_25_=this.cfg.includeDirs) != null ? _21_25_ : true)
        this.cfg.maxFiles = ((_22_25_=this.cfg.maxFiles) != null ? _22_25_ : 500)
        this.cfg.ignore = ((_23_25_=this.cfg.ignore) != null ? _23_25_ : ['node_modules','build','Build','Library','Applications'])
        this.cfg.include = ((_24_25_=this.cfg.include) != null ? _24_25_ : ['.konrad.noon','.gitignore','.npmignore'])
        this.cfg.ignoreExt = ((_25_25_=this.cfg.ignoreExt) != null ? _25_25_ : ['app','asar'])
        this.cfg.includeExt = ((_26_25_=this.cfg.includeExt) != null ? _26_25_ : File.sourceFileExtensions)
    }

    start ()
    {
        var dir, onWalkerPath

        try
        {
            this.running = true
            dir = this.cfg.root
            this.walker = walkdir.walk(dir,{max_depth:this.cfg.maxDepth})
            onWalkerPath = function (cfg)
            {
                return function (p, stat)
                {
                    var extn, name, sp, _44_29_, _50_38_, _76_24_, _79_31_, _80_34_, _84_32_

                    sp = slash.path(p)
                    name = slash.basename(p)
                    extn = slash.ext(p)
                    if ((typeof cfg.filter === "function" ? cfg.filter(p) : undefined))
                    {
                        return this.ignore(p)
                    }
                    else if (_k_.in(name,['.DS_Store','Icon\r']) || _k_.in(extn,['pyc']))
                    {
                        return this.ignore(p)
                    }
                    else if (name.endsWith(`-${os.arch()}`))
                    {
                        return this.ignore(p)
                    }
                    else if ((cfg.includeDir != null) && slash.dir(p) === cfg.includeDir)
                    {
                        cfg.files.push(sp)
                        cfg.stats.push(stat)
                        if (_k_.in(name,cfg.ignore))
                        {
                            this.ignore(p)
                        }
                        if (name.startsWith('.') && !cfg.dotFiles)
                        {
                            this.ignore(p)
                        }
                    }
                    else if (_k_.in(name,cfg.ignore))
                    {
                        return this.ignore(p)
                    }
                    else if (_k_.in(name,cfg.include))
                    {
                        cfg.files.push(sp)
                        cfg.stats.push(stat)
                    }
                    else if (name.startsWith('.'))
                    {
                        if (cfg.dotFiles)
                        {
                            cfg.files.push(sp)
                            cfg.stats.push(stat)
                        }
                        else
                        {
                            return this.ignore(p)
                        }
                    }
                    else if (_k_.in(extn,cfg.ignoreExt))
                    {
                        return this.ignore(p)
                    }
                    else if (_k_.in(extn,cfg.includeExt) || cfg.includeExt.indexOf('') >= 0)
                    {
                        cfg.files.push(sp)
                        cfg.stats.push(stat)
                    }
                    else if (stat.isDirectory())
                    {
                        if (p !== cfg.root && cfg.includeDirs)
                        {
                            cfg.files.push(sp)
                            cfg.stats.push(stat)
                        }
                    }
                    ;(typeof cfg.path === "function" ? cfg.path(sp,stat) : undefined)
                    if (stat.isDirectory())
                    {
                        if (cfg.includeDirs)
                        {
                            ;(typeof cfg.dir === "function" ? cfg.dir(sp,stat) : undefined)
                        }
                        if ((typeof cfg.skipDir === "function" ? cfg.skipDir(sp) : undefined))
                        {
                            this.ignore(p)
                        }
                    }
                    else
                    {
                        if (_k_.in(slash.ext(sp),cfg.includeExt) || _k_.in(slash.basename(sp),cfg.include) || cfg.includeExt.indexOf('') >= 0)
                        {
                            ;(typeof cfg.file === "function" ? cfg.file(sp,stat) : undefined)
                        }
                    }
                    if (cfg.files.length > cfg.maxFiles)
                    {
                        return this.end()
                    }
                    else if (cfg.slowdown && (cfg.files.length % 400) === 399)
                    {
                        this.pause()
                        return setTimeout(this.resume,10)
                    }
                }
            }
            this.walker.on('path',onWalkerPath(this.cfg))
            return this.walker.on('end',(function ()
            {
                var _96_25_

                this.running = false
                return (typeof this.cfg.done === "function" ? this.cfg.done(this) : undefined)
            }).bind(this))
        }
        catch (err)
        {
            this.running = false
            return kerror(`Walker.start -- ${err} dir: ${dir} stack:`,err.stack)
        }
    }

    stop ()
    {
        var _104_15_, _105_15_

        ;(this.walker != null ? this.walker.pause() : undefined)
        ;(this.walker != null ? this.walker.end() : undefined)
        return this.walker = null
    }
}

module.exports = Walker