// monsterkodi/kode 0.214.0

var _k_ = {in: function (a,l) {return (typeof l === 'string' && typeof a === 'string' && a.length ? '' : []).indexOf.call(l,a) >= 0}}

var clamp, filter, post, prefs, slash, _

_ = require('kxk')._
clamp = require('kxk').clamp
filter = require('kxk').filter
post = require('kxk').post
prefs = require('kxk').prefs
slash = require('kxk').slash

class Navigate
{
    constructor (main)
    {
        var _15_27_

        this.main = main
    
        this.navigate = this.navigate.bind(this)
        this.onGet = this.onGet.bind(this)
        if (!(this.main != null))
        {
            return
        }
        post.onGet('navigate',this.onGet)
        post.on('navigate',this.navigate)
        this.filePositions = prefs.get('filePositions',[])
        this.currentIndex = -1
        this.navigating = false
    }

    onGet (key)
    {
        return this[key]
    }

    addToHistory (file, pos)
    {
        var filePos, fp, i

        if (!this.main)
        {
            return
        }
        if (!(file != null))
        {
            return
        }
        pos = (pos != null ? pos : [0,0])
        if (!pos[0] && !pos[1] && this.filePositions.length)
        {
            for (var _39_22_ = i = this.filePositions.length - 1, _39_47_ = 0; (_39_22_ <= _39_47_ ? i <= 0 : i >= 0); (_39_22_ <= _39_47_ ? ++i : --i))
            {
                fp = this.filePositions[i]
                if (slash.samePath(fp.file,file))
                {
                    pos = fp.pos
                    break
                }
            }
        }
        _.pullAllWith(this.filePositions,[{file:file,pos:pos}],function (a, b)
        {
            return slash.samePath(a.file,b.file) && (a.pos[1] === b.pos[1] || a.pos[1] <= 1)
        })
        filePos = slash.tilde(slash.joinFilePos(file,pos))
        if ((this.filePositions.slice(-1)[0] != null ? this.filePositions.slice(-1)[0].file : undefined) === file && (this.filePositions.slice(-1)[0] != null ? this.filePositions.slice(-1)[0].pos[1] : undefined) === pos[1] - 1)
        {
            this.filePositions.pop()
        }
        this.filePositions.push({file:file,pos:pos,line:pos[1] + 1,column:pos[0],name:filePos,text:slash.file(filePos)})
        while (this.filePositions.length > prefs.get('navigateHistoryLength',100))
        {
            this.filePositions.shift()
        }
        return prefs.set('filePositions',this.filePositions)
    }

    navigate (opt)
    {
        var hasFile, _88_30_, _88_45_, _96_39_

        switch (opt.action)
        {
            case 'clear':
                this.filePositions = []
                return this.currentIndex = -1

            case 'backward':
                if (!this.filePositions.length)
                {
                    return
                }
                this.currentIndex = clamp(0,Math.max(0,this.filePositions.length - 2),this.currentIndex - 1)
                this.navigating = true
                return this.loadFilePos(this.filePositions[this.currentIndex],opt)

            case 'forward':
                if (!this.filePositions.length)
                {
                    return
                }
                this.currentIndex = clamp(0,this.filePositions.length - 1,this.currentIndex + 1)
                this.navigating = true
                return this.loadFilePos(this.filePositions[this.currentIndex],opt)

            case 'delFilePos':
                opt.item.line = ((_88_30_=opt.item.line) != null ? _88_30_ : (opt.item.pos != null ? opt.item.pos[1] : undefined) + 1)
                this.filePositions = filter(this.filePositions,function (f)
                {
                    return f.file !== opt.item.file || f.line !== opt.item.line
                })
                this.currentIndex = clamp(0,this.filePositions.length - 1,this.currentIndex)
                return post.toWins('navigateHistoryChanged',this.filePositions,this.currentIndex)

            case 'addFilePos':
                if (!(opt != null ? (_96_39_=opt.file) != null ? _96_39_.length : undefined : undefined))
                {
                    return
                }
                this.addToHistory(opt.oldFile,opt.oldPos)
                hasFile = _.find(this.filePositions,function (v)
                {
                    return v.file === opt.file
                })
                if (!this.navigating || !hasFile || _k_.in((opt != null ? opt.for : undefined),['edit','goto']))
                {
                    if (_k_.in((opt != null ? opt.for : undefined),['edit','goto']))
                    {
                        this.navigating = false
                    }
                    this.addToHistory(opt.file,opt.pos)
                    this.currentIndex = this.filePositions.length - 1
                    if ((opt != null ? opt.for : undefined) === 'goto')
                    {
                        post.toWins('navigateHistoryChanged',this.filePositions,this.currentIndex)
                        return this.loadFilePos(this.filePositions[this.currentIndex],opt)
                    }
                    else
                    {
                        this.currentIndex = this.filePositions.length
                        return post.toWins('navigateHistoryChanged',this.filePositions,this.currentIndex)
                    }
                }
                break
        }

    }

    loadFilePos (filePos, opt)
    {
        var _122_47_

        if ((opt != null ? opt.newWindow : undefined))
        {
            post.toMain('newWindowWithFile',`${filePos.file}:${filePos.pos[1] + 1}:${filePos.pos[0]}`)
        }
        else
        {
            if (!((opt != null ? opt.winID : undefined) != null))
            {
                console.error('no winID?')
            }
            post.toWin(opt.winID,'loadFile',`${filePos.file}:${filePos.pos[1] + 1}:${filePos.pos[0]}`)
        }
        post.toWins('navigateIndexChanged',this.currentIndex,this.filePositions[this.currentIndex])
        return filePos
    }

    delFilePos (item)
    {
        return post.toMain('navigate',{action:'delFilePos',winID:window.winID,item:item})
    }

    addFilePos (opt)
    {
        opt.action = 'addFilePos'
        opt.for = 'edit'
        return post.toMain('navigate',opt)
    }

    gotoFilePos (opt)
    {
        opt.action = 'addFilePos'
        opt.for = 'goto'
        return post.toMain('navigate',opt)
    }

    backward ()
    {
        return post.toMain('navigate',{action:'backward',winID:window.winID})
    }

    forward ()
    {
        return post.toMain('navigate',{action:'forward',winID:window.winID})
    }

    clear ()
    {
        return post.toMain('navigate',{action:'clear',winID:window.winID})
    }
}

module.exports = Navigate