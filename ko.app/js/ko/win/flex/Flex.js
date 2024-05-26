var _k_ = {empty: function (l) {return l==='' || l===null || l===undefined || l!==l || typeof(l) === 'object' && Object.keys(l).length === 0}, list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}, last: function (o) {return o != null ? o.length ? o[o.length-1] : undefined : o}, isNum: function (o) {return !isNaN(o) && !isNaN(parseFloat(o)) && (isFinite(o) || o === Infinity || o === -Infinity)}, isStr: function (o) {return typeof o === 'string' || o instanceof String}}

import kxk from "../../../kxk.js"
let defaults = kxk.defaults

import Pane from "./Pane.js"
import Handle from "./Handle.js"

class Flex
{
    constructor (opt)
    {
        var horz, p, _17_37_, _33_34_, _38_25_

        this.handleSize = 4
        this.direction = ((_17_37_=opt.direction) != null ? _17_37_ : 'horizontal')
        this.snapFirst = opt.snapFirst
        this.snapLast = opt.snapLast
        this.onPaneSize = opt.onPaneSize
        this.onDragStart = opt.onDragStart
        this.onDrag = opt.onDrag
        this.onDragEnd = opt.onDragEnd
        horz = this.direction === 'horizontal'
        this.dimension = horz && 'width' || 'height'
        this.clientDim = horz && 'clientWidth' || 'clientHeight'
        this.axis = horz && 'x' || 'y'
        this.position = horz && 'left' || 'top'
        this.handleClass = horz && 'split-handle split-handle-horizontal' || 'split-handle split-handle-vertical'
        this.paddingA = horz && 'paddingLeft' || 'paddingTop'
        this.paddingB = horz && 'paddingRight' || 'paddingBottom'
        this.cursor = ((_33_34_=opt.cursor) != null ? _33_34_ : horz && 'ew-resize' || 'ns-resize')
        this.panes = []
        this.handles = []
        this.view = ((_38_25_=opt.view) != null ? _38_25_ : opt.panes[0].div.parentNode)
        this.view.style.display = 'flex'
        this.view.style.flexDirection = horz && 'row' || 'column'
        if (!_k_.empty(opt.panes))
        {
            var list = _k_.list(opt.panes)
            for (var _a_ = 0; _a_ < list.length; _a_++)
            {
                p = list[_a_]
                this.addPane(p)
            }
        }
    }

    addPane (p)
    {
        var lastPane, newPane, _53_16_, _54_16_

        p.flex = ((_53_16_=p.flex) != null ? _53_16_ : this)
        p.index = ((_54_16_=p.index) != null ? _54_16_ : this.panes.length)
        newPane = new Pane(p)
        if (lastPane = _k_.last(this.panes))
        {
            this.handles.push(new Handle({flex:this,index:lastPane.index,panea:lastPane,paneb:newPane}))
        }
        this.panes.push(newPane)
        return this.relax()
    }

    popPane (opt = {})
    {
        if ((opt != null ? opt.relax : undefined) === false)
        {
            this.unrelax()
        }
        if (this.panes.length > 1)
        {
            this.panes.pop().del()
            this.handles.pop().del()
        }
        if ((opt != null ? opt.relax : undefined) !== false)
        {
            return this.relax()
        }
        else
        {
            return _k_.last(this.panes).setSize(_k_.last(this.panes).actualSize())
        }
    }

    shiftPane ()
    {
        var i

        if (this.panes.length > 1)
        {
            this.panes.shift().del()
            this.handles.shift().del()
        }
        for (var _a_ = i = 0, _b_ = this.panes.length; (_a_ <= _b_ ? i < this.panes.length : i > this.panes.length); (_a_ <= _b_ ? ++i : --i))
        {
            this.panes[i].index = i
        }
        for (var _c_ = i = 0, _d_ = this.handles.length; (_c_ <= _d_ ? i < this.handles.length : i > this.handles.length); (_c_ <= _d_ ? ++i : --i))
        {
            this.handles[i].index = i
        }
        return this.relax()
    }

    relax ()
    {
        var p

        this.relaxed = true
        var list = _k_.list(this.visiblePanes())
        for (var _a_ = 0; _a_ < list.length; _a_++)
        {
            p = list[_a_]
            if (p.div)
            {
                p.div.style.flex = "1 1 0"
            }
            p.size = 0
        }
    }

    unrelax ()
    {
        var p

        this.relaxed = false
        var list = _k_.list(this.visiblePanes())
        for (var _a_ = 0; _a_ < list.length; _a_++)
        {
            p = list[_a_]
            p.size = p.actualSize()
        }
    }

    calculate ()
    {
        var avail, diff, flexPanes, h, p, visPanes, _150_19_

        visPanes = this.panes.filter(function (p)
        {
            return !p.collapsed
        })
        flexPanes = visPanes.filter(function (p)
        {
            return !p.fixed
        })
        avail = this.size()
        if (avail <= 0)
        {
            return
        }
        var list = _k_.list(this.handles)
        for (var _a_ = 0; _a_ < list.length; _a_++)
        {
            h = list[_a_]
            h.update()
            if (h.isVisible())
            {
                avail -= h.size()
            }
        }
        var list1 = _k_.list(visPanes)
        for (var _b_ = 0; _b_ < list1.length; _b_++)
        {
            p = list1[_b_]
            avail -= p.size
        }
        diff = avail / flexPanes.length
        var list2 = _k_.list(flexPanes)
        for (var _c_ = 0; _c_ < list2.length; _c_++)
        {
            p = list2[_c_]
            p.size += diff
        }
        var list3 = _k_.list(visPanes)
        for (var _d_ = 0; _d_ < list3.length; _d_++)
        {
            p = list3[_d_]
            p.setSize(p.size)
        }
        return (typeof this.onPaneSize === "function" ? this.onPaneSize() : undefined)
    }

    moveHandle (opt)
    {
        var handle

        handle = this.handles[opt.index]
        return this.moveHandleToPos(handle,opt.pos)
    }

    moveHandleToPos (handle, pos)
    {
        var deduct, leftOver, next, nextHandle, nextSize, nextVisFlex, offset, prev, prevHandle, prevSize, prevVisFlex, _172_36_, _172_59_, _173_36_, _173_59_, _181_21_, _200_20_, _222_19_

        pos = parseInt(pos)
        if (this.relaxed)
        {
            this.unrelax()
        }
        offset = pos - handle.actualPos()
        if (Math.abs(offset) < 1)
        {
            return false
        }
        prev = ((_172_36_=this.prevAllInv(handle)) != null ? _172_36_ : ((_172_59_=this.prevVisFlex(handle)) != null ? _172_59_ : this.prevFlex(handle)))
        next = ((_173_36_=this.nextAllInv(handle)) != null ? _173_36_ : ((_173_59_=this.nextVisFlex(handle)) != null ? _173_59_ : this.nextFlex(handle)))
        delete prev.collapsed
        delete next.collapsed
        prevSize = prev.size + offset
        nextSize = next.size - offset
        if ((this.snapFirst != null) && prevSize < this.snapFirst && !this.prevVisPane(prev))
        {
            if (prevSize <= 0 || offset < this.snapFirst)
            {
                prevSize = -1
                nextSize = next.size + prev.size + this.handleSize
            }
        }
        else if (prevSize < 0)
        {
            leftOver = -prevSize
            prevHandle = handle.prev()
            while (leftOver > 0 && prevHandle && (prevVisFlex = this.prevVisFlex(prevHandle)))
            {
                deduct = Math.min(leftOver,prevVisFlex.size)
                leftOver -= deduct
                prevVisFlex.setSize(prevVisFlex.size - deduct)
                prevHandle = prevHandle.prev()
            }
            prevSize = 0
            nextSize -= leftOver
        }
        if ((this.snapLast != null) && nextSize < this.snapLast && !this.nextVisPane(next))
        {
            if (nextSize <= 0 || -offset < this.snapLast)
            {
                nextSize = -1
                prevSize = prev.size + next.size + this.handleSize
            }
        }
        else if (nextSize < 0)
        {
            leftOver = -nextSize
            nextHandle = handle.next()
            while (leftOver > 0 && nextHandle && (nextVisFlex = this.nextVisFlex(nextHandle)))
            {
                deduct = Math.min(leftOver,nextVisFlex.size)
                leftOver -= deduct
                nextVisFlex.setSize(nextVisFlex.size - deduct)
                nextHandle = nextHandle.next()
            }
            nextSize = 0
            prevSize -= leftOver
        }
        prev.setSize(prevSize)
        next.setSize(nextSize)
        this.update()
        ;(typeof this.onPaneSize === "function" ? this.onPaneSize() : undefined)
        return true
    }

    restoreState (state)
    {
        var p, s, si, _242_19_

        if (!(state != null ? state.length : undefined))
        {
            return
        }
        for (var _a_ = si = 0, _b_ = state.length; (_a_ <= _b_ ? si < state.length : si > state.length); (_a_ <= _b_ ? ++si : --si))
        {
            s = state[si]
            p = this.pane(si)
            delete p.collapsed
            if (s.size < 0)
            {
                p.collapse()
            }
            if (s.size >= 0)
            {
                p.setSize(s.size)
            }
        }
        this.updateHandles()
        return (typeof this.onPaneSize === "function" ? this.onPaneSize() : undefined)
    }

    getState ()
    {
        var p, state

        state = []
        var list = _k_.list(this.panes)
        for (var _a_ = 0; _a_ < list.length; _a_++)
        {
            p = list[_a_]
            state.push({id:p.id,size:p.size,pos:p.pos()})
        }
        return state
    }

    resized ()
    {
        return this.update().calculate()
    }

    update ()
    {
        return this.updatePanes().updateHandles()
    }

    updatePanes ()
    {
        var p

        var list = _k_.list(this.panes)
        for (var _a_ = 0; _a_ < list.length; _a_++)
        {
            p = list[_a_]
            p.update()
        }
        return this
    }

    updateHandles ()
    {
        var h

        var list = _k_.list(this.handles)
        for (var _a_ = 0; _a_ < list.length; _a_++)
        {
            h = list[_a_]
            h.update()
        }
        return this
    }

    handleStart (handle)
    {
        var _268_39_

        return (typeof this.onDragStart === "function" ? this.onDragStart() : undefined)
    }

    handleDrag (handle, drag)
    {
        var _271_19_

        if (this.moveHandleToPos(handle,drag.pos[this.axis] - this.pos() - 4))
        {
            return (typeof this.onDrag === "function" ? this.onDrag() : undefined)
        }
    }

    handleEnd ()
    {
        var _275_18_

        this.update()
        return (typeof this.onDragEnd === "function" ? this.onDragEnd() : undefined)
    }

    numPanes ()
    {
        return this.panes.length
    }

    visiblePanes ()
    {
        return this.panes.filter(function (p)
        {
            return p.isVisible()
        })
    }

    panePositions ()
    {
        return this.panes.map(function (p)
        {
            return p.pos()
        })
    }

    paneSizes ()
    {
        return this.panes.map(function (p)
        {
            return p.size
        })
    }

    sizeOfPane (i)
    {
        return this.pane(i).size
    }

    posOfPane (i)
    {
        return this.pane(i).pos()
    }

    posOfHandle (i)
    {
        return this.handle(i).pos()
    }

    pane (i)
    {
        return ((_k_.isNum(i)) && this.panes[i]) || ((_k_.isStr(i)) && this.panes.find(function (p)
        {
            return p.id === i
        })) || i
    }

    handle (i)
    {
        return ((_k_.isNum(i)) && this.handles[i]) || i
    }

    height ()
    {
        return this.view.getBoundingClientRect().height
    }

    size ()
    {
        return this.view.getBoundingClientRect()[this.dimension]
    }

    pos ()
    {
        return this.view.getBoundingClientRect()[this.position]
    }

    isCollapsed (i)
    {
        return this.pane(i).collapsed
    }

    collapse (i)
    {
        var pane

        if (pane = this.pane(i))
        {
            if (!pane.collapsed)
            {
                return pane.collapse()
            }
        }
    }

    expand (i, factor = 0.5)
    {
        var pane

        if (pane = this.pane(i))
        {
            if (pane.collapsed)
            {
                return pane.expand()
            }
            else
            {
                console.log('no expand?',i,pane)
            }
        }
        else
        {
            console.log('pane not found',i)
        }
    }

    nextVisPane (p)
    {
        var next, pi

        pi = this.panes.indexOf(p)
        if (pi >= this.panes.length - 1)
        {
            return null
        }
        next = this.panes[pi + 1]
        if (next.isVisible())
        {
            return next
        }
        return this.nextVisPane(next)
    }

    prevVisPane (p)
    {
        var pi, prev

        pi = this.panes.indexOf(p)
        if (pi <= 0)
        {
            return null
        }
        prev = this.panes[pi - 1]
        if (prev.isVisible())
        {
            return prev
        }
        return this.prevVisPane(prev)
    }

    closestVisFlex (p)
    {
        var d, isVisFlexPane, pi

        d = 1
        pi = this.panes.indexOf(p)
        isVisFlexPane = (function (i)
        {
            if (i >= 0 && i < this.panes.length)
            {
                if (!this.panes[i].collapsed && !this.panes[i].fixed)
                {
                    return true
                }
            }
        }).bind(this)
        while (d < this.panes.length - 1)
        {
            if (isVisFlexPane(pi + d))
            {
                return this.panes[pi + d]
            }
            if (isVisFlexPane(pi - d))
            {
                return this.panes[pi - d]
            }
            d++
        }
    }

    travPrev (h, f)
    {
        return f(h) && h.panea || h.index > 0 && this.travPrev(this.handles[h.index - 1],f) || null
    }

    travNext (h, f)
    {
        return f(h) && h.paneb || h.index < this.handles.length - 1 && this.travNext(this.handles[h.index + 1],f) || null
    }

    prevVisFlex (h)
    {
        return this.travPrev(h,function (v)
        {
            return !v.panea.collapsed && !v.panea.fixed
        })
    }

    nextVisFlex (h)
    {
        return this.travNext(h,function (v)
        {
            return !v.paneb.collapsed && !v.paneb.fixed
        })
    }

    prevFlex (h)
    {
        return this.travPrev(h,function (v)
        {
            return !v.panea.fixed
        })
    }

    nextFlex (h)
    {
        return this.travNext(h,function (v)
        {
            return !v.paneb.fixed
        })
    }

    prevVis (h)
    {
        return this.travPrev(h,function (v)
        {
            return !v.panea.collapsed
        })
    }

    nextVis (h)
    {
        return this.travNext(h,function (v)
        {
            return !v.paneb.collapsed
        })
    }

    prevAllInv (h)
    {
        var p

        p = !this.prevVis(h) && h.panea || null
        ;(p != null ? p.expand() : undefined)
        return p
    }

    nextAllInv (h)
    {
        var p

        p = !this.nextVis(h) && h.paneb || null
        ;(p != null ? p.expand() : undefined)
        return p
    }
}

export default Flex;