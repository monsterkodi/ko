// koffee 1.11.0

/*
000   000   0000000   000000000   0000000  000   000  
000 0 000  000   000     000     000       000   000  
000000000  000000000     000     000       000000000  
000   000  000   000     000     000       000   000  
00     00  000   000     000      0000000  000   000
 */
var GitWatch, post, ref1, slash, valid, watch;

ref1 = require('kxk'), post = ref1.post, slash = ref1.slash, watch = ref1.watch, valid = ref1.valid;

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2F0Y2guanMiLCJzb3VyY2VSb290IjoiLi4vLi4vY29mZmVlL2dpdCIsInNvdXJjZXMiOlsid2F0Y2guY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBOztBQVFBLE9BQWdDLE9BQUEsQ0FBUSxLQUFSLENBQWhDLEVBQUUsZ0JBQUYsRUFBUSxrQkFBUixFQUFlLGtCQUFmLEVBQXNCOztBQUVoQjtJQUVDLGtCQUFDLE1BQUQsRUFBVSxFQUFWO0FBRUMsWUFBQTtRQUZBLElBQUMsQ0FBQSxTQUFEO1FBRUEsSUFBYyxtQkFBZDtBQUFBLG1CQUFBOztRQUVBLElBQUMsQ0FBQSxPQUFELEdBQVcsS0FBSyxDQUFDLElBQU4sQ0FBVyxJQUFDLENBQUEsTUFBWixFQUFvQixNQUFwQixFQUE0QixNQUE1QjtRQUVYLElBQUcsS0FBSyxDQUFDLFVBQU4sQ0FBaUIsSUFBQyxDQUFBLE9BQWxCLENBQUg7WUFFSSxPQUFBLEdBQVUsS0FBSyxDQUFDLFFBQU4sQ0FBZSxJQUFDLENBQUEsT0FBaEI7WUFDVixJQUFHLE9BQU8sQ0FBQyxVQUFSLENBQW1CLE9BQW5CLENBQUg7Z0JBQ0ksSUFBQyxDQUFBLE9BQUQsR0FBVyxLQUFLLENBQUMsSUFBTixDQUFXLElBQUMsQ0FBQSxNQUFaLEVBQW9CLE1BQXBCLEVBQTRCLE9BQU8sQ0FBQyxLQUFSLENBQWMsQ0FBZCxDQUFnQixDQUFDLElBQWpCLENBQUEsQ0FBNUI7Z0JBQ1gsSUFBQyxDQUFBLEdBQUQsR0FBTyxLQUFLLENBQUMsUUFBTixDQUFlLElBQUMsQ0FBQSxPQUFoQixFQUZYO2FBQUEsTUFBQTtnQkFJSSxJQUFDLENBQUEsR0FBRCxHQUFPLFFBSlg7O1lBTUEsSUFBQyxDQUFBLE9BQUQsR0FBVyxLQUFLLENBQUMsSUFBTixDQUFXLElBQUMsQ0FBQSxPQUFaO1lBQ1gsSUFBQyxDQUFBLE9BQU8sQ0FBQyxFQUFULENBQVksUUFBWixFQUFzQixDQUFBLFNBQUEsS0FBQTt1QkFBQSxTQUFDLElBQUQ7QUFDbEIsd0JBQUE7b0JBQUEsR0FBQSxHQUFNLEtBQUssQ0FBQyxRQUFOLENBQWUsS0FBQyxDQUFBLE9BQWhCO29CQUNOLElBQUcsS0FBQSxDQUFNLEdBQU4sQ0FBQSxJQUFlLEtBQUMsQ0FBQSxHQUFELEtBQVEsR0FBMUI7d0JBQ0ksS0FBQyxDQUFBLEdBQUQsR0FBTzt3QkFDUCxFQUFBLENBQUcsS0FBQyxDQUFBLE1BQUo7K0JBQ0EsSUFBSSxDQUFDLElBQUwsQ0FBVSxlQUFWLEVBQTJCLEtBQUMsQ0FBQSxNQUE1QixFQUhKOztnQkFGa0I7WUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQXRCLEVBVko7O0lBTkQ7O3VCQXVCSCxPQUFBLEdBQVMsU0FBQTtBQUVMLFlBQUE7O2dCQUFRLENBQUUsS0FBVixDQUFBOztlQUNBLE9BQU8sSUFBQyxDQUFBO0lBSEg7Ozs7OztBQUtiLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwICBcbjAwMCAwIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuMDAwMDAwMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMDAwMDAwMCAgXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICBcbjAwICAgICAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgICAwMDAwMDAwICAwMDAgICAwMDAgIFxuIyMjXG5cbnsgcG9zdCwgc2xhc2gsIHdhdGNoLCB2YWxpZCB9ID0gcmVxdWlyZSAna3hrJ1xuXG5jbGFzcyBHaXRXYXRjaFxuICAgIFxuICAgIEA6IChAZ2l0RGlyLCBjYikgLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBub3QgQGdpdERpcj9cbiAgICAgICAgXG4gICAgICAgIEBnaXRGaWxlID0gc2xhc2guam9pbiBAZ2l0RGlyLCAnLmdpdCcsICdIRUFEJ1xuICAgICAgICBcbiAgICAgICAgaWYgc2xhc2guZmlsZUV4aXN0cyBAZ2l0RmlsZVxuICAgICAgICAgICAgXG4gICAgICAgICAgICByZWZQYXRoID0gc2xhc2gucmVhZFRleHQgQGdpdEZpbGVcbiAgICAgICAgICAgIGlmIHJlZlBhdGguc3RhcnRzV2l0aCAncmVmOiAnXG4gICAgICAgICAgICAgICAgQGdpdEZpbGUgPSBzbGFzaC5qb2luIEBnaXREaXIsICcuZ2l0JywgcmVmUGF0aC5zbGljZSg1KS50cmltKClcbiAgICAgICAgICAgICAgICBAcmVmID0gc2xhc2gucmVhZFRleHQgQGdpdEZpbGVcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAcmVmID0gcmVmUGF0aFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgQHdhdGNoZXIgPSB3YXRjaC5maWxlIEBnaXRGaWxlXG4gICAgICAgICAgICBAd2F0Y2hlci5vbiAnY2hhbmdlJywgKGluZm8pID0+XG4gICAgICAgICAgICAgICAgcmVmID0gc2xhc2gucmVhZFRleHQgQGdpdEZpbGVcbiAgICAgICAgICAgICAgICBpZiB2YWxpZChyZWYpIGFuZCBAcmVmICE9IHJlZlxuICAgICAgICAgICAgICAgICAgICBAcmVmID0gcmVmXG4gICAgICAgICAgICAgICAgICAgIGNiIEBnaXREaXJcbiAgICAgICAgICAgICAgICAgICAgcG9zdC5lbWl0ICdnaXRSZWZDaGFuZ2VkJywgQGdpdERpclxuXG4gICAgdW53YXRjaDogLT5cbiAgICAgICAgXG4gICAgICAgIEB3YXRjaGVyPy5jbG9zZSgpXG4gICAgICAgIGRlbGV0ZSBAd2F0Y2hlclxuICAgICAgICAgICAgICAgIFxubW9kdWxlLmV4cG9ydHMgPSBHaXRXYXRjaFxuIl19
//# sourceURL=../../coffee/git/watch.coffee