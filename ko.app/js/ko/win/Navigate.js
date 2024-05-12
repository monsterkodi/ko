var _k_ = {last: function (o) {return o != null ? o.length ? o[o.length-1] : undefined : o}, clamp: function (l,h,v) { var ll = Math.min(l,h), hh = Math.max(l,h); if (!_k_.isNum(v)) { v = ll }; if (v < ll) { v = ll }; if (v > hh) { v = hh }; if (!_k_.isNum(v)) { v = ll }; return v }, in: function (a,l) {return (typeof l === 'string' && typeof a === 'string' && a.length ? '' : []).indexOf.call(l,a) >= 0}, isNum: function (o) {return !isNaN(o) && !isNaN(parseFloat(o)) && (isFinite(o) || o === Infinity || o === -Infinity)}}

import kxk from "../../kxk.js"
let pullIf = kxk.pullIf
let keepIf = kxk.keepIf
let slash = kxk.slash
let prefs = kxk.prefs
let post = kxk.post

class Navigate
{
    constructor (main)
    {
        this.main = main
    
        this.navigate = this.navigate.bind(this)
        post.on('navigate',this.navigate)
        this.navlist = stash.get('navigate',[])
        this.currentIndex = -1
        this.navigating = false
    }

    addToHistory (file, pos)
    {
        var filePos, fp, i

        if (!(file != null))
        {
            return
        }
        pos = (pos != null ? pos : [0,0])
        if (!pos[0] && !pos[1] && this.navlist.length)
        {
            for (var _39_21_ = i = this.navlist.length - 1, _39_40_ = 0; (_39_21_ <= _39_40_ ? i <= 0 : i >= 0); (_39_21_ <= _39_40_ ? ++i : --i))
            {
                fp = this.navlist[i]
                if (slash.samePath(fp.file,file))
                {
                    pos = fp.pos
                    break
                }
            }
        }
        pullIf(this.navlist,function (f)
        {
            return slash.sameFileLine(f,file)
        })
        keepIf(this.navlist,function (f)
        {
            return slash.hasFilePos(f)
        })
        filePos = slash.joinFilePos(file,pos)
        if (slash.sameFileLine(_k_.last(this.navlist),filePos))
        {
            this.navlist.pop()
        }
        this.navlist.push(filePos)
        while (this.navlist.length > prefs.get('navigateHistoryLength',100))
        {
            this.navlist.shift()
        }
        return stash.set('navigate',this.navlist)
    }

    navigate (opt)
    {
        var hasFile, _103_39_, _94_30_, _94_45_

        switch (opt.action)
        {
            case 'clear':
                this.navlist = []
                return this.currentIndex = -1

            case 'backward':
                console.log('Navigate backward',this.navlist)
                if (!this.navlist.length)
                {
                    return
                }
                this.currentIndex = _k_.clamp(0,Math.max(0,this.navlist.length - 2),this.currentIndex - 1)
                this.navigating = true
                return this.loadFilePos(this.navlist[this.currentIndex])

            case 'forward':
                if (!this.navlist.length)
                {
                    return
                }
                this.currentIndex = _k_.clamp(0,this.navlist.length - 1,this.currentIndex + 1)
                this.navigating = true
                return this.loadFilePos(this.navlist[this.currentIndex])

            case 'delFilePos':
                opt.item.line = ((_94_30_=opt.item.line) != null ? _94_30_ : (opt.item.pos != null ? opt.item.pos[1] : undefined) + 1)
                this.navlist = this.navlist.filter(function (f)
                {
                    var splitPos

                    splitPos = slash.splitFilePos(f)
                    return splitPos[0] !== opt.item.file || splitPos[1][1] + 1 !== opt.item.line
                })
                return this.currentIndex = _k_.clamp(0,this.navlist.length - 1,this.currentIndex)

            case 'addFilePos':
                if (!(opt != null ? (_103_39_=opt.file) != null ? _103_39_.length : undefined : undefined))
                {
                    return
                }
                this.addToHistory(opt.oldFile,opt.oldPos)
                hasFile = this.navlist.find(function (f)
                {
                    return slash.splitFilePos(f)[0] === opt.file
                })
                if (!this.navigating || !hasFile || _k_.in((opt != null ? opt.for : undefined),['edit','goto']))
                {
                    if (_k_.in((opt != null ? opt.for : undefined),['edit','goto']))
                    {
                        this.navigating = false
                    }
                    this.addToHistory(opt.file,opt.pos)
                    this.currentIndex = this.navlist.length - 1
                    if ((opt != null ? opt.for : undefined) === 'goto')
                    {
                        return this.loadFilePos(this.navlist[this.currentIndex])
                    }
                    else
                    {
                        return this.currentIndex = this.navlist.length
                    }
                }
                break
        }

    }

    loadFilePos (filePos)
    {
        console.log('loadFile',filePos)
        post.emit('loadFile',filePos)
        return filePos
    }

    delFilePos (item)
    {
        return post.emit('navigate',{action:'delFilePos',item:item})
    }

    addFilePos (opt)
    {
        opt.action = 'addFilePos'
        opt.for = 'edit'
        return post.emit('navigate',opt)
    }

    gotoFilePos (opt)
    {
        opt.action = 'addFilePos'
        opt.for = 'goto'
        return post.emit('navigate',opt)
    }

    backward ()
    {
        return post.emit('navigate',{action:'backward'})
    }

    forward ()
    {
        return post.emit('navigate',{action:'forward'})
    }

    clear ()
    {
        return post.emit('navigate',{action:'clear'})
    }
}

export default Navigate;