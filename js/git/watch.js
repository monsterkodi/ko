// koffee 0.56.0

/*
000   000   0000000   000000000   0000000  000   000  
000 0 000  000   000     000     000       000   000  
000000000  000000000     000     000       000000000  
000   000  000   000     000     000       000   000  
00     00  000   000     000      0000000  000   000
 */
var GitWatch, fs, post, ref1, slash, valid, watch;

ref1 = require('kxk'), post = ref1.post, slash = ref1.slash, watch = ref1.watch, valid = ref1.valid, fs = ref1.fs;

GitWatch = (function() {
    function GitWatch(gitDir, cb) {
        var refPath;
        this.gitDir = gitDir;
        if (this.gitDir == null) {
            return;
        }
        this.gitFile = slash.join(this.gitDir, '.git', 'HEAD');
        if (slash.fileExists(this.gitFile)) {
            refPath = slash.readText(this.gitFile);
            if (refPath.startsWith('ref: ')) {
                this.gitFile = slash.join(this.gitDir, '.git', refPath.slice(5).trim());
                this.ref = slash.readText(this.gitFile);
            } else {
                this.ref = refPath;
            }
            this.watcher = watch.file(this.gitFile);
            this.watcher.on('change', (function(_this) {
                return function(info) {
                    var ref;
                    ref = slash.readText(_this.gitFile);
                    if (valid(ref) && _this.ref !== ref) {
                        _this.ref = ref;
                        cb(_this.gitDir);
                        return post.emit('gitRefChanged', _this.gitDir);
                    }
                };
            })(this));
        }
    }

    GitWatch.prototype.unwatch = function() {
        var ref2;
        if ((ref2 = this.watcher) != null) {
            ref2.close();
        }
        return delete this.watcher;
    };

    return GitWatch;

})();

module.exports = GitWatch;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2F0Y2guanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBOztBQVFBLE9BQW9DLE9BQUEsQ0FBUSxLQUFSLENBQXBDLEVBQUUsZ0JBQUYsRUFBUSxrQkFBUixFQUFlLGtCQUFmLEVBQXNCLGtCQUF0QixFQUE2Qjs7QUFFdkI7SUFFVyxrQkFBQyxNQUFELEVBQVUsRUFBVjtBQUVULFlBQUE7UUFGVSxJQUFDLENBQUEsU0FBRDtRQUVWLElBQWMsbUJBQWQ7QUFBQSxtQkFBQTs7UUFFQSxJQUFDLENBQUEsT0FBRCxHQUFXLEtBQUssQ0FBQyxJQUFOLENBQVcsSUFBQyxDQUFBLE1BQVosRUFBb0IsTUFBcEIsRUFBNEIsTUFBNUI7UUFFWCxJQUFHLEtBQUssQ0FBQyxVQUFOLENBQWlCLElBQUMsQ0FBQSxPQUFsQixDQUFIO1lBRUksT0FBQSxHQUFVLEtBQUssQ0FBQyxRQUFOLENBQWUsSUFBQyxDQUFBLE9BQWhCO1lBQ1YsSUFBRyxPQUFPLENBQUMsVUFBUixDQUFtQixPQUFuQixDQUFIO2dCQUNJLElBQUMsQ0FBQSxPQUFELEdBQVcsS0FBSyxDQUFDLElBQU4sQ0FBVyxJQUFDLENBQUEsTUFBWixFQUFvQixNQUFwQixFQUE0QixPQUFPLENBQUMsS0FBUixDQUFjLENBQWQsQ0FBZ0IsQ0FBQyxJQUFqQixDQUFBLENBQTVCO2dCQUNYLElBQUMsQ0FBQSxHQUFELEdBQU8sS0FBSyxDQUFDLFFBQU4sQ0FBZSxJQUFDLENBQUEsT0FBaEIsRUFGWDthQUFBLE1BQUE7Z0JBSUksSUFBQyxDQUFBLEdBQUQsR0FBTyxRQUpYOztZQU1BLElBQUMsQ0FBQSxPQUFELEdBQVcsS0FBSyxDQUFDLElBQU4sQ0FBVyxJQUFDLENBQUEsT0FBWjtZQUNYLElBQUMsQ0FBQSxPQUFPLENBQUMsRUFBVCxDQUFZLFFBQVosRUFBc0IsQ0FBQSxTQUFBLEtBQUE7dUJBQUEsU0FBQyxJQUFEO0FBQ2xCLHdCQUFBO29CQUFBLEdBQUEsR0FBTSxLQUFLLENBQUMsUUFBTixDQUFlLEtBQUMsQ0FBQSxPQUFoQjtvQkFDTixJQUFHLEtBQUEsQ0FBTSxHQUFOLENBQUEsSUFBZSxLQUFDLENBQUEsR0FBRCxLQUFRLEdBQTFCO3dCQUNJLEtBQUMsQ0FBQSxHQUFELEdBQU87d0JBQ1AsRUFBQSxDQUFHLEtBQUMsQ0FBQSxNQUFKOytCQUNBLElBQUksQ0FBQyxJQUFMLENBQVUsZUFBVixFQUEyQixLQUFDLENBQUEsTUFBNUIsRUFISjs7Z0JBRmtCO1lBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUF0QixFQVZKOztJQU5TOzt1QkF1QmIsT0FBQSxHQUFTLFNBQUE7QUFFTCxZQUFBOztnQkFBUSxDQUFFLEtBQVYsQ0FBQTs7ZUFDQSxPQUFPLElBQUMsQ0FBQTtJQUhIOzs7Ozs7QUFLYixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4wMDAgMCAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICBcbjAwMDAwMDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAwMDAwMDAgIFxuMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4wMCAgICAgMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgMDAwMDAwMCAgMDAwICAgMDAwICBcbiMjI1xuXG57IHBvc3QsIHNsYXNoLCB3YXRjaCwgdmFsaWQsIGZzIH0gPSByZXF1aXJlICdreGsnXG5cbmNsYXNzIEdpdFdhdGNoXG4gICAgXG4gICAgY29uc3RydWN0b3I6IChAZ2l0RGlyLCBjYikgLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBub3QgQGdpdERpcj9cbiAgICAgICAgXG4gICAgICAgIEBnaXRGaWxlID0gc2xhc2guam9pbiBAZ2l0RGlyLCAnLmdpdCcsICdIRUFEJ1xuICAgICAgICBcbiAgICAgICAgaWYgc2xhc2guZmlsZUV4aXN0cyBAZ2l0RmlsZVxuICAgICAgICAgICAgXG4gICAgICAgICAgICByZWZQYXRoID0gc2xhc2gucmVhZFRleHQgQGdpdEZpbGVcbiAgICAgICAgICAgIGlmIHJlZlBhdGguc3RhcnRzV2l0aCAncmVmOiAnXG4gICAgICAgICAgICAgICAgQGdpdEZpbGUgPSBzbGFzaC5qb2luIEBnaXREaXIsICcuZ2l0JywgcmVmUGF0aC5zbGljZSg1KS50cmltKClcbiAgICAgICAgICAgICAgICBAcmVmID0gc2xhc2gucmVhZFRleHQgQGdpdEZpbGVcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAcmVmID0gcmVmUGF0aFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgQHdhdGNoZXIgPSB3YXRjaC5maWxlIEBnaXRGaWxlXG4gICAgICAgICAgICBAd2F0Y2hlci5vbiAnY2hhbmdlJywgKGluZm8pID0+XG4gICAgICAgICAgICAgICAgcmVmID0gc2xhc2gucmVhZFRleHQgQGdpdEZpbGVcbiAgICAgICAgICAgICAgICBpZiB2YWxpZChyZWYpIGFuZCBAcmVmICE9IHJlZlxuICAgICAgICAgICAgICAgICAgICBAcmVmID0gcmVmXG4gICAgICAgICAgICAgICAgICAgIGNiIEBnaXREaXJcbiAgICAgICAgICAgICAgICAgICAgcG9zdC5lbWl0ICdnaXRSZWZDaGFuZ2VkJywgQGdpdERpclxuXG4gICAgdW53YXRjaDogLT5cbiAgICAgICAgXG4gICAgICAgIEB3YXRjaGVyPy5jbG9zZSgpXG4gICAgICAgIGRlbGV0ZSBAd2F0Y2hlclxuICAgICAgICAgICAgICAgIFxubW9kdWxlLmV4cG9ydHMgPSBHaXRXYXRjaFxuIl19
//# sourceURL=../../coffee/git/watch.coffee