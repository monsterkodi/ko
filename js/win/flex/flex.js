// koffee 1.11.0

/*
00000000  000      00000000  000   000  
000       000      000        000 000   
000000    000      0000000     00000    
000       000      000        000 000   
000       0000000  00000000  000   000
 */
var Flex, Handle, Pane, _, drag, last, ref, valid;

ref = require('kxk'), valid = ref.valid, last = ref.last, drag = ref.drag, _ = ref._;

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmxleC5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi8uLi9jb2ZmZWUvd2luL2ZsZXgiLCJzb3VyY2VzIjpbImZsZXguY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBOztBQVFBLE1BQTJCLE9BQUEsQ0FBUSxLQUFSLENBQTNCLEVBQUUsaUJBQUYsRUFBUyxlQUFULEVBQWUsZUFBZixFQUFxQjs7QUFFckIsSUFBQSxHQUFTLE9BQUEsQ0FBUSxRQUFSOztBQUNULE1BQUEsR0FBUyxPQUFBLENBQVEsVUFBUjs7QUFFSDtJQUVDLGNBQUMsR0FBRDtBQUVDLFlBQUE7UUFBQSxJQUFDLENBQUEsVUFBRCw0Q0FBZ0M7UUFDaEMsSUFBQyxDQUFBLFNBQUQsMkNBQStCO1FBQy9CLElBQUMsQ0FBQSxTQUFELEdBQWUsR0FBRyxDQUFDO1FBQ25CLElBQUMsQ0FBQSxRQUFELEdBQWUsR0FBRyxDQUFDO1FBQ25CLElBQUMsQ0FBQSxVQUFELEdBQWUsR0FBRyxDQUFDO1FBQ25CLElBQUMsQ0FBQSxXQUFELEdBQWUsR0FBRyxDQUFDO1FBQ25CLElBQUMsQ0FBQSxNQUFELEdBQWUsR0FBRyxDQUFDO1FBQ25CLElBQUMsQ0FBQSxTQUFELEdBQWUsR0FBRyxDQUFDO1FBRW5CLElBQUEsR0FBZSxJQUFDLENBQUEsU0FBRCxLQUFjO1FBQzdCLElBQUMsQ0FBQSxTQUFELEdBQWUsSUFBQSxJQUFTLE9BQVQsSUFBb0I7UUFDbkMsSUFBQyxDQUFBLFNBQUQsR0FBZSxJQUFBLElBQVMsYUFBVCxJQUEwQjtRQUN6QyxJQUFDLENBQUEsSUFBRCxHQUFlLElBQUEsSUFBUyxHQUFULElBQWdCO1FBQy9CLElBQUMsQ0FBQSxRQUFELEdBQWUsSUFBQSxJQUFTLE1BQVQsSUFBbUI7UUFDbEMsSUFBQyxDQUFBLFdBQUQsR0FBZSxJQUFBLElBQVMsc0NBQVQsSUFBbUQ7UUFDbEUsSUFBQyxDQUFBLFFBQUQsR0FBZSxJQUFBLElBQVMsYUFBVCxJQUEwQjtRQUN6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LFNBQUMsQ0FBRDtBQUFPLFlBQUE7UUFBQSxDQUFBLEdBQUksQ0FBSSxJQUFDLENBQUEsT0FBRCxDQUFTLENBQVQsQ0FBSixJQUFvQixDQUFDLENBQUMsS0FBdEIsSUFBK0I7O1lBQU0sQ0FBQyxDQUFFLE1BQUgsQ0FBQTs7ZUFBYTtJQUE3RDs7Ozs7O0FBRWpCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAwMDAwMCAgMDAwICAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4wMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgICAwMDAgMDAwICAgXG4wMDAwMDAgICAgMDAwICAgICAgMDAwMDAwMCAgICAgMDAwMDAgICAgXG4wMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgICAwMDAgMDAwICAgXG4wMDAgICAgICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4jIyNcblxueyB2YWxpZCwgbGFzdCwgZHJhZywgXyB9ID0gcmVxdWlyZSAna3hrJ1xuXG5QYW5lICAgPSByZXF1aXJlICcuL3BhbmUnXG5IYW5kbGUgPSByZXF1aXJlICcuL2hhbmRsZSdcblxuY2xhc3MgRmxleCBcbiAgICBcbiAgICBAOiAob3B0KSAtPlxuICAgICAgICBcbiAgICAgICAgQGhhbmRsZVNpemUgID0gb3B0LmhhbmRsZVNpemUgPyA2XG4gICAgICAgIEBkaXJlY3Rpb24gICA9IG9wdC5kaXJlY3Rpb24gPyAnaG9yaXpvbnRhbCdcbiAgICAgICAgQHNuYXBGaXJzdCAgID0gb3B0LnNuYXBGaXJzdFxuICAgICAgICBAc25hcExhc3QgICAgPSBvcHQuc25hcExhc3RcbiAgICAgICAgQG9uUGFuZVNpemUgID0gb3B0Lm9uUGFuZVNpemVcbiAgICAgICAgQG9uRHJhZ1N0YXJ0ID0gb3B0Lm9uRHJhZ1N0YXJ0XG4gICAgICAgIEBvbkRyYWcgICAgICA9IG9wdC5vbkRyYWdcbiAgICAgICAgQG9uRHJhZ0VuZCAgID0gb3B0Lm9uRHJhZ0VuZFxuICAgIFxuICAgICAgICBob3J6ICAgICAgICAgPSBAZGlyZWN0aW9uID09ICdob3Jpem9udGFsJ1xuICAgICAgICBAZGltZW5zaW9uICAgPSBob3J6IGFuZCAnd2lkdGgnIG9yICdoZWlnaHQnXG4gICAgICAgIEBjbGllbnREaW0gICA9IGhvcnogYW5kICdjbGllbnRXaWR0aCcgb3IgJ2NsaWVudEhlaWdodCdcbiAgICAgICAgQGF4aXMgICAgICAgID0gaG9yeiBhbmQgJ3gnIG9yICd5J1xuICAgICAgICBAcG9zaXRpb24gICAgPSBob3J6IGFuZCAnbGVmdCcgb3IgJ3RvcCdcbiAgICAgICAgQGhhbmRsZUNsYXNzID0gaG9yeiBhbmQgJ3NwbGl0LWhhbmRsZSBzcGxpdC1oYW5kbGUtaG9yaXpvbnRhbCcgb3IgJ3NwbGl0LWhhbmRsZSBzcGxpdC1oYW5kbGUtdmVydGljYWwnXG4gICAgICAgIEBwYWRkaW5nQSAgICA9IGhvcnogYW5kICdwYWRkaW5nTGVmdCcgb3IgJ3BhZGRpbmdUb3AnXG4gICAgICAgIEBwYWRkaW5nQiAgICA9IGhvcnogYW5kICdwYWRkaW5nUmlnaHQnIG9yICdwYWRkaW5nQm90dG9tJ1xuICAgICAgICBAY3Vyc29yICAgICAgPSBvcHQuY3Vyc29yID8gaG9yeiBhbmQgJ2V3LXJlc2l6ZScgb3IgJ25zLXJlc2l6ZSdcbiAgICAgICAgXG4gICAgICAgIEBwYW5lcyAgID0gW11cbiAgICAgICAgQGhhbmRsZXMgPSBbXVxuXG4gICAgICAgIEB2aWV3ID0gb3B0LnZpZXcgPyBvcHQucGFuZXNbMF0uZGl2LnBhcmVudE5vZGVcbiAgICAgICAgQHZpZXcuc3R5bGUuZGlzcGxheSA9ICdmbGV4J1xuICAgICAgICBAdmlldy5zdHlsZS5mbGV4RGlyZWN0aW9uID0gaG9yeiBhbmQgJ3Jvdycgb3IgJ2NvbHVtbidcbiAgICAgICAgXG4gICAgICAgIGlmIHZhbGlkIG9wdC5wYW5lc1xuICAgICAgICAgICAgQGFkZFBhbmUgcCBmb3IgcCBpbiBvcHQucGFuZXNcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgIFxuICAgIFxuICAgIGFkZFBhbmU6IChwKSAtPlxuXG4gICAgICAgIG5ld1BhbmUgPSBuZXcgUGFuZSBfLmRlZmF1bHRzIHAsIFxuICAgICAgICAgICAgZmxleDogICBAIFxuICAgICAgICAgICAgaW5kZXg6ICBAcGFuZXMubGVuZ3RoXG4gICAgICAgICAgICBcbiAgICAgICAgaWYgbGFzdFBhbmUgPSBfLmxhc3QgQHBhbmVzXG4gICAgICAgICAgICBAaGFuZGxlcy5wdXNoIG5ldyBIYW5kbGVcbiAgICAgICAgICAgICAgICBmbGV4OiAgQFxuICAgICAgICAgICAgICAgIGluZGV4OiBsYXN0UGFuZS5pbmRleFxuICAgICAgICAgICAgICAgIHBhbmVhOiBsYXN0UGFuZVxuICAgICAgICAgICAgICAgIHBhbmViOiBuZXdQYW5lXG4gICAgICAgICAgICBcbiAgICAgICAgQHBhbmVzLnB1c2ggbmV3UGFuZVxuICAgICAgICBAcmVsYXgoKVxuXG4gICAgIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICBcbiAgICAjIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAgICAgICAgIFxuICAgIFxuICAgIHBvcFBhbmU6IChvcHQ9e30pIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBvcHQ/LnJlbGF4ID09IGZhbHNlXG4gICAgICAgICAgICBAdW5yZWxheCgpICBcbiAgICAgICAgXG4gICAgICAgIGlmIEBwYW5lcy5sZW5ndGggPiAxXG4gICAgICAgICAgICBAcGFuZXMucG9wKCkuZGVsKClcbiAgICAgICAgICAgIEBoYW5kbGVzLnBvcCgpLmRlbCgpXG4gICAgICAgICAgICBcbiAgICAgICAgaWYgb3B0Py5yZWxheCAhPSBmYWxzZVxuICAgICAgICAgICAgQHJlbGF4KCkgICAgXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGxhc3QoQHBhbmVzKS5zZXRTaXplIGxhc3QoQHBhbmVzKS5hY3R1YWxTaXplKClcblxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAgMDAwIDAwMCAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwMDAwICAgIDAwMDAwICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAgMDAwIDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgIFxuICAgIHJlbGF4OiAtPlxuICAgICAgICBcbiAgICAgICAgQHJlbGF4ZWQgPSB0cnVlXG4gICAgICAgIGZvciBwIGluIEB2aXNpYmxlUGFuZXMoKVxuICAgICAgICAgICAgcC5kaXYuc3R5bGUuZmxleCA9IFwiMSAxIDBcIlxuICAgICAgICAgICAgcC5zaXplID0gMFxuXG4gICAgdW5yZWxheDogLT5cbiAgICAgICAgXG4gICAgICAgIEByZWxheGVkID0gZmFsc2VcbiAgICAgICAgZm9yIHAgaW4gQHZpc2libGVQYW5lcygpXG4gICAgICAgICAgICBwLnNpemUgPSBwLmFjdHVhbFNpemUoKVxuXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwMDAwMDAwICAwMDAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgXG4gICAgXG4gICAgY2FsY3VsYXRlOiAtPlxuXG4gICAgICAgIHZpc1BhbmVzICA9IEBwYW5lcy5maWx0ZXIgKHApIC0+IG5vdCBwLmNvbGxhcHNlZFxuICAgICAgICBmbGV4UGFuZXMgPSB2aXNQYW5lcy5maWx0ZXIgKHApIC0+IG5vdCBwLmZpeGVkXG4gICAgICAgIGF2YWlsICAgICA9IEBzaXplKClcbiAgICAgICAgXG4gICAgICAgIGZvciBoIGluIEBoYW5kbGVzXG4gICAgICAgICAgICBoLnVwZGF0ZSgpIFxuICAgICAgICAgICAgYXZhaWwgLT0gaC5zaXplKCkgaWYgaC5pc1Zpc2libGUoKVxuICAgICAgICAgICAgXG4gICAgICAgIGZvciBwIGluIHZpc1BhbmVzXG4gICAgICAgICAgICBhdmFpbCAtPSBwLnNpemVcbiAgICAgICAgICAgIFxuICAgICAgICBkaWZmID0gYXZhaWwgLyBmbGV4UGFuZXMubGVuZ3RoXG4gICAgICAgIFxuICAgICAgICBmb3IgcCBpbiBmbGV4UGFuZXNcbiAgICAgICAgICAgIHAuc2l6ZSArPSBkaWZmXG4gICAgICAgICAgICBcbiAgICAgICAgZm9yIHAgaW4gdmlzUGFuZXNcbiAgICAgICAgICAgIHAuc2V0U2l6ZSBwLnNpemVcblxuICAgICAgICBAb25QYW5lU2l6ZT8oKVxuICAgIFxuICAgICMgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAgMDAwICAgMDAwMDAwMCAgIFxuICAgICMgMDAwIDAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgICAgICAwICAgICAgMDAwMDAwMDAgIFxuXG4gICAgbW92ZUhhbmRsZTogKG9wdCkgLT4gXG4gICAgICAgIFxuICAgICAgICBoYW5kbGUgPSBAaGFuZGxlc1tvcHQuaW5kZXhdXG4gICAgICAgIEBtb3ZlSGFuZGxlVG9Qb3MgaGFuZGxlLCBvcHQucG9zICAgICAgICBcbiAgICBcbiAgICBtb3ZlSGFuZGxlVG9Qb3M6IChoYW5kbGUsIHBvcykgLT5cbiAgICAgICAgXG4gICAgICAgIHBvcyA9IHBhcnNlSW50IHBvc1xuICAgICAgICBpZiBAcmVsYXhlZCB0aGVuIEB1bnJlbGF4KClcbiAgICAgICAgXG4gICAgICAgIG9mZnNldCA9IHBvcyAtIGhhbmRsZS5hY3R1YWxQb3MoKVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIE1hdGguYWJzKG9mZnNldCkgPCAxXG4gICAgICAgIFxuICAgICAgICBwcmV2ICA9IEBwcmV2QWxsSW52KGhhbmRsZSkgPyBAcHJldlZpc0ZsZXgoaGFuZGxlKSA/IEBwcmV2RmxleCBoYW5kbGVcbiAgICAgICAgbmV4dCAgPSBAbmV4dEFsbEludihoYW5kbGUpID8gQG5leHRWaXNGbGV4KGhhbmRsZSkgPyBAbmV4dEZsZXggaGFuZGxlXG4gICAgICAgIFxuICAgICAgICBkZWxldGUgcHJldi5jb2xsYXBzZWRcbiAgICAgICAgZGVsZXRlIG5leHQuY29sbGFwc2VkXG4gICAgICAgIFxuICAgICAgICBwcmV2U2l6ZSA9IHByZXYuc2l6ZSArIG9mZnNldFxuICAgICAgICBuZXh0U2l6ZSA9IG5leHQuc2l6ZSAtIG9mZnNldFxuICAgICAgICBcbiAgICAgICAgaWYgQHNuYXBGaXJzdD8gYW5kIHByZXZTaXplIDwgQHNuYXBGaXJzdCBhbmQgbm90IEBwcmV2VmlzUGFuZSBwcmV2XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIHByZXZTaXplIDw9IDAgb3Igb2Zmc2V0IDwgQHNuYXBGaXJzdCAjIGNvbGxhcHNlIHBhbmVhXG4gICAgICAgICAgICAgICAgcHJldlNpemUgPSAtMVxuICAgICAgICAgICAgICAgIG5leHRTaXplID0gbmV4dC5zaXplICsgcHJldi5zaXplICsgQGhhbmRsZVNpemVcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgZWxzZSBpZiBwcmV2U2l6ZSA8IDBcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGxlZnRPdmVyID0gLXByZXZTaXplXG4gICAgICAgICAgICBwcmV2SGFuZGxlID0gaGFuZGxlLnByZXYoKVxuICAgICAgICAgICAgd2hpbGUgbGVmdE92ZXIgPiAwIGFuZCBwcmV2SGFuZGxlIGFuZCBwcmV2VmlzRmxleCA9IEBwcmV2VmlzRmxleCBwcmV2SGFuZGxlXG4gICAgICAgICAgICAgICAgZGVkdWN0ID0gTWF0aC5taW4gbGVmdE92ZXIsIHByZXZWaXNGbGV4LnNpemVcbiAgICAgICAgICAgICAgICBsZWZ0T3ZlciAtPSBkZWR1Y3RcbiAgICAgICAgICAgICAgICBwcmV2VmlzRmxleC5zZXRTaXplIHByZXZWaXNGbGV4LnNpemUgLSBkZWR1Y3RcbiAgICAgICAgICAgICAgICBwcmV2SGFuZGxlID0gcHJldkhhbmRsZS5wcmV2KClcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIHByZXZTaXplID0gMFxuICAgICAgICAgICAgbmV4dFNpemUgLT0gbGVmdE92ZXJcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIEBzbmFwTGFzdD8gYW5kIG5leHRTaXplIDwgQHNuYXBMYXN0IGFuZCBub3QgQG5leHRWaXNQYW5lIG5leHRcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgbmV4dFNpemUgPD0gMCBvciAtb2Zmc2V0IDwgQHNuYXBMYXN0ICMgY29sbGFwc2UgcGFuZWJcbiAgICAgICAgICAgICAgICBuZXh0U2l6ZSA9IC0xXG4gICAgICAgICAgICAgICAgcHJldlNpemUgPSBwcmV2LnNpemUgKyBuZXh0LnNpemUgKyBAaGFuZGxlU2l6ZVxuICAgICAgICAgICAgICAgIFxuICAgICAgICBlbHNlIGlmIG5leHRTaXplIDwgMFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgbGVmdE92ZXIgPSAtbmV4dFNpemVcbiAgICAgICAgICAgIG5leHRIYW5kbGUgPSBoYW5kbGUubmV4dCgpXG4gICAgICAgICAgICB3aGlsZSBsZWZ0T3ZlciA+IDAgYW5kIG5leHRIYW5kbGUgYW5kIG5leHRWaXNGbGV4ID0gQG5leHRWaXNGbGV4IG5leHRIYW5kbGVcbiAgICAgICAgICAgICAgICBkZWR1Y3QgPSBNYXRoLm1pbiBsZWZ0T3ZlciwgbmV4dFZpc0ZsZXguc2l6ZVxuICAgICAgICAgICAgICAgIGxlZnRPdmVyIC09IGRlZHVjdFxuICAgICAgICAgICAgICAgIG5leHRWaXNGbGV4LnNldFNpemUgbmV4dFZpc0ZsZXguc2l6ZSAtIGRlZHVjdFxuICAgICAgICAgICAgICAgIG5leHRIYW5kbGUgPSBuZXh0SGFuZGxlLm5leHQoKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgbmV4dFNpemUgPSAwXG4gICAgICAgICAgICBwcmV2U2l6ZSAtPSBsZWZ0T3ZlclxuICAgICAgICBcbiAgICAgICAgcHJldi5zZXRTaXplIHByZXZTaXplXG4gICAgICAgIG5leHQuc2V0U2l6ZSBuZXh0U2l6ZVxuICAgICAgICBAdXBkYXRlKClcbiAgICAgICAgQG9uUGFuZVNpemU/KClcblxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIFxuICAgICMgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgXG4gICAgXG4gICAgcmVzdG9yZVN0YXRlOiAoc3RhdGUpIC0+XG4gICAgICAgIHJldHVybiBpZiBub3Qgc3RhdGU/Lmxlbmd0aFxuICAgICAgICBmb3Igc2kgaW4gWzAuLi5zdGF0ZS5sZW5ndGhdXG4gICAgICAgICAgICBzID0gc3RhdGVbc2ldXG4gICAgICAgICAgICBwYW5lID0gQHBhbmUgc2lcbiAgICAgICAgICAgIGRlbGV0ZSBwYW5lLmNvbGxhcHNlZFxuICAgICAgICAgICAgcGFuZS5jb2xsYXBzZSgpICAgICAgaWYgcy5zaXplIDwgMFxuICAgICAgICAgICAgcGFuZS5zZXRTaXplKHMuc2l6ZSkgaWYgcy5zaXplID49IDBcblxuICAgICAgICBAdXBkYXRlSGFuZGxlcygpXG4gICAgICAgIEBvblBhbmVTaXplPygpXG4gICAgICAgIFxuICAgIGdldFN0YXRlOiAoKSAtPlxuICAgICAgICBzdGF0ZSA9IFtdXG4gICAgICAgIGZvciBwIGluIEBwYW5lc1xuICAgICAgICAgICAgc3RhdGUucHVzaFxuICAgICAgICAgICAgICAgIGlkOiAgIHAuaWRcbiAgICAgICAgICAgICAgICBzaXplOiBwLnNpemVcbiAgICAgICAgICAgICAgICBwb3M6ICBwLnBvcygpXG4gICAgICAgIHN0YXRlXG5cbiAgICAjICAwMDAwMDAwICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAgICAwMDAgICAgMDAwICAgIDAwMDAwMDAgICBcbiAgICAjICAgICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICAgICAgXG4gICAgcmVzaXplZDogICAgICAgLT4gQHVwZGF0ZSgpLmNhbGN1bGF0ZSgpXG5cbiAgICB1cGRhdGU6ICAgICAgICAtPiBAdXBkYXRlUGFuZXMoKS51cGRhdGVIYW5kbGVzKClcbiAgICB1cGRhdGVQYW5lczogICAtPiBwLnVwZGF0ZSgpIGZvciBwIGluIEBwYW5lcyAgIDsgQFxuICAgIHVwZGF0ZUhhbmRsZXM6IC0+IGgudXBkYXRlKCkgZm9yIGggaW4gQGhhbmRsZXMgOyBAXG5cbiAgICAjIGhhbmRsZSBkcmFnIGNhbGxiYWNrc1xuICAgIFxuICAgIGhhbmRsZVN0YXJ0OiAoaGFuZGxlKSAtPiBAb25EcmFnU3RhcnQ/KClcbiAgICBoYW5kbGVEcmFnOiAgKGhhbmRsZSwgZHJhZykgLT5cbiAgICAgICAgQG1vdmVIYW5kbGVUb1BvcyBoYW5kbGUsIGRyYWcucG9zW0BheGlzXSAtIEBwb3MoKSAtIDRcbiAgICAgICAgQG9uRHJhZz8oKVxuICAgIGhhbmRsZUVuZDogKCkgLT5cbiAgICAgICAgQHVwZGF0ZSgpXG4gICAgICAgIEBvbkRyYWdFbmQ/KClcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgIDAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMDAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgbnVtUGFuZXM6ICAgICAgICAtPiBAcGFuZXMubGVuZ3RoXG4gICAgdmlzaWJsZVBhbmVzOiAgICAtPiBAcGFuZXMuZmlsdGVyIChwKSAtPiBwLmlzVmlzaWJsZSgpXG4gICAgcGFuZVBvc2l0aW9uczogICAtPiAoIHAucG9zKCkgZm9yIHAgaW4gQHBhbmVzIClcbiAgICBwYW5lU2l6ZXM6ICAgICAgIC0+ICggcC5zaXplIGZvciBwIGluIEBwYW5lcyApXG4gICAgc2l6ZU9mUGFuZTogIChpKSAtPiBAcGFuZShpKS5zaXplXG4gICAgcG9zT2ZQYW5lOiAgIChpKSAtPiBAcGFuZShpKS5wb3MoKVxuICAgIHBvc09mSGFuZGxlOiAoaSkgLT4gQGhhbmRsZShpKS5wb3MoKVxuICAgIHBhbmU6ICAgICAgICAoaSkgLT4gXy5pc051bWJlcihpKSBhbmQgQHBhbmVzW2ldICAgb3IgXy5pc1N0cmluZyhpKSBhbmQgXy5maW5kKEBwYW5lcywgKHApIC0+IHAuaWQgPT0gaSkgb3IgaVxuICAgIGhhbmRsZTogICAgICAoaSkgLT4gXy5pc051bWJlcihpKSBhbmQgQGhhbmRsZXNbaV0gb3IgaVxuXG4gICAgaGVpZ2h0OiAtPiBAdmlldy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5oZWlnaHRcbiAgICBzaXplOiAgIC0+IEB2aWV3LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpW0BkaW1lbnNpb25dXG4gICAgcG9zOiAgICAtPiBAdmlldy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVtAcG9zaXRpb25dXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgICAwMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMDAwMDAgICAwMDAwMDAwMCAgXG4gICAgXG4gICAgaXNDb2xsYXBzZWQ6IChpKSAtPiBAcGFuZShpKS5jb2xsYXBzZWRcbiAgICBcbiAgICBjb2xsYXBzZTogKGkpIC0+IFxuICAgICAgICBcbiAgICAgICAgaWYgcGFuZSA9IEBwYW5lIGlcbiAgICAgICAgICAgIGlmIG5vdCBwYW5lLmNvbGxhcHNlZFxuICAgICAgICAgICAgICAgIHBhbmUuY29sbGFwc2UoKVxuICAgICAgICAgICAgICAgIEBjYWxjdWxhdGUoKVxuICAgICAgICBcbiAgICBleHBhbmQ6IChpLCBmYWN0b3I9MC41KSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgcGFuZSA9IEBwYW5lIGlcbiAgICAgICAgICAgIGlmIHBhbmUuY29sbGFwc2VkXG4gICAgICAgICAgICAgICAgcGFuZS5leHBhbmQoKVxuICAgICAgICAgICAgICAgIGlmIGZsZXggPSBAY2xvc2VzdFZpc0ZsZXggcGFuZVxuICAgICAgICAgICAgICAgICAgICB1c2UgPSBwYW5lLmZpeGVkID8gZmxleC5zaXplICogZmFjdG9yXG4gICAgICAgICAgICAgICAgICAgIGZsZXguc2l6ZSAtPSB1c2VcbiAgICAgICAgICAgICAgICAgICAgcGFuZS5zaXplID0gdXNlXG4gICAgICAgICAgICAgICAgQGNhbGN1bGF0ZSgpXG5cbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgICAwMDAgMDAwICAgXG4gICAgIyAgMDAwIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMCAgICAwMDAgICAgICAwMDAwMDAwICAgICAwMDAwMCAgICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAgMDAwIDAwMCAgIFxuICAgICMgICAgIDAgICAgICAwMDAgIDAwMDAwMDAgICAwMDAgICAgICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgbmV4dFZpc1BhbmU6IChwKSAtPlxuICAgICAgICBwaSA9IEBwYW5lcy5pbmRleE9mIHBcbiAgICAgICAgcmV0dXJuIG51bGwgaWYgcGkgPj0gQHBhbmVzLmxlbmd0aC0xXG4gICAgICAgIG5leHQgPSBAcGFuZXNbcGkrMV1cbiAgICAgICAgcmV0dXJuIG5leHQgaWYgbmV4dC5pc1Zpc2libGUoKVxuICAgICAgICBAbmV4dFZpc1BhbmUgbmV4dFxuICAgICAgICBcbiAgICBwcmV2VmlzUGFuZTogKHApIC0+XG4gICAgICAgIHBpID0gQHBhbmVzLmluZGV4T2YgcFxuICAgICAgICByZXR1cm4gbnVsbCBpZiBwaSA8PSAwXG4gICAgICAgIHByZXYgPSBAcGFuZXNbcGktMV1cbiAgICAgICAgcmV0dXJuIHByZXYgaWYgcHJldi5pc1Zpc2libGUoKVxuICAgICAgICBAcHJldlZpc1BhbmUgcHJldlxuXG4gICAgY2xvc2VzdFZpc0ZsZXg6IChwKSAtPlxuICAgICAgICBkID0gMVxuICAgICAgICBwaSA9IEBwYW5lcy5pbmRleE9mIHBcbiAgICAgICAgXG4gICAgICAgIGlzVmlzRmxleFBhbmUgPSAoaSkgPT5cbiAgICAgICAgICAgIGlmIGkgPj0gMCBhbmQgaSA8IEBwYW5lcy5sZW5ndGhcbiAgICAgICAgICAgICAgICBpZiBub3QgQHBhbmVzW2ldLmNvbGxhcHNlZCBhbmQgbm90IEBwYW5lc1tpXS5maXhlZFxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZSBcbiAgICAgICAgICAgIFxuICAgICAgICB3aGlsZSBkIDwgQHBhbmVzLmxlbmd0aC0xXG4gICAgICAgICAgICBpZiBpc1Zpc0ZsZXhQYW5lIHBpICsgZFxuICAgICAgICAgICAgICAgIHJldHVybiBAcGFuZXNbcGkgKyBkXVxuICAgICAgICAgICAgZWxzZSBpZiBpc1Zpc0ZsZXhQYW5lIHBpIC0gZFxuICAgICAgICAgICAgICAgIHJldHVybiBAcGFuZXNbcGkgLSBkXVxuICAgICAgICAgICAgZCsrXG5cbiAgICB0cmF2UHJldjogKGgsIGYpIC0+IGYoaCkgYW5kIGgucGFuZWEgb3IgaC5pbmRleCA+IDAgYW5kIEB0cmF2UHJldihAaGFuZGxlc1toLmluZGV4LTFdLCBmKSBvciBudWxsICAgIFxuICAgIHRyYXZOZXh0OiAoaCwgZikgLT4gZihoKSBhbmQgaC5wYW5lYiBvciBoLmluZGV4IDwgQGhhbmRsZXMubGVuZ3RoLTEgYW5kIEB0cmF2TmV4dChAaGFuZGxlc1toLmluZGV4KzFdLCBmKSBvciBudWxsXG4gICAgcHJldlZpc0ZsZXg6IChoKSAtPiBAdHJhdlByZXYgaCwgKHYpIC0+IG5vdCB2LnBhbmVhLmNvbGxhcHNlZCBhbmQgbm90IHYucGFuZWEuZml4ZWRcbiAgICBuZXh0VmlzRmxleDogKGgpIC0+IEB0cmF2TmV4dCBoLCAodikgLT4gbm90IHYucGFuZWIuY29sbGFwc2VkIGFuZCBub3Qgdi5wYW5lYi5maXhlZCBcbiAgICBwcmV2RmxleDogICAgKGgpIC0+IEB0cmF2UHJldiBoLCAodikgLT4gbm90IHYucGFuZWEuZml4ZWRcbiAgICBuZXh0RmxleDogICAgKGgpIC0+IEB0cmF2TmV4dCBoLCAodikgLT4gbm90IHYucGFuZWIuZml4ZWQgXG4gICAgcHJldlZpczogICAgIChoKSAtPiBAdHJhdlByZXYgaCwgKHYpIC0+IG5vdCB2LnBhbmVhLmNvbGxhcHNlZCBcbiAgICBuZXh0VmlzOiAgICAgKGgpIC0+IEB0cmF2TmV4dCBoLCAodikgLT4gbm90IHYucGFuZWIuY29sbGFwc2VkIFxuICAgIHByZXZBbGxJbnY6ICAoaCkgLT4gcCA9IG5vdCBAcHJldlZpcyhoKSBhbmQgaC5wYW5lYSBvciBudWxsOyBwPy5leHBhbmQoKTsgcFxuICAgIG5leHRBbGxJbnY6ICAoaCkgLT4gcCA9IG5vdCBAbmV4dFZpcyhoKSBhbmQgaC5wYW5lYiBvciBudWxsOyBwPy5leHBhbmQoKTsgcFxuICAgICAgICBcbm1vZHVsZS5leHBvcnRzID0gRmxleFxuIl19
//# sourceURL=../../../coffee/win/flex/flex.coffee