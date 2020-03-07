// koffee 1.12.0

/*
000   000   0000000   000000000   0000000  000   000  00000000  00000000 
000 0 000  000   000     000     000       000   000  000       000   000
000000000  000000000     000     000       000000000  0000000   0000000  
000   000  000   000     000     000       000   000  000       000   000
00     00  000   000     000      0000000  000   000  00000000  000   000
 */
var FileWatcher, Watcher, fs, klog, post, ref, slash,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), fs = ref.fs, klog = ref.klog, post = ref.post, slash = ref.slash;

Watcher = (function() {
    Watcher.id = 0;

    function Watcher(file1) {
        this.file = file1;
        this.onRename = bind(this.onRename, this);
        this.onChange = bind(this.onChange, this);
        this.onExists = bind(this.onExists, this);
        this.id = Watcher.id++;
        slash.exists(this.file, this.onExists);
    }

    Watcher.prototype.onExists = function(stat) {
        if (!stat) {
            return;
        }
        if (!this.id) {
            return;
        }
        this.mtime = stat.mtimeMs;
        this.w = fs.watch(this.file);
        this.w.on('change', (function(_this) {
            return function(changeType, p) {
                if (changeType === 'change') {
                    return slash.exists(_this.file, _this.onChange);
                } else {
                    return setTimeout((function() {
                        return slash.exists(_this.file, _this.onRename);
                    }), 200);
                }
            };
        })(this));
        return this.w.on('unlink', (function(_this) {
            return function(p) {
                return klog("unlink " + _this.id, slash.basename(_this.file));
            };
        })(this));
    };

    Watcher.prototype.onChange = function(stat) {
        if (stat.mtimeMs !== this.mtime) {
            this.mtime = stat.mtimeMs;
            return post.emit('reloadFile', this.file);
        }
    };

    Watcher.prototype.onRename = function(stat) {
        if (!stat) {
            this.stop();
            return post.emit('removeFile', this.file);
        }
    };

    Watcher.prototype.stop = function() {
        var ref1;
        if ((ref1 = this.w) != null) {
            ref1.close();
        }
        delete this.w;
        return this.id = 0;
    };

    return Watcher;

})();

FileWatcher = (function() {
    function FileWatcher() {
        this.onUnwatch = bind(this.onUnwatch, this);
        this.onWatch = bind(this.onWatch, this);
        this.watchers = {};
        post.on('watch', this.onWatch);
        post.on('unwatch', this.onUnwatch);
    }

    FileWatcher.prototype.onWatch = function(file) {
        file = slash.resolve(file);
        if (this.watchers[file] == null) {
            return this.watchers[file] = new Watcher(file);
        }
    };

    FileWatcher.prototype.onUnwatch = function(file) {
        var ref1;
        file = slash.resolve(file);
        if ((ref1 = this.watchers[file]) != null) {
            ref1.stop();
        }
        return delete this.watchers[file];
    };

    return FileWatcher;

})();

module.exports = FileWatcher;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2F0Y2hlci5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi9jb2ZmZWUvdG9vbHMiLCJzb3VyY2VzIjpbIndhdGNoZXIuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLGdEQUFBO0lBQUE7O0FBUUEsTUFBNEIsT0FBQSxDQUFRLEtBQVIsQ0FBNUIsRUFBRSxXQUFGLEVBQU0sZUFBTixFQUFZLGVBQVosRUFBa0I7O0FBRVo7SUFFRixPQUFDLENBQUEsRUFBRCxHQUFLOztJQUVGLGlCQUFDLEtBQUQ7UUFBQyxJQUFDLENBQUEsT0FBRDs7OztRQUVBLElBQUMsQ0FBQSxFQUFELEdBQU0sT0FBTyxDQUFDLEVBQVI7UUFDTixLQUFLLENBQUMsTUFBTixDQUFhLElBQUMsQ0FBQSxJQUFkLEVBQW9CLElBQUMsQ0FBQSxRQUFyQjtJQUhEOztzQkFLSCxRQUFBLEdBQVUsU0FBQyxJQUFEO1FBRU4sSUFBVSxDQUFJLElBQWQ7QUFBQSxtQkFBQTs7UUFDQSxJQUFVLENBQUksSUFBQyxDQUFBLEVBQWY7QUFBQSxtQkFBQTs7UUFDQSxJQUFDLENBQUEsS0FBRCxHQUFTLElBQUksQ0FBQztRQUVkLElBQUMsQ0FBQSxDQUFELEdBQUssRUFBRSxDQUFDLEtBQUgsQ0FBUyxJQUFDLENBQUEsSUFBVjtRQUNMLElBQUMsQ0FBQSxDQUFDLENBQUMsRUFBSCxDQUFNLFFBQU4sRUFBZSxDQUFBLFNBQUEsS0FBQTttQkFBQSxTQUFDLFVBQUQsRUFBYSxDQUFiO2dCQUVYLElBQUcsVUFBQSxLQUFjLFFBQWpCOzJCQUNJLEtBQUssQ0FBQyxNQUFOLENBQWEsS0FBQyxDQUFBLElBQWQsRUFBb0IsS0FBQyxDQUFBLFFBQXJCLEVBREo7aUJBQUEsTUFBQTsyQkFHSSxVQUFBLENBQVcsQ0FBQyxTQUFBOytCQUFHLEtBQUssQ0FBQyxNQUFOLENBQWEsS0FBQyxDQUFBLElBQWQsRUFBb0IsS0FBQyxDQUFBLFFBQXJCO29CQUFILENBQUQsQ0FBWCxFQUErQyxHQUEvQyxFQUhKOztZQUZXO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFmO2VBT0EsSUFBQyxDQUFBLENBQUMsQ0FBQyxFQUFILENBQU0sUUFBTixFQUFlLENBQUEsU0FBQSxLQUFBO21CQUFBLFNBQUMsQ0FBRDt1QkFBTyxJQUFBLENBQUssU0FBQSxHQUFVLEtBQUMsQ0FBQSxFQUFoQixFQUFxQixLQUFLLENBQUMsUUFBTixDQUFlLEtBQUMsQ0FBQSxJQUFoQixDQUFyQjtZQUFQO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFmO0lBZE07O3NCQWdCVixRQUFBLEdBQVUsU0FBQyxJQUFEO1FBRU4sSUFBRyxJQUFJLENBQUMsT0FBTCxLQUFnQixJQUFDLENBQUEsS0FBcEI7WUFDSSxJQUFDLENBQUEsS0FBRCxHQUFTLElBQUksQ0FBQzttQkFDZCxJQUFJLENBQUMsSUFBTCxDQUFVLFlBQVYsRUFBdUIsSUFBQyxDQUFBLElBQXhCLEVBRko7O0lBRk07O3NCQU1WLFFBQUEsR0FBVSxTQUFDLElBQUQ7UUFFTixJQUFHLENBQUksSUFBUDtZQUNJLElBQUMsQ0FBQSxJQUFELENBQUE7bUJBQ0EsSUFBSSxDQUFDLElBQUwsQ0FBVSxZQUFWLEVBQXVCLElBQUMsQ0FBQSxJQUF4QixFQUZKOztJQUZNOztzQkFNVixJQUFBLEdBQU0sU0FBQTtBQUVGLFlBQUE7O2dCQUFFLENBQUUsS0FBSixDQUFBOztRQUNBLE9BQU8sSUFBQyxDQUFBO2VBQ1IsSUFBQyxDQUFBLEVBQUQsR0FBTTtJQUpKOzs7Ozs7QUFZSjtJQUVDLHFCQUFBOzs7UUFFQyxJQUFDLENBQUEsUUFBRCxHQUFZO1FBQ1osSUFBSSxDQUFDLEVBQUwsQ0FBUSxPQUFSLEVBQWtCLElBQUMsQ0FBQSxPQUFuQjtRQUNBLElBQUksQ0FBQyxFQUFMLENBQVEsU0FBUixFQUFrQixJQUFDLENBQUEsU0FBbkI7SUFKRDs7MEJBTUgsT0FBQSxHQUFTLFNBQUMsSUFBRDtRQUVMLElBQUEsR0FBTyxLQUFLLENBQUMsT0FBTixDQUFjLElBQWQ7UUFFUCxJQUFPLDJCQUFQO21CQUNJLElBQUMsQ0FBQSxRQUFTLENBQUEsSUFBQSxDQUFWLEdBQWtCLElBQUksT0FBSixDQUFZLElBQVosRUFEdEI7O0lBSks7OzBCQU9ULFNBQUEsR0FBVyxTQUFDLElBQUQ7QUFFUCxZQUFBO1FBQUEsSUFBQSxHQUFPLEtBQUssQ0FBQyxPQUFOLENBQWMsSUFBZDs7Z0JBRVEsQ0FBRSxJQUFqQixDQUFBOztlQUNBLE9BQU8sSUFBQyxDQUFBLFFBQVMsQ0FBQSxJQUFBO0lBTFY7Ozs7OztBQU9mLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgXG4wMDAgMCAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwXG4wMDAwMDAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwXG4wMCAgICAgMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwXG4jIyNcblxueyBmcywga2xvZywgcG9zdCwgc2xhc2ggfSA9IHJlcXVpcmUgJ2t4aydcblxuY2xhc3MgV2F0Y2hlclxuXG4gICAgQGlkOiAwXG4gICAgXG4gICAgQDogKEBmaWxlKSAtPlxuXG4gICAgICAgIEBpZCA9IFdhdGNoZXIuaWQrK1xuICAgICAgICBzbGFzaC5leGlzdHMgQGZpbGUsIEBvbkV4aXN0c1xuICAgICAgICBcbiAgICBvbkV4aXN0czogKHN0YXQpID0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgbm90IHN0YXRcbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAaWRcbiAgICAgICAgQG10aW1lID0gc3RhdC5tdGltZU1zXG4gICAgICAgIFxuICAgICAgICBAdyA9IGZzLndhdGNoIEBmaWxlXG4gICAgICAgIEB3Lm9uICdjaGFuZ2UnIChjaGFuZ2VUeXBlLCBwKSA9PlxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBjaGFuZ2VUeXBlID09ICdjaGFuZ2UnXG4gICAgICAgICAgICAgICAgc2xhc2guZXhpc3RzIEBmaWxlLCBAb25DaGFuZ2VcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0ICg9PiBzbGFzaC5leGlzdHMgQGZpbGUsIEBvblJlbmFtZSksIDIwMFxuICAgICAgICBcbiAgICAgICAgQHcub24gJ3VubGluaycgKHApID0+IGtsb2cgXCJ1bmxpbmsgI3tAaWR9XCIgc2xhc2guYmFzZW5hbWUoQGZpbGUpXG4gICAgXG4gICAgb25DaGFuZ2U6IChzdGF0KSA9PlxuICAgICAgICBcbiAgICAgICAgaWYgc3RhdC5tdGltZU1zICE9IEBtdGltZVxuICAgICAgICAgICAgQG10aW1lID0gc3RhdC5tdGltZU1zXG4gICAgICAgICAgICBwb3N0LmVtaXQgJ3JlbG9hZEZpbGUnIEBmaWxlXG5cbiAgICBvblJlbmFtZTogKHN0YXQpID0+XG4gICAgICAgIFxuICAgICAgICBpZiBub3Qgc3RhdFxuICAgICAgICAgICAgQHN0b3AoKVxuICAgICAgICAgICAgcG9zdC5lbWl0ICdyZW1vdmVGaWxlJyBAZmlsZVxuICAgIFxuICAgIHN0b3A6IC0+XG5cbiAgICAgICAgQHc/LmNsb3NlKClcbiAgICAgICAgZGVsZXRlIEB3XG4gICAgICAgIEBpZCA9IDBcblxuIyAwMDAwMDAwMCAgMDAwICAwMDAgICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAgXG4jIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICBcbiMgMDAwMDAwICAgIDAwMCAgMDAwICAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgIFxuIyAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4jIDAwMCAgICAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMCAgICAgMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICBcblxuY2xhc3MgRmlsZVdhdGNoZXJcbiAgICBcbiAgICBAOiAtPlxuICAgICAgICBcbiAgICAgICAgQHdhdGNoZXJzID0ge31cbiAgICAgICAgcG9zdC5vbiAnd2F0Y2gnICAgQG9uV2F0Y2hcbiAgICAgICAgcG9zdC5vbiAndW53YXRjaCcgQG9uVW53YXRjaFxuICAgICAgICBcbiAgICBvbldhdGNoOiAoZmlsZSkgPT5cbiAgICAgICAgXG4gICAgICAgIGZpbGUgPSBzbGFzaC5yZXNvbHZlIGZpbGVcbiAgICAgICAgXG4gICAgICAgIGlmIG5vdCBAd2F0Y2hlcnNbZmlsZV0/XG4gICAgICAgICAgICBAd2F0Y2hlcnNbZmlsZV0gPSBuZXcgV2F0Y2hlciBmaWxlXG4gICAgICAgIFxuICAgIG9uVW53YXRjaDogKGZpbGUpID0+XG5cbiAgICAgICAgZmlsZSA9IHNsYXNoLnJlc29sdmUgZmlsZVxuICAgICAgICBcbiAgICAgICAgQHdhdGNoZXJzW2ZpbGVdPy5zdG9wKClcbiAgICAgICAgZGVsZXRlIEB3YXRjaGVyc1tmaWxlXVxuICAgICAgICBcbm1vZHVsZS5leHBvcnRzID0gRmlsZVdhdGNoZXJcbiJdfQ==
//# sourceURL=../../coffee/tools/watcher.coffee