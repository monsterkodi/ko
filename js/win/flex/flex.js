// koffee 1.4.0

/*
00000000  000      00000000  000   000  
000       000      000        000 000   
000000    000      0000000     00000    
000       000      000        000 000   
000       0000000  00000000  000   000
 */
var Flex, Handle, Pane, _, clamp, def, drag, empty, getStyle, last, ref, valid;

ref = require('kxk'), getStyle = ref.getStyle, clamp = ref.clamp, valid = ref.valid, empty = ref.empty, last = ref.last, drag = ref.drag, def = ref.def, _ = ref._;

Pane = require('./pane');

Handle = require('./handle');

Flex = (function() {
    function Flex(opt) {
        var horz, j, len, p, ref1, ref2, ref3, ref4, ref5;
        this.handleSize = (ref1 = opt.handleSize) != null ? ref1 : 6;
        this.direction = (ref2 = opt.direction) != null ? ref2 : 'horizontal';
        this.snapFirst = opt.snapFirst;
        this.snapLast = opt.snapLast;
        this.onPaneSize = opt.onPaneSize;
        this.onDragStart = opt.onDragStart;
        this.onDrag = opt.onDrag;
        this.onDragEnd = opt.onDragEnd;
        horz = this.direction === 'horizontal';
        this.dimension = horz && 'width' || 'height';
        this.clientDim = horz && 'clientWidth' || 'clientHeight';
        this.axis = horz && 'x' || 'y';
        this.position = horz && 'left' || 'top';
        this.handleClass = horz && 'split-handle split-handle-horizontal' || 'split-handle split-handle-vertical';
        this.paddingA = horz && 'paddingLeft' || 'paddingTop';
        this.paddingB = horz && 'paddingRight' || 'paddingBottom';
        this.cursor = (ref3 = opt.cursor) != null ? ref3 : horz && 'ew-resize' || 'ns-resize';
        this.panes = [];
        this.handles = [];
        this.view = (ref4 = opt.view) != null ? ref4 : opt.panes[0].div.parentNode;
        this.view.style.display = 'flex';
        this.view.style.flexDirection = horz && 'row' || 'column';
        if (valid(opt.panes)) {
            ref5 = opt.panes;
            for (j = 0, len = ref5.length; j < len; j++) {
                p = ref5[j];
                this.addPane(p);
            }
        }
    }

    Flex.prototype.addPane = function(p) {
        var lastPane, newPane;
        newPane = new Pane(_.defaults(p, {
            flex: this,
            index: this.panes.length
        }));
        if (lastPane = _.last(this.panes)) {
            this.handles.push(new Handle({
                flex: this,
                index: lastPane.index,
                panea: lastPane,
                paneb: newPane
            }));
        }
        this.panes.push(newPane);
        return this.relax();
    };

    Flex.prototype.popPane = function(opt) {
        if (opt == null) {
            opt = {};
        }
        if ((opt != null ? opt.relax : void 0) === false) {
            this.unrelax();
        }
        if (this.panes.length > 1) {
            this.panes.pop().del();
            this.handles.pop().del();
        }
        if ((opt != null ? opt.relax : void 0) !== false) {
            return this.relax();
        } else {
            return last(this.panes).setSize(last(this.panes).actualSize());
        }
    };

    Flex.prototype.relax = function() {
        var j, len, p, ref1, results;
        this.relaxed = true;
        ref1 = this.visiblePanes();
        results = [];
        for (j = 0, len = ref1.length; j < len; j++) {
            p = ref1[j];
            p.div.style.flex = "1 1 0";
            results.push(p.size = 0);
        }
        return results;
    };

    Flex.prototype.unrelax = function() {
        var j, len, p, ref1, results;
        this.relaxed = false;
        ref1 = this.visiblePanes();
        results = [];
        for (j = 0, len = ref1.length; j < len; j++) {
            p = ref1[j];
            results.push(p.size = p.actualSize());
        }
        return results;
    };

    Flex.prototype.calculate = function() {
        var avail, diff, flexPanes, h, j, k, l, len, len1, len2, len3, m, p, ref1, visPanes;
        visPanes = this.panes.filter(function(p) {
            return !p.collapsed;
        });
        flexPanes = visPanes.filter(function(p) {
            return !p.fixed;
        });
        avail = this.size();
        ref1 = this.handles;
        for (j = 0, len = ref1.length; j < len; j++) {
            h = ref1[j];
            h.update();
            if (h.isVisible()) {
                avail -= h.size();
            }
        }
        for (k = 0, len1 = visPanes.length; k < len1; k++) {
            p = visPanes[k];
            avail -= p.size;
        }
        diff = avail / flexPanes.length;
        for (l = 0, len2 = flexPanes.length; l < len2; l++) {
            p = flexPanes[l];
            p.size += diff;
        }
        for (m = 0, len3 = visPanes.length; m < len3; m++) {
            p = visPanes[m];
            p.setSize(p.size);
        }
        return typeof this.onPaneSize === "function" ? this.onPaneSize() : void 0;
    };

    Flex.prototype.moveHandle = function(opt) {
        var handle;
        handle = this.handles[opt.index];
        return this.moveHandleToPos(handle, opt.pos);
    };

    Flex.prototype.moveHandleToPos = function(handle, pos) {
        var deduct, leftOver, next, nextHandle, nextSize, nextVisFlex, offset, prev, prevHandle, prevSize, prevVisFlex, ref1, ref2, ref3, ref4;
        pos = parseInt(pos);
        if (this.relaxed) {
            this.unrelax();
        }
        offset = pos - handle.actualPos();
        if (Math.abs(offset) < 1) {
            return;
        }
        prev = (ref1 = (ref2 = this.prevAllInv(handle)) != null ? ref2 : this.prevVisFlex(handle)) != null ? ref1 : this.prevFlex(handle);
        next = (ref3 = (ref4 = this.nextAllInv(handle)) != null ? ref4 : this.nextVisFlex(handle)) != null ? ref3 : this.nextFlex(handle);
        delete prev.collapsed;
        delete next.collapsed;
        prevSize = prev.size + offset;
        nextSize = next.size - offset;
        if ((this.snapFirst != null) && prevSize < this.snapFirst && !this.prevVisPane(prev)) {
            if (prevSize <= 0 || offset < this.snapFirst) {
                prevSize = -1;
                nextSize = next.size + prev.size + this.handleSize;
            }
        } else if (prevSize < 0) {
            leftOver = -prevSize;
            prevHandle = handle.prev();
            while (leftOver > 0 && prevHandle && (prevVisFlex = this.prevVisFlex(prevHandle))) {
                deduct = Math.min(leftOver, prevVisFlex.size);
                leftOver -= deduct;
                prevVisFlex.setSize(prevVisFlex.size - deduct);
                prevHandle = prevHandle.prev();
            }
            prevSize = 0;
            nextSize -= leftOver;
        }
        if ((this.snapLast != null) && nextSize < this.snapLast && !this.nextVisPane(next)) {
            if (nextSize <= 0 || -offset < this.snapLast) {
                nextSize = -1;
                prevSize = prev.size + next.size + this.handleSize;
            }
        } else if (nextSize < 0) {
            leftOver = -nextSize;
            nextHandle = handle.next();
            while (leftOver > 0 && nextHandle && (nextVisFlex = this.nextVisFlex(nextHandle))) {
                deduct = Math.min(leftOver, nextVisFlex.size);
                leftOver -= deduct;
                nextVisFlex.setSize(nextVisFlex.size - deduct);
                nextHandle = nextHandle.next();
            }
            nextSize = 0;
            prevSize -= leftOver;
        }
        prev.setSize(prevSize);
        next.setSize(nextSize);
        this.update();
        return typeof this.onPaneSize === "function" ? this.onPaneSize() : void 0;
    };

    Flex.prototype.restoreState = function(state) {
        var j, pane, ref1, s, si;
        if (!(state != null ? state.length : void 0)) {
            return;
        }
        for (si = j = 0, ref1 = state.length; 0 <= ref1 ? j < ref1 : j > ref1; si = 0 <= ref1 ? ++j : --j) {
            s = state[si];
            pane = this.pane(si);
            delete pane.collapsed;
            if (s.size < 0) {
                pane.collapse();
            }
            if (s.size >= 0) {
                pane.setSize(s.size);
            }
        }
        this.updateHandles();
        return typeof this.onPaneSize === "function" ? this.onPaneSize() : void 0;
    };

    Flex.prototype.getState = function() {
        var j, len, p, ref1, state;
        state = [];
        ref1 = this.panes;
        for (j = 0, len = ref1.length; j < len; j++) {
            p = ref1[j];
            state.push({
                id: p.id,
                size: p.size,
                pos: p.pos()
            });
        }
        return state;
    };

    Flex.prototype.resized = function() {
        return this.update().calculate();
    };

    Flex.prototype.update = function() {
        return this.updatePanes().updateHandles();
    };

    Flex.prototype.updatePanes = function() {
        var j, len, p, ref1;
        ref1 = this.panes;
        for (j = 0, len = ref1.length; j < len; j++) {
            p = ref1[j];
            p.update();
        }
        return this;
    };

    Flex.prototype.updateHandles = function() {
        var h, j, len, ref1;
        ref1 = this.handles;
        for (j = 0, len = ref1.length; j < len; j++) {
            h = ref1[j];
            h.update();
        }
        return this;
    };

    Flex.prototype.handleStart = function(handle) {
        return typeof this.onDragStart === "function" ? this.onDragStart() : void 0;
    };

    Flex.prototype.handleDrag = function(handle, drag) {
        this.moveHandleToPos(handle, drag.pos[this.axis] - this.pos() - 4);
        return typeof this.onDrag === "function" ? this.onDrag() : void 0;
    };

    Flex.prototype.handleEnd = function() {
        this.update();
        return typeof this.onDragEnd === "function" ? this.onDragEnd() : void 0;
    };

    Flex.prototype.numPanes = function() {
        return this.panes.length;
    };

    Flex.prototype.visiblePanes = function() {
        return this.panes.filter(function(p) {
            return p.isVisible();
        });
    };

    Flex.prototype.panePositions = function() {
        var j, len, p, ref1, results;
        ref1 = this.panes;
        results = [];
        for (j = 0, len = ref1.length; j < len; j++) {
            p = ref1[j];
            results.push(p.pos());
        }
        return results;
    };

    Flex.prototype.paneSizes = function() {
        var j, len, p, ref1, results;
        ref1 = this.panes;
        results = [];
        for (j = 0, len = ref1.length; j < len; j++) {
            p = ref1[j];
            results.push(p.size);
        }
        return results;
    };

    Flex.prototype.sizeOfPane = function(i) {
        return this.pane(i).size;
    };

    Flex.prototype.posOfPane = function(i) {
        return this.pane(i).pos();
    };

    Flex.prototype.posOfHandle = function(i) {
        return this.handle(i).pos();
    };

    Flex.prototype.pane = function(i) {
        return _.isNumber(i) && this.panes[i] || _.isString(i) && _.find(this.panes, function(p) {
            return p.id === i;
        }) || i;
    };

    Flex.prototype.handle = function(i) {
        return _.isNumber(i) && this.handles[i] || i;
    };

    Flex.prototype.height = function() {
        return this.view.getBoundingClientRect().height;
    };

    Flex.prototype.size = function() {
        return this.view.getBoundingClientRect()[this.dimension];
    };

    Flex.prototype.pos = function() {
        return this.view.getBoundingClientRect()[this.position];
    };

    Flex.prototype.isCollapsed = function(i) {
        return this.pane(i).collapsed;
    };

    Flex.prototype.collapse = function(i) {
        var pane;
        if (pane = this.pane(i)) {
            if (!pane.collapsed) {
                pane.collapse();
                return this.calculate();
            }
        }
    };

    Flex.prototype.expand = function(i, factor) {
        var flex, pane, ref1, use;
        if (factor == null) {
            factor = 0.5;
        }
        if (pane = this.pane(i)) {
            if (pane.collapsed) {
                pane.expand();
                if (flex = this.closestVisFlex(pane)) {
                    use = (ref1 = pane.fixed) != null ? ref1 : flex.size * factor;
                    flex.size -= use;
                    pane.size = use;
                }
                return this.calculate();
            }
        }
    };

    Flex.prototype.nextVisPane = function(p) {
        var next, pi;
        pi = this.panes.indexOf(p);
        if (pi >= this.panes.length - 1) {
            return null;
        }
        next = this.panes[pi + 1];
        if (next.isVisible()) {
            return next;
        }
        return this.nextVisPane(next);
    };

    Flex.prototype.prevVisPane = function(p) {
        var pi, prev;
        pi = this.panes.indexOf(p);
        if (pi <= 0) {
            return null;
        }
        prev = this.panes[pi - 1];
        if (prev.isVisible()) {
            return prev;
        }
        return this.prevVisPane(prev);
    };

    Flex.prototype.closestVisFlex = function(p) {
        var d, isVisFlexPane, pi;
        d = 1;
        pi = this.panes.indexOf(p);
        isVisFlexPane = (function(_this) {
            return function(i) {
                if (i >= 0 && i < _this.panes.length) {
                    if (!_this.panes[i].collapsed && !_this.panes[i].fixed) {
                        return true;
                    }
                }
            };
        })(this);
        while (d < this.panes.length - 1) {
            if (isVisFlexPane(pi + d)) {
                return this.panes[pi + d];
            } else if (isVisFlexPane(pi - d)) {
                return this.panes[pi - d];
            }
            d++;
        }
    };

    Flex.prototype.travPrev = function(h, f) {
        return f(h) && h.panea || h.index > 0 && this.travPrev(this.handles[h.index - 1], f) || null;
    };

    Flex.prototype.travNext = function(h, f) {
        return f(h) && h.paneb || h.index < this.handles.length - 1 && this.travNext(this.handles[h.index + 1], f) || null;
    };

    Flex.prototype.prevVisFlex = function(h) {
        return this.travPrev(h, function(v) {
            return !v.panea.collapsed && !v.panea.fixed;
        });
    };

    Flex.prototype.nextVisFlex = function(h) {
        return this.travNext(h, function(v) {
            return !v.paneb.collapsed && !v.paneb.fixed;
        });
    };

    Flex.prototype.prevFlex = function(h) {
        return this.travPrev(h, function(v) {
            return !v.panea.fixed;
        });
    };

    Flex.prototype.nextFlex = function(h) {
        return this.travNext(h, function(v) {
            return !v.paneb.fixed;
        });
    };

    Flex.prototype.prevVis = function(h) {
        return this.travPrev(h, function(v) {
            return !v.panea.collapsed;
        });
    };

    Flex.prototype.nextVis = function(h) {
        return this.travNext(h, function(v) {
            return !v.paneb.collapsed;
        });
    };

    Flex.prototype.prevAllInv = function(h) {
        var p;
        p = !this.prevVis(h) && h.panea || null;
        if (p != null) {
            p.expand();
        }
        return p;
    };

    Flex.prototype.nextAllInv = function(h) {
        var p;
        p = !this.nextVis(h) && h.paneb || null;
        if (p != null) {
            p.expand();
        }
        return p;
    };

    return Flex;

})();

module.exports = Flex;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmxleC5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUE7O0FBUUEsTUFBd0QsT0FBQSxDQUFRLEtBQVIsQ0FBeEQsRUFBRSx1QkFBRixFQUFZLGlCQUFaLEVBQW1CLGlCQUFuQixFQUEwQixpQkFBMUIsRUFBaUMsZUFBakMsRUFBdUMsZUFBdkMsRUFBNkMsYUFBN0MsRUFBa0Q7O0FBRWxELElBQUEsR0FBUyxPQUFBLENBQVEsUUFBUjs7QUFDVCxNQUFBLEdBQVMsT0FBQSxDQUFRLFVBQVI7O0FBRUg7SUFFVyxjQUFDLEdBQUQ7QUFFVCxZQUFBO1FBQUEsSUFBQyxDQUFBLFVBQUQsNENBQWdDO1FBQ2hDLElBQUMsQ0FBQSxTQUFELDJDQUErQjtRQUMvQixJQUFDLENBQUEsU0FBRCxHQUFlLEdBQUcsQ0FBQztRQUNuQixJQUFDLENBQUEsUUFBRCxHQUFlLEdBQUcsQ0FBQztRQUNuQixJQUFDLENBQUEsVUFBRCxHQUFlLEdBQUcsQ0FBQztRQUNuQixJQUFDLENBQUEsV0FBRCxHQUFlLEdBQUcsQ0FBQztRQUNuQixJQUFDLENBQUEsTUFBRCxHQUFlLEdBQUcsQ0FBQztRQUNuQixJQUFDLENBQUEsU0FBRCxHQUFlLEdBQUcsQ0FBQztRQUVuQixJQUFBLEdBQWUsSUFBQyxDQUFBLFNBQUQsS0FBYztRQUM3QixJQUFDLENBQUEsU0FBRCxHQUFlLElBQUEsSUFBUyxPQUFULElBQW9CO1FBQ25DLElBQUMsQ0FBQSxTQUFELEdBQWUsSUFBQSxJQUFTLGFBQVQsSUFBMEI7UUFDekMsSUFBQyxDQUFBLElBQUQsR0FBZSxJQUFBLElBQVMsR0FBVCxJQUFnQjtRQUMvQixJQUFDLENBQUEsUUFBRCxHQUFlLElBQUEsSUFBUyxNQUFULElBQW1CO1FBQ2xDLElBQUMsQ0FBQSxXQUFELEdBQWUsSUFBQSxJQUFTLHNDQUFULElBQW1EO1FBQ2xFLElBQUMsQ0FBQSxRQUFELEdBQWUsSUFBQSxJ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N0Q7O21CQUNiLFVBQUEsR0FBYSxTQUFDLENBQUQ7QUFBTyxZQUFBO1FBQUEsQ0FBQSxHQUFJLENBQUksSUFBQyxDQUFBLE9BQUQsQ0FBUyxDQUFULENBQUosSUFBb0IsQ0FBQyxDQUFDLEtBQXRCLElBQStCOztZQUFNLENBQUMsQ0FBRSxNQUFILENBQUE7O2VBQWE7SUFBN0Q7Ozs7OztBQUVqQixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwMDAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAgMDAwIDAwMCAgIFxuMDAwMDAwICAgIDAwMCAgICAgIDAwMDAwMDAgICAgIDAwMDAwICAgIFxuMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAgMDAwIDAwMCAgIFxuMDAwICAgICAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuIyMjXG5cbnsgZ2V0U3R5bGUsIGNsYW1wLCB2YWxpZCwgZW1wdHksIGxhc3QsIGRyYWcsIGRlZiwgXyB9ID0gcmVxdWlyZSAna3hrJ1xuXG5QYW5lICAgPSByZXF1aXJlICcuL3BhbmUnXG5IYW5kbGUgPSByZXF1aXJlICcuL2hhbmRsZSdcblxuY2xhc3MgRmxleCBcbiAgICBcbiAgICBjb25zdHJ1Y3RvcjogKG9wdCkgLT5cbiAgICAgICAgXG4gICAgICAgIEBoYW5kbGVTaXplICA9IG9wdC5oYW5kbGVTaXplID8gNlxuICAgICAgICBAZGlyZWN0aW9uICAgPSBvcHQuZGlyZWN0aW9uID8gJ2hvcml6b250YWwnXG4gICAgICAgIEBzbmFwRmlyc3QgICA9IG9wdC5zbmFwRmlyc3RcbiAgICAgICAgQHNuYXBMYXN0ICAgID0gb3B0LnNuYXBMYXN0XG4gICAgICAgIEBvblBhbmVTaXplICA9IG9wdC5vblBhbmVTaXplXG4gICAgICAgIEBvbkRyYWdTdGFydCA9IG9wdC5vbkRyYWdTdGFydFxuICAgICAgICBAb25EcmFnICAgICAgPSBvcHQub25EcmFnXG4gICAgICAgIEBvbkRyYWdFbmQgICA9IG9wdC5vbkRyYWdFbmRcbiAgICBcbiAgICAgICAgaG9yeiAgICAgICAgID0gQGRpcmVjdGlvbiA9PSAnaG9yaXpvbnRhbCdcbiAgICAgICAgQGRpbWVuc2lvbiAgID0gaG9yeiBhbmQgJ3dpZHRoJyBvciAnaGVpZ2h0J1xuICAgICAgICBAY2xpZW50RGltICAgPSBob3J6IGFuZCAnY2xpZW50V2lkdGgnIG9yICdjbGllbnRIZWlnaHQnXG4gICAgICAgIEBheGlzICAgICAgICA9IGhvcnogYW5kICd4JyBvciAneSdcbiAgICAgICAgQHBvc2l0aW9uICAgID0gaG9yeiBhbmQgJ2xlZnQnIG9yICd0b3AnXG4gICAgICAgIEBoYW5kbGVDbGFzcyA9IGhvcnogYW5kICdzcGxpdC1oYW5kbGUgc3BsaXQtaGFuZGxlLWhvcml6b250YWwnIG9yICdzcGxpdC1oYW5kbGUgc3BsaXQtaGFuZGxlLXZlcnRpY2FsJ1xuICAgICAgICBAcGFkZGluZ0EgICAgPSBob3J6IGFuZCAncGFkZGluZ0xlZnQnIG9yICdwYWRkaW5nVG9wJ1xuICAgICAgICBAcGFkZGluZ0IgICAgPSBob3J6IGFuZCAncGFkZGluZ1JpZ2h0JyBvciAncGFkZGluZ0JvdHRvbSdcbiAgICAgICAgQGN1cnNvciAgICAgID0gb3B0LmN1cnNvciA/IGhvcnogYW5kICdldy1yZXNpemUnIG9yICducy1yZXNpemUnXG4gICAgICAgIFxuICAgICAgICBAcGFuZXMgICA9IFtdXG4gICAgICAgIEBoYW5kbGVzID0gW11cblxuICAgICAgICBAdmlldyA9IG9wdC52aWV3ID8gb3B0LnBhbmVzWzBdLmRpdi5wYXJlbnROb2RlXG4gICAgICAgIEB2aWV3LnN0eWxlLmRpc3BsYXkgPSAnZmxleCdcbiAgICAgICAgQHZpZXcuc3R5bGUuZmxleERpcmVjdGlvbiA9IGhvcnogYW5kICdyb3cnIG9yICdjb2x1bW4nXG4gICAgICAgIFxuICAgICAgICBpZiB2YWxpZCBvcHQucGFuZXNcbiAgICAgICAgICAgIEBhZGRQYW5lIHAgZm9yIHAgaW4gb3B0LnBhbmVzXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICBcbiAgICBcbiAgICBhZGRQYW5lOiAocCkgLT5cblxuICAgICAgICBuZXdQYW5lID0gbmV3IFBhbmUgXy5kZWZhdWx0cyBwLCBcbiAgICAgICAgICAgIGZsZXg6ICAgQCBcbiAgICAgICAgICAgIGluZGV4OiAgQHBhbmVzLmxlbmd0aFxuICAgICAgICAgICAgXG4gICAgICAgIGlmIGxhc3RQYW5lID0gXy5sYXN0IEBwYW5lc1xuICAgICAgICAgICAgQGhhbmRsZXMucHVzaCBuZXcgSGFuZGxlXG4gICAgICAgICAgICAgICAgZmxleDogIEBcbiAgICAgICAgICAgICAgICBpbmRleDogbGFzdFBhbmUuaW5kZXhcbiAgICAgICAgICAgICAgICBwYW5lYTogbGFzdFBhbmVcbiAgICAgICAgICAgICAgICBwYW5lYjogbmV3UGFuZVxuICAgICAgICAgICAgXG4gICAgICAgIEBwYW5lcy5wdXNoIG5ld1BhbmVcbiAgICAgICAgQHJlbGF4KClcblxuICAgICMgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgXG4gICAgIyAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwICAgICAgICBcbiAgICBcbiAgICBwb3BQYW5lOiAob3B0PXt9KSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgb3B0Py5yZWxheCA9PSBmYWxzZVxuICAgICAgICAgICAgQHVucmVsYXgoKSAgXG4gICAgICAgIFxuICAgICAgICBpZiBAcGFuZXMubGVuZ3RoID4gMVxuICAgICAgICAgICAgQHBhbmVzLnBvcCgpLmRlbCgpXG4gICAgICAgICAgICBAaGFuZGxlcy5wb3AoKS5kZWwoKVxuICAgICAgICAgICAgXG4gICAgICAgIGlmIG9wdD8ucmVsYXggIT0gZmFsc2VcbiAgICAgICAgICAgIEByZWxheCgpICAgIFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBsYXN0KEBwYW5lcykuc2V0U2l6ZSBsYXN0KEBwYW5lcykuYWN0dWFsU2l6ZSgpXG5cbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgIDAwMCAwMDAgICBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMDAwMCAgICAwMDAwMCAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgIDAwMCAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICBcbiAgICByZWxheDogLT5cbiAgICAgICAgXG4gICAgICAgIEByZWxheGVkID0gdHJ1ZVxuICAgICAgICBmb3IgcCBpbiBAdmlzaWJsZVBhbmVzKClcbiAgICAgICAgICAgIHAuZGl2LnN0eWxlLmZsZXggPSBcIjEgMSAwXCJcbiAgICAgICAgICAgIHAuc2l6ZSA9IDBcblxuICAgIHVucmVsYXg6IC0+XG4gICAgICAgIFxuICAgICAgICBAcmVsYXhlZCA9IGZhbHNlXG4gICAgICAgIGZvciBwIGluIEB2aXNpYmxlUGFuZXMoKVxuICAgICAgICAgICAgcC5zaXplID0gcC5hY3R1YWxTaXplKClcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgICAgIDAwMDAwMDAwMCAgMDAwICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgIFxuICAgIFxuICAgIGNhbGN1bGF0ZTogLT5cblxuICAgICAgICB2aXNQYW5lcyAgPSBAcGFuZXMuZmlsdGVyIChwKSAtPiBub3QgcC5jb2xsYXBzZWRcbiAgICAgICAgZmxleFBhbmVzID0gdmlzUGFuZXMuZmlsdGVyIChwKSAtPiBub3QgcC5maXhlZFxuICAgICAgICBhdmFpbCAgICAgPSBAc2l6ZSgpXG4gICAgICAgIFxuICAgICAgICBmb3IgaCBpbiBAaGFuZGxlc1xuICAgICAgICAgICAgaC51cGRhdGUoKSBcbiAgICAgICAgICAgIGF2YWlsIC09IGguc2l6ZSgpIGlmIGguaXNWaXNpYmxlKClcbiAgICAgICAgICAgIFxuICAgICAgICBmb3IgcCBpbiB2aXNQYW5lc1xuICAgICAgICAgICAgYXZhaWwgLT0gcC5zaXplXG4gICAgICAgICAgICBcbiAgICAgICAgZGlmZiA9IGF2YWlsIC8gZmxleFBhbmVzLmxlbmd0aFxuICAgICAgICBcbiAgICAgICAgZm9yIHAgaW4gZmxleFBhbmVzXG4gICAgICAgICAgICBwLnNpemUgKz0gZGlmZlxuICAgICAgICAgICAgXG4gICAgICAgIGZvciBwIGluIHZpc1BhbmVzXG4gICAgICAgICAgICBwLnNldFNpemUgcC5zaXplXG5cbiAgICAgICAgQG9uUGFuZVNpemU/KClcbiAgICBcbiAgICAjIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwIDAwMCAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgICAgMCAgICAgIDAwMDAwMDAwICBcblxuICAgIG1vdmVIYW5kbGU6IChvcHQpIC0+IFxuICAgICAgICBcbiAgICAgICAgaGFuZGxlID0gQGhhbmRsZXNbb3B0LmluZGV4XVxuICAgICAgICBAbW92ZUhhbmRsZVRvUG9zIGhhbmRsZSwgb3B0LnBvcyAgICAgICAgXG4gICAgXG4gICAgbW92ZUhhbmRsZVRvUG9zOiAoaGFuZGxlLCBwb3MpIC0+XG4gICAgICAgIFxuICAgICAgICBwb3MgPSBwYXJzZUludCBwb3NcbiAgICAgICAgaWYgQHJlbGF4ZWQgdGhlbiBAdW5yZWxheCgpXG4gICAgICAgIFxuICAgICAgICBvZmZzZXQgPSBwb3MgLSBoYW5kbGUuYWN0dWFsUG9zKClcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBNYXRoLmFicyhvZmZzZXQpIDwgMVxuICAgICAgICBcbiAgICAgICAgcHJldiAgPSBAcHJldkFsbEludihoYW5kbGUpID8gQHByZXZWaXNGbGV4KGhhbmRsZSkgPyBAcHJldkZsZXggaGFuZGxlXG4gICAgICAgIG5leHQgID0gQG5leHRBbGxJbnYoaGFuZGxlKSA/IEBuZXh0VmlzRmxleChoYW5kbGUpID8gQG5leHRGbGV4IGhhbmRsZVxuICAgICAgICBcbiAgICAgICAgZGVsZXRlIHByZXYuY29sbGFwc2VkXG4gICAgICAgIGRlbGV0ZSBuZXh0LmNvbGxhcHNlZFxuICAgICAgICBcbiAgICAgICAgcHJldlNpemUgPSBwcmV2LnNpemUgKyBvZmZzZXRcbiAgICAgICAgbmV4dFNpemUgPSBuZXh0LnNpemUgLSBvZmZzZXRcbiAgICAgICAgXG4gICAgICAgIGlmIEBzbmFwRmlyc3Q/IGFuZCBwcmV2U2l6ZSA8IEBzbmFwRmlyc3QgYW5kIG5vdCBAcHJldlZpc1BhbmUgcHJldlxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBwcmV2U2l6ZSA8PSAwIG9yIG9mZnNldCA8IEBzbmFwRmlyc3QgIyBjb2xsYXBzZSBwYW5lYVxuICAgICAgICAgICAgICAgIHByZXZTaXplID0gLTFcbiAgICAgICAgICAgICAgICBuZXh0U2l6ZSA9IG5leHQuc2l6ZSArIHByZXYuc2l6ZSArIEBoYW5kbGVTaXplXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGVsc2UgaWYgcHJldlNpemUgPCAwXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBsZWZ0T3ZlciA9IC1wcmV2U2l6ZVxuICAgICAgICAgICAgcHJldkhhbmRsZSA9IGhhbmRsZS5wcmV2KClcbiAgICAgICAgICAgIHdoaWxlIGxlZnRPdmVyID4gMCBhbmQgcHJldkhhbmRsZSBhbmQgcHJldlZpc0ZsZXggPSBAcHJldlZpc0ZsZXggcHJldkhhbmRsZVxuICAgICAgICAgICAgICAgIGRlZHVjdCA9IE1hdGgubWluIGxlZnRPdmVyLCBwcmV2VmlzRmxleC5zaXplXG4gICAgICAgICAgICAgICAgbGVmdE92ZXIgLT0gZGVkdWN0XG4gICAgICAgICAgICAgICAgcHJldlZpc0ZsZXguc2V0U2l6ZSBwcmV2VmlzRmxleC5zaXplIC0gZGVkdWN0XG4gICAgICAgICAgICAgICAgcHJldkhhbmRsZSA9IHByZXZIYW5kbGUucHJldigpXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBwcmV2U2l6ZSA9IDBcbiAgICAgICAgICAgIG5leHRTaXplIC09IGxlZnRPdmVyXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICBpZiBAc25hcExhc3Q/IGFuZCBuZXh0U2l6ZSA8IEBzbmFwTGFzdCBhbmQgbm90IEBuZXh0VmlzUGFuZSBuZXh0XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIG5leHRTaXplIDw9IDAgb3IgLW9mZnNldCA8IEBzbmFwTGFzdCAjIGNvbGxhcHNlIHBhbmViXG4gICAgICAgICAgICAgICAgbmV4dFNpemUgPSAtMVxuICAgICAgICAgICAgICAgIHByZXZTaXplID0gcHJldi5zaXplICsgbmV4dC5zaXplICsgQGhhbmRsZVNpemVcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgZWxzZSBpZiBuZXh0U2l6ZSA8IDBcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGxlZnRPdmVyID0gLW5leHRTaXplXG4gICAgICAgICAgICBuZXh0SGFuZGxlID0gaGFuZGxlLm5leHQoKVxuICAgICAgICAgICAgd2hpbGUgbGVmdE92ZXIgPiAwIGFuZCBuZXh0SGFuZGxlIGFuZCBuZXh0VmlzRmxleCA9IEBuZXh0VmlzRmxleCBuZXh0SGFuZGxlXG4gICAgICAgICAgICAgICAgZGVkdWN0ID0gTWF0aC5taW4gbGVmdE92ZXIsIG5leHRWaXNGbGV4LnNpemVcbiAgICAgICAgICAgICAgICBsZWZ0T3ZlciAtPSBkZWR1Y3RcbiAgICAgICAgICAgICAgICBuZXh0VmlzRmxleC5zZXRTaXplIG5leHRWaXNGbGV4LnNpemUgLSBkZWR1Y3RcbiAgICAgICAgICAgICAgICBuZXh0SGFuZGxlID0gbmV4dEhhbmRsZS5uZXh0KClcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIG5leHRTaXplID0gMFxuICAgICAgICAgICAgcHJldlNpemUgLT0gbGVmdE92ZXJcbiAgICAgICAgXG4gICAgICAgIHByZXYuc2V0U2l6ZSBwcmV2U2l6ZVxuICAgICAgICBuZXh0LnNldFNpemUgbmV4dFNpemVcbiAgICAgICAgQHVwZGF0ZSgpXG4gICAgICAgIEBvblBhbmVTaXplPygpXG5cbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICBcbiAgICAjICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIFxuICAgIFxuICAgIHJlc3RvcmVTdGF0ZTogKHN0YXRlKSAtPlxuICAgICAgICByZXR1cm4gaWYgbm90IHN0YXRlPy5sZW5ndGhcbiAgICAgICAgZm9yIHNpIGluIFswLi4uc3RhdGUubGVuZ3RoXVxuICAgICAgICAgICAgcyA9IHN0YXRlW3NpXVxuICAgICAgICAgICAgcGFuZSA9IEBwYW5lIHNpXG4gICAgICAgICAgICBkZWxldGUgcGFuZS5jb2xsYXBzZWRcbiAgICAgICAgICAgIHBhbmUuY29sbGFwc2UoKSAgICAgIGlmIHMuc2l6ZSA8IDBcbiAgICAgICAgICAgIHBhbmUuc2V0U2l6ZShzLnNpemUpIGlmIHMuc2l6ZSA+PSAwXG5cbiAgICAgICAgQHVwZGF0ZUhhbmRsZXMoKVxuICAgICAgICBAb25QYW5lU2l6ZT8oKVxuICAgICAgICBcbiAgICBnZXRTdGF0ZTogKCkgLT5cbiAgICAgICAgc3RhdGUgPSBbXVxuICAgICAgICBmb3IgcCBpbiBAcGFuZXNcbiAgICAgICAgICAgIHN0YXRlLnB1c2hcbiAgICAgICAgICAgICAgICBpZDogICBwLmlkXG4gICAgICAgICAgICAgICAgc2l6ZTogcC5zaXplXG4gICAgICAgICAgICAgICAgcG9zOiAgcC5wb3MoKVxuICAgICAgICBzdGF0ZVxuXG4gICAgIyAgMDAwMDAwMCAgMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAwMDAgICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgMDAwICAgIDAwMCAgICAwMDAwMDAwICAgXG4gICAgIyAgICAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgICAgIFxuICAgIHJlc2l6ZWQ6ICAgICAgIC0+IEB1cGRhdGUoKS5jYWxjdWxhdGUoKVxuXG4gICAgdXBkYXRlOiAgICAgICAgLT4gQHVwZGF0ZVBhbmVzKCkudXBkYXRlSGFuZGxlcygpXG4gICAgdXBkYXRlUGFuZXM6ICAgLT4gcC51cGRhdGUoKSBmb3IgcCBpbiBAcGFuZXMgICA7IEBcbiAgICB1cGRhdGVIYW5kbGVzOiAtPiBoLnVwZGF0ZSgpIGZvciBoIGluIEBoYW5kbGVzIDsgQFxuXG4gICAgIyBoYW5kbGUgZHJhZyBjYWxsYmFja3NcbiAgICBcbiAgICBoYW5kbGVTdGFydDogKGhhbmRsZSkgLT4gQG9uRHJhZ1N0YXJ0PygpXG4gICAgaGFuZGxlRHJhZzogIChoYW5kbGUsIGRyYWcpIC0+XG4gICAgICAgIEBtb3ZlSGFuZGxlVG9Qb3MgaGFuZGxlLCBkcmFnLnBvc1tAYXhpc10gLSBAcG9zKCkgLSA0XG4gICAgICAgIEBvbkRyYWc/KClcbiAgICBoYW5kbGVFbmQ6ICgpIC0+XG4gICAgICAgIEB1cGRhdGUoKVxuICAgICAgICBAb25EcmFnRW5kPygpXG5cbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIFxuICAgICMgMDAwICAwMDAwICAwMDAwMDAwICAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAwICAgICAwMDAgICAgIFxuICAgIFxuICAgIG51bVBhbmVzOiAgICAgICAgLT4gQHBhbmVzLmxlbmd0aFxuICAgIHZpc2libGVQYW5lczogICAgLT4gQHBhbmVzLmZpbHRlciAocCkgLT4gcC5pc1Zpc2libGUoKVxuICAgIHBhbmVQb3NpdGlvbnM6ICAgLT4gKCBwLnBvcygpIGZvciBwIGluIEBwYW5lcyApXG4gICAgcGFuZVNpemVzOiAgICAgICAtPiAoIHAuc2l6ZSBmb3IgcCBpbiBAcGFuZXMgKVxuICAgIHNpemVPZlBhbmU6ICAoaSkgLT4gQHBhbmUoaSkuc2l6ZVxuICAgIHBvc09mUGFuZTogICAoaSkgLT4gQHBhbmUoaSkucG9zKClcbiAgICBwb3NPZkhhbmRsZTogKGkpIC0+IEBoYW5kbGUoaSkucG9zKClcbiAgICBwYW5lOiAgICAgICAgKGkpIC0+IF8uaXNOdW1iZXIoaSkgYW5kIEBwYW5lc1tpXSAgIG9yIF8uaXNTdHJpbmcoaSkgYW5kIF8uZmluZChAcGFuZXMsIChwKSAtPiBwLmlkID09IGkpIG9yIGlcbiAgICBoYW5kbGU6ICAgICAgKGkpIC0+IF8uaXNOdW1iZXIoaSkgYW5kIEBoYW5kbGVzW2ldIG9yIGlcblxuICAgIGhlaWdodDogLT4gQHZpZXcuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkuaGVpZ2h0XG4gICAgc2l6ZTogICAtPiBAdmlldy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVtAZGltZW5zaW9uXVxuICAgIHBvczogICAgLT4gQHZpZXcuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClbQHBvc2l0aW9uXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgMDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAwMDAwICAgMDAwMDAwMDAgIFxuICAgIFxuICAgIGlzQ29sbGFwc2VkOiAoaSkgLT4gQHBhbmUoaSkuY29sbGFwc2VkXG4gICAgXG4gICAgY29sbGFwc2U6IChpKSAtPiBcbiAgICAgICAgXG4gICAgICAgIGlmIHBhbmUgPSBAcGFuZSBpXG4gICAgICAgICAgICBpZiBub3QgcGFuZS5jb2xsYXBzZWRcbiAgICAgICAgICAgICAgICBwYW5lLmNvbGxhcHNlKClcbiAgICAgICAgICAgICAgICBAY2FsY3VsYXRlKClcbiAgICAgICAgXG4gICAgZXhwYW5kOiAoaSwgZmFjdG9yPTAuNSkgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIHBhbmUgPSBAcGFuZSBpXG4gICAgICAgICAgICBpZiBwYW5lLmNvbGxhcHNlZFxuICAgICAgICAgICAgICAgIHBhbmUuZXhwYW5kKClcbiAgICAgICAgICAgICAgICBpZiBmbGV4ID0gQGNsb3Nlc3RWaXNGbGV4IHBhbmVcbiAgICAgICAgICAgICAgICAgICAgdXNlID0gcGFuZS5maXhlZCA/IGZsZXguc2l6ZSAqIGZhY3RvclxuICAgICAgICAgICAgICAgICAgICBmbGV4LnNpemUgLT0gdXNlXG4gICAgICAgICAgICAgICAgICAgIHBhbmUuc2l6ZSA9IHVzZVxuICAgICAgICAgICAgICAgIEBjYWxjdWxhdGUoKVxuXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAgMDAwIDAwMCAgIFxuICAgICMgIDAwMCAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAgICAgMDAwICAgICAgMDAwMDAwMCAgICAgMDAwMDAgICAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgIDAwMCAwMDAgICBcbiAgICAjICAgICAwICAgICAgMDAwICAwMDAwMDAwICAgMDAwICAgICAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgIFxuICAgIG5leHRWaXNQYW5lOiAocCkgLT5cbiAgICAgICAgcGkgPSBAcGFuZXMuaW5kZXhPZiBwXG4gICAgICAgIHJldHVybiBudWxsIGlmIHBpID49IEBwYW5lcy5sZW5ndGgtMVxuICAgICAgICBuZXh0ID0gQHBhbmVzW3BpKzFdXG4gICAgICAgIHJldHVybiBuZXh0IGlmIG5leHQuaXNWaXNpYmxlKClcbiAgICAgICAgQG5leHRWaXNQYW5lIG5leHRcbiAgICAgICAgXG4gICAgcHJldlZpc1BhbmU6IChwKSAtPlxuICAgICAgICBwaSA9IEBwYW5lcy5pbmRleE9mIHBcbiAgICAgICAgcmV0dXJuIG51bGwgaWYgcGkgPD0gMFxuICAgICAgICBwcmV2ID0gQHBhbmVzW3BpLTFdXG4gICAgICAgIHJldHVybiBwcmV2IGlmIHByZXYuaXNWaXNpYmxlKClcbiAgICAgICAgQHByZXZWaXNQYW5lIHByZXZcblxuICAgIGNsb3Nlc3RWaXNGbGV4OiAocCkgLT5cbiAgICAgICAgZCA9IDFcbiAgICAgICAgcGkgPSBAcGFuZXMuaW5kZXhPZiBwXG4gICAgICAgIFxuICAgICAgICBpc1Zpc0ZsZXhQYW5lID0gKGkpID0+XG4gICAgICAgICAgICBpZiBpID49IDAgYW5kIGkgPCBAcGFuZXMubGVuZ3RoXG4gICAgICAgICAgICAgICAgaWYgbm90IEBwYW5lc1tpXS5jb2xsYXBzZWQgYW5kIG5vdCBAcGFuZXNbaV0uZml4ZWRcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWUgXG4gICAgICAgICAgICBcbiAgICAgICAgd2hpbGUgZCA8IEBwYW5lcy5sZW5ndGgtMVxuICAgICAgICAgICAgaWYgaXNWaXNGbGV4UGFuZSBwaSArIGRcbiAgICAgICAgICAgICAgICByZXR1cm4gQHBhbmVzW3BpICsgZF1cbiAgICAgICAgICAgIGVsc2UgaWYgaXNWaXNGbGV4UGFuZSBwaSAtIGRcbiAgICAgICAgICAgICAgICByZXR1cm4gQHBhbmVzW3BpIC0gZF1cbiAgICAgICAgICAgIGQrK1xuXG4gICAgdHJhdlByZXY6IChoLCBmKSAtPiBmKGgpIGFuZCBoLnBhbmVhIG9yIGguaW5kZXggPiAwIGFuZCBAdHJhdlByZXYoQGhhbmRsZXNbaC5pbmRleC0xXSwgZikgb3IgbnVsbCAgICBcbiAgICB0cmF2TmV4dDogKGgsIGYpIC0+IGYoaCkgYW5kIGgucGFuZWIgb3IgaC5pbmRleCA8IEBoYW5kbGVzLmxlbmd0aC0xIGFuZCBAdHJhdk5leHQoQGhhbmRsZXNbaC5pbmRleCsxXSwgZikgb3IgbnVsbFxuICAgIHByZXZWaXNGbGV4OiAoaCkgLT4gQHRyYXZQcmV2IGgsICh2KSAtPiBub3Qgdi5wYW5lYS5jb2xsYXBzZWQgYW5kIG5vdCB2LnBhbmVhLmZpeGVkXG4gICAgbmV4dFZpc0ZsZXg6IChoKSAtPiBAdHJhdk5leHQgaCwgKHYpIC0+IG5vdCB2LnBhbmViLmNvbGxhcHNlZCBhbmQgbm90IHYucGFuZWIuZml4ZWQgXG4gICAgcHJldkZsZXg6ICAgIChoKSAtPiBAdHJhdlByZXYgaCwgKHYpIC0+IG5vdCB2LnBhbmVhLmZpeGVkXG4gICAgbmV4dEZsZXg6ICAgIChoKSAtPiBAdHJhdk5leHQgaCwgKHYpIC0+IG5vdCB2LnBhbmViLmZpeGVkIFxuICAgIHByZXZWaXM6ICAgICAoaCkgLT4gQHRyYXZQcmV2IGgsICh2KSAtPiBub3Qgdi5wYW5lYS5jb2xsYXBzZWQgXG4gICAgbmV4dFZpczogICAgIChoKSAtPiBAdHJhdk5leHQgaCwgKHYpIC0+IG5vdCB2LnBhbmViLmNvbGxhcHNlZCBcbiAgICBwcmV2QWxsSW52OiAgKGgpIC0+IHAgPSBub3QgQHByZXZWaXMoaCkgYW5kIGgucGFuZWEgb3IgbnVsbDsgcD8uZXhwYW5kKCk7IHBcbiAgICBuZXh0QWxsSW52OiAgKGgpIC0+IHAgPSBub3QgQG5leHRWaXMoaCkgYW5kIGgucGFuZWIgb3IgbnVsbDsgcD8uZXhwYW5kKCk7IHBcbiAgICAgICAgXG5tb2R1bGUuZXhwb3J0cyA9IEZsZXhcbiJdfQ==
//# sourceURL=../../../coffee/win/flex/flex.coffee