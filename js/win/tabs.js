// koffee 1.19.0

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
        this.onEditorFocus = bind(this.onEditorFocus, this);
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
        post.on('editorFocus', this.onEditorFocus);
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

    Tabs.prototype.onEditorFocus = function(editor) {
        var t;
        if (editor.name === 'editor') {
            if (t = this.getTmpTab()) {
                if (t.file === window.textEditor.currentFile) {
                    delete t.tmpTab;
                    t.update();
                    return this.update();
                }
            }
        }
    };

    Tabs.prototype.closeTab = function(tab) {
        if (empty(tab)) {
            return;
        }
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
        var i, len, t, tabsToClose;
        if (!this.activeTab()) {
            return;
        }
        tabsToClose = filter(this.tabs, (function(_this) {
            return function(t) {
                return !t.pinned && t !== _this.activeTab();
            };
        })(this));
        for (i = 0, len = tabsToClose.length; i < len; i++) {
            t = tabsToClose[i];
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

    Tabs.prototype.getTmpTab = function() {
        var i, len, ref1, t;
        ref1 = this.tabs;
        for (i = 0, len = ref1.length; i < len; i++) {
            t = ref1[i];
            if (t.tmpTab) {
                return t;
            }
        }
    };

    Tabs.prototype.addTmpTab = function(file) {
        var tab;
        this.closeTab(this.getTmpTab());
        tab = this.addTab(file);
        tab.tmpTab = true;
        tab.update();
        return tab;
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
        klog('onNewTabWithFile', file);
        ref1 = slash.splitFileLine(file), file = ref1[0], line = ref1[1], col = ref1[2];
        if (tab = this.tab(file)) {
            tab.activate();
        } else {
            klog('onNewTabWithFile', file);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFicy5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi9jb2ZmZWUvd2luIiwic291cmNlcyI6WyJ0YWJzLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSxzSEFBQTtJQUFBOztBQVFBLE1BQTZHLE9BQUEsQ0FBUSxLQUFSLENBQTdHLEVBQUUsU0FBRixFQUFLLFNBQUwsRUFBUSxlQUFSLEVBQWMsZUFBZCxFQUFvQixpQkFBcEIsRUFBMkIsbUJBQTNCLEVBQW1DLGlCQUFuQyxFQUEwQyxtQkFBMUMsRUFBa0QsZUFBbEQsRUFBd0QsZUFBeEQsRUFBOEQsZUFBOUQsRUFBb0UsaUJBQXBFLEVBQTJFLGVBQTNFLEVBQWlGLGlCQUFqRixFQUF3RixpQkFBeEYsRUFBK0Y7O0FBRS9GLEdBQUEsR0FBTSxPQUFBLENBQVEsT0FBUjs7QUFFQTtJQUVDLGNBQUMsUUFBRDs7Ozs7Ozs7Ozs7Ozs7Ozs7OztRQUVDLElBQUMsQ0FBQSxPQUFELEdBQVc7UUFDWCxJQUFDLENBQUEsSUFBRCxHQUFRO1FBQ1IsSUFBQyxDQUFBLEdBQUQsR0FBTyxJQUFBLENBQUs7WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLE1BQVA7U0FBTDtRQUVQLFFBQVEsQ0FBQyxZQUFULENBQXNCLElBQUMsQ0FBQSxHQUF2QixFQUE0QixDQUFBLENBQUUsV0FBRixDQUE1QjtRQUVBLElBQUMsQ0FBQSxHQUFHLENBQUMsZ0JBQUwsQ0FBc0IsT0FBdEIsRUFBb0MsSUFBQyxDQUFBLE9BQXJDO1FBQ0EsSUFBQyxDQUFBLEdBQUcsQ0FBQyxnQkFBTCxDQUFzQixhQUF0QixFQUFvQyxJQUFDLENBQUEsYUFBckM7UUFFQSxJQUFDLENBQUEsSUFBRCxHQUFRLElBQUksSUFBSixDQUNKO1lBQUEsTUFBQSxFQUFTLElBQUMsQ0FBQSxHQUFWO1lBQ0EsT0FBQSxFQUFTLElBQUMsQ0FBQSxXQURWO1lBRUEsTUFBQSxFQUFTLElBQUMsQ0FBQSxVQUZWO1lBR0EsTUFBQSxFQUFTLElB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MDAwMCAgICAgMDAwMDAwMFxuICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwXG4gICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwXG4gICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMFxuICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMFxuIyMjXG5cbnsgJCwgXywgZHJhZywgZWxlbSwgZW1wdHksIGZpbHRlciwgZmlyc3QsIGtlcnJvciwga2xvZywga3BvcywgbGFzdCwgcG9wdXAsIHBvc3QsIHByZWZzLCBzbGFzaCwgc3RvcEV2ZW50IH0gPSByZXF1aXJlICdreGsnXG5cblRhYiA9IHJlcXVpcmUgJy4vdGFiJ1xuXG5jbGFzcyBUYWJzXG5cbiAgICBAOiAodGl0bGViYXIpIC0+XG5cbiAgICAgICAgQGVtcHR5aWQgPSAwXG4gICAgICAgIEB0YWJzID0gW11cbiAgICAgICAgQGRpdiA9IGVsZW0gY2xhc3M6ICd0YWJzJ1xuXG4gICAgICAgIHRpdGxlYmFyLmluc2VydEJlZm9yZSBAZGl2LCAkIFwiLm1pbmltaXplXCJcblxuICAgICAgICBAZGl2LmFkZEV2ZW50TGlzdGVuZXIgJ2NsaWNrJyAgICAgICBAb25DbGlja1xuICAgICAgICBAZGl2LmFkZEV2ZW50TGlzdGVuZXIgJ2NvbnRleHRtZW51JyBAb25Db250ZXh0TWVudVxuXG4gICAgICAgIEBkcmFnID0gbmV3IGRyYWdcbiAgICAgICAgICAgIHRhcmdldDogIEBkaXZcbiAgICAgICAgICAgIG9uU3RhcnQ6IEBvbkRyYWdTdGFydFxuICAgICAgICAgICAgb25Nb3ZlOiAgQG9uRHJhZ01vdmVcbiAgICAgICAgICAgIG9uU3RvcDogIEBvbkRyYWdTdG9wXG5cbiAgICAgICAgcG9zdC5vbiAnbmV3VGFiV2l0aEZpbGUnICAgQG9uTmV3VGFiV2l0aEZpbGVcbiAgICAgICAgcG9zdC5vbiAnbmV3RW1wdHlUYWInICAgICAgQG9uTmV3RW1wdHlUYWJcblxuICAgICAgICBwb3N0Lm9uICdjbG9zZVRhYk9yV2luZG93JyBAb25DbG9zZVRhYk9yV2luZG93XG4gICAgICAgIHBvc3Qub24gJ2Nsb3NlT3RoZXJUYWJzJyAgIEBvbkNsb3NlT3RoZXJUYWJzXG4gICAgICAgIHBvc3Qub24gJ3N0YXNoJyAgICAgICAgICAgIEBzdGFzaFxuICAgICAgICBwb3N0Lm9uICdkaXJ0eScgICAgICAgICAgICBAb25EaXJ0eVxuICAgICAgICBwb3N0Lm9uICdyZXN0b3JlJyAgICAgICAgICBAcmVzdG9yZVxuICAgICAgICBwb3N0Lm9uICdyZXZlcnRGaWxlJyAgICAgICBAcmV2ZXJ0RmlsZVxuICAgICAgICBwb3N0Lm9uICdzZW5kVGFicycgICAgICAgICBAb25TZW5kVGFic1xuICAgICAgICBwb3N0Lm9uICdmaWxlTGluZUNoYW5nZXMnICBAb25GaWxlTGluZUNoYW5nZXNcbiAgICAgICAgcG9zdC5vbiAnZmlsZVNhdmVkJyAgICAgICAgQG9uRmlsZVNhdmVkXG4gICAgICAgIHBvc3Qub24gJ2VkaXRvckZvY3VzJyAgICAgIEBvbkVkaXRvckZvY3VzXG5cbiAgICBvblNlbmRUYWJzOiAod2luSUQpID0+XG5cbiAgICAgICAgdCA9ICcnXG4gICAgICAgIGZvciB0YWIgaW4gQHRhYnNcbiAgICAgICAgICAgIHQgKz0gdGFiLmRpdi5pbm5lckhUTUxcbiAgICAgICAgcG9zdC50b1dpbiB3aW5JRCwgJ3dpblRhYnMnIHdpbmRvdy53aW5JRCwgdFxuXG4gICAgb25GaWxlTGluZUNoYW5nZXM6IChmaWxlLCBsaW5lQ2hhbmdlcykgPT5cblxuICAgICAgICB0YWIgPSBAdGFiIGZpbGVcbiAgICAgICAgaWYgdGFiPyBhbmQgdGFiICE9IEBhY3RpdmVUYWIoKVxuICAgICAgICAgICAgdGFiLmZvcmVpZ25DaGFuZ2VzIGxpbmVDaGFuZ2VzXG5cbiAgICBvbkZpbGVTYXZlZDogKGZpbGUsIHdpbklEKSA9PlxuXG4gICAgICAgIGlmIHdpbklEID09IHdpbmRvdy53aW5JRFxuICAgICAgICAgICAgcmV0dXJuIGtlcnJvciBcImZpbGVTYXZlZCBmcm9tIHRoaXMgd2luZG93PyAje2ZpbGV9ICN7d2luSUR9XCJcbiAgICAgICAgICAgIFxuICAgICAgICB0YWIgPSBAdGFiIGZpbGVcbiAgICAgICAgaWYgdGFiPyBhbmQgdGFiICE9IEBhY3RpdmVUYWIoKVxuICAgICAgICAgICAgdGFiLnJldmVydCgpXG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAgICAwMDAgICAwMDAwMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMFxuXG4gICAgb25DbGljazogKGV2ZW50KSA9PlxuXG4gICAgICAgIGlmIHRhYiA9IEB0YWIgZXZlbnQudGFyZ2V0XG4gICAgICAgICAgICBpZiBldmVudC50YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zICdkb3QnXG4gICAgICAgICAgICAgICAgQG9uQ2xvc2VUYWJPcldpbmRvdyB0YWJcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICB0YWIuYWN0aXZhdGUoKVxuICAgICAgICB0cnVlXG5cbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMCAgMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMFxuXG4gICAgb25EcmFnU3RhcnQ6IChkLCBldmVudCkgPT5cblxuICAgICAgICByZXR1cm4gJ3NraXAnIGlmIGV2ZW50LnRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMgJ3RhYidcbiAgICAgICAgXG4gICAgICAgIGlmIGV2ZW50LnRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMgJ3RhYnN0YXRlJ1xuICAgICAgICAgICAgIyBAZHJhZ1RhYj8udG9nZ2xlUGlubmVkKClcbiAgICAgICAgICAgICMgZGVsZXRlIEBkcmFnVGFiXG4gICAgICAgICAgICByZXR1cm4gJ3NraXAnIFxuICAgICAgICBcbiAgICAgICAgQGRyYWdUYWIgPSBAdGFiIGV2ZW50LnRhcmdldFxuXG4gICAgICAgIHJldHVybiAnc2tpcCcgaWYgZW1wdHkgQGRyYWdUYWJcbiAgICAgICAgcmV0dXJuICdza2lwJyBpZiBldmVudC5idXR0b24gIT0gMFxuXG4gICAgICAgIEBkcmFnRGl2ID0gQGRyYWdUYWIuZGl2LmNsb25lTm9kZSB0cnVlXG4gICAgICAgIEBkcmFnVGFiLmRpdi5zdHlsZS5vcGFjaXR5ID0gJzAnXG4gICAgICAgIGJyID0gQGRyYWdUYWIuZGl2LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgICAgIEBkcmFnRGl2LnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJ1xuICAgICAgICBAZHJhZ0Rpdi5zdHlsZS50b3AgID0gXCIje2JyLnRvcH1weFwiXG4gICAgICAgIEBkcmFnRGl2LnN0eWxlLmxlZnQgPSBcIiN7YnIubGVmdH1weFwiXG4gICAgICAgIEBkcmFnRGl2LnN0eWxlLndpZHRoID0gXCIje2JyLndpZHRofXB4XCJcbiAgICAgICAgQGRyYWdEaXYuc3R5bGUuaGVpZ2h0ID0gXCIje2JyLmhlaWdodH1weFwiXG4gICAgICAgIEBkcmFnRGl2LnN0eWxlLmZsZXggPSAndW5zZXQnXG4gICAgICAgIEBkcmFnRGl2LnN0eWxlLnBvaW50ZXJFdmVudHMgPSAnbm9uZSdcbiAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCBAZHJhZ0RpdlxuXG4gICAgb25EcmFnTW92ZTogKGQsZSkgPT5cblxuICAgICAgICBAZHJhZ0Rpdi5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZVgoI3tkLmRlbHRhU3VtLnh9cHgpXCJcbiAgICAgICAgaWYgdGFiID0gQHRhYkF0WCBkLnBvcy54XG4gICAgICAgICAgICBpZiB0YWIuaW5kZXgoKSAhPSBAZHJhZ1RhYi5pbmRleCgpXG4gICAgICAgICAgICAgICAgQHN3YXAgdGFiLCBAZHJhZ1RhYlxuXG4gICAgb25EcmFnU3RvcDogKGQsZSkgPT5cblxuICAgICAgICBAZHJhZ1RhYi5kaXYuc3R5bGUub3BhY2l0eSA9ICcnXG4gICAgICAgIEBkcmFnRGl2LnJlbW92ZSgpXG5cbiAgICAjIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMFxuICAgICMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDBcblxuICAgIHRhYjogKGlkKSAtPlxuXG4gICAgICAgIGlmIF8uaXNOdW1iZXIgIGlkIHRoZW4gcmV0dXJuIEB0YWJzW2lkXVxuICAgICAgICBpZiBfLmlzRWxlbWVudCBpZCB0aGVuIHJldHVybiBfLmZpbmQgQHRhYnMsICh0KSAtPiB0LmRpdi5jb250YWlucyBpZFxuICAgICAgICBpZiBfLmlzU3RyaW5nICBpZCB0aGVuIHJldHVybiBfLmZpbmQgQHRhYnMsICh0KSAtPiB0LmZpbGUgPT0gaWRcblxuICAgIGFjdGl2ZVRhYjogKGNyZWF0ZSkgLT5cblxuICAgICAgICBpZiBub3QgQHRhYnMubGVuZ3RoIGFuZCBjcmVhdGVcbiAgICAgICAgICAgIHRhYiA9IEBvbk5ld0VtcHR5VGFiKClcbiAgICAgICAgICAgIHRhYi5zZXRBY3RpdmUoKVxuICAgICAgICAgICAgcmV0dXJuIHRhYlxuICAgICAgICAgICAgXG4gICAgICAgIHRhYiA9IF8uZmluZCBAdGFicywgKHQpIC0+IHQuaXNBY3RpdmUoKVxuICAgICAgICBcbiAgICAgICAgaWYgbm90IHRhYiBhbmQgY3JlYXRlXG4gICAgICAgICAgICB0YWIgPSBmaXJzdCBAdGFic1xuICAgICAgICAgICAgdGFiLnNldEFjdGl2ZSgpXG4gICAgICAgICAgICBcbiAgICAgICAgdGFiXG5cbiAgICBudW1UYWJzOiAgIC0+IEB0YWJzLmxlbmd0aFxuXG4gICAgdGFiQXRYOiAoeCkgLT5cblxuICAgICAgICBfLmZpbmQgQHRhYnMsICh0KSAtPlxuICAgICAgICAgICAgYnIgPSB0LmRpdi5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICAgICAgICAgICAgYnIubGVmdCA8PSB4IDw9IGJyLmxlZnQgKyBici53aWR0aFxuXG4gICAgb25FZGl0b3JGb2N1czogKGVkaXRvcikgPT5cbiAgICAgICAgaWYgZWRpdG9yLm5hbWUgPT0gJ2VkaXRvcidcbiAgICAgICAgICAgIGlmIHQgPSBAZ2V0VG1wVGFiKClcbiAgICAgICAgICAgICAgICBpZiB0LmZpbGUgPT0gd2luZG93LnRleHRFZGl0b3IuY3VycmVudEZpbGVcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHQudG1wVGFiXG4gICAgICAgICAgICAgICAgICAgIHQudXBkYXRlKClcbiAgICAgICAgICAgICAgICAgICAgQHVwZGF0ZSgpXG4gICAgICAgICAgICBcbiAgICAjICAwMDAwMDAwICAwMDAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgICAgICAgMDAwICAwMDBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuXG4gICAgY2xvc2VUYWI6ICh0YWIpIC0+XG5cbiAgICAgICAgcmV0dXJuIGlmIGVtcHR5IHRhYlxuICAgICAgICBcbiAgICAgICAgXy5wdWxsIEB0YWJzLCB0YWIuY2xvc2UoKVxuICAgICAgICBcbiAgICAgICAgaWYgZW1wdHkgQHRhYnNcbiAgICAgICAgICAgIEBvbk5ld0VtcHR5VGFiKClcbiAgICAgICAgQFxuXG4gICAgb25DbG9zZVRhYk9yV2luZG93OiAodGFiKSA9PlxuXG4gICAgICAgIGlmIEBudW1UYWJzKCkgPD0gMVxuICAgICAgICAgICAgcG9zdC5lbWl0ICdtZW51QWN0aW9uJyAnY2xvc2UnXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHRhYiA/PSBAYWN0aXZlVGFiKClcbiAgICAgICAgICAgIHRhYi5uZXh0T3JQcmV2KCkuYWN0aXZhdGUoKVxuICAgICAgICAgICAgQGNsb3NlVGFiIHRhYlxuICAgICAgICAgICAgQHVwZGF0ZSgpXG5cbiAgICBvbkNsb3NlT3RoZXJUYWJzOiA9PlxuXG4gICAgICAgIHJldHVybiBpZiBub3QgQGFjdGl2ZVRhYigpICMgc2hvdWxkIG5vdCBoYXBwZW5cbiAgICAgICAgdGFic1RvQ2xvc2UgPSBmaWx0ZXIgQHRhYnMsICh0KSA9PiBub3QgdC5waW5uZWQgYW5kIHQgIT0gQGFjdGl2ZVRhYigpXG4gICAgICAgIGZvciB0IGluIHRhYnNUb0Nsb3NlXG4gICAgICAgICAgICBAY2xvc2VUYWIgdFxuICAgICAgICBAdXBkYXRlKClcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAgICAgICAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgICAgIDAwMCAgICAgMDAwMDAwMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuXG4gICAgYWRkVGFiOiAoZmlsZSkgLT5cblxuICAgICAgICAjIGtsb2cgJ2FkZFRhYicgZmlsZVxuICAgICAgICBcbiAgICAgICAgaWYgQHRhYnMubGVuZ3RoID49IHByZWZzLmdldCAnbWF4aW1hbE51bWJlck9mVGFicycgOFxuICAgICAgICAgICAgZm9yIGluZGV4IGluIFswLi4uQHRhYnMubGVuZ3RoXVxuICAgICAgICAgICAgICAgIGlmIG5vdCBAdGFic1tpbmRleF0uZGlydHkgYW5kIG5vdCBAdGFic1tpbmRleF0ucGlubmVkXG4gICAgICAgICAgICAgICAgICAgIEBjbG9zZVRhYiBAdGFic1tpbmRleF1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcblxuICAgICAgICBAdGFicy5wdXNoIG5ldyBUYWIgQCwgZmlsZVxuICAgICAgICBsYXN0IEB0YWJzXG5cbiAgICBnZXRUbXBUYWI6IC0+XG4gICAgICAgIFxuICAgICAgICBmb3IgdCBpbiBAdGFic1xuICAgICAgICAgICAgcmV0dXJuIHQgaWYgdC50bXBUYWJcbiAgICAgICAgXG4gICAgYWRkVG1wVGFiOiAoZmlsZSkgLT5cbiAgICAgICAgXG4gICAgICAgIEBjbG9zZVRhYiBAZ2V0VG1wVGFiKClcbiAgICAgICAgXG4gICAgICAgIHRhYiA9IEBhZGRUYWIgZmlsZVxuICAgICAgICB0YWIudG1wVGFiID0gdHJ1ZVxuICAgICAgICB0YWIudXBkYXRlKClcbiAgICAgICAgdGFiXG4gICAgICAgIFxuICAgIG9uTmV3RW1wdHlUYWI6ID0+XG5cbiAgICAgICAgQGVtcHR5aWQgKz0gMVxuICAgICAgICB0YWIgPSBAYWRkVGFiKFwidW50aXRsZWQtI3tAZW1wdHlpZH1cIikuYWN0aXZhdGUoKVxuICAgICAgICBAdXBkYXRlKClcbiAgICAgICAgdGFiXG5cbiAgICBvbk5ld1RhYldpdGhGaWxlOiAoZmlsZSkgPT5cblxuICAgICAgICBrbG9nICdvbk5ld1RhYldpdGhGaWxlJyBmaWxlXG4gICAgICAgIFtmaWxlLCBsaW5lLCBjb2xdID0gc2xhc2guc3BsaXRGaWxlTGluZSBmaWxlXG5cbiAgICAgICAgaWYgdGFiID0gQHRhYiBmaWxlXG4gICAgICAgICAgICB0YWIuYWN0aXZhdGUoKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBrbG9nICdvbk5ld1RhYldpdGhGaWxlJyBmaWxlXG4gICAgICAgICAgICBAYWRkVGFiKGZpbGUpLmFjdGl2YXRlKClcblxuICAgICAgICBAdXBkYXRlKClcblxuICAgICAgICBpZiBsaW5lIG9yIGNvbFxuXG4gICAgICAgICAgICBwb3N0LmVtaXQgJ3NpbmdsZUN1cnNvckF0UG9zJyBbY29sLCBsaW5lLTFdXG5cbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAgMCAwMDAgIDAwMDAwMDAwMCAgIDAwMCAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgIDAgICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwXG5cbiAgICBuYXZpZ2F0ZTogKGtleSkgLT5cblxuICAgICAgICBpbmRleCA9IEBhY3RpdmVUYWIoKS5pbmRleCgpXG4gICAgICAgIGluZGV4ICs9IHN3aXRjaCBrZXlcbiAgICAgICAgICAgIHdoZW4gJ2xlZnQnIHRoZW4gLTFcbiAgICAgICAgICAgIHdoZW4gJ3JpZ2h0JyB0aGVuICsxXG4gICAgICAgIGluZGV4ID0gKEBudW1UYWJzKCkgKyBpbmRleCkgJSBAbnVtVGFicygpXG4gICAgICAgIEB0YWJzW2luZGV4XS5hY3RpdmF0ZSgpXG5cbiAgICBzd2FwOiAodGEsIHRiKSAtPlxuXG4gICAgICAgIHJldHVybiBpZiBub3QgdGE/IG9yIG5vdCB0Yj9cbiAgICAgICAgW3RhLCB0Yl0gPSBbdGIsIHRhXSBpZiB0YS5pbmRleCgpID4gdGIuaW5kZXgoKVxuICAgICAgICBAdGFic1t0YS5pbmRleCgpXSAgID0gdGJcbiAgICAgICAgQHRhYnNbdGIuaW5kZXgoKSsxXSA9IHRhXG4gICAgICAgIEBkaXYuaW5zZXJ0QmVmb3JlIHRiLmRpdiwgdGEuZGl2XG4gICAgICAgIEB1cGRhdGUoKVxuXG4gICAgbW92ZTogKGtleSkgLT5cblxuICAgICAgICB0YWIgPSBAYWN0aXZlVGFiKClcbiAgICAgICAgc3dpdGNoIGtleVxuICAgICAgICAgICAgd2hlbiAnbGVmdCcgIHRoZW4gQHN3YXAgdGFiLCB0YWIucHJldigpXG4gICAgICAgICAgICB3aGVuICdyaWdodCcgdGhlbiBAc3dhcCB0YWIsIHRhYi5uZXh0KClcblxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwXG5cbiAgICBzdGFzaDogPT5cblxuICAgICAgICBmaWxlcyAgPSAoIHQuZmlsZSBmb3IgdCBpbiBAdGFicyApXG4gICAgICAgIHBpbm5lZCA9ICggdC5waW5uZWQgZm9yIHQgaW4gQHRhYnMgKVxuICAgICAgICBmaWxlcyAgPSBmaWxlcy5maWx0ZXIgKGZpbGUpIC0+IG5vdCBmaWxlLnN0YXJ0c1dpdGggJ3VudGl0bGVkJ1xuXG4gICAgICAgIHdpbmRvdy5zdGFzaC5zZXQgJ3RhYnMnLFxuICAgICAgICAgICAgZmlsZXM6ICBmaWxlc1xuICAgICAgICAgICAgcGlubmVkOiBwaW5uZWRcbiAgICAgICAgICAgIGFjdGl2ZTogTWF0aC5taW4gQGFjdGl2ZVRhYigpPy5pbmRleCgpLCBmaWxlcy5sZW5ndGgtMVxuXG4gICAgcmVzdG9yZTogPT5cblxuICAgICAgICBhY3RpdmUgPSB3aW5kb3cuc3Rhc2guZ2V0ICd0YWJzfGFjdGl2ZScgMFxuICAgICAgICBmaWxlcyAgPSB3aW5kb3cuc3Rhc2guZ2V0ICd0YWJzfGZpbGVzJ1xuICAgICAgICBwaW5uZWQgPSB3aW5kb3cuc3Rhc2guZ2V0ICd0YWJzfHBpbm5lZCdcbiAgICAgICAgcGlubmVkID89IFtdXG5cbiAgICAgICAgcmV0dXJuIGlmIGVtcHR5IGZpbGVzICMgaGFwcGVucyB3aGVuIGZpcnN0IHdpbmRvdyBvcGVuc1xuXG4gICAgICAgIEB0YWJzID0gW11cblxuICAgICAgICB3aGlsZSBmaWxlcy5sZW5ndGhcbiAgICAgICAgICAgIEBhZGRUYWIgZmlsZXMuc2hpZnQoKVxuXG4gICAgICAgIEB0YWJzW2FjdGl2ZV0/LmFjdGl2YXRlKClcbiAgICAgICAgXG4gICAgICAgIGZvciBwaSBpbiAwLi4ucGlubmVkLmxlbmd0aFxuICAgICAgICAgICAgaWYgcGlubmVkW3BpXVxuICAgICAgICAgICAgICAgIEB0YWJzW3BpXS50b2dnbGVQaW5uZWQoKVxuXG4gICAgICAgIEB1cGRhdGUoKVxuXG4gICAgcmV2ZXJ0RmlsZTogKGZpbGUpID0+IEB0YWIoZmlsZSk/LnJldmVydCgpXG5cbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgICAgICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMFxuXG4gICAgdXBkYXRlOiAtPlxuXG4gICAgICAgIEBzdGFzaCgpXG5cbiAgICAgICAgcmV0dXJuIGlmIGVtcHR5IEB0YWJzXG5cbiAgICAgICAgcGtnID0gQHRhYnNbMF0ucGtnXG4gICAgICAgIEB0YWJzWzBdLnNob3dQa2coKVxuICAgICAgICBmb3IgdGFiIGluIEB0YWJzLnNsaWNlIDFcbiAgICAgICAgICAgIGlmIHRhYi5wa2cgPT0gcGtnXG4gICAgICAgICAgICAgICAgdGFiLmhpZGVQa2coKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHBrZyA9IHRhYi5wa2dcbiAgICAgICAgICAgICAgICB0YWIuc2hvd1BrZygpXG4gICAgICAgIEBcblxuICAgIG9uRGlydHk6IChkaXJ0eSkgPT5cblxuICAgICAgICBAYWN0aXZlVGFiKCk/LnNldERpcnR5IGRpcnR5XG5cbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgIDAwMCAwMDAgICAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgICAwMDAwMCAgICAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgIDAwMCAwMDAgICAgICAwMDBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDBcblxuICAgIG9uQ29udGV4dE1lbnU6IChldmVudCkgPT4gc3RvcEV2ZW50IGV2ZW50LCBAc2hvd0NvbnRleHRNZW51IGtwb3MgZXZlbnRcblxuICAgIHNob3dDb250ZXh0TWVudTogKGFic1BvcykgPT5cblxuICAgICAgICBpZiB0YWIgPSBAdGFiIGV2ZW50LnRhcmdldFxuICAgICAgICAgICAgdGFiLmFjdGl2YXRlKClcblxuICAgICAgICBpZiBub3QgYWJzUG9zP1xuICAgICAgICAgICAgYWJzUG9zID0ga3BvcyBAdmlldy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5sZWZ0LCBAdmlldy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS50b3BcblxuICAgICAgICBvcHQgPSBpdGVtczogW1xuICAgICAgICAgICAgdGV4dDogICAnQ2xvc2UgT3RoZXIgVGFicydcbiAgICAgICAgICAgIGNvbWJvOiAgJ2N0cmwrc2hpZnQrdydcbiAgICAgICAgLFxuICAgICAgICAgICAgdGV4dDogICAnTmV3IFdpbmRvdydcbiAgICAgICAgICAgIGNvbWJvOiAgJ2N0cmwrc2hpZnQrbidcbiAgICAgICAgXVxuXG4gICAgICAgIG9wdC54ID0gYWJzUG9zLnhcbiAgICAgICAgb3B0LnkgPSBhYnNQb3MueVxuICAgICAgICBwb3B1cC5tZW51IG9wdFxuXG5tb2R1bGUuZXhwb3J0cyA9IFRhYnNcbiJdfQ==
//# sourceURL=../../coffee/win/tabs.coffee