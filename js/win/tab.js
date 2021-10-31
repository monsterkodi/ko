// koffee 1.14.0

/*
000000000   0000000   0000000
   000     000   000  000   000
   000     000000000  0000000
   000     000   000  000   000
   000     000   000  0000000
 */
var File, Tab, elem, kerror, klog, post, ref, render, slash, syntax, tooltip,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), elem = ref.elem, kerror = ref.kerror, klog = ref.klog, post = ref.post, slash = ref.slash, tooltip = ref.tooltip;

File = require('../tools/file');

render = require('../editor/render');

syntax = require('../editor/syntax');

Tab = (function() {
    function Tab(tabs, file) {
        this.tabs = tabs;
        this.file = file;
        this.togglePinned = bind(this.togglePinned, this);
        this.dirty = false;
        this.pinned = false;
        this.div = elem({
            "class": 'tab',
            text: ''
        });
        this.tabs.div.appendChild(this.div);
        if (!this.file.startsWith('untitled')) {
            this.pkg = slash.pkg(this.file);
            if (this.pkg != null) {
                this.pkg = slash.basename(this.pkg);
            }
        }
        this.update();
        post.emit('watch', this.file);
    }

    Tab.prototype.foreignChanges = function(lineChanges) {
        if (this.foreign != null) {
            this.foreign;
        } else {
            this.foreign = [];
        }
        this.foreign.push(lineChanges);
        return this.update();
    };

    Tab.prototype.reload = function() {
        delete this.state;
        this.dirty = false;
        return this.update();
    };

    Tab.prototype.saveChanges = function() {
        var change, changes, i, j, len, len1, ref1, ref2;
        if (this.state) {
            if ((ref1 = this.foreign) != null ? ref1.length : void 0) {
                ref2 = this.foreign;
                for (i = 0, len = ref2.length; i < len; i++) {
                    changes = ref2[i];
                    for (j = 0, len1 = changes.length; j < len1; j++) {
                        change = changes[j];
                        switch (change.change) {
                            case 'changed':
                                this.state.state = this.state.state.changeLine(change.doIndex, change.after);
                                break;
                            case 'inserted':
                                this.state.state = this.state.state.insertLine(change.doIndex, change.after);
                                break;
                            case 'deleted':
                                this.state.state = this.state.state.deleteLine(change.doIndex);
                        }
                    }
                }
            }
            if (this.state.state) {
                return File.save(this.state.file, this.state.state.text(), (function(_this) {
                    return function(err) {
                        if (err) {
                            return kerror("tab.saveChanges failed " + err);
                        }
                        return _this.revert();
                    };
                })(this));
            } else {
                return kerror('tab.saveChanges -- nothing to save?');
            }
        } else {
            return post.emit('saveChanges');
        }
    };

    Tab.prototype.setFile = function(newFile) {
        if (!slash.samePath(this.file, newFile)) {
            this.file = slash.path(newFile);
            post.emit('watch', this.file);
            return this.update();
        }
    };

    Tab.prototype.storeState = function() {
        if (window.editor.currentFile) {
            return this.state = window.editor["do"].tabState();
        }
    };

    Tab.prototype.restoreState = function() {
        var ref1;
        if (((ref1 = this.state) != null ? ref1.file : void 0) == null) {
            return kerror('no file in state?', this.state);
        }
        window.editor["do"].setTabState(this.state);
        return delete this.state;
    };

    Tab.prototype.update = function() {
        var diss, html, name, sep;
        this.div.innerHTML = '';
        this.div.classList.toggle('dirty', this.dirty);
        sep = '●';
        if (window.editor.newlineCharacters === '\r\n') {
            sep = '■';
        }
        this.div.appendChild(elem('span', {
            "class": 'dot',
            text: sep
        }));
        sep = "<span class='dot'>►</span>";
        this.pkgDiv = elem('span', {
            "class": 'pkg',
            html: this.pkg && (this.pkg + sep) || ''
        });
        this.div.appendChild(this.pkgDiv);
        diss = syntax.dissForTextAndSyntax(slash.basename(this.file), 'ko');
        name = elem('span', {
            "class": 'name',
            html: render.line(diss, {
                charWidth: 0
            })
        });
        this.div.appendChild(name);
        html = '';
        if (this.pinned) {
            html = "<svg width=\"100%\" height=\"100%\" viewBox=\"0 0 30 30\">\n    <circle cx=\"15\" cy=\"12\" r=\"4\" />\n    <line x1=\"15\" y1=\"16\"  x2=\"15\"  y2=\"22\" stroke-linecap=\"round\"></line>\n</svg>";
        } else if (this.tmpTab) {
            html = "<svg width=\"100%\" height=\"100%\" viewBox=\"0 0 30 30\">\n    <circle cx=\"15\" cy=\"10\" r=\"2\" />\n    <circle cx=\"15\" cy=\"15\" r=\"2\" />\n    <circle cx=\"15\" cy=\"20\" r=\"2\" />\n</svg>";
        }
        this.div.appendChild(elem({
            "class": 'tabstate',
            html: html,
            click: this.togglePinned
        }));
        if (this.file != null) {
            diss = syntax.dissForTextAndSyntax(slash.tilde(this.file), 'ko');
            html = render.line(diss, {
                charWidth: 0
            });
            this.tooltip = new tooltip({
                elem: name,
                html: html,
                x: 0
            });
        }
        if (this.dirty) {
            this.div.appendChild(elem('span', {
                "class": 'dot',
                text: '●'
            }));
        }
        return this;
    };

    Tab.prototype.index = function() {
        return this.tabs.tabs.indexOf(this);
    };

    Tab.prototype.prev = function() {
        if (this.index() > 0) {
            return this.tabs.tab(this.index() - 1);
        }
    };

    Tab.prototype.next = function() {
        if (this.index() < this.tabs.numTabs() - 1) {
            return this.tabs.tab(this.index() + 1);
        }
    };

    Tab.prototype.nextOrPrev = function() {
        var ref1;
        return (ref1 = this.next()) != null ? ref1 : this.prev();
    };

    Tab.prototype.close = function() {
        var ref1;
        post.emit('unwatch', this.file);
        if (this.dirty) {
            this.saveChanges();
        }
        this.div.remove();
        if ((ref1 = this.tooltip) != null) {
            ref1.del();
        }
        post.emit('tabClosed', this.file);
        return this;
    };

    Tab.prototype.hidePkg = function() {
        var ref1;
        return (ref1 = this.pkgDiv) != null ? ref1.style.display = 'none' : void 0;
    };

    Tab.prototype.showPkg = function() {
        var ref1;
        return (ref1 = this.pkgDiv) != null ? ref1.style.display = 'initial' : void 0;
    };

    Tab.prototype.setDirty = function(dirty) {
        if (this.dirty !== dirty) {
            this.dirty = dirty;
            if (this.dirty) {
                delete this.tmpTab;
            }
            this.update();
        }
        return this;
    };

    Tab.prototype.togglePinned = function() {
        this.pinned = !this.pinned;
        delete this.tmpTab;
        this.update();
        return this;
    };

    Tab.prototype.revert = function() {
        delete this.foreign;
        delete this.state;
        this.dirty = false;
        this.update();
        this.tabs.update();
        return this;
    };

    Tab.prototype.activate = function() {
        post.emit('jumpToFile', {
            file: this.file
        });
        return this;
    };

    Tab.prototype.finishActivation = function() {
        var changes, i, len, ref1, ref2;
        klog('tab.finishActivation', this.file);
        this.setActive();
        if (this.state != null) {
            this.restoreState();
        }
        if ((ref1 = this.foreign) != null ? ref1.length : void 0) {
            ref2 = this.foreign;
            for (i = 0, len = ref2.length; i < len; i++) {
                changes = ref2[i];
                window.editor["do"].foreignChanges(changes);
            }
            delete this.foreign;
        }
        this.tabs.update();
        return this;
    };

    Tab.prototype.isActive = function() {
        return this.div.classList.contains('active');
    };

    Tab.prototype.setActive = function() {
        if (!this.isActive()) {
            this.div.classList.add('active');
        }
        return this;
    };

    Tab.prototype.clearActive = function() {
        this.div.classList.remove('active');
        return this;
    };

    return Tab;

})();

module.exports = Tab;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFiLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uL2NvZmZlZS93aW4iLCJzb3VyY2VzIjpbInRhYi5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsd0VBQUE7SUFBQTs7QUFRQSxNQUErQyxPQUFBLENBQVEsS0FBUixDQUEvQyxFQUFFLGVBQUYsRUFBUSxtQkFBUixFQUFnQixlQUFoQixFQUFzQixlQUF0QixFQUE0QixpQkFBNUIsRUFBbUM7O0FBRW5DLElBQUEsR0FBVSxPQUFBLENBQVEsZUFBUjs7QUFDVixNQUFBLEdBQVUsT0FBQSxDQUFRLGtCQUFSOztBQUNWLE1BQUEsR0FBVSxPQUFBLENBQVEsa0JBQVI7O0FBRUo7SUFFQyxhQUFDLElBQUQsRUFBUSxJQUFSO1FBQUMsSUFBQyxDQUFBLE9BQUQ7UUFBTyxJQUFDLENBQUEsT0FBRDs7UUFFUCxJQUFDLENBQUEsS0FBRCxHQUFTO1FBQ1QsSUFBQyxDQUFBLE1BQUQsR0FBVTtRQUNWLElBQUMsQ0FBQSxHQUFELEdBQU8sSUFBQSxDQUFLO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxLQUFQO1lBQWEsSUFBQSxFQUFNLEVBQW5CO1NBQUw7UUFDUCxJQUFDLENBQUEsSUFBSSxDQUFDLEdBQUcsQ0FBQyxXQUFWLENBQXNCLElBQUMsQ0FBQSxHQUF2QjtRQUVBLElBQUcsQ0FBSSxJQUFDLENBQUEsSUFBSSxDQUFDLFVBQU4sQ0FBaUIsVUFBakIsQ0FBUDtZQUNJLElBQUMsQ0FBQSxHQUFELEdBQU8sS0FBSyxDQUFDLEdBQU4sQ0FBVSxJQUFDLENBQUEsSUFBWDtZQUNQLElBQThCLGdCQUE5QjtnQkFBQSxJQUFDLENBQUEsR0FBRCxHQUFPLEtBQUssQ0FBQyxRQUFOLENBQWUsSUFBQyxDQUFBLEdBQWhCLEVBQVA7YUFGSjs7UUFJQSxJQUFDLENBQUEsTUFBRCxDQUFBO1FBRUEsSUFBSSxDQUFDLElBQUwsQ0FBVSxPQUFWLEVBQWtCLElBQUMsQ0FBQSxJQUFuQjtJQWJEOztrQkFlSCxjQUFBLEdBQWdCLFNBQUMsV0FBRDs7WUFFWixJQUFDLENBQUE7O1lBQUQsSUFBQyxDQUFBLFVBQVc7O1FBQ1osSUFBQyxDQUFBLE9BQU8sQ0FBQyxJQUFULENBQWMsV0FBZDtlQUNBLElBQUMsQ0FBQSxNQUFELENBQUE7SUFKWTs7a0JBTWhCLE1BQUEsR0FBUSxTQUFBO1FBRUosT0FBTyxJQUFDLENBQUE7UUFDUixJQUFDLENBQUEsS0FBRCxHQUFTO2VBQ1QsSUFBQyxDQUFBLE1BQUQsQ0FBQTtJQUpJOztrQkFZUixXQUFBLEdBQWEsU0FBQTtBQUVULFlBQUE7UUFBQSxJQUFHLElBQUMsQ0FBQSxLQUFKO1lBRUksd0NBQVcsQ0FBRSxlQUFiO0FBQ0k7QUFBQSxxQkFBQSxzQ0FBQTs7QUFDSSx5QkFBQSwyQ0FBQTs7QUFDSSxnQ0FBTyxNQUFNLENBQUMsTUFBZDtBQUFBLGlDQUNTLFNBRFQ7Z0NBQ3lCLElBQUMsQ0FBQSxLQUFLLENBQUMsS0FBUCxHQUFlLElBQUMsQ0FBQSxLQUFLLENBQUMsS0FBSyxDQUFDLFVBQWIsQ0FBd0IsTUFBTSxDQUFDLE9BQS9CLEVBQXdDLE1BQU0sQ0FBQyxLQUEvQztBQUEvQjtBQURULGlDQUVTLFVBRlQ7Z0NBRXlCLElBQUMsQ0FBQSxLQUFLLENBQUMsS0FBUCxHQUFlLElBQUMsQ0FBQSxLQUFLLENBQUMsS0FBSyxDQUFDLFVBQWIsQ0FBd0IsTUFBTSxDQUFDLE9BQS9CLEVBQXdDLE1BQU0sQ0FBQyxLQUEvQztBQUEvQjtBQUZULGlDQUdTLFNBSFQ7Z0NBR3lCLElBQUMsQ0FBQSxLQUFLLENBQUMsS0FBUCxHQUFlLElBQUMsQ0FBQSxLQUFLLENBQUMsS0FBSyxDQUFDLFVBQWIsQ0FBd0IsTUFBTSxDQUFDLE9BQS9CO0FBSHhDO0FBREo7QUFESixpQkFESjs7WUFRQSxJQUFHLElBQUMsQ0FBQSxLQUFLLENBQUMsS0FBVjt1QkFDSSxJQUFJLENBQUMsSUFBTCxDQUFVLElBQUMsQ0FBQSxLQUFLLENBQUMsSUFBakIsRUFBdUIsSUFBQyxDQUFBLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBYixDQUFBLENBQXZCLEVBQTRDLENBQUEsU0FBQSxLQUFBOzJCQUFBLFNBQUMsR0FBRDt3QkFDeEMsSUFBaUQsR0FBakQ7QUFBQSxtQ0FBTyxNQUFBLENBQU8seUJBQUEsR0FBMEIsR0FBakMsRUFBUDs7K0JBQ0EsS0FBQyxDQUFBLE1BQUQsQ0FBQTtvQkFGd0M7Z0JBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUE1QyxFQURKO2FBQUEsTUFBQTt1QkFLSSxNQUFBLENBQU8scUNBQVAsRUFMSjthQVZKO1NBQUEsTUFBQTttQkFpQkksSUFBSSxDQUFDLElBQUwsQ0FBVSxhQUFWLEVBakJKOztJQUZTOztrQkFxQmIsT0FBQSxHQUFTLFNBQUMsT0FBRDtRQUVMLElBQUcsQ0FBSSxLQUFLLENBQUMsUUFBTixDQUFlLElBQUMsQ0FBQSxJQUFoQixFQUFzQixPQUF0QixDQUFQO1lBRUksSUFBQyxDQUFBLElBQUQsR0FBUSxLQUFLLENBQUMsSUFBTixDQUFXLE9BQVg7WUFDUixJQUFJLENBQUMsSUFBTCxDQUFVLE9BQVYsRUFBa0IsSUFBQyxDQUFBLElBQW5CO21CQUNBLElBQUMsQ0FBQSxNQUFELENBQUEsRUFKSjs7SUFGSzs7a0JBY1QsVUFBQSxHQUFZLFNBQUE7UUFFUixJQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsV0FBakI7bUJBQ0ksSUFBQyxDQUFBLEtBQUQsR0FBUyxNQUFNLENBQUMsTUFBTSxFQUFDLEVBQUQsRUFBRyxDQUFDLFFBQWpCLENBQUEsRUFEYjs7SUFGUTs7a0JBS1osWUFBQSxHQUFjLFNBQUE7QUFFVixZQUFBO1FBQUEsSUFBZ0QsMERBQWhEO0FBQUEsbUJBQU8sTUFBQSxDQUFPLG1CQUFQLEVBQTJCLElBQUMsQ0FBQSxLQUE1QixFQUFQOztRQUNBLE1BQU0sQ0FBQyxNQUFNLEVBQUMsRUFBRCxFQUFHLENBQUMsV0FBakIsQ0FBNkIsSUFBQyxDQUFBLEtBQTlCO2VBQ0EsT0FBTyxJQUFDLENBQUE7SUFKRTs7a0JBWWQsTUFBQSxHQUFRLFNBQUE7QUFFSixZQUFBO1FBQUEsSUFBQyxDQUFBLEdBQUcsQ0FBQyxTQUFMLEdBQWlCO1FBQ2pCLElBQUMsQ0FBQSxHQUFHLENBQUMsU0FBUyxDQUFDLE1BQWYsQ0FBc0IsT0FBdEIsRUFBOEIsSUFBQyxDQUFBLEtBQS9CO1FBRUEsR0FBQSxHQUFNO1FBQ04sSUFBYSxNQUFNLENBQUMsTUFBTSxDQUFDLGlCQUFkLEtBQW1DLE1BQWhEO1lBQUEsR0FBQSxHQUFNLElBQU47O1FBQ0EsSUFBQyxDQUFBLEdBQUcsQ0FBQyxXQUFMLENBQWlCLElBQUEsQ0FBSyxNQUFMLEVBQVk7WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFNLEtBQU47WUFBWSxJQUFBLEVBQUssR0FBakI7U0FBWixDQUFqQjtRQUVBLEdBQUEsR0FBTTtRQUNOLElBQUMsQ0FBQSxNQUFELEdBQVUsSUFBQSxDQUFLLE1BQUwsRUFBWTtZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU0sS0FBTjtZQUFZLElBQUEsRUFBTSxJQUFDLENBQUEsR0FBRCxJQUFTLENBQUMsSUFBQyxDQUFBLEdBQUQsR0FBTyxHQUFSLENBQVQsSUFBeUIsRUFBM0M7U0FBWjtRQUNWLElBQUMsQ0FBQSxHQUFHLENBQUMsV0FBTCxDQUFpQixJQUFDLENBQUEsTUFBbEI7UUFFQSxJQUFBLEdBQU8sTUFBTSxDQUFDLG9CQUFQLENBQTRCLEtBQUssQ0FBQyxRQUFOLENBQWUsSUFBQyxDQUFBLElBQWhCLENBQTVCLEVBQW1ELElBQW5EO1FBQ1AsSUFBQSxHQUFPLElBQUEsQ0FBSyxNQUFMLEVBQVk7WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFNLE1BQU47WUFBYSxJQUFBLEVBQUssTUFBTSxDQUFDLElBQVAsQ0FBWSxJQUFaLEVBQWtCO2dCQUFBLFNBQUEsRUFBVSxDQUFWO2FBQWxCLENBQWxCO1NBQVo7UUFDUCxJQUFDLENBQUEsR0FBRyxDQUFDLFdBQUwsQ0FBaUIsSUFBakI7UUFFQSxJQUFBLEdBQU87UUFDUCxJQUFHLElBQUMsQ0FBQSxNQUFKO1lBQ0ksSUFBQSxHQUFPLHVNQURYO1NBQUEsTUFPSyxJQUFHLElBQUMsQ0FBQSxNQUFKO1lBQ0QsSUFBQSxHQUFPLHlNQUROOztRQVNMLElBQUMsQ0FBQSxHQUFHLENBQUMsV0FBTCxDQUFpQixJQUFBLENBQUs7WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFNLFVBQU47WUFBaUIsSUFBQSxFQUFLLElBQXRCO1lBQTRCLEtBQUEsRUFBTSxJQUFDLENBQUEsWUFBbkM7U0FBTCxDQUFqQjtRQUVBLElBQUcsaUJBQUg7WUFDSSxJQUFBLEdBQU8sTUFBTSxDQUFDLG9CQUFQLENBQTRCLEtBQUssQ0FBQyxLQUFOLENBQVksSUFBQyxDQUFBLElBQWIsQ0FBNUIsRUFBZ0QsSUFBaEQ7WUFDUCxJQUFBLEdBQU8sTUFBTSxDQUFDLElBQVAsQ0FBWSxJQUFaLEVBQWtCO2dCQUFBLFNBQUEsRUFBVSxDQUFWO2FBQWxCO1lBQ1AsSUFBQyxDQUFBLE9BQUQsR0FBVyxJQUFJLE9BQUosQ0FBWTtnQkFBQSxJQUFBLEVBQUssSUFBTDtnQkFBVyxJQUFBLEVBQUssSUFBaEI7Z0JBQXNCLENBQUEsRUFBRSxDQUF4QjthQUFaLEVBSGY7O1FBS0EsSUFBcUQsSUFBQyxDQUFBLEtBQXREO1lBQUEsSUFBQyxDQUFBLEdBQUcsQ0FBQyxXQUFMLENBQWlCLElBQUEsQ0FBSyxNQUFMLEVBQVk7Z0JBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTSxLQUFOO2dCQUFZLElBQUEsRUFBSyxHQUFqQjthQUFaLENBQWpCLEVBQUE7O2VBQ0E7SUExQ0k7O2tCQTRDUixLQUFBLEdBQU8sU0FBQTtlQUFHLElBQUMsQ0FBQSxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQVgsQ0FBbUIsSUFBbkI7SUFBSDs7a0JBQ1AsSUFBQSxHQUFPLFNBQUE7UUFBRyxJQUF3QixJQUFDLENBQUEsS0FBRCxDQUFBLENBQUEsR0FBVyxDQUFuQzttQkFBQSxJQUFDLENBQUEsSUFBSSxDQUFDLEdBQU4sQ0FBVSxJQUFDLENBQUEsS0FBRCxDQUFBLENBQUEsR0FBUyxDQUFuQixFQUFBOztJQUFIOztrQkFDUCxJQUFBLEdBQU8sU0FBQTtRQUFHLElBQXdCLElBQUMsQ0FBQSxLQUFELENBQUEsQ0FBQSxHQUFXLElBQUMsQ0FBQSxJQUFJLENBQUMsT0FBTixDQUFBLENBQUEsR0FBZ0IsQ0FBbkQ7bUJBQUEsSUFBQyxDQUFBLElBQUksQ0FBQyxHQUFOLENBQVUsSUFBQyxDQUFBLEtBQUQsQ0FBQSxDQUFBLEdBQVMsQ0FBbkIsRUFBQTs7SUFBSDs7a0JBQ1AsVUFBQSxHQUFZLFNBQUE7QUFBRyxZQUFBO3FEQUFVLElBQUMsQ0FBQSxJQUFELENBQUE7SUFBYjs7a0JBRVosS0FBQSxHQUFPLFNBQUE7QUFFSCxZQUFBO1FBQUEsSUFBSSxDQUFDLElBQUwsQ0FBVSxTQUFWLEVBQW9CLElBQUMsQ0FBQSxJQUFyQjtRQUVBLElBQUcsSUFBQyxDQUFBLEtBQUo7WUFDSSxJQUFDLENBQUEsV0FBRCxDQUFBLEVBREo7O1FBR0EsSUFBQyxDQUFBLEdBQUcsQ0FBQyxNQUFMLENBQUE7O2dCQUNRLENBQUUsR0FBVixDQUFBOztRQUNBLElBQUksQ0FBQyxJQUFMLENBQVUsV0FBVixFQUFzQixJQUFDLENBQUEsSUFBdkI7ZUFDQTtJQVZHOztrQkFZUCxPQUFBLEdBQVMsU0FBQTtBQUFHLFlBQUE7a0RBQU8sQ0FBRSxLQUFLLENBQUMsT0FBZixHQUF5QjtJQUE1Qjs7a0JBQ1QsT0FBQSxHQUFTLFNBQUE7QUFBRyxZQUFBO2tEQUFPLENBQUUsS0FBSyxDQUFDLE9BQWYsR0FBeUI7SUFBNUI7O2tCQVFULFFBQUEsR0FBVSxTQUFDLEtBQUQ7UUFFTixJQUFHLElBQUMsQ0FBQSxLQUFELEtBQVUsS0FBYjtZQUNJLElBQUMsQ0FBQSxLQUFELEdBQVM7WUFDVCxJQUFHLElBQUMsQ0FBQSxLQUFKO2dCQUFlLE9BQU8sSUFBQyxDQUFBLE9BQXZCOztZQUNBLElBQUMsQ0FBQSxNQUFELENBQUEsRUFISjs7ZUFJQTtJQU5NOztrQkFRVixZQUFBLEdBQWMsU0FBQTtRQUVWLElBQUMsQ0FBQSxNQUFELEdBQVUsQ0FBSSxJQUFDLENBQUE7UUFDZixPQUFPLElBQUMsQ0FBQTtRQUNSLElBQUMsQ0FBQSxNQUFELENBQUE7ZUFDQTtJQUxVOztrQkFhZCxNQUFBLEdBQVEsU0FBQTtRQUVKLE9BQU8sSUFBQyxDQUFBO1FBQ1IsT0FBTyxJQUFDLENBQUE7UUFDUixJQUFDLENBQUEsS0FBRCxHQUFTO1FBQ1QsSUFBQyxDQUFBLE1BQUQsQ0FBQTtRQUNBLElBQUMsQ0FBQSxJQUFJLENBQUMsTUFBTixDQUFBO2VBQ0E7SUFQSTs7a0JBZVIsUUFBQSxHQUFVLFNBQUE7UUFFTixJQUFJLENBQUMsSUFBTCxDQUFVLFlBQVYsRUFBdUI7WUFBQSxJQUFBLEVBQUssSUFBQyxDQUFBLElBQU47U0FBdkI7ZUFDQTtJQUhNOztrQkFLVixnQkFBQSxHQUFrQixTQUFBO0FBRWQsWUFBQTtRQUFBLElBQUEsQ0FBSyxzQkFBTCxFQUE0QixJQUFDLENBQUEsSUFBN0I7UUFFQSxJQUFDLENBQUEsU0FBRCxDQUFBO1FBRUEsSUFBRyxrQkFBSDtZQUNJLElBQUMsQ0FBQSxZQUFELENBQUEsRUFESjs7UUFHQSx3Q0FBVyxDQUFFLGVBQWI7QUFDSTtBQUFBLGlCQUFBLHNDQUFBOztnQkFDSSxNQUFNLENBQUMsTUFBTSxFQUFDLEVBQUQsRUFBRyxDQUFDLGNBQWpCLENBQWdDLE9BQWhDO0FBREo7WUFFQSxPQUFPLElBQUMsQ0FBQSxRQUhaOztRQUtBLElBQUMsQ0FBQSxJQUFJLENBQUMsTUFBTixDQUFBO2VBQ0E7SUFmYzs7a0JBdUJsQixRQUFBLEdBQVUsU0FBQTtlQUFHLElBQUMsQ0FBQSxHQUFHLENBQUMsU0FBUyxDQUFDLFFBQWYsQ0FBd0IsUUFBeEI7SUFBSDs7a0JBRVYsU0FBQSxHQUFXLFNBQUE7UUFFUCxJQUFHLENBQUksSUFBQyxDQUFBLFFBQUQsQ0FBQSxDQUFQO1lBQ0ksSUFBQyxDQUFBLEdBQUcsQ0FBQyxTQUFTLENBQUMsR0FBZixDQUFtQixRQUFuQixFQURKOztlQUVBO0lBSk87O2tCQU1YLFdBQUEsR0FBYSxTQUFBO1FBRVQsSUFBQyxDQUFBLEdBQUcsQ0FBQyxTQUFTLENBQUMsTUFBZixDQUFzQixRQUF0QjtlQUNBO0lBSFM7Ozs7OztBQUtqQixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDBcbiAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgIDAwMCAgICAgMDAwMDAwMDAwICAwMDAwMDAwXG4gICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuIyMjXG5cbnsgZWxlbSwga2Vycm9yLCBrbG9nLCBwb3N0LCBzbGFzaCwgdG9vbHRpcCB9ID0gcmVxdWlyZSAna3hrJ1xuXG5GaWxlICAgID0gcmVxdWlyZSAnLi4vdG9vbHMvZmlsZSdcbnJlbmRlciAgPSByZXF1aXJlICcuLi9lZGl0b3IvcmVuZGVyJ1xuc3ludGF4ICA9IHJlcXVpcmUgJy4uL2VkaXRvci9zeW50YXgnXG5cbmNsYXNzIFRhYlxuXG4gICAgQDogKEB0YWJzLCBAZmlsZSkgLT5cblxuICAgICAgICBAZGlydHkgPSBmYWxzZVxuICAgICAgICBAcGlubmVkID0gZmFsc2VcbiAgICAgICAgQGRpdiA9IGVsZW0gY2xhc3M6ICd0YWInIHRleHQ6ICcnXG4gICAgICAgIEB0YWJzLmRpdi5hcHBlbmRDaGlsZCBAZGl2XG5cbiAgICAgICAgaWYgbm90IEBmaWxlLnN0YXJ0c1dpdGggJ3VudGl0bGVkJ1xuICAgICAgICAgICAgQHBrZyA9IHNsYXNoLnBrZyBAZmlsZVxuICAgICAgICAgICAgQHBrZyA9IHNsYXNoLmJhc2VuYW1lIEBwa2cgaWYgQHBrZz9cblxuICAgICAgICBAdXBkYXRlKClcblxuICAgICAgICBwb3N0LmVtaXQgJ3dhdGNoJyBAZmlsZVxuXG4gICAgZm9yZWlnbkNoYW5nZXM6IChsaW5lQ2hhbmdlcykgLT5cblxuICAgICAgICBAZm9yZWlnbiA/PSBbXVxuICAgICAgICBAZm9yZWlnbi5wdXNoIGxpbmVDaGFuZ2VzXG4gICAgICAgIEB1cGRhdGUoKVxuXG4gICAgcmVsb2FkOiAtPlxuXG4gICAgICAgIGRlbGV0ZSBAc3RhdGVcbiAgICAgICAgQGRpcnR5ID0gZmFsc2VcbiAgICAgICAgQHVwZGF0ZSgpXG5cbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAwICAgMDAwIDAwMCAgIDAwMDAwMDBcbiAgICAjICAgICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwICAgMDAwICAgICAgMCAgICAgIDAwMDAwMDAwXG5cbiAgICBzYXZlQ2hhbmdlczogLT5cblxuICAgICAgICBpZiBAc3RhdGVcblxuICAgICAgICAgICAgaWYgQGZvcmVpZ24/Lmxlbmd0aFxuICAgICAgICAgICAgICAgIGZvciBjaGFuZ2VzIGluIEBmb3JlaWduXG4gICAgICAgICAgICAgICAgICAgIGZvciBjaGFuZ2UgaW4gY2hhbmdlc1xuICAgICAgICAgICAgICAgICAgICAgICAgc3dpdGNoIGNoYW5nZS5jaGFuZ2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aGVuICdjaGFuZ2VkJyAgdGhlbiBAc3RhdGUuc3RhdGUgPSBAc3RhdGUuc3RhdGUuY2hhbmdlTGluZSBjaGFuZ2UuZG9JbmRleCwgY2hhbmdlLmFmdGVyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2hlbiAnaW5zZXJ0ZWQnIHRoZW4gQHN0YXRlLnN0YXRlID0gQHN0YXRlLnN0YXRlLmluc2VydExpbmUgY2hhbmdlLmRvSW5kZXgsIGNoYW5nZS5hZnRlclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdoZW4gJ2RlbGV0ZWQnICB0aGVuIEBzdGF0ZS5zdGF0ZSA9IEBzdGF0ZS5zdGF0ZS5kZWxldGVMaW5lIGNoYW5nZS5kb0luZGV4XG5cbiAgICAgICAgICAgIGlmIEBzdGF0ZS5zdGF0ZVxuICAgICAgICAgICAgICAgIEZpbGUuc2F2ZSBAc3RhdGUuZmlsZSwgQHN0YXRlLnN0YXRlLnRleHQoKSwgKGVycikgPT5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGtlcnJvciBcInRhYi5zYXZlQ2hhbmdlcyBmYWlsZWQgI3tlcnJ9XCIgaWYgZXJyXG4gICAgICAgICAgICAgICAgICAgIEByZXZlcnQoKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGtlcnJvciAndGFiLnNhdmVDaGFuZ2VzIC0tIG5vdGhpbmcgdG8gc2F2ZT8nXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHBvc3QuZW1pdCAnc2F2ZUNoYW5nZXMnXG5cbiAgICBzZXRGaWxlOiAobmV3RmlsZSkgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIG5vdCBzbGFzaC5zYW1lUGF0aCBAZmlsZSwgbmV3RmlsZVxuICAgICAgICAgICAgIyBrbG9nICd0YWIuc2V0RmlsZScgc2xhc2gucGF0aCBuZXdGaWxlXG4gICAgICAgICAgICBAZmlsZSA9IHNsYXNoLnBhdGggbmV3RmlsZVxuICAgICAgICAgICAgcG9zdC5lbWl0ICd3YXRjaCcgQGZpbGVcbiAgICAgICAgICAgIEB1cGRhdGUoKVxuICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwXG4gICAgIyAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDBcblxuICAgIHN0b3JlU3RhdGU6IC0+XG5cbiAgICAgICAgaWYgd2luZG93LmVkaXRvci5jdXJyZW50RmlsZVxuICAgICAgICAgICAgQHN0YXRlID0gd2luZG93LmVkaXRvci5kby50YWJTdGF0ZSgpXG5cbiAgICByZXN0b3JlU3RhdGU6IC0+XG5cbiAgICAgICAgcmV0dXJuIGtlcnJvciAnbm8gZmlsZSBpbiBzdGF0ZT8nIEBzdGF0ZSBpZiBub3QgQHN0YXRlPy5maWxlP1xuICAgICAgICB3aW5kb3cuZWRpdG9yLmRvLnNldFRhYlN0YXRlIEBzdGF0ZVxuICAgICAgICBkZWxldGUgQHN0YXRlXG5cbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgICAgICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMFxuXG4gICAgdXBkYXRlOiAtPlxuXG4gICAgICAgIEBkaXYuaW5uZXJIVE1MID0gJydcbiAgICAgICAgQGRpdi5jbGFzc0xpc3QudG9nZ2xlICdkaXJ0eScgQGRpcnR5XG5cbiAgICAgICAgc2VwID0gJ+KXjydcbiAgICAgICAgc2VwID0gJ+KWoCcgaWYgd2luZG93LmVkaXRvci5uZXdsaW5lQ2hhcmFjdGVycyA9PSAnXFxyXFxuJ1xuICAgICAgICBAZGl2LmFwcGVuZENoaWxkIGVsZW0gJ3NwYW4nIGNsYXNzOidkb3QnIHRleHQ6c2VwXG5cbiAgICAgICAgc2VwID0gXCI8c3BhbiBjbGFzcz0nZG90Jz7ilro8L3NwYW4+XCJcbiAgICAgICAgQHBrZ0RpdiA9IGVsZW0gJ3NwYW4nIGNsYXNzOidwa2cnIGh0bWw6IEBwa2cgYW5kIChAcGtnICsgc2VwKSBvciAnJ1xuICAgICAgICBAZGl2LmFwcGVuZENoaWxkIEBwa2dEaXZcblxuICAgICAgICBkaXNzID0gc3ludGF4LmRpc3NGb3JUZXh0QW5kU3ludGF4IHNsYXNoLmJhc2VuYW1lKEBmaWxlKSwgJ2tvJ1xuICAgICAgICBuYW1lID0gZWxlbSAnc3BhbicgY2xhc3M6J25hbWUnIGh0bWw6cmVuZGVyLmxpbmUgZGlzcywgY2hhcldpZHRoOjBcbiAgICAgICAgQGRpdi5hcHBlbmRDaGlsZCBuYW1lXG5cbiAgICAgICAgaHRtbCA9ICcnXG4gICAgICAgIGlmIEBwaW5uZWRcbiAgICAgICAgICAgIGh0bWwgPSBcIlwiXCJcbiAgICAgICAgICAgIDxzdmcgd2lkdGg9XCIxMDAlXCIgaGVpZ2h0PVwiMTAwJVwiIHZpZXdCb3g9XCIwIDAgMzAgMzBcIj5cbiAgICAgICAgICAgICAgICA8Y2lyY2xlIGN4PVwiMTVcIiBjeT1cIjEyXCIgcj1cIjRcIiAvPlxuICAgICAgICAgICAgICAgIDxsaW5lIHgxPVwiMTVcIiB5MT1cIjE2XCIgIHgyPVwiMTVcIiAgeTI9XCIyMlwiIHN0cm9rZS1saW5lY2FwPVwicm91bmRcIj48L2xpbmU+XG4gICAgICAgICAgICA8L3N2Zz5cbiAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICBlbHNlIGlmIEB0bXBUYWJcbiAgICAgICAgICAgIGh0bWwgPSBcIlwiXCJcbiAgICAgICAgICAgIDxzdmcgd2lkdGg9XCIxMDAlXCIgaGVpZ2h0PVwiMTAwJVwiIHZpZXdCb3g9XCIwIDAgMzAgMzBcIj5cbiAgICAgICAgICAgICAgICA8Y2lyY2xlIGN4PVwiMTVcIiBjeT1cIjEwXCIgcj1cIjJcIiAvPlxuICAgICAgICAgICAgICAgIDxjaXJjbGUgY3g9XCIxNVwiIGN5PVwiMTVcIiByPVwiMlwiIC8+XG4gICAgICAgICAgICAgICAgPGNpcmNsZSBjeD1cIjE1XCIgY3k9XCIyMFwiIHI9XCIyXCIgLz5cbiAgICAgICAgICAgIDwvc3ZnPlxuICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIEBkaXYuYXBwZW5kQ2hpbGQgZWxlbSBjbGFzczondGFic3RhdGUnIGh0bWw6aHRtbCwgY2xpY2s6QHRvZ2dsZVBpbm5lZFxuXG4gICAgICAgIGlmIEBmaWxlP1xuICAgICAgICAgICAgZGlzcyA9IHN5bnRheC5kaXNzRm9yVGV4dEFuZFN5bnRheCBzbGFzaC50aWxkZShAZmlsZSksICdrbydcbiAgICAgICAgICAgIGh0bWwgPSByZW5kZXIubGluZSBkaXNzLCBjaGFyV2lkdGg6MFxuICAgICAgICAgICAgQHRvb2x0aXAgPSBuZXcgdG9vbHRpcCBlbGVtOm5hbWUsIGh0bWw6aHRtbCwgeDowXG5cbiAgICAgICAgQGRpdi5hcHBlbmRDaGlsZCBlbGVtICdzcGFuJyBjbGFzczonZG90JyB0ZXh0Oifil48nIGlmIEBkaXJ0eVxuICAgICAgICBAXG5cbiAgICBpbmRleDogLT4gQHRhYnMudGFicy5pbmRleE9mIEBcbiAgICBwcmV2OiAgLT4gQHRhYnMudGFiIEBpbmRleCgpLTEgaWYgQGluZGV4KCkgPiAwXG4gICAgbmV4dDogIC0+IEB0YWJzLnRhYiBAaW5kZXgoKSsxIGlmIEBpbmRleCgpIDwgQHRhYnMubnVtVGFicygpLTFcbiAgICBuZXh0T3JQcmV2OiAtPiBAbmV4dCgpID8gQHByZXYoKVxuXG4gICAgY2xvc2U6IC0+XG5cbiAgICAgICAgcG9zdC5lbWl0ICd1bndhdGNoJyBAZmlsZVxuXG4gICAgICAgIGlmIEBkaXJ0eVxuICAgICAgICAgICAgQHNhdmVDaGFuZ2VzKClcblxuICAgICAgICBAZGl2LnJlbW92ZSgpXG4gICAgICAgIEB0b29sdGlwPy5kZWwoKVxuICAgICAgICBwb3N0LmVtaXQgJ3RhYkNsb3NlZCcgQGZpbGVcbiAgICAgICAgQFxuXG4gICAgaGlkZVBrZzogLT4gQHBrZ0Rpdj8uc3R5bGUuZGlzcGxheSA9ICdub25lJ1xuICAgIHNob3dQa2c6IC0+IEBwa2dEaXY/LnN0eWxlLmRpc3BsYXkgPSAnaW5pdGlhbCdcblxuICAgICMgMDAwMDAwMCAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgIDAwMCAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwICAgICAgIDAwMCAgICAgICAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgICAgMDAwXG5cbiAgICBzZXREaXJ0eTogKGRpcnR5KSAtPlxuXG4gICAgICAgIGlmIEBkaXJ0eSAhPSBkaXJ0eVxuICAgICAgICAgICAgQGRpcnR5ID0gZGlydHlcbiAgICAgICAgICAgIGlmIEBkaXJ0eSB0aGVuIGRlbGV0ZSBAdG1wVGFiXG4gICAgICAgICAgICBAdXBkYXRlKClcbiAgICAgICAgQFxuICAgICAgICBcbiAgICB0b2dnbGVQaW5uZWQ6ID0+XG4gICAgICAgIFxuICAgICAgICBAcGlubmVkID0gbm90IEBwaW5uZWRcbiAgICAgICAgZGVsZXRlIEB0bXBUYWJcbiAgICAgICAgQHVwZGF0ZSgpXG4gICAgICAgIEBcblxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgICAwICAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwXG5cbiAgICByZXZlcnQ6IC0+XG5cbiAgICAgICAgZGVsZXRlIEBmb3JlaWduXG4gICAgICAgIGRlbGV0ZSBAc3RhdGVcbiAgICAgICAgQGRpcnR5ID0gZmFsc2VcbiAgICAgICAgQHVwZGF0ZSgpXG4gICAgICAgIEB0YWJzLnVwZGF0ZSgpXG4gICAgICAgIEBcblxuICAgICMgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAwMDAgICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAgICAwICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwXG5cbiAgICBhY3RpdmF0ZTogLT5cblxuICAgICAgICBwb3N0LmVtaXQgJ2p1bXBUb0ZpbGUnIGZpbGU6QGZpbGVcbiAgICAgICAgQFxuXG4gICAgZmluaXNoQWN0aXZhdGlvbjogLT5cblxuICAgICAgICBrbG9nICd0YWIuZmluaXNoQWN0aXZhdGlvbicgQGZpbGVcbiAgICAgICAgXG4gICAgICAgIEBzZXRBY3RpdmUoKVxuXG4gICAgICAgIGlmIEBzdGF0ZT9cbiAgICAgICAgICAgIEByZXN0b3JlU3RhdGUoKVxuXG4gICAgICAgIGlmIEBmb3JlaWduPy5sZW5ndGhcbiAgICAgICAgICAgIGZvciBjaGFuZ2VzIGluIEBmb3JlaWduXG4gICAgICAgICAgICAgICAgd2luZG93LmVkaXRvci5kby5mb3JlaWduQ2hhbmdlcyBjaGFuZ2VzXG4gICAgICAgICAgICBkZWxldGUgQGZvcmVpZ25cblxuICAgICAgICBAdGFicy51cGRhdGUoKVxuICAgICAgICBAXG5cbiAgICAjICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwIDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAgICAwICAgICAgMDAwMDAwMDBcblxuICAgIGlzQWN0aXZlOiAtPiBAZGl2LmNsYXNzTGlzdC5jb250YWlucyAnYWN0aXZlJ1xuXG4gICAgc2V0QWN0aXZlOiAtPlxuXG4gICAgICAgIGlmIG5vdCBAaXNBY3RpdmUoKVxuICAgICAgICAgICAgQGRpdi5jbGFzc0xpc3QuYWRkICdhY3RpdmUnXG4gICAgICAgIEBcblxuICAgIGNsZWFyQWN0aXZlOiAtPlxuXG4gICAgICAgIEBkaXYuY2xhc3NMaXN0LnJlbW92ZSAnYWN0aXZlJ1xuICAgICAgICBAXG5cbm1vZHVsZS5leHBvcnRzID0gVGFiXG4iXX0=
//# sourceURL=../../coffee/win/tab.coffee