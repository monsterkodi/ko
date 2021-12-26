// monsterkodi/kode 0.230.0

var _k_ = {in: function (a,l) {return (typeof l === 'string' && typeof a === 'string' && a.length ? '' : []).indexOf.call(l,a) >= 0}, empty: function (l) {return l==='' || l===null || l===undefined || l!==l || typeof(l) === 'object' && Object.keys(l).length === 0}, valid: undefined}

var childp, fs, icons, kerror, klog, kxk, slash

kxk = require('kxk')
childp = kxk.childp
fs = kxk.fs
kerror = kxk.kerror
klog = kxk.klog
slash = kxk.slash

icons = require('./icons.json')
class File
{
    static sourceFileExtensions = ['kode','coffee','styl','swift','pug','md','noon','txt','json','sh','py','cpp','cc','c','cs','h','hpp','ts','js','frag','vert']

    static isCode (file)
    {
        return _k_.in(slash.ext(file),['coffee','kode','py','cpp','cc','c','cs','ts','js','h','hpp','frag','vert'])
    }

    static isImage (file)
    {
        return _k_.in(slash.ext(file),['gif','png','jpg','jpeg','svg','bmp','ico'])
    }

    static isText (file)
    {
        return slash.isText(file)
    }

    static rename (from, to, cb)
    {
        return fs.mkdir(slash.dir(to),{recursive:true},function (err)
        {
            if (err)
            {
                return kerror(`mkdir failed ${err}`)
            }
            if (slash.isDir(to))
            {
                to = slash.join(to,slash.file(from))
            }
            return fs.move(from,to,{overwrite:true},function (err)
            {
                var _36_39_

                if (err)
                {
                    return kerror(`rename failed ${err}`)
                }
                if (editor.currentFile === from)
                {
                    editor.currentFile = to
                    if ((tabs.activeTab() != null ? tabs.activeTab().file : undefined) === from)
                    {
                        tabs.activeTab().setFile(to)
                    }
                    if (commandline.command.name === 'browse')
                    {
                        if (commandline.text() === slash.tilde(from))
                        {
                            commandline.setText(slash.tilde(to))
                        }
                    }
                    if (!tabs.tab(to))
                    {
                        klog('recreate tab!',tabs.activeTab().file,to)
                    }
                }
                return cb(from,to)
            })
        })
    }

    static duplicate (from, cb)
    {
        return slash.unused(from,(function (target)
        {
            return this.copy(from,target,cb)
        }).bind(this))
    }

    static copy (from, to, cb)
    {
        if (slash.isDir(to))
        {
            to = slash.join(to,slash.file(from))
        }
        return fs.copy(from,to,function (err)
        {
            if (err)
            {
                return kerror(`copy failed ${err}`)
            }
            return cb(from,to)
        })
    }

    static iconClassName (file)
    {
        var clss

        file = slash.removeLinePos(file)
        clss = icons.ext[slash.ext(file)]
        clss = (clss != null ? clss : icons.base[slash.base(file).toLowerCase()])
        clss = (clss != null ? clss : 'file')
        return `icon ${clss}`
    }

    static write (file, text, mode, cb)
    {
        slash.logErrors = true
        return slash.writeText(file,text,function (done)
        {
            if (_k_.empty(done))
            {
                return cb(`can't write ${file}`)
            }
            else
            {
                return cb(null,done)
            }
        })
    }

    static unlock (file, text, cb)
    {
        return fs.chmod(file,0o666,function (err)
        {
            if (!_k_.empty(err))
            {
                return cb(err)
            }
            else
            {
                return File.write(file,text,0o666,cb)
            }
        })
    }

    static p4edit (file, text, cb)
    {
        slash.logErrors = true
        if (slash.win())
        {
            try
            {
                return childp.exec(`p4 edit ${slash.unslash(file)}`,function (err)
                {
                    if (!_k_.empty(err))
                    {
                        return File.unlock(file,text,cb)
                    }
                    else
                    {
                        return File.write(file,text,0o666,cb)
                    }
                })
            }
            catch (err)
            {
                return File.unlock(file,text,cb)
            }
        }
        else
        {
            return File.unlock(file,text,cb)
        }
    }

    static save (file, text, cb)
    {
        slash.logErrors = true
        return slash.fileExists(file,function (stat)
        {
            if (stat)
            {
                return slash.isWritable(file,function (writable)
                {
                    if (writable)
                    {
                        return File.write(file,text,stat.mode,cb)
                    }
                    else
                    {
                        return File.p4edit(file,text,cb)
                    }
                })
            }
            else
            {
                return File.write(file,text,0o666,cb)
            }
        })
    }

    static span (text)
    {
        var base, clss, ext, span

        base = slash.base(text)
        ext = slash.ext(text).toLowerCase()
        clss = !_k_.empty((ext)) && ' ' + ext || ''
        if (base.startsWith('.'))
        {
            clss += ' dotfile'
        }
        span = `<span class='text${clss}'>` + base + "</span>"
        if (!_k_.empty(ext))
        {
            span += `<span class='ext punct${clss}'>.</span>` + `<span class='ext text${clss}'>` + ext + "</span>"
        }
        return span
    }

    static crumbSpan (file)
    {
        var i, s, spans, split

        if (_k_.in(file,['/','']))
        {
            return "<span>/</span>"
        }
        spans = []
        split = slash.split(file)
        for (var _138_18_ = i = 0, _138_22_ = split.length - 1; (_138_18_ <= _138_22_ ? i < split.length - 1 : i > split.length - 1); (_138_18_ <= _138_22_ ? ++i : --i))
        {
            s = split[i]
            spans.push(`<div class='inline path' id='${split.slice(0, typeof i === 'number' ? i+1 : Infinity).join('/')}'>${s}</div>`)
        }
        spans.push(`<div class='inline' id='${file}'>${split.slice(-1)[0]}</div>`)
        return spans.join("<span class='punct'>/</span>")
    }
}

module.exports = File