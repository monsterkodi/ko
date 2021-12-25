// monsterkodi/kode 0.223.0

var _k_ = {list: function (l) {return (l != null ? typeof l.length === 'number' ? l : [] : [])}, empty: function (l) {return l==='' || l===null || l===undefined || l!==l || typeof(l) === 'object' && Object.keys(l).length === 0}}

var clamp, kerror, kxk, last, post, State, _

kxk = require('kxk')
_ = kxk._
clamp = kxk.clamp
kerror = kxk.kerror
last = kxk.last
post = kxk.post

State = require('./state')
require('../tools/ranges')
class Do
{
    constructor (editor)
    {
        this.editor = editor
    
        this.onFileLineChanges = this.onFileLineChanges.bind(this)
        this.reset()
        post.on('fileLineChanges',this.onFileLineChanges)
    }

    del ()
    {
        return post.removeListener('fileLineChanges',this.onFileLineChanges)
    }

    onFileLineChanges (file, lineChanges)
    {
        if (file === this.editor.currentFile)
        {
            return this.foreignChanges(lineChanges)
        }
    }

    foreignChanges (lineChanges)
    {
        var change, _32_62_

        this.start()
        var list = _k_.list(lineChanges)
        for (var _31_19_ = 0; _31_19_ < list.length; _31_19_++)
        {
            change = list[_31_19_]
            if (change.change !== 'deleted' && !(change.after != null))
            {
                kerror(`Do.foreignChanges -- no after? ${change}`)
                continue
            }
            switch (change.change)
            {
                case 'changed':
                    this.change(change.doIndex,change.after)
                    break
                case 'inserted':
                    this.insert(change.doIndex,change.after)
                    break
                case 'deleted':
                    this.delete(change.doIndex)
                    break
                default:
                    kerror(`Do.foreignChanges -- unknown change ${change.change}`)
            }

        }
        return this.end({foreign:true})
    }

    tabState ()
    {
        return {saveIndex:this.saveIndex,history:this.history,redos:this.redos,state:this.state,file:this.editor.currentFile}
    }

    setTabState (state)
    {
        this.editor.restoreFromTabState(state)
        this.groupCount = 0
        this.saveIndex = state.saveIndex
        this.history = state.history
        this.redos = state.redos
        return this.state = state.state
    }

    reset ()
    {
        this.groupCount = 0
        this.saveIndex = 0
        this.history = []
        this.redos = []
        return this.state = null
    }

    hasChanges ()
    {
        if (this.history.length > this.saveIndex && (this.history[this.saveIndex] != null ? this.history[this.saveIndex].text() : undefined) === this.editor.text())
        {
            return false
        }
        return true
    }

    start ()
    {
        this.groupCount += 1
        if (this.groupCount === 1)
        {
            this.startState = this.state = new State(this.editor.state.s)
            if (_k_.empty((this.history)) || this.state.s !== last(this.history).s)
            {
                return this.history.push(this.state)
            }
        }
    }

    isDoing ()
    {
        return this.groupCount > 0
    }

    change (index, text)
    {
        return this.state = this.state.changeLine(index,text)
    }

    insert (index, text)
    {
        return this.state = this.state.insertLine(index,text)
    }

    delete (index)
    {
        if (this.numLines() >= 1 && (0 <= index && index < this.numLines()))
        {
            this.editor.emit('willDeleteLine',this.line(index))
            return this.state = this.state.deleteLine(index)
        }
    }

    end (opt)
    {
        var changes, _133_27_

        this.redos = []
        this.groupCount -= 1
        if (this.groupCount === 0)
        {
            this.merge()
            changes = this.calculateChanges(this.startState,this.state)
            changes.foreign = (opt != null ? opt.foreign : undefined)
            this.editor.setState(this.state)
            return (typeof this.editor.changed === "function" ? this.editor.changed(changes) : undefined)
        }
    }

    undo ()
    {
        var changes, _153_27_

        if (this.history.length)
        {
            if (_.isEmpty(this.redos))
            {
                this.redos.unshift(this.editor.state)
            }
            this.state = this.history.pop()
            this.redos.unshift(this.state)
            changes = this.calculateChanges(this.editor.state,this.state)
            this.editor.setState(this.state)
            ;(typeof this.editor.changed === "function" ? this.editor.changed(changes) : undefined)
            return this.editor.emit('undone')
        }
    }

    redo ()
    {
        var changes, _175_27_

        if (this.redos.length)
        {
            if (this.redos.length > 1)
            {
                this.history.push(this.redos.shift())
            }
            this.state = _.first(this.redos)
            if (this.redos.length === 1)
            {
                this.redos = []
            }
            changes = this.calculateChanges(this.editor.state,this.state)
            this.editor.setState(this.state)
            ;(typeof this.editor.changed === "function" ? this.editor.changed(changes) : undefined)
            return this.editor.emit('redone')
        }
    }

    select (newSelections)
    {
        if (newSelections.length)
        {
            newSelections = cleanRanges(newSelections)
            return this.state = this.state.setSelections(newSelections)
        }
        else
        {
            return this.state = this.state.setSelections([])
        }
    }

    setCursors (newCursors, opt)
    {
        var mainCursor, mainIndex

        if (!(newCursors != null) || newCursors.length < 1)
        {
            return kerror("Do.setCursors -- empty cursors?")
        }
        if ((opt != null ? opt.main : undefined))
        {
            switch (opt.main)
            {
                case 'first':
                    mainIndex = 0
                    break
                case 'last':
                    mainIndex = newCursors.length - 1
                    break
                case 'closest':
                    mainIndex = newCursors.indexOf(posClosestToPosInPositions(this.editor.mainCursor(),newCursors))
                    break
                default:
                    mainIndex = newCursors.indexOf(opt.main)
                    if (mainIndex < 0)
                {
                    mainIndex = parseInt(opt.main)
                }
            }

        }
        else
        {
            mainIndex = newCursors.length - 1
        }
        mainCursor = newCursors[mainIndex]
        this.cleanCursors(newCursors)
        mainIndex = newCursors.indexOf(posClosestToPosInPositions(mainCursor,newCursors))
        this.state = this.state.setCursors(newCursors)
        return this.state = this.state.setMain(mainIndex)
    }

    calculateChanges (oldState, newState)
    {
        var changes, dd, deletions, insertions, newLines, ni, nl, oi, ol, oldLines

        oi = 0
        ni = 0
        dd = 0
        changes = []
        oldLines = oldState.s.lines
        newLines = newState.s.lines
        insertions = 0
        deletions = 0
        if (oldLines !== newLines)
        {
            ol = oldLines[oi]
            nl = newLines[ni]
            while (oi < oldLines.length)
            {
                if (!(nl != null))
                {
                    deletions += 1
                    changes.push({change:'deleted',oldIndex:oi,doIndex:oi + dd})
                    oi += 1
                    dd -= 1
                }
                else if (ol === nl)
                {
                    oi += 1
                    ni += 1
                    ol = oldLines[oi]
                    nl = newLines[ni]
                }
                else
                {
                    if (nl === oldLines[oi + 1] && ol === newLines[ni + 1])
                    {
                        changes.push({change:'changed',oldIndex:oi,newIndex:ni,doIndex:oi + dd,after:nl})
                        oi += 1
                        ni += 1
                        changes.push({change:'changed',oldIndex:oi,newIndex:ni,doIndex:oi + dd,after:ol})
                        oi += 1
                        ni += 1
                        ol = oldLines[oi]
                        nl = newLines[ni]
                    }
                    else if (nl === oldLines[oi + 1] && oldLines[oi + 1] !== newLines[ni + 1])
                    {
                        changes.push({change:'deleted',oldIndex:oi,doIndex:oi + dd})
                        oi += 1
                        dd -= 1
                        deletions += 1
                        ol = oldLines[oi]
                    }
                    else if (ol === newLines[ni + 1] && oldLines[oi + 1] !== newLines[ni + 1])
                    {
                        changes.push({change:'inserted',newIndex:ni,doIndex:oi + dd,after:nl})
                        ni += 1
                        dd += 1
                        insertions += 1
                        nl = newLines[ni]
                    }
                    else
                    {
                        changes.push({change:'changed',oldIndex:oi,newIndex:ni,doIndex:oi + dd,after:nl})
                        oi += 1
                        ol = oldLines[oi]
                        ni += 1
                        nl = newLines[ni]
                    }
                }
            }
            while (ni < newLines.length)
            {
                insertions += 1
                changes.push({change:'inserted',newIndex:ni,doIndex:ni,after:nl})
                ni += 1
                nl = newLines[ni]
            }
        }
        return {changes:changes,inserts:insertions,deletes:deletions,cursors:oldState.s.cursors !== newState.s.cursors,selects:oldState.s.selections !== newState.s.selections}
    }

    merge ()
    {
        var a, b, c, la, lb, lc, li

        while (this.history.length > 1)
        {
            b = this.history[this.history.length - 2]
            a = last(this.history)
            if (a.s.lines === b.s.lines)
            {
                if (this.history.length > 2)
                {
                    this.history.splice(this.history.length - 2,1)
                }
                else
                {
                    return
                }
            }
            else if (this.history.length > 2)
            {
                c = this.history[this.history.length - 3]
                if ((a.numLines() === b.numLines() && b.numLines() === c.numLines()))
                {
                    for (var _338_31_ = li = 0, _338_35_ = a.numLines(); (_338_31_ <= _338_35_ ? li < a.numLines() : li > a.numLines()); (_338_31_ <= _338_35_ ? ++li : --li))
                    {
                        la = a.s.lines[li]
                        lb = b.s.lines[li]
                        lc = c.s.lines[li]
                        if (la === lb && lc !== lb || la !== lb && lc === lb)
                        {
                            return
                        }
                    }
                    this.history.splice(this.history.length - 2,1)
                }
                else
                {
                    return
                }
            }
            else
            {
                return
            }
        }
    }

    cleanCursors (cs)
    {
        var c, ci, p

        var list = _k_.list(cs)
        for (var _356_14_ = 0; _356_14_ < list.length; _356_14_++)
        {
            p = list[_356_14_]
            p[0] = Math.max(p[0],0)
            p[1] = clamp(0,this.state.numLines() - 1,p[1])
        }
        sortPositions(cs)
        if (cs.length > 1)
        {
            for (var _363_23_ = ci = cs.length - 1, _363_37_ = 0; (_363_23_ <= _363_37_ ? ci < 0 : ci > 0); (_363_23_ <= _363_37_ ? ++ci : --ci))
            {
                c = cs[ci]
                p = cs[ci - 1]
                if (c[1] === p[1] && c[0] === p[0])
                {
                    cs.splice(ci,1)
                }
            }
        }
        return cs
    }

    text ()
    {
        return this.state.text()
    }

    line (i)
    {
        return this.state.line(i)
    }

    cursor (i)
    {
        return this.state.cursor(i)
    }

    highlight (i)
    {
        return this.state.highlight(i)
    }

    selection (i)
    {
        return this.state.selection(i)
    }

    lines ()
    {
        return this.state.lines()
    }

    cursors ()
    {
        return this.state.cursors()
    }

    highlights ()
    {
        return this.state.highlights()
    }

    selections ()
    {
        return this.state.selections()
    }

    numLines ()
    {
        return this.state.numLines()
    }

    numCursors ()
    {
        return this.state.numCursors()
    }

    numSelections ()
    {
        return this.state.numSelections()
    }

    numHighlights ()
    {
        return this.state.numHighlights()
    }

    textInRange (r)
    {
        var _392_41_

        return (this.state.line(r[0]) != null ? this.state.line(r[0]).slice(r[1][0],r[1][1]) : undefined)
    }

    mainCursor ()
    {
        return this.state.mainCursor()
    }

    rangeForLineAtIndex (i)
    {
        return [i,[0,this.line(i).length]]
    }
}

module.exports = Do