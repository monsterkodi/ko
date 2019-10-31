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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmxleC5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUE7O0FBUUEsTUFBd0QsT0FBQSxDQUFRLEtBQVIsQ0FBeEQsRUFBRSx1QkFBRixFQUFZLGlCQUFaLEVBQW1CLGlCQUFuQixFQUEwQixpQkFBMUIsRUFBaUMsZUFBakMsRUFBdUMsZUFBdkMsRUFBNkMsYUFBN0MsRUFBa0Q7O0FBRWxELElBQUEsR0FBUyxPQUFBLENBQVEsUUFBUjs7QUFDVCxNQUFBLEdBQVMsT0FBQSxDQUFRLFVBQVI7O0FBRUg7SUFFQyxjQUFDLEdBQUQ7QUFFQyxZQUFBO1FBQUEsSUFBQyxDQUFBLFVBQUQsNENBQWdDO1FBQ2hDLElBQUMsQ0FBQSxTQUFELDJDQUErQjtRQUMvQixJQUFDLENBQUEsU0FBRCxHQUFlLEdBQUcsQ0FBQztRQUNuQixJQUFDLENBQUEsUUFBRCxHQUFlLEdBQUcsQ0FBQztRQUNuQixJQUFDLENBQUEsVUFBRCxHQUFlLEdBQUcsQ0FBQztRQUNuQixJQUFDLENBQUEsV0FBRCxHQUFlLEdBQUcsQ0FBQztRQUNuQixJQUFDLENBQUEsTUFBRCxHQUFlLEdBQUcsQ0FBQztRQUNuQixJQUFDLENBQUEsU0FBRCxHQUFlLEdBQUcsQ0FBQztRQUVuQixJQUFBLEdBQWUsSUFBQyxDQUFBLFNBQUQsS0FBYztRQUM3QixJQUFDLENBQUEsU0FBRCxHQUFlLElBQUEsSUFBUyxPQUFULElBQW9CO1FBQ25DLElBQUMsQ0FBQSxTQUFELEdBQWUsSUFBQSxJQUFTLGFBQVQsSUFBMEI7UUFDekMsSUFBQyxDQUFBLElBQUQsR0FBZSxJQUFBLElBQVMsR0FBVCxJQUFnQjtRQUMvQixJQUFDLENBQUEsUUFBRCxHQUFlLElBQUEsSUFBUyxNQUFULElBQW1CO1FBQ2xDLElBQUMsQ0FBQSxXQUFELEdBQWUsSUFBQSxJQUFTLHNDQUFULElBQW1EO1FBQ2xFLElBQUMsQ0FBQSxRQUFELEdBQWUsSUFBQSxJ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N0Q7O21CQUNiLFVBQUEsR0FBYSxTQUFDLENBQUQ7QUFBTyxZQUFBO1FBQUEsQ0FBQSxHQUFJLENBQUksSUFBQyxDQUFBLE9BQUQsQ0FBUyxDQUFULENBQUosSUFBb0IsQ0FBQyxDQUFDLEtBQXRCLElBQStCOztZQUFNLENBQUMsQ0FBRSxNQUFILENBQUE7O2VBQWE7SUFBN0Q7Ozs7OztBQUVqQixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwMDAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAgMDAwIDAwMCAgIFxuMDAwMDAwICAgIDAwMCAgICAgIDAwMDAwMDAgICAgIDAwMDAwICAgIFxuMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAgMDAwIDAwMCAgIFxuMDAwICAgICAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuIyMjXG5cbnsgZ2V0U3R5bGUsIGNsYW1wLCB2YWxpZCwgZW1wdHksIGxhc3QsIGRyYWcsIGRlZiwgXyB9ID0gcmVxdWlyZSAna3hrJ1xuXG5QYW5lICAgPSByZXF1aXJlICcuL3BhbmUnXG5IYW5kbGUgPSByZXF1aXJlICcuL2hhbmRsZSdcblxuY2xhc3MgRmxleCBcbiAgICBcbiAgICBAOiAob3B0KSAtPlxuICAgICAgICBcbiAgICAgICAgQGhhbmRsZVNpemUgID0gb3B0LmhhbmRsZVNpemUgPyA2XG4gICAgICAgIEBkaXJlY3Rpb24gICA9IG9wdC5kaXJlY3Rpb24gPyAnaG9yaXpvbnRhbCdcbiAgICAgICAgQHNuYXBGaXJzdCAgID0gb3B0LnNuYXBGaXJzdFxuICAgICAgICBAc25hcExhc3QgICAgPSBvcHQuc25hcExhc3RcbiAgICAgICAgQG9uUGFuZVNpemUgID0gb3B0Lm9uUGFuZVNpemVcbiAgICAgICAgQG9uRHJhZ1N0YXJ0ID0gb3B0Lm9uRHJhZ1N0YXJ0XG4gICAgICAgIEBvbkRyYWcgICAgICA9IG9wdC5vbkRyYWdcbiAgICAgICAgQG9uRHJhZ0VuZCAgID0gb3B0Lm9uRHJhZ0VuZFxuICAgIFxuICAgICAgICBob3J6ICAgICAgICAgPSBAZGlyZWN0aW9uID09ICdob3Jpem9udGFsJ1xuICAgICAgICBAZGltZW5zaW9uICAgPSBob3J6IGFuZCAnd2lkdGgnIG9yICdoZWlnaHQnXG4gICAgICAgIEBjbGllbnREaW0gICA9IGhvcnogYW5kICdjbGllbnRXaWR0aCcgb3IgJ2NsaWVudEhlaWdodCdcbiAgICAgICAgQGF4aXMgICAgICAgID0gaG9yeiBhbmQgJ3gnIG9yICd5J1xuICAgICAgICBAcG9zaXRpb24gICAgPSBob3J6IGFuZCAnbGVmdCcgb3IgJ3RvcCdcbiAgICAgICAgQGhhbmRsZUNsYXNzID0gaG9yeiBhbmQgJ3NwbGl0LWhhbmRsZSBzcGxpdC1oYW5kbGUtaG9yaXpvbnRhbCcgb3IgJ3NwbGl0LWhhbmRsZSBzcGxpdC1oYW5kbGUtdmVydGljYWwnXG4gICAgICAgIEBwYWRkaW5nQSAgICA9IGhvcnogYW5kICdwYWRkaW5nTGVmdCcgb3IgJ3BhZGRpbmdUb3AnXG4gICAgICAgIEBwYWRkaW5nQiAgICA9IGhvcnogYW5kICdwYWRkaW5nUmlnaHQnIG9yICdwYWRkaW5nQm90dG9tJ1xuICAgICAgICBAY3Vyc29yICAgICAgPSBvcHQuY3Vyc29yID8gaG9yeiBhbmQgJ2V3LXJlc2l6ZScgb3IgJ25zLXJlc2l6ZSdcbiAgICAgICAgXG4gICAgICAgIEBwYW5lcyAgID0gW11cbiAgICAgICAgQGhhbmRsZXMgPSBbXVxuXG4gICAgICAgIEB2aWV3ID0gb3B0LnZpZXcgPyBvcHQucGFuZXNbMF0uZGl2LnBhcmVudE5vZGVcbiAgICAgICAgQHZpZXcuc3R5bGUuZGlzcGxheSA9ICdmbGV4J1xuICAgICAgICBAdmlldy5zdHlsZS5mbGV4RGlyZWN0aW9uID0gaG9yeiBhbmQgJ3Jvdycgb3IgJ2NvbHVtbidcbiAgICAgICAgXG4gICAgICAgIGlmIHZhbGlkIG9wdC5wYW5lc1xuICAgICAgICAgICAgQGFkZFBhbmUgcCBmb3IgcCBpbiBvcHQucGFuZXNcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgIFxuICAgIFxuICAgIGFkZFBhbmU6IChwKSAtPlxuXG4gICAgICAgIG5ld1BhbmUgPSBuZXcgUGFuZSBfLmRlZmF1bHRzIHAsIFxuICAgICAgICAgICAgZmxleDogICBAIFxuICAgICAgICAgICAgaW5kZXg6ICBAcGFuZXMubGVuZ3RoXG4gICAgICAgICAgICBcbiAgICAgICAgaWYgbGFzdFBhbmUgPSBfLmxhc3QgQHBhbmVzXG4gICAgICAgICAgICBAaGFuZGxlcy5wdXNoIG5ldyBIYW5kbGVcbiAgICAgICAgICAgICAgICBmbGV4OiAgQFxuICAgICAgICAgICAgICAgIGluZGV4OiBsYXN0UGFuZS5pbmRleFxuICAgICAgICAgICAgICAgIHBhbmVhOiBsYXN0UGFuZVxuICAgICAgICAgICAgICAgIHBhbmViOiBuZXdQYW5lXG4gICAgICAgICAgICBcbiAgICAgICAgQHBhbmVzLnB1c2ggbmV3UGFuZVxuICAgICAgICBAcmVsYXgoKVxuXG4gICAgIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICBcbiAgICAjIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAgICAgICAgIFxuICAgIFxuICAgIHBvcFBhbmU6IChvcHQ9e30pIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBvcHQ/LnJlbGF4ID09IGZhbHNlXG4gICAgICAgICAgICBAdW5yZWxheCgpICBcbiAgICAgICAgXG4gICAgICAgIGlmIEBwYW5lcy5sZW5ndGggPiAxXG4gICAgICAgICAgICBAcGFuZXMucG9wKCkuZGVsKClcbiAgICAgICAgICAgIEBoYW5kbGVzLnBvcCgpLmRlbCgpXG4gICAgICAgICAgICBcbiAgICAgICAgaWYgb3B0Py5yZWxheCAhPSBmYWxzZVxuICAgICAgICAgICAgQHJlbGF4KCkgICAgXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGxhc3QoQHBhbmVzKS5zZXRTaXplIGxhc3QoQHBhbmVzKS5hY3R1YWxTaXplKClcblxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAgMDAwIDAwMCAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwMDAwICAgIDAwMDAwICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAgMDAwIDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgIFxuICAgIHJlbGF4OiAtPlxuICAgICAgICBcbiAgICAgICAgQHJlbGF4ZWQgPSB0cnVlXG4gICAgICAgIGZvciBwIGluIEB2aXNpYmxlUGFuZXMoKVxuICAgICAgICAgICAgcC5kaXYuc3R5bGUuZmxleCA9IFwiMSAxIDBcIlxuICAgICAgICAgICAgcC5zaXplID0gMFxuXG4gICAgdW5yZWxheDogLT5cbiAgICAgICAgXG4gICAgICAgIEByZWxheGVkID0gZmFsc2VcbiAgICAgICAgZm9yIHAgaW4gQHZpc2libGVQYW5lcygpXG4gICAgICAgICAgICBwLnNpemUgPSBwLmFjdHVhbFNpemUoKVxuXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwMDAwMDAwICAwMDAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgXG4gICAgXG4gICAgY2FsY3VsYXRlOiAtPlxuXG4gICAgICAgIHZpc1BhbmVzICA9IEBwYW5lcy5maWx0ZXIgKHApIC0+IG5vdCBwLmNvbGxhcHNlZFxuICAgICAgICBmbGV4UGFuZXMgPSB2aXNQYW5lcy5maWx0ZXIgKHApIC0+IG5vdCBwLmZpeGVkXG4gICAgICAgIGF2YWlsICAgICA9IEBzaXplKClcbiAgICAgICAgXG4gICAgICAgIGZvciBoIGluIEBoYW5kbGVzXG4gICAgICAgICAgICBoLnVwZGF0ZSgpIFxuICAgICAgICAgICAgYXZhaWwgLT0gaC5zaXplKCkgaWYgaC5pc1Zpc2libGUoKVxuICAgICAgICAgICAgXG4gICAgICAgIGZvciBwIGluIHZpc1BhbmVzXG4gICAgICAgICAgICBhdmFpbCAtPSBwLnNpemVcbiAgICAgICAgICAgIFxuICAgICAgICBkaWZmID0gYXZhaWwgLyBmbGV4UGFuZXMubGVuZ3RoXG4gICAgICAgIFxuICAgICAgICBmb3IgcCBpbiBmbGV4UGFuZXNcbiAgICAgICAgICAgIHAuc2l6ZSArPSBkaWZmXG4gICAgICAgICAgICBcbiAgICAgICAgZm9yIHAgaW4gdmlzUGFuZXNcbiAgICAgICAgICAgIHAuc2V0U2l6ZSBwLnNpemVcblxuICAgICAgICBAb25QYW5lU2l6ZT8oKVxuICAgIFxuICAgICMgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAgMDAwICAgMDAwMDAwMCAgIFxuICAgICMgMDAwIDAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgICAgICAwICAgICAgMDAwMDAwMDAgIFxuXG4gICAgbW92ZUhhbmRsZTogKG9wdCkgLT4gXG4gICAgICAgIFxuICAgICAgICBoYW5kbGUgPSBAaGFuZGxlc1tvcHQuaW5kZXhdXG4gICAgICAgIEBtb3ZlSGFuZGxlVG9Qb3MgaGFuZGxlLCBvcHQucG9zICAgICAgICBcbiAgICBcbiAgICBtb3ZlSGFuZGxlVG9Qb3M6IChoYW5kbGUsIHBvcykgLT5cbiAgICAgICAgXG4gICAgICAgIHBvcyA9IHBhcnNlSW50IHBvc1xuICAgICAgICBpZiBAcmVsYXhlZCB0aGVuIEB1bnJlbGF4KClcbiAgICAgICAgXG4gICAgICAgIG9mZnNldCA9IHBvcyAtIGhhbmRsZS5hY3R1YWxQb3MoKVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIE1hdGguYWJzKG9mZnNldCkgPCAxXG4gICAgICAgIFxuICAgICAgICBwcmV2ICA9IEBwcmV2QWxsSW52KGhhbmRsZSkgPyBAcHJldlZpc0ZsZXgoaGFuZGxlKSA/IEBwcmV2RmxleCBoYW5kbGVcbiAgICAgICAgbmV4dCAgPSBAbmV4dEFsbEludihoYW5kbGUpID8gQG5leHRWaXNGbGV4KGhhbmRsZSkgPyBAbmV4dEZsZXggaGFuZGxlXG4gICAgICAgIFxuICAgICAgICBkZWxldGUgcHJldi5jb2xsYXBzZWRcbiAgICAgICAgZGVsZXRlIG5leHQuY29sbGFwc2VkXG4gICAgICAgIFxuICAgICAgICBwcmV2U2l6ZSA9IHByZXYuc2l6ZSArIG9mZnNldFxuICAgICAgICBuZXh0U2l6ZSA9IG5leHQuc2l6ZSAtIG9mZnNldFxuICAgICAgICBcbiAgICAgICAgaWYgQHNuYXBGaXJzdD8gYW5kIHByZXZTaXplIDwgQHNuYXBGaXJzdCBhbmQgbm90IEBwcmV2VmlzUGFuZSBwcmV2XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIHByZXZTaXplIDw9IDAgb3Igb2Zmc2V0IDwgQHNuYXBGaXJzdCAjIGNvbGxhcHNlIHBhbmVhXG4gICAgICAgICAgICAgICAgcHJldlNpemUgPSAtMVxuICAgICAgICAgICAgICAgIG5leHRTaXplID0gbmV4dC5zaXplICsgcHJldi5zaXplICsgQGhhbmRsZVNpemVcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgZWxzZSBpZiBwcmV2U2l6ZSA8IDBcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGxlZnRPdmVyID0gLXByZXZTaXplXG4gICAgICAgICAgICBwcmV2SGFuZGxlID0gaGFuZGxlLnByZXYoKVxuICAgICAgICAgICAgd2hpbGUgbGVmdE92ZXIgPiAwIGFuZCBwcmV2SGFuZGxlIGFuZCBwcmV2VmlzRmxleCA9IEBwcmV2VmlzRmxleCBwcmV2SGFuZGxlXG4gICAgICAgICAgICAgICAgZGVkdWN0ID0gTWF0aC5taW4gbGVmdE92ZXIsIHByZXZWaXNGbGV4LnNpemVcbiAgICAgICAgICAgICAgICBsZWZ0T3ZlciAtPSBkZWR1Y3RcbiAgICAgICAgICAgICAgICBwcmV2VmlzRmxleC5zZXRTaXplIHByZXZWaXNGbGV4LnNpemUgLSBkZWR1Y3RcbiAgICAgICAgICAgICAgICBwcmV2SGFuZGxlID0gcHJldkhhbmRsZS5wcmV2KClcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIHByZXZTaXplID0gMFxuICAgICAgICAgICAgbmV4dFNpemUgLT0gbGVmdE92ZXJcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIEBzbmFwTGFzdD8gYW5kIG5leHRTaXplIDwgQHNuYXBMYXN0IGFuZCBub3QgQG5leHRWaXNQYW5lIG5leHRcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgbmV4dFNpemUgPD0gMCBvciAtb2Zmc2V0IDwgQHNuYXBMYXN0ICMgY29sbGFwc2UgcGFuZWJcbiAgICAgICAgICAgICAgICBuZXh0U2l6ZSA9IC0xXG4gICAgICAgICAgICAgICAgcHJldlNpemUgPSBwcmV2LnNpemUgKyBuZXh0LnNpemUgKyBAaGFuZGxlU2l6ZVxuICAgICAgICAgICAgICAgIFxuICAgICAgICBlbHNlIGlmIG5leHRTaXplIDwgMFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgbGVmdE92ZXIgPSAtbmV4dFNpemVcbiAgICAgICAgICAgIG5leHRIYW5kbGUgPSBoYW5kbGUubmV4dCgpXG4gICAgICAgICAgICB3aGlsZSBsZWZ0T3ZlciA+IDAgYW5kIG5leHRIYW5kbGUgYW5kIG5leHRWaXNGbGV4ID0gQG5leHRWaXNGbGV4IG5leHRIYW5kbGVcbiAgICAgICAgICAgICAgICBkZWR1Y3QgPSBNYXRoLm1pbiBsZWZ0T3ZlciwgbmV4dFZpc0ZsZXguc2l6ZVxuICAgICAgICAgICAgICAgIGxlZnRPdmVyIC09IGRlZHVjdFxuICAgICAgICAgICAgICAgIG5leHRWaXNGbGV4LnNldFNpemUgbmV4dFZpc0ZsZXguc2l6ZSAtIGRlZHVjdFxuICAgICAgICAgICAgICAgIG5leHRIYW5kbGUgPSBuZXh0SGFuZGxlLm5leHQoKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgbmV4dFNpemUgPSAwXG4gICAgICAgICAgICBwcmV2U2l6ZSAtPSBsZWZ0T3ZlclxuICAgICAgICBcbiAgICAgICAgcHJldi5zZXRTaXplIHByZXZTaXplXG4gICAgICAgIG5leHQuc2V0U2l6ZSBuZXh0U2l6ZVxuICAgICAgICBAdXBkYXRlKClcbiAgICAgICAgQG9uUGFuZVNpemU/KClcblxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIFxuICAgICMgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgXG4gICAgXG4gICAgcmVzdG9yZVN0YXRlOiAoc3RhdGUpIC0+XG4gICAgICAgIHJldHVybiBpZiBub3Qgc3RhdGU/Lmxlbmd0aFxuICAgICAgICBmb3Igc2kgaW4gWzAuLi5zdGF0ZS5sZW5ndGhdXG4gICAgICAgICAgICBzID0gc3RhdGVbc2ldXG4gICAgICAgICAgICBwYW5lID0gQHBhbmUgc2lcbiAgICAgICAgICAgIGRlbGV0ZSBwYW5lLmNvbGxhcHNlZFxuICAgICAgICAgICAgcGFuZS5jb2xsYXBzZSgpICAgICAgaWYgcy5zaXplIDwgMFxuICAgICAgICAgICAgcGFuZS5zZXRTaXplKHMuc2l6ZSkgaWYgcy5zaXplID49IDBcblxuICAgICAgICBAdXBkYXRlSGFuZGxlcygpXG4gICAgICAgIEBvblBhbmVTaXplPygpXG4gICAgICAgIFxuICAgIGdldFN0YXRlOiAoKSAtPlxuICAgICAgICBzdGF0ZSA9IFtdXG4gICAgICAgIGZvciBwIGluIEBwYW5lc1xuICAgICAgICAgICAgc3RhdGUucHVzaFxuICAgICAgICAgICAgICAgIGlkOiAgIHAuaWRcbiAgICAgICAgICAgICAgICBzaXplOiBwLnNpemVcbiAgICAgICAgICAgICAgICBwb3M6ICBwLnBvcygpXG4gICAgICAgIHN0YXRlXG5cbiAgICAjICAwMDAwMDAwICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAgICAwMDAgICAgMDAwICAgIDAwMDAwMDAgICBcbiAgICAjICAgICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICAgICAgXG4gICAgcmVzaXplZDogICAgICAgLT4gQHVwZGF0ZSgpLmNhbGN1bGF0ZSgpXG5cbiAgICB1cGRhdGU6ICAgICAgICAtPiBAdXBkYXRlUGFuZXMoKS51cGRhdGVIYW5kbGVzKClcbiAgICB1cGRhdGVQYW5lczogICAtPiBwLnVwZGF0ZSgpIGZvciBwIGluIEBwYW5lcyAgIDsgQFxuICAgIHVwZGF0ZUhhbmRsZXM6IC0+IGgudXBkYXRlKCkgZm9yIGggaW4gQGhhbmRsZXMgOyBAXG5cbiAgICAjIGhhbmRsZSBkcmFnIGNhbGxiYWNrc1xuICAgIFxuICAgIGhhbmRsZVN0YXJ0OiAoaGFuZGxlKSAtPiBAb25EcmFnU3RhcnQ/KClcbiAgICBoYW5kbGVEcmFnOiAgKGhhbmRsZSwgZHJhZykgLT5cbiAgICAgICAgQG1vdmVIYW5kbGVUb1BvcyBoYW5kbGUsIGRyYWcucG9zW0BheGlzXSAtIEBwb3MoKSAtIDRcbiAgICAgICAgQG9uRHJhZz8oKVxuICAgIGhhbmRsZUVuZDogKCkgLT5cbiAgICAgICAgQHVwZGF0ZSgpXG4gICAgICAgIEBvbkRyYWdFbmQ/KClcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgIDAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMDAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgbnVtUGFuZXM6ICAgICAgICAtPiBAcGFuZXMubGVuZ3RoXG4gICAgdmlzaWJsZVBhbmVzOiAgICAtPiBAcGFuZXMuZmlsdGVyIChwKSAtPiBwLmlzVmlzaWJsZSgpXG4gICAgcGFuZVBvc2l0aW9uczogICAtPiAoIHAucG9zKCkgZm9yIHAgaW4gQHBhbmVzIClcbiAgICBwYW5lU2l6ZXM6ICAgICAgIC0+ICggcC5zaXplIGZvciBwIGluIEBwYW5lcyApXG4gICAgc2l6ZU9mUGFuZTogIChpKSAtPiBAcGFuZShpKS5zaXplXG4gICAgcG9zT2ZQYW5lOiAgIChpKSAtPiBAcGFuZShpKS5wb3MoKVxuICAgIHBvc09mSGFuZGxlOiAoaSkgLT4gQGhhbmRsZShpKS5wb3MoKVxuICAgIHBhbmU6ICAgICAgICAoaSkgLT4gXy5pc051bWJlcihpKSBhbmQgQHBhbmVzW2ldICAgb3IgXy5pc1N0cmluZyhpKSBhbmQgXy5maW5kKEBwYW5lcywgKHApIC0+IHAuaWQgPT0gaSkgb3IgaVxuICAgIGhhbmRsZTogICAgICAoaSkgLT4gXy5pc051bWJlcihpKSBhbmQgQGhhbmRsZXNbaV0gb3IgaVxuXG4gICAgaGVpZ2h0OiAtPiBAdmlldy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5oZWlnaHRcbiAgICBzaXplOiAgIC0+IEB2aWV3LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpW0BkaW1lbnNpb25dXG4gICAgcG9zOiAgICAtPiBAdmlldy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVtAcG9zaXRpb25dXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgICAwMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMDAwMDAgICAwMDAwMDAwMCAgXG4gICAgXG4gICAgaXNDb2xsYXBzZWQ6IChpKSAtPiBAcGFuZShpKS5jb2xsYXBzZWRcbiAgICBcbiAgICBjb2xsYXBzZTogKGkpIC0+IFxuICAgICAgICBcbiAgICAgICAgaWYgcGFuZSA9IEBwYW5lIGlcbiAgICAgICAgICAgIGlmIG5vdCBwYW5lLmNvbGxhcHNlZFxuICAgICAgICAgICAgICAgIHBhbmUuY29sbGFwc2UoKVxuICAgICAgICAgICAgICAgIEBjYWxjdWxhdGUoKVxuICAgICAgICBcbiAgICBleHBhbmQ6IChpLCBmYWN0b3I9MC41KSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgcGFuZSA9IEBwYW5lIGlcbiAgICAgICAgICAgIGlmIHBhbmUuY29sbGFwc2VkXG4gICAgICAgICAgICAgICAgcGFuZS5leHBhbmQoKVxuICAgICAgICAgICAgICAgIGlmIGZsZXggPSBAY2xvc2VzdFZpc0ZsZXggcGFuZVxuICAgICAgICAgICAgICAgICAgICB1c2UgPSBwYW5lLmZpeGVkID8gZmxleC5zaXplICogZmFjdG9yXG4gICAgICAgICAgICAgICAgICAgIGZsZXguc2l6ZSAtPSB1c2VcbiAgICAgICAgICAgICAgICAgICAgcGFuZS5zaXplID0gdXNlXG4gICAgICAgICAgICAgICAgQGNhbGN1bGF0ZSgpXG5cbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgICAwMDAgMDAwICAgXG4gICAgIyAgMDAwIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMCAgICAwMDAgICAgICAwMDAwMDAwICAgICAwMDAwMCAgICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAgMDAwIDAwMCAgIFxuICAgICMgICAgIDAgICAgICAwMDAgIDAwMDAwMDAgICAwMDAgICAgICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgbmV4dFZpc1BhbmU6IChwKSAtPlxuICAgICAgICBwaSA9IEBwYW5lcy5pbmRleE9mIHBcbiAgICAgICAgcmV0dXJuIG51bGwgaWYgcGkgPj0gQHBhbmVzLmxlbmd0aC0xXG4gICAgICAgIG5leHQgPSBAcGFuZXNbcGkrMV1cbiAgICAgICAgcmV0dXJuIG5leHQgaWYgbmV4dC5pc1Zpc2libGUoKVxuICAgICAgICBAbmV4dFZpc1BhbmUgbmV4dFxuICAgICAgICBcbiAgICBwcmV2VmlzUGFuZTogKHApIC0+XG4gICAgICAgIHBpID0gQHBhbmVzLmluZGV4T2YgcFxuICAgICAgICByZXR1cm4gbnVsbCBpZiBwaSA8PSAwXG4gICAgICAgIHByZXYgPSBAcGFuZXNbcGktMV1cbiAgICAgICAgcmV0dXJuIHByZXYgaWYgcHJldi5pc1Zpc2libGUoKVxuICAgICAgICBAcHJldlZpc1BhbmUgcHJldlxuXG4gICAgY2xvc2VzdFZpc0ZsZXg6IChwKSAtPlxuICAgICAgICBkID0gMVxuICAgICAgICBwaSA9IEBwYW5lcy5pbmRleE9mIHBcbiAgICAgICAgXG4gICAgICAgIGlzVmlzRmxleFBhbmUgPSAoaSkgPT5cbiAgICAgICAgICAgIGlmIGkgPj0gMCBhbmQgaSA8IEBwYW5lcy5sZW5ndGhcbiAgICAgICAgICAgICAgICBpZiBub3QgQHBhbmVzW2ldLmNvbGxhcHNlZCBhbmQgbm90IEBwYW5lc1tpXS5maXhlZFxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZSBcbiAgICAgICAgICAgIFxuICAgICAgICB3aGlsZSBkIDwgQHBhbmVzLmxlbmd0aC0xXG4gICAgICAgICAgICBpZiBpc1Zpc0ZsZXhQYW5lIHBpICsgZFxuICAgICAgICAgICAgICAgIHJldHVybiBAcGFuZXNbcGkgKyBkXVxuICAgICAgICAgICAgZWxzZSBpZiBpc1Zpc0ZsZXhQYW5lIHBpIC0gZFxuICAgICAgICAgICAgICAgIHJldHVybiBAcGFuZXNbcGkgLSBkXVxuICAgICAgICAgICAgZCsrXG5cbiAgICB0cmF2UHJldjogKGgsIGYpIC0+IGYoaCkgYW5kIGgucGFuZWEgb3IgaC5pbmRleCA+IDAgYW5kIEB0cmF2UHJldihAaGFuZGxlc1toLmluZGV4LTFdLCBmKSBvciBudWxsICAgIFxuICAgIHRyYXZOZXh0OiAoaCwgZikgLT4gZihoKSBhbmQgaC5wYW5lYiBvciBoLmluZGV4IDwgQGhhbmRsZXMubGVuZ3RoLTEgYW5kIEB0cmF2TmV4dChAaGFuZGxlc1toLmluZGV4KzFdLCBmKSBvciBudWxsXG4gICAgcHJldlZpc0ZsZXg6IChoKSAtPiBAdHJhdlByZXYgaCwgKHYpIC0+IG5vdCB2LnBhbmVhLmNvbGxhcHNlZCBhbmQgbm90IHYucGFuZWEuZml4ZWRcbiAgICBuZXh0VmlzRmxleDogKGgpIC0+IEB0cmF2TmV4dCBoLCAodikgLT4gbm90IHYucGFuZWIuY29sbGFwc2VkIGFuZCBub3Qgdi5wYW5lYi5maXhlZCBcbiAgICBwcmV2RmxleDogICAgKGgpIC0+IEB0cmF2UHJldiBoLCAodikgLT4gbm90IHYucGFuZWEuZml4ZWRcbiAgICBuZXh0RmxleDogICAgKGgpIC0+IEB0cmF2TmV4dCBoLCAodikgLT4gbm90IHYucGFuZWIuZml4ZWQgXG4gICAgcHJldlZpczogICAgIChoKSAtPiBAdHJhdlByZXYgaCwgKHYpIC0+IG5vdCB2LnBhbmVhLmNvbGxhcHNlZCBcbiAgICBuZXh0VmlzOiAgICAgKGgpIC0+IEB0cmF2TmV4dCBoLCAodikgLT4gbm90IHYucGFuZWIuY29sbGFwc2VkIFxuICAgIHByZXZBbGxJbnY6ICAoaCkgLT4gcCA9IG5vdCBAcHJldlZpcyhoKSBhbmQgaC5wYW5lYSBvciBudWxsOyBwPy5leHBhbmQoKTsgcFxuICAgIG5leHRBbGxJbnY6ICAoaCkgLT4gcCA9IG5vdCBAbmV4dFZpcyhoKSBhbmQgaC5wYW5lYiBvciBudWxsOyBwPy5leHBhbmQoKTsgcFxuICAgICAgICBcbm1vZHVsZS5leHBvcnRzID0gRmxleFxuIl19
//# sourceURL=../../../coffee/win/flex/flex.coffee