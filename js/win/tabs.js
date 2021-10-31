// koffee 1.14.0

/*
000000000   0000000   0000000     0000000
   000     000   000  000   000  000
   000     000000000  0000000    0000000
   000     000   000  000   000       000
   000     000   000  0000000    0000000
 */
var $, Tab, Tabs, _, drag, elem, empty, filter, first, kerror, klog, kpos, last, popup, post, prefs, ref, slash, stopEvent,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), $ = ref.$, _ = ref._, drag = ref.drag, elem = ref.elem, empty = ref.empty, filter = ref.filter, first = ref.first, kerror = ref.kerror, klog = ref.klog, kpos = ref.kpos, last = ref.last, popup = ref.popup, post = ref.post, prefs = ref.prefs, slash = ref.slash, stopEvent = ref.stopEvent;

Tab = require('./tab');

Tabs = (function() {
    function Tabs(titlebar) {
        this.showContextMenu = bind(this.showContextMenu, this);
        this.onContextMenu = bind(this.onContextMenu, this);
        this.onDirty = bind(this.onDirty, this);
        this.revertFile = bind(this.revertFile, this);
        this.restore = bind(this.restore, this);
        this.stash = bind(this.stash, this);
        this.onNewTabWithFile = bind(this.onNewTabWithFile, this);
        this.onNewEmptyTab = bind(this.onNewEmptyTab, this);
        this.onCloseOtherTabs = bind(this.onCloseOtherTabs, this);
        this.onCloseTabOrWindow = bind(this.onCloseTabOrWindow, this);
        this.onDragStop = bind(this.onDragStop, this);
        this.onDragMove = bind(this.onDragMove, this);
        this.onDragStart = bind(this.onDragStart, this);
        this.onClick = bind(this.onClick, this);
        this.onFileSaved = bind(this.onFileSaved, this);
        this.onFileLineChanges = bind(this.onFileLineChanges, this);
        this.onSendTabs = bind(this.onSendTabs, this);
        this.emptyid = 0;
        this.tabs = [];
        this.div = elem({
            "class": 'tabs'
        });
        titlebar.insertBefore(this.div, $(".minimize"));
        this.div.addEventListener('click', this.onClick);
        this.div.addEventListener('contextmenu', this.onContextMenu);
        this.drag = new drag({
            target: this.div,
            onStart: this.onDragStart,
            onMove: this.onDragMove,
            onStop: this.onDragStop
        });
        post.on('newTabWithFile', this.onNewTabWithFile);
        post.on('newEmptyTab', this.onNewEmptyTab);
        post.on('closeTabOrWindow', this.onCloseTabOrWindow);
        post.on('closeOtherTabs', this.onCloseOtherTabs);
        post.on('stash', this.stash);
        post.on('dirty', this.onDirty);
        post.on('restore', this.restore);
        post.on('revertFile', this.revertFile);
        post.on('sendTabs', this.onSendTabs);
        post.on('fileLineChanges', this.onFileLineChanges);
        post.on('fileSaved', this.onFileSaved);
    }

    Tabs.prototype.onSendTabs = function(winID) {
        var i, len, ref1, t, tab;
        t = '';
        ref1 = this.tabs;
        for (i = 0, len = ref1.length; i < len; i++) {
            tab = ref1[i];
            t += tab.div.innerHTML;
        }
        return post.toWin(winID, 'winTabs', window.winID, t);
    };

    Tabs.prototype.onFileLineChanges = function(file, lineChanges) {
        var tab;
        tab = this.tab(file);
        if ((tab != null) && tab !== this.activeTab()) {
            return tab.foreignChanges(lineChanges);
        }
    };

    Tabs.prototype.onFileSaved = function(file, winID) {
        var tab;
        if (winID === window.winID) {
            return kerror("fileSaved from this window? " + file + " " + winID);
        }
        tab = this.tab(file);
        if ((tab != null) && tab !== this.activeTab()) {
            return tab.revert();
        }
    };

    Tabs.prototype.onClick = function(event) {
        var tab;
        if (tab = this.tab(event.target)) {
            if (event.target.classList.contains('dot')) {
                this.onCloseTabOrWindow(tab);
            } else {
                tab.activate();
            }
        }
        return true;
    };

    Tabs.prototype.onDragStart = function(d, event) {
        var br;
        if (event.target.classList.contains('tab')) {
            return 'skip';
        }
        if (event.target.classList.contains('tabstate')) {
            return 'skip';
        }
        this.dragTab = this.tab(event.target);
        if (empty(this.dragTab)) {
            return 'skip';
        }
        if (event.button !== 0) {
            return 'skip';
        }
        this.dragDiv = this.dragTab.div.cloneNode(true);
        this.dragTab.div.style.opacity = '0';
        br = this.dragTab.div.getBoundingClientRect();
        this.dragDiv.style.position = 'absolute';
        this.dragDiv.style.top = br.top + "px";
        this.dragDiv.style.left = br.left + "px";
        this.dragDiv.style.width = br.width + "px";
        this.dragDiv.style.height = br.height + "px";
        this.dragDiv.style.flex = 'unset';
        this.dragDiv.style.pointerEvents = 'none';
        return document.body.appendChild(this.dragDiv);
    };

    Tabs.prototype.onDragMove = function(d, e) {
        var tab;
        this.dragDiv.style.transform = "translateX(" + d.deltaSum.x + "px)";
        if (tab = this.tabAtX(d.pos.x)) {
            if (tab.index() !== this.dragTab.index()) {
                return this.swap(tab, this.dragTab);
            }
        }
    };

    Tabs.prototype.onDragStop = function(d, e) {
        this.dragTab.div.style.opacity = '';
        return this.dragDiv.remove();
    };

    Tabs.prototype.tab = function(id) {
        if (_.isNumber(id)) {
            return this.tabs[id];
        }
        if (_.isElement(id)) {
            return _.find(this.tabs, function(t) {
                return t.div.contains(id);
            });
        }
        if (_.isString(id)) {
            return _.find(this.tabs, function(t) {
                return t.file === id;
            });
        }
    };

    Tabs.prototype.activeTab = function(create) {
        var tab;
        if (!this.tabs.length && create) {
            tab = this.onNewEmptyTab();
            tab.setActive();
            return tab;
        }
        tab = _.find(this.tabs, function(t) {
            return t.isActive();
        });
        if (!tab && create) {
            tab = first(this.tabs);
            tab.setActive();
        }
        return tab;
    };

    Tabs.prototype.numTabs = function() {
        return this.tabs.length;
    };

    Tabs.prototype.tabAtX = function(x) {
        return _.find(this.tabs, function(t) {
            var br;
            br = t.div.getBoundingClientRect();
            return (br.left <= x && x <= br.left + br.width);
        });
    };

    Tabs.prototype.closeTab = function(tab) {
        _.pull(this.tabs, tab.close());
        if (empty(this.tabs)) {
            this.onNewEmptyTab();
        }
        return this;
    };

    Tabs.prototype.onCloseTabOrWindow = function(tab) {
        if (this.numTabs() <= 1) {
            return post.emit('menuAction', 'close');
        } else {
            if (tab != null) {
                tab;
            } else {
                tab = this.activeTab();
            }
            tab.nextOrPrev().activate();
            this.closeTab(tab);
            return this.update();
        }
    };

    Tabs.prototype.onCloseOtherTabs = function() {
        var clse, i, keep, len, t;
        if (!this.activeTab()) {
            return;
        }
        keep = filter(this.tabs, (function(_this) {
            return function(t) {
                return t.pinned || t === _this.activeTab();
            };
        })(this));
        clse = filter(this.tabs, (function(_this) {
            return function(t) {
                return !t.pinned && t !== _this.activeTab();
            };
        })(this));
        klog('closeOtherTabs', keep.length, close.length);
        for (i = 0, len = clse.length; i < len; i++) {
            t = clse[i];
            this.closeTab(t);
        }
        return this.update();
    };

    Tabs.prototype.addTab = function(file) {
        var i, index, ref1;
        if (this.tabs.length >= prefs.get('maximalNumberOfTabs', 8)) {
            for (index = i = 0, ref1 = this.tabs.length; 0 <= ref1 ? i < ref1 : i > ref1; index = 0 <= ref1 ? ++i : --i) {
                if (!this.tabs[index].dirty && !this.tabs[index].pinned) {
                    this.closeTab(this.tabs[index]);
                    break;
                }
            }
        }
        this.tabs.push(new Tab(this, file));
        return last(this.tabs);
    };

    Tabs.prototype.onNewEmptyTab = function() {
        var tab;
        this.emptyid += 1;
        tab = this.addTab("untitled-" + this.emptyid).activate();
        this.update();
        return tab;
    };

    Tabs.prototype.onNewTabWithFile = function(file) {
        var col, line, ref1, tab;
        console.log('onNewTabWithFile', file);
        ref1 = slash.splitFileLine(file), file = ref1[0], line = ref1[1], col = ref1[2];
        if (tab = this.tab(file)) {
            tab.activate();
        } else {
            this.addTab(file).activate();
        }
        this.update();
        if (line || col) {
            return post.emit('singleCursorAtPos', [col, line - 1]);
        }
    };

    Tabs.prototype.navigate = function(key) {
        var index;
        index = this.activeTab().index();
        index += (function() {
            switch (key) {
                case 'left':
                    return -1;
                case 'right':
                    return +1;
            }
        })();
        index = (this.numTabs() + index) % this.numTabs();
        return this.tabs[index].activate();
    };

    Tabs.prototype.swap = function(ta, tb) {
        var ref1;
        if ((ta == null) || (tb == null)) {
            return;
        }
        if (ta.index() > tb.index()) {
            ref1 = [tb, ta], ta = ref1[0], tb = ref1[1];
        }
        this.tabs[ta.index()] = tb;
        this.tabs[tb.index() + 1] = ta;
        this.div.insertBefore(tb.div, ta.div);
        return this.update();
    };

    Tabs.prototype.move = function(key) {
        var tab;
        tab = this.activeTab();
        switch (key) {
            case 'left':
                return this.swap(tab, tab.prev());
            case 'right':
                return this.swap(tab, tab.next());
        }
    };

    Tabs.prototype.stash = function() {
        var files, pinned, ref1, t;
        files = (function() {
            var i, len, ref1, results;
            ref1 = this.tabs;
            results = [];
            for (i = 0, len = ref1.length; i < len; i++) {
                t = ref1[i];
                results.push(t.file);
            }
            return results;
        }).call(this);
        pinned = (function() {
            var i, len, ref1, results;
            ref1 = this.tabs;
            results = [];
            for (i = 0, len = ref1.length; i < len; i++) {
                t = ref1[i];
                results.push(t.pinned);
            }
            return results;
        }).call(this);
        files = files.filter(function(file) {
            return !file.startsWith('untitled');
        });
        return window.stash.set('tabs', {
            files: files,
            pinned: pinned,
            active: Math.min((ref1 = this.activeTab()) != null ? ref1.index() : void 0, files.length - 1)
        });
    };

    Tabs.prototype.restore = function() {
        var active, files, i, j, len, pi, pinned, ref1, ref2, ref3, results;
        active = window.stash.get('tabs|active', 0);
        files = window.stash.get('tabs|files');
        pinned = window.stash.get('tabs|pinned');
        if (pinned != null) {
            pinned;
        } else {
            pinned = [];
        }
        if (empty(files)) {
            return;
        }
        this.tabs = [];
        while (files.length) {
            this.addTab(files.shift());
        }
        if ((ref1 = this.tabs[active]) != null) {
            ref1.activate();
        }
        ref3 = (function() {
            results = [];
            for (var j = 0, ref2 = pinned.length; 0 <= ref2 ? j < ref2 : j > ref2; 0 <= ref2 ? j++ : j--){ results.push(j); }
            return results;
        }).apply(this);
        for (i = 0, len = ref3.length; i < len; i++) {
            pi = ref3[i];
            if (pinned[pi]) {
                this.tabs[pi].togglePinned();
            }
        }
        return this.update();
    };

    Tabs.prototype.revertFile = function(file) {
        var ref1;
        return (ref1 = this.tab(file)) != null ? ref1.revert() : void 0;
    };

    Tabs.prototype.update = function() {
        var i, len, pkg, ref1, tab;
        this.stash();
        if (empty(this.tabs)) {
            return;
        }
        pkg = this.tabs[0].pkg;
        this.tabs[0].showPkg();
        ref1 = this.tabs.slice(1);
        for (i = 0, len = ref1.length; i < len; i++) {
            tab = ref1[i];
            if (tab.pkg === pkg) {
                tab.hidePkg();
            } else {
                pkg = tab.pkg;
                tab.showPkg();
            }
        }
        return this;
    };

    Tabs.prototype.onDirty = function(dirty) {
        var ref1;
        return (ref1 = this.activeTab()) != null ? ref1.setDirty(dirty) : void 0;
    };

    Tabs.prototype.onContextMenu = function(event) {
        return stopEvent(event, this.showContextMenu(kpos(event)));
    };

    Tabs.prototype.showContextMenu = function(absPos) {
        var opt, tab;
        if (tab = this.tab(event.target)) {
            tab.activate();
        }
        if (absPos == null) {
            absPos = kpos(this.view.getBoundingClientRect().left, this.view.getBoundingClientRect().top);
        }
        opt = {
            items: [
                {
                    text: 'Close Other Tabs',
                    combo: 'ctrl+shift+w'
                }, {
                    text: 'New Window',
                    combo: 'ctrl+shift+n'
                }
            ]
        };
        opt.x = absPos.x;
        opt.y = absPos.y;
        return popup.menu(opt);
    };

    return Tabs;

})();

module.exports = Tabs;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFicy5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi9jb2ZmZWUvd2luIiwic291cmNlcyI6WyJ0YWJzLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSxzSEFBQTtJQUFBOztBQVFBLE1BQTZHLE9BQUEsQ0FBUSxLQUFSLENBQTdHLEVBQUUsU0FBRixFQUFLLFNBQUwsRUFBUSxlQUFSLEVBQWMsZUFBZCxFQUFvQixpQkFBcEIsRUFBMkIsbUJBQTNCLEVBQW1DLGlCQUFuQyxFQUEwQyxtQkFBMUMsRUFBa0QsZUFBbEQsRUFBd0QsZUFBeEQsRUFBOEQsZUFBOUQsRUFBb0UsaUJBQXBFLEVBQTJFLGVBQTNFLEVBQWlGLGlCQUFqRixFQUF3RixpQkFBeEYsRUFBK0Y7O0FBRS9GLEdBQUEsR0FBTSxPQUFBLENBQVEsT0FBUjs7QUFFQTtJQUVDLGNBQUMsUUFBRDs7Ozs7Ozs7Ozs7Ozs7Ozs7O1FBRUMsSUFBQyxDQUFBLE9BQUQsR0FBVztRQUNYLElBQUMsQ0FBQSxJQUFELEdBQVE7UUFDUixJQUFDLENBQUEsR0FBRCxHQUFPLElBQUEsQ0FBSztZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sTUFBUDtTQUFMO1FBRVAsUUFBUSxDQUFDLFlBQVQsQ0FBc0IsSUFBQyxDQUFBLEdBQXZCLEVBQTRCLENBQUEsQ0FBRSxXQUFGLENBQTVCO1FBRUEsSUFBQyxDQUFBLEdBQUcsQ0FBQyxnQkFBTCxDQUFzQixPQUF0QixFQUFvQyxJQUFDLENBQUEsT0FBckM7UUFDQSxJQUFDLENBQUEsR0FBRyxDQUFDLGdCQUFMLENBQXNCLGFBQXRCLEVBQW9DLElBQUMsQ0FBQSxhQUFyQztRQUVBLElBQUMsQ0FBQSxJQUFELEdBQVEsSUFBSSxJQUFKLENBQ0o7WUFBQSxNQUFBLEVBQVMsSUFBQyxDQUFBLEdBQVY7WUFDQSxPQUFBLEVBQVMsSUFBQyxDQUFBLFdBRFY7WUFFQSxNQUFBLEVBQVMsSUFBQyxDQUFBLFVBRlY7WUFHQSxNQUFBLEVBQVMsSUFB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UyxJQUFBLENBQUssSUFBQyxDQUFBLElBQUksQ0FBQyxxQkFBTixDQUFBLENBQTZCLENBQUMsSUFBbkMsRUFBeUMsSUFBQyxDQUFBLElBQUksQ0FBQyxxQkFBTixDQUFBLENBQTZCLENBQUMsR0FBdkUsRUFEYjs7UUFHQSxHQUFBLEdBQU07WUFBQSxLQUFBLEVBQU87Z0JBQ1Q7b0JBQUEsSUFBQSxFQUFRLGtCQUFSO29CQUNBLEtBQUEsRUFBUSxjQURSO2lCQURTLEVBSVQ7b0JBQUEsSUFBQSxFQUFRLFlBQVI7b0JBQ0EsS0FBQSxFQUFRLGNBRFI7aUJBSlM7YUFBUDs7UUFRTixHQUFHLENBQUMsQ0FBSixHQUFRLE1BQU0sQ0FBQztRQUNmLEdBQUcsQ0FBQyxDQUFKLEdBQVEsTUFBTSxDQUFDO2VBQ2YsS0FBSyxDQUFDLElBQU4sQ0FBVyxHQUFYO0lBbEJhOzs7Ozs7QUFvQnJCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgMDAwMDAwMFxuICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwXG4gICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwXG4gICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMFxuICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMFxuIyMjXG5cbnsgJCwgXywgZHJhZywgZWxlbSwgZW1wdHksIGZpbHRlciwgZmlyc3QsIGtlcnJvciwga2xvZywga3BvcywgbGFzdCwgcG9wdXAsIHBvc3QsIHByZWZzLCBzbGFzaCwgc3RvcEV2ZW50IH0gPSByZXF1aXJlICdreGsnXG5cblRhYiA9IHJlcXVpcmUgJy4vdGFiJ1xuXG5jbGFzcyBUYWJzXG5cbiAgICBAOiAodGl0bGViYXIpIC0+XG5cbiAgICAgICAgQGVtcHR5aWQgPSAwXG4gICAgICAgIEB0YWJzID0gW11cbiAgICAgICAgQGRpdiA9IGVsZW0gY2xhc3M6ICd0YWJzJ1xuXG4gICAgICAgIHRpdGxlYmFyLmluc2VydEJlZm9yZSBAZGl2LCAkIFwiLm1pbmltaXplXCJcblxuICAgICAgICBAZGl2LmFkZEV2ZW50TGlzdGVuZXIgJ2NsaWNrJyAgICAgICBAb25DbGlja1xuICAgICAgICBAZGl2LmFkZEV2ZW50TGlzdGVuZXIgJ2NvbnRleHRtZW51JyBAb25Db250ZXh0TWVudVxuXG4gICAgICAgIEBkcmFnID0gbmV3IGRyYWdcbiAgICAgICAgICAgIHRhcmdldDogIEBkaXZcbiAgICAgICAgICAgIG9uU3RhcnQ6IEBvbkRyYWdTdGFydFxuICAgICAgICAgICAgb25Nb3ZlOiAgQG9uRHJhZ01vdmVcbiAgICAgICAgICAgIG9uU3RvcDogIEBvbkRyYWdTdG9wXG5cbiAgICAgICAgcG9zdC5vbiAnbmV3VGFiV2l0aEZpbGUnICAgQG9uTmV3VGFiV2l0aEZpbGVcbiAgICAgICAgcG9zdC5vbiAnbmV3RW1wdHlUYWInICAgICAgQG9uTmV3RW1wdHlUYWJcblxuICAgICAgICBwb3N0Lm9uICdjbG9zZVRhYk9yV2luZG93JyBAb25DbG9zZVRhYk9yV2luZG93XG4gICAgICAgIHBvc3Qub24gJ2Nsb3NlT3RoZXJUYWJzJyAgIEBvbkNsb3NlT3RoZXJUYWJzXG4gICAgICAgIHBvc3Qub24gJ3N0YXNoJyAgICAgICAgICAgIEBzdGFzaFxuICAgICAgICBwb3N0Lm9uICdkaXJ0eScgICAgICAgICAgICBAb25EaXJ0eVxuICAgICAgICBwb3N0Lm9uICdyZXN0b3JlJyAgICAgICAgICBAcmVzdG9yZVxuICAgICAgICBwb3N0Lm9uICdyZXZlcnRGaWxlJyAgICAgICBAcmV2ZXJ0RmlsZVxuICAgICAgICBwb3N0Lm9uICdzZW5kVGFicycgICAgICAgICBAb25TZW5kVGFic1xuICAgICAgICBwb3N0Lm9uICdmaWxlTGluZUNoYW5nZXMnICBAb25GaWxlTGluZUNoYW5nZXNcbiAgICAgICAgcG9zdC5vbiAnZmlsZVNhdmVkJyAgICAgICAgQG9uRmlsZVNhdmVkXG5cbiAgICBvblNlbmRUYWJzOiAod2luSUQpID0+XG5cbiAgICAgICAgdCA9ICcnXG4gICAgICAgIGZvciB0YWIgaW4gQHRhYnNcbiAgICAgICAgICAgIHQgKz0gdGFiLmRpdi5pbm5lckhUTUxcbiAgICAgICAgcG9zdC50b1dpbiB3aW5JRCwgJ3dpblRhYnMnIHdpbmRvdy53aW5JRCwgdFxuXG4gICAgb25GaWxlTGluZUNoYW5nZXM6IChmaWxlLCBsaW5lQ2hhbmdlcykgPT5cblxuICAgICAgICB0YWIgPSBAdGFiIGZpbGVcbiAgICAgICAgaWYgdGFiPyBhbmQgdGFiICE9IEBhY3RpdmVUYWIoKVxuICAgICAgICAgICAgdGFiLmZvcmVpZ25DaGFuZ2VzIGxpbmVDaGFuZ2VzXG5cbiAgICBvbkZpbGVTYXZlZDogKGZpbGUsIHdpbklEKSA9PlxuXG4gICAgICAgIGlmIHdpbklEID09IHdpbmRvdy53aW5JRFxuICAgICAgICAgICAgcmV0dXJuIGtlcnJvciBcImZpbGVTYXZlZCBmcm9tIHRoaXMgd2luZG93PyAje2ZpbGV9ICN7d2luSUR9XCJcbiAgICAgICAgICAgIFxuICAgICAgICB0YWIgPSBAdGFiIGZpbGVcbiAgICAgICAgaWYgdGFiPyBhbmQgdGFiICE9IEBhY3RpdmVUYWIoKVxuICAgICAgICAgICAgdGFiLnJldmVydCgpXG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAgICAwMDAgICAwMDAwMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMFxuXG4gICAgb25DbGljazogKGV2ZW50KSA9PlxuXG4gICAgICAgIGlmIHRhYiA9IEB0YWIgZXZlbnQudGFyZ2V0XG4gICAgICAgICAgICBpZiBldmVudC50YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zICdkb3QnXG4gICAgICAgICAgICAgICAgQG9uQ2xvc2VUYWJPcldpbmRvdyB0YWJcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICB0YWIuYWN0aXZhdGUoKVxuICAgICAgICB0cnVlXG5cbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMCAgMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMFxuXG4gICAgb25EcmFnU3RhcnQ6IChkLCBldmVudCkgPT5cblxuICAgICAgICByZXR1cm4gJ3NraXAnIGlmIGV2ZW50LnRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMgJ3RhYidcbiAgICAgICAgXG4gICAgICAgIGlmIGV2ZW50LnRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMgJ3RhYnN0YXRlJ1xuICAgICAgICAgICAgIyBAZHJhZ1RhYj8udG9nZ2xlUGlubmVkKClcbiAgICAgICAgICAgICMgZGVsZXRlIEBkcmFnVGFiXG4gICAgICAgICAgICByZXR1cm4gJ3NraXAnIFxuICAgICAgICBcbiAgICAgICAgQGRyYWdUYWIgPSBAdGFiIGV2ZW50LnRhcmdldFxuXG4gICAgICAgIHJldHVybiAnc2tpcCcgaWYgZW1wdHkgQGRyYWdUYWJcbiAgICAgICAgcmV0dXJuICdza2lwJyBpZiBldmVudC5idXR0b24gIT0gMFxuXG4gICAgICAgIEBkcmFnRGl2ID0gQGRyYWdUYWIuZGl2LmNsb25lTm9kZSB0cnVlXG4gICAgICAgIEBkcmFnVGFiLmRpdi5zdHlsZS5vcGFjaXR5ID0gJzAnXG4gICAgICAgIGJyID0gQGRyYWdUYWIuZGl2LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgICAgIEBkcmFnRGl2LnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJ1xuICAgICAgICBAZHJhZ0Rpdi5zdHlsZS50b3AgID0gXCIje2JyLnRvcH1weFwiXG4gICAgICAgIEBkcmFnRGl2LnN0eWxlLmxlZnQgPSBcIiN7YnIubGVmdH1weFwiXG4gICAgICAgIEBkcmFnRGl2LnN0eWxlLndpZHRoID0gXCIje2JyLndpZHRofXB4XCJcbiAgICAgICAgQGRyYWdEaXYuc3R5bGUuaGVpZ2h0ID0gXCIje2JyLmhlaWdodH1weFwiXG4gICAgICAgIEBkcmFnRGl2LnN0eWxlLmZsZXggPSAndW5zZXQnXG4gICAgICAgIEBkcmFnRGl2LnN0eWxlLnBvaW50ZXJFdmVudHMgPSAnbm9uZSdcbiAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCBAZHJhZ0RpdlxuXG4gICAgb25EcmFnTW92ZTogKGQsZSkgPT5cblxuICAgICAgICBAZHJhZ0Rpdi5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZVgoI3tkLmRlbHRhU3VtLnh9cHgpXCJcbiAgICAgICAgaWYgdGFiID0gQHRhYkF0WCBkLnBvcy54XG4gICAgICAgICAgICBpZiB0YWIuaW5kZXgoKSAhPSBAZHJhZ1RhYi5pbmRleCgpXG4gICAgICAgICAgICAgICAgQHN3YXAgdGFiLCBAZHJhZ1RhYlxuXG4gICAgb25EcmFnU3RvcDogKGQsZSkgPT5cblxuICAgICAgICBAZHJhZ1RhYi5kaXYuc3R5bGUub3BhY2l0eSA9ICcnXG4gICAgICAgIEBkcmFnRGl2LnJlbW92ZSgpXG5cbiAgICAjIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMFxuICAgICMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDBcblxuICAgIHRhYjogKGlkKSAtPlxuXG4gICAgICAgIGlmIF8uaXNOdW1iZXIgIGlkIHRoZW4gcmV0dXJuIEB0YWJzW2lkXVxuICAgICAgICBpZiBfLmlzRWxlbWVudCBpZCB0aGVuIHJldHVybiBfLmZpbmQgQHRhYnMsICh0KSAtPiB0LmRpdi5jb250YWlucyBpZFxuICAgICAgICBpZiBfLmlzU3RyaW5nICBpZCB0aGVuIHJldHVybiBfLmZpbmQgQHRhYnMsICh0KSAtPiB0LmZpbGUgPT0gaWRcblxuICAgIGFjdGl2ZVRhYjogKGNyZWF0ZSkgLT5cblxuICAgICAgICBpZiBub3QgQHRhYnMubGVuZ3RoIGFuZCBjcmVhdGVcbiAgICAgICAgICAgIHRhYiA9IEBvbk5ld0VtcHR5VGFiKClcbiAgICAgICAgICAgIHRhYi5zZXRBY3RpdmUoKVxuICAgICAgICAgICAgcmV0dXJuIHRhYlxuICAgICAgICAgICAgXG4gICAgICAgIHRhYiA9IF8uZmluZCBAdGFicywgKHQpIC0+IHQuaXNBY3RpdmUoKVxuICAgICAgICBcbiAgICAgICAgaWYgbm90IHRhYiBhbmQgY3JlYXRlXG4gICAgICAgICAgICB0YWIgPSBmaXJzdCBAdGFic1xuICAgICAgICAgICAgdGFiLnNldEFjdGl2ZSgpXG4gICAgICAgICAgICBcbiAgICAgICAgdGFiXG5cbiAgICBudW1UYWJzOiAgIC0+IEB0YWJzLmxlbmd0aFxuXG4gICAgdGFiQXRYOiAoeCkgLT5cblxuICAgICAgICBfLmZpbmQgQHRhYnMsICh0KSAtPlxuICAgICAgICAgICAgYnIgPSB0LmRpdi5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICAgICAgICAgICAgYnIubGVmdCA8PSB4IDw9IGJyLmxlZnQgKyBici53aWR0aFxuXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcblxuICAgIGNsb3NlVGFiOiAodGFiKSAtPlxuXG4gICAgICAgIF8ucHVsbCBAdGFicywgdGFiLmNsb3NlKClcbiAgICAgICAgXG4gICAgICAgIGlmIGVtcHR5IEB0YWJzXG4gICAgICAgICAgICBAb25OZXdFbXB0eVRhYigpXG4gICAgICAgIEBcblxuICAgIG9uQ2xvc2VUYWJPcldpbmRvdzogKHRhYikgPT5cblxuICAgICAgICBpZiBAbnVtVGFicygpIDw9IDFcbiAgICAgICAgICAgIHBvc3QuZW1pdCAnbWVudUFjdGlvbicgJ2Nsb3NlJ1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICB0YWIgPz0gQGFjdGl2ZVRhYigpXG4gICAgICAgICAgICB0YWIubmV4dE9yUHJldigpLmFjdGl2YXRlKClcbiAgICAgICAgICAgIEBjbG9zZVRhYiB0YWJcbiAgICAgICAgICAgIEB1cGRhdGUoKVxuXG4gICAgb25DbG9zZU90aGVyVGFiczogPT5cblxuICAgICAgICByZXR1cm4gaWYgbm90IEBhY3RpdmVUYWIoKSAjIHNob3VsZCBub3QgaGFwcGVuXG4gICAgICAgICMga2VlcCA9IF8ucHVsbEF0IEB0YWJzLCBAYWN0aXZlVGFiKCkuaW5kZXgoKVxuICAgICAgICAjIGtlZXAgPSBmaWx0ZXIgQHRhYnMsICh0KSA9PiBub3QgdC5waW5uZWQgYW5kIHQgIT0gQGFjdGl2ZVRhYigpXG4gICAgICAgIGtlZXAgPSBmaWx0ZXIgQHRhYnMsICh0KSA9PiB0LnBpbm5lZCBvciB0ID09IEBhY3RpdmVUYWIoKVxuICAgICAgICBjbHNlID0gZmlsdGVyIEB0YWJzLCAodCkgPT4gbm90IHQucGlubmVkIGFuZCB0ICE9IEBhY3RpdmVUYWIoKVxuICAgICAgICBrbG9nICdjbG9zZU90aGVyVGFicycga2VlcC5sZW5ndGgsIGNsb3NlLmxlbmd0aFxuICAgICAgICAjIHdoaWxlIEBudW1UYWJzKClcbiAgICAgICAgICAgICMgQHRhYnMucG9wKCkuY2xvc2UoKVxuICAgICAgICAjIEB0YWJzID0ga2VlcFxuICAgICAgICBmb3IgdCBpbiBjbHNlXG4gICAgICAgICAgICBAY2xvc2VUYWIgdFxuICAgICAgICBAdXBkYXRlKClcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAgICAgICAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgICAgIDAwMCAgICAgMDAwMDAwMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuXG4gICAgYWRkVGFiOiAoZmlsZSkgLT5cblxuICAgICAgICBpZiBAdGFicy5sZW5ndGggPj0gcHJlZnMuZ2V0ICdtYXhpbWFsTnVtYmVyT2ZUYWJzJyA4XG4gICAgICAgICAgICBmb3IgaW5kZXggaW4gWzAuLi5AdGFicy5sZW5ndGhdXG4gICAgICAgICAgICAgICAgaWYgbm90IEB0YWJzW2luZGV4XS5kaXJ0eSBhbmQgbm90IEB0YWJzW2luZGV4XS5waW5uZWRcbiAgICAgICAgICAgICAgICAgICAgQGNsb3NlVGFiIEB0YWJzW2luZGV4XVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuXG4gICAgICAgIEB0YWJzLnB1c2ggbmV3IFRhYiBALCBmaWxlXG4gICAgICAgIGxhc3QgQHRhYnNcblxuICAgIG9uTmV3RW1wdHlUYWI6ID0+XG5cbiAgICAgICAgQGVtcHR5aWQgKz0gMVxuICAgICAgICB0YWIgPSBAYWRkVGFiKFwidW50aXRsZWQtI3tAZW1wdHlpZH1cIikuYWN0aXZhdGUoKVxuICAgICAgICBAdXBkYXRlKClcbiAgICAgICAgdGFiXG5cbiAgICBvbk5ld1RhYldpdGhGaWxlOiAoZmlsZSkgPT5cblxuICAgICAgICBsb2cgJ29uTmV3VGFiV2l0aEZpbGUnIGZpbGVcbiAgICAgICAgW2ZpbGUsIGxpbmUsIGNvbF0gPSBzbGFzaC5zcGxpdEZpbGVMaW5lIGZpbGVcblxuICAgICAgICBpZiB0YWIgPSBAdGFiIGZpbGVcbiAgICAgICAgICAgIHRhYi5hY3RpdmF0ZSgpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBhZGRUYWIoZmlsZSkuYWN0aXZhdGUoKVxuXG4gICAgICAgIEB1cGRhdGUoKVxuXG4gICAgICAgIGlmIGxpbmUgb3IgY29sXG5cbiAgICAgICAgICAgIHBvc3QuZW1pdCAnc2luZ2xlQ3Vyc29yQXRQb3MnIFtjb2wsIGxpbmUtMV1cblxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAwIDAwMCAgMDAwMDAwMDAwICAgMDAwIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMFxuICAgICMgMDAwICAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgMCAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDBcblxuICAgIG5hdmlnYXRlOiAoa2V5KSAtPlxuXG4gICAgICAgIGluZGV4ID0gQGFjdGl2ZVRhYigpLmluZGV4KClcbiAgICAgICAgaW5kZXggKz0gc3dpdGNoIGtleVxuICAgICAgICAgICAgd2hlbiAnbGVmdCcgdGhlbiAtMVxuICAgICAgICAgICAgd2hlbiAncmlnaHQnIHRoZW4gKzFcbiAgICAgICAgaW5kZXggPSAoQG51bVRhYnMoKSArIGluZGV4KSAlIEBudW1UYWJzKClcbiAgICAgICAgQHRhYnNbaW5kZXhdLmFjdGl2YXRlKClcblxuICAgIHN3YXA6ICh0YSwgdGIpIC0+XG5cbiAgICAgICAgcmV0dXJuIGlmIG5vdCB0YT8gb3Igbm90IHRiP1xuICAgICAgICBbdGEsIHRiXSA9IFt0YiwgdGFdIGlmIHRhLmluZGV4KCkgPiB0Yi5pbmRleCgpXG4gICAgICAgIEB0YWJzW3RhLmluZGV4KCldICAgPSB0YlxuICAgICAgICBAdGFic1t0Yi5pbmRleCgpKzFdID0gdGFcbiAgICAgICAgQGRpdi5pbnNlcnRCZWZvcmUgdGIuZGl2LCB0YS5kaXZcbiAgICAgICAgQHVwZGF0ZSgpXG5cbiAgICBtb3ZlOiAoa2V5KSAtPlxuXG4gICAgICAgIHRhYiA9IEBhY3RpdmVUYWIoKVxuICAgICAgICBzd2l0Y2gga2V5XG4gICAgICAgICAgICB3aGVuICdsZWZ0JyAgdGhlbiBAc3dhcCB0YWIsIHRhYi5wcmV2KClcbiAgICAgICAgICAgIHdoZW4gJ3JpZ2h0JyB0aGVuIEBzd2FwIHRhYiwgdGFiLm5leHQoKVxuXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDBcblxuICAgIHN0YXNoOiA9PlxuXG4gICAgICAgIGZpbGVzICA9ICggdC5maWxlIGZvciB0IGluIEB0YWJzIClcbiAgICAgICAgcGlubmVkID0gKCB0LnBpbm5lZCBmb3IgdCBpbiBAdGFicyApXG4gICAgICAgIGZpbGVzICA9IGZpbGVzLmZpbHRlciAoZmlsZSkgLT4gbm90IGZpbGUuc3RhcnRzV2l0aCAndW50aXRsZWQnXG5cbiAgICAgICAgd2luZG93LnN0YXNoLnNldCAndGFicycsXG4gICAgICAgICAgICBmaWxlczogIGZpbGVzXG4gICAgICAgICAgICBwaW5uZWQ6IHBpbm5lZFxuICAgICAgICAgICAgYWN0aXZlOiBNYXRoLm1pbiBAYWN0aXZlVGFiKCk/LmluZGV4KCksIGZpbGVzLmxlbmd0aC0xXG5cbiAgICByZXN0b3JlOiA9PlxuXG4gICAgICAgIGFjdGl2ZSA9IHdpbmRvdy5zdGFzaC5nZXQgJ3RhYnN8YWN0aXZlJyAwXG4gICAgICAgIGZpbGVzICA9IHdpbmRvdy5zdGFzaC5nZXQgJ3RhYnN8ZmlsZXMnXG4gICAgICAgIHBpbm5lZCA9IHdpbmRvdy5zdGFzaC5nZXQgJ3RhYnN8cGlubmVkJ1xuICAgICAgICBwaW5uZWQgPz0gW11cblxuICAgICAgICByZXR1cm4gaWYgZW1wdHkgZmlsZXMgIyBoYXBwZW5zIHdoZW4gZmlyc3Qgd2luZG93IG9wZW5zXG5cbiAgICAgICAgQHRhYnMgPSBbXVxuXG4gICAgICAgIHdoaWxlIGZpbGVzLmxlbmd0aFxuICAgICAgICAgICAgQGFkZFRhYiBmaWxlcy5zaGlmdCgpXG5cbiAgICAgICAgQHRhYnNbYWN0aXZlXT8uYWN0aXZhdGUoKVxuICAgICAgICBcbiAgICAgICAgZm9yIHBpIGluIDAuLi5waW5uZWQubGVuZ3RoXG4gICAgICAgICAgICBpZiBwaW5uZWRbcGldXG4gICAgICAgICAgICAgICAgQHRhYnNbcGldLnRvZ2dsZVBpbm5lZCgpXG5cbiAgICAgICAgQHVwZGF0ZSgpXG5cbiAgICByZXZlcnRGaWxlOiAoZmlsZSkgPT4gQHRhYihmaWxlKT8ucmV2ZXJ0KClcblxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAgICAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwXG5cbiAgICB1cGRhdGU6IC0+XG5cbiAgICAgICAgQHN0YXNoKClcblxuICAgICAgICByZXR1cm4gaWYgZW1wdHkgQHRhYnNcblxuICAgICAgICBwa2cgPSBAdGFic1swXS5wa2dcbiAgICAgICAgQHRhYnNbMF0uc2hvd1BrZygpXG4gICAgICAgIGZvciB0YWIgaW4gQHRhYnMuc2xpY2UgMVxuICAgICAgICAgICAgaWYgdGFiLnBrZyA9PSBwa2dcbiAgICAgICAgICAgICAgICB0YWIuaGlkZVBrZygpXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgcGtnID0gdGFiLnBrZ1xuICAgICAgICAgICAgICAgIHRhYi5zaG93UGtnKClcbiAgICAgICAgQFxuXG4gICAgb25EaXJ0eTogKGRpcnR5KSA9PlxuXG4gICAgICAgIEBhY3RpdmVUYWIoKT8uc2V0RGlydHkgZGlydHlcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAgMDAwIDAwMCAgICAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAgIDAwMDAwICAgICAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAgMDAwIDAwMCAgICAgIDAwMFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMFxuXG4gICAgb25Db250ZXh0TWVudTogKGV2ZW50KSA9PiBzdG9wRXZlbnQgZXZlbnQsIEBzaG93Q29udGV4dE1lbnUga3BvcyBldmVudFxuXG4gICAgc2hvd0NvbnRleHRNZW51OiAoYWJzUG9zKSA9PlxuXG4gICAgICAgIGlmIHRhYiA9IEB0YWIgZXZlbnQudGFyZ2V0XG4gICAgICAgICAgICB0YWIuYWN0aXZhdGUoKVxuXG4gICAgICAgIGlmIG5vdCBhYnNQb3M/XG4gICAgICAgICAgICBhYnNQb3MgPSBrcG9zIEB2aWV3LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmxlZnQsIEB2aWV3LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnRvcFxuXG4gICAgICAgIG9wdCA9IGl0ZW1zOiBbXG4gICAgICAgICAgICB0ZXh0OiAgICdDbG9zZSBPdGhlciBUYWJzJ1xuICAgICAgICAgICAgY29tYm86ICAnY3RybCtzaGlmdCt3J1xuICAgICAgICAsXG4gICAgICAgICAgICB0ZXh0OiAgICdOZXcgV2luZG93J1xuICAgICAgICAgICAgY29tYm86ICAnY3RybCtzaGlmdCtuJ1xuICAgICAgICBdXG5cbiAgICAgICAgb3B0LnggPSBhYnNQb3MueFxuICAgICAgICBvcHQueSA9IGFic1Bvcy55XG4gICAgICAgIHBvcHVwLm1lbnUgb3B0XG5cbm1vZHVsZS5leHBvcnRzID0gVGFic1xuIl19
//# sourceURL=../../coffee/win/tabs.coffee