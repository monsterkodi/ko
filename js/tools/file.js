// monsterkodi/kode 0.218.0

var _k_ = {in: function (a,l) {return (typeof l === 'string' && typeof a === 'string' && a.length ? '' : []).indexOf.call(l,a) >= 0}, dbg: function (f,l,c,m,...a) { console.log(f + ':' + l + ':' + c + (m ? ' ' + m + '\n' : '\n') + a.map(function (a) { return _k_.noon(a) }).join(' '))}, empty: function (l) {return l==='' || l===null || l===undefined || l!==l || typeof(l) === 'object' && Object.keys(l).length === 0}, valid: undefined, noon: function (obj) { var pad = function (s, l) { while (s.length < l) { s += ' ' }; return s }; var esc = function (k, arry) { var es, sp; if (0 <= k.indexOf('\n')) { sp = k.split('\n'); es = sp.map(function (s) { return esc(s,arry) }); es.unshift('...'); es.push('...'); return es.join('\n') } if (k === '' || k === '...' || _k_.in(k[0],[' ','#','|']) || _k_.in(k[k.length - 1],[' ','#','|'])) { k = '|' + k + '|' } else if (arry && /  /.test(k)) { k = '|' + k + '|' }; return k }; var pretty = function (o, ind, seen) { var k, kl, l, v, mk = 4; if (Object.keys(o).length > 1) { for (k in o) { if (Object.hasOwn(o,k)) { kl = parseInt(Math.ceil((k.length + 2) / 4) * 4); mk = Math.max(mk,kl); if (mk > 32) { mk = 32; break } } } }; l = []; var keyValue = function (k, v) { var i, ks, s, vs; s = ind; k = esc(k,true); if (k.indexOf('  ') > 0 && k[0] !== '|') { k = `|${k}|` } else if (k[0] !== '|' && k[k.length - 1] === '|') { k = '|' + k } else if (k[0] === '|' && k[k.length - 1] !== '|') { k += '|' }; ks = pad(k,Math.max(mk,k.length + 2)); i = pad(ind + '    ',mk); s += ks; vs = toStr(v,i,false,seen); if (vs[0] === '\n') { while (s[s.length - 1] === ' ') { s = s.substr(0,s.length - 1) } }; s += vs; while (s[s.length - 1] === ' ') { s = s.substr(0,s.length - 1) }; return s }; for (k in o) { if (Object.hasOwn(o,k)) { l.push(keyValue(k,o[k])) } }; return l.join('\n') }; var toStr = function (o, ind = '', arry = false, seen = []) { var s, t, v; if (!(o != null)) { if (o === null) { return 'null' }; if (o === undefined) { return 'undefined' }; return '<?>' }; switch (t = typeof(o)) { case 'string': {return esc(o,arry)}; case 'object': { if (_k_.in(o,seen)) { return '<v>' }; seen.push(o); if ((o.constructor != null ? o.constructor.name : undefined) === 'Array') { s = ind !== '' && arry && '.' || ''; if (o.length && ind !== '') { s += '\n' }; s += (function () { var result = []; var list = _k_.list(o); for (var li = 0; li < list.length; li++)  { v = list[li];result.push(ind + toStr(v,ind + '    ',true,seen))  } return result }).bind(this)().join('\n') } else if ((o.constructor != null ? o.constructor.name : undefined) === 'RegExp') { return o.source } else { s = (arry && '.\n') || ((ind !== '') && '\n' || ''); s += pretty(o,ind,seen) }; return s } default: return String(o) }; return '<???>' }; return toStr(obj) }, list: function (l) {return (l != null ? typeof l.length === 'number' ? l : [] : [])}}

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
        _k_.dbg(".", 73, 8, null, "file.write",file)
        return slash.writeText(file,text,function (done)
        {
            _k_.dbg(".", 75, 12, null, `file.write ${done}`)
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
        _k_.dbg(".", 112, 8, null, 'file.save',file)
        return slash.fileExists(file,function (stat)
        {
            if (stat)
            {
                _k_.dbg(".", 115, 16, null, 'file.save exists')
                return slash.isWritable(file,function (writable)
                {
                    if (writable)
                    {
                        _k_.dbg(".", 118, 24, null, 'file.save writable')
                        return File.write(file,text,stat.mode,cb)
                    }
                    else
                    {
                        _k_.dbg(".", 122, 24, null, 'file.save p4edit')
                        return File.p4edit(file,text,cb)
                    }
                })
            }
            else
            {
                _k_.dbg(".", 125, 16, null, 'file.save new')
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
        for (var _149_18_ = i = 0, _149_22_ = split.length - 1; (_149_18_ <= _149_22_ ? i < split.length - 1 : i > split.length - 1); (_149_18_ <= _149_22_ ? ++i : --i))
        {
            s = split[i]
            spans.push(`<div class='inline path' id='${split.slice(0, typeof i === 'number' ? i+1 : Infinity).join('/')}'>${s}</div>`)
        }
        spans.push(`<div class='inline' id='${file}'>${split.slice(-1)[0]}</div>`)
        return spans.join("<span class='punct'>/</span>")
    }
}

module.exports = File