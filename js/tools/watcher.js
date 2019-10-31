// koffee 1.4.0

/*
000   000   0000000   000000000   0000000  000   000  00000000  00000000 
000 0 000  000   000     000     000       000   000  000       000   000
000000000  000000000     000     000       000000000  0000000   0000000  
000   000  000   000     000     000       000   000  000       000   000
00     00  000   000     000      0000000  000   000  00000000  000   000
 */
var Watcher, fs, klog, post, ref, slash,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), slash = ref.slash, post = ref.post, klog = ref.klog, fs = ref.fs;

Watcher = (function() {
    Watcher.id = 0;

    function Watcher(file) {
        this.file = file;
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

module.exports = Watcher;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2F0Y2hlci5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsbUNBQUE7SUFBQTs7QUFRQSxNQUE0QixPQUFBLENBQVEsS0FBUixDQUE1QixFQUFFLGlCQUFGLEVBQVMsZUFBVCxFQUFlLGVBQWYsRUFBcUI7O0FBRWY7SUFFRixPQUFDLENBQUEsRUFBRCxHQUFLOztJQUVGLGlCQUFDLElBQUQ7UUFBQyxJQUFDLENBQUEsT0FBRDs7OztRQUVBLElBQUMsQ0FBQSxFQUFELEdBQU0sT0FBTyxDQUFDLEVBQVI7UUFDTixLQUFLLENBQUMsTUFBTixDQUFhLElBQUMsQ0FBQSxJQUFkLEVBQW9CLElBQUMsQ0FBQSxRQUFyQjtJQUhEOztzQkFLSCxRQUFBLEdBQVUsU0FBQyxJQUFEO1FBRU4sSUFBVSxDQUFJLElBQWQ7QUFBQSxtQkFBQTs7UUFDQSxJQUFVLENBQUksSUFBQyxDQUFBLEVBQWY7QUFBQSxtQkFBQTs7UUFDQSxJQUFDLENBQUEsS0FBRCxHQUFTLElBQUksQ0FBQztRQUVkLElBQUMsQ0FBQSxDQUFELEdBQUssRUFBRSxDQUFDLEtBQUgsQ0FBUyxJQUFDLENBQUEsSUFBVjtRQUNMLElBQUMsQ0FBQSxDQUFDLENBQUMsRUFBSCxDQUFNLFFBQU4sRUFBZSxDQUFBLFNBQUEsS0FBQTttQkFBQSxTQUFDLFVBQUQsRUFBYSxDQUFiO2dCQUVYLElBQUcsVUFBQSxLQUFjLFFBQWpCOzJCQUNJLEtBQUssQ0FBQyxNQUFOLENBQWEsS0FBQyxDQUFBLElBQWQsRUFBb0IsS0FBQyxDQUFBLFFBQXJCLEVBREo7aUJBQUEsTUFBQTsyQkFHSSxVQUFBLENBQVcsQ0FBQyxTQUFBOytCQUFHLEtBQUssQ0FBQyxNQUFOLENBQWEsS0FBQyxDQUFBLElBQWQsRUFBb0IsS0FBQyxDQUFBLFFBQXJCO29CQUFILENBQUQsQ0FBWCxFQUErQyxHQUEvQyxFQUhKOztZQUZXO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFmO2VBT0EsSUFBQyxDQUFBLENBQUMsQ0FBQyxFQUFILENBQU0sUUFBTixFQUFlLENBQUEsU0FBQSxLQUFBO21CQUFBLFNBQUMsQ0FBRDt1QkFBTyxJQUFBLENBQUssU0FBQSxHQUFVLEtBQUMsQ0FBQSxFQUFoQixFQUFzQixLQUFLLENBQUMsUUFBTixDQUFlLEtBQUMsQ0FBQSxJQUFoQixDQUF0QjtZQUFQO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFmO0lBZE07O3NCQWdCVixRQUFBLEdBQVUsU0FBQyxJQUFEO1FBRU4sSUFBRyxJQUFJLENBQUMsT0FBTCxLQUFnQixJQUFDLENBQUEsS0FBcEI7WUFDSSxJQUFDLENBQUEsS0FBRCxHQUFTLElBQUksQ0FBQzttQkFDZCxJQUFJLENBQUMsSUFBTCxDQUFVLFlBQVYsRUFBdUIsSUFBQyxDQUFBLElBQXhCLEVBRko7O0lBRk07O3NCQU1WLFFBQUEsR0FBVSxTQUFDLElBQUQ7UUFFTixJQUFHLENBQUksSUFBUDtZQUNJLElBQUMsQ0FBQSxJQUFELENBQUE7bUJBQ0EsSUFBSSxDQUFDLElBQUwsQ0FBVSxZQUFWLEVBQXVCLElBQUMsQ0FBQSxJQUF4QixFQUZKOztJQUZNOztzQkFNVixJQUFBLEdBQU0sU0FBQTtBQUVGLFlBQUE7O2dCQUFFLENBQUUsS0FBSixDQUFBOztRQUNBLE9BQU8sSUFBQyxDQUFBO2VBQ1IsSUFBQyxDQUFBLEVBQUQsR0FBTTtJQUpKOzs7Ozs7QUFNVixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwIFxuMDAwIDAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMFxuMDAwMDAwMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgIFxuMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMFxuMDAgICAgIDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuIyMjXG5cbnsgc2xhc2gsIHBvc3QsIGtsb2csIGZzIH0gPSByZXF1aXJlICdreGsnXG5cbmNsYXNzIFdhdGNoZXJcblxuICAgIEBpZDogMFxuICAgIFxuICAgIEA6IChAZmlsZSkgLT5cblxuICAgICAgICBAaWQgPSBXYXRjaGVyLmlkKytcbiAgICAgICAgc2xhc2guZXhpc3RzIEBmaWxlLCBAb25FeGlzdHNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgb25FeGlzdHM6IChzdGF0KSA9PlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIG5vdCBzdGF0XG4gICAgICAgIHJldHVybiBpZiBub3QgQGlkXG4gICAgICAgIEBtdGltZSA9IHN0YXQubXRpbWVNc1xuICAgICAgICBcbiAgICAgICAgQHcgPSBmcy53YXRjaCBAZmlsZVxuICAgICAgICBAdy5vbiAnY2hhbmdlJyAoY2hhbmdlVHlwZSwgcCkgPT5cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgY2hhbmdlVHlwZSA9PSAnY2hhbmdlJ1xuICAgICAgICAgICAgICAgIHNsYXNoLmV4aXN0cyBAZmlsZSwgQG9uQ2hhbmdlXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgc2V0VGltZW91dCAoPT4gc2xhc2guZXhpc3RzIEBmaWxlLCBAb25SZW5hbWUpLCAyMDBcbiAgICAgICAgICAgIFxuICAgICAgICBAdy5vbiAndW5saW5rJyAocCkgPT4ga2xvZyBcInVubGluayAje0BpZH1cIiwgc2xhc2guYmFzZW5hbWUoQGZpbGUpXG4gICAgICAgIFxuICAgIG9uQ2hhbmdlOiAoc3RhdCkgPT5cbiAgICAgICAgXG4gICAgICAgIGlmIHN0YXQubXRpbWVNcyAhPSBAbXRpbWVcbiAgICAgICAgICAgIEBtdGltZSA9IHN0YXQubXRpbWVNc1xuICAgICAgICAgICAgcG9zdC5lbWl0ICdyZWxvYWRGaWxlJyBAZmlsZVxuXG4gICAgb25SZW5hbWU6IChzdGF0KSA9PlxuICAgICAgICBcbiAgICAgICAgaWYgbm90IHN0YXRcbiAgICAgICAgICAgIEBzdG9wKClcbiAgICAgICAgICAgIHBvc3QuZW1pdCAncmVtb3ZlRmlsZScgQGZpbGVcbiAgICAgICAgICAgIFxuICAgIHN0b3A6IC0+XG4gICAgICAgIFxuICAgICAgICBAdz8uY2xvc2UoKVxuICAgICAgICBkZWxldGUgQHdcbiAgICAgICAgQGlkID0gMFxuXG5tb2R1bGUuZXhwb3J0cyA9IFdhdGNoZXJcbiJdfQ==
//# sourceURL=../../coffee/tools/watcher.coffee