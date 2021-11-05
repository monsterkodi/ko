// koffee 1.16.0

/*
000   000   0000000   000000000   0000000  000   000  
000 0 000  000   000     000     000       000   000  
000000000  000000000     000     000       000000000  
000   000  000   000     000     000       000   000  
00     00  000   000     000      0000000  000   000
 */
var GitWatch, post, ref1, slash, valid, watch;

ref1 = require('kxk'), post = ref1.post, slash = ref1.slash, valid = ref1.valid, watch = ref1.watch;

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2F0Y2guanMiLCJzb3VyY2VSb290IjoiLi4vLi4vY29mZmVlL2dpdCIsInNvdXJjZXMiOlsid2F0Y2guY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBOztBQVFBLE9BQWdDLE9BQUEsQ0FBUSxLQUFSLENBQWhDLEVBQUUsZ0JBQUYsRUFBUSxrQkFBUixFQUFlLGtCQUFmLEVBQXNCOztBQUVoQjtJQUVDLGtCQUFDLE1BQUQsRUFBVSxFQUFWO0FBRUMsWUFBQTtRQUZBLElBQUMsQ0FBQSxTQUFEO1FBRUEsSUFBYyxtQkFBZDtBQUFBLG1CQUFBOztRQUVBLElBQUMsQ0FBQSxPQUFELEdBQVcsS0FBSyxDQUFDLElBQU4sQ0FBVyxJQUFDLENBQUEsTUFBWixFQUFvQixNQUFwQixFQUEyQixNQUEzQjtRQUVYLElBQUcsS0FBSyxDQUFDLFVBQU4sQ0FBaUIsSUFBQyxDQUFBLE9BQWxCLENBQUg7WUFFSSxPQUFBLEdBQVUsS0FBSyxDQUFDLFFBQU4sQ0FBZSxJQUFDLENBQUEsT0FBaEI7WUFDVixJQUFHLE9BQU8sQ0FBQyxVQUFSLENBQW1CLE9BQW5CLENBQUg7Z0JBQ0ksSUFBQyxDQUFBLE9BQUQsR0FBVyxLQUFLLENBQUMsSUFBTixDQUFXLElBQUMsQ0FBQSxNQUFaLEVBQW9CLE1BQXBCLEVBQTJCLE9BQU8sQ0FBQyxLQUFSLENBQWMsQ0FBZCxDQUFnQixDQUFDLElBQWpCLENBQUEsQ0FBM0I7Z0JBQ1gsSUFBQyxDQUFBLEdBQUQsR0FBTyxLQUFLLENBQUMsUUFBTixDQUFlLElBQUMsQ0FBQSxPQUFoQixFQUZYO2FBQUEsTUFBQTtnQkFJSSxJQUFDLENBQUEsR0FBRCxHQUFPLFFBSlg7O1lBTUEsSUFBQyxDQUFBLE9BQUQsR0FBVyxLQUFLLENBQUMsSUFBTixDQUFXLElBQUMsQ0FBQSxPQUFaO1lBQ1gsSUFBQyxDQUFBLE9BQU8sQ0FBQyxFQUFULENBQVksUUFBWixFQUFxQixDQUFBLFNBQUEsS0FBQTt1QkFBQSxTQUFDLElBQUQ7QUFDakIsd0JBQUE7b0JBQUEsR0FBQSxHQUFNLEtBQUssQ0FBQyxRQUFOLENBQWUsS0FBQyxDQUFBLE9BQWhCO29CQUNOLElBQUcsS0FBQSxDQUFNLEdBQU4sQ0FBQSxJQUFlLEtBQUMsQ0FBQSxHQUFELEtBQVEsR0FBMUI7d0JBQ0ksS0FBQyxDQUFBLEdBQUQsR0FBTzt3QkFDUCxFQUFBLENBQUcsS0FBQyxDQUFBLE1BQUo7K0JBQ0EsSUFBSSxDQUFDLElBQUwsQ0FBVSxlQUFWLEVBQTBCLEtBQUMsQ0FBQSxNQUEzQixFQUhKOztnQkFGaUI7WUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQXJCLEVBVko7O0lBTkQ7O3VCQXVCSCxPQUFBLEdBQVMsU0FBQTtBQUVMLFlBQUE7O2dCQUFRLENBQUUsS0FBVixDQUFBOztlQUNBLE9BQU8sSUFBQyxDQUFBO0lBSEg7Ozs7OztBQUtiLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwICBcbjAwMCAwIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuMDAwMDAwMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMDAwMDAwMCAgXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICBcbjAwICAgICAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgICAwMDAwMDAwICAwMDAgICAwMDAgIFxuIyMjXG5cbnsgcG9zdCwgc2xhc2gsIHZhbGlkLCB3YXRjaCB9ID0gcmVxdWlyZSAna3hrJ1xuXG5jbGFzcyBHaXRXYXRjaFxuICAgIFxuICAgIEA6IChAZ2l0RGlyLCBjYikgLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBub3QgQGdpdERpcj9cbiAgICAgICAgXG4gICAgICAgIEBnaXRGaWxlID0gc2xhc2guam9pbiBAZ2l0RGlyLCAnLmdpdCcgJ0hFQUQnXG4gICAgICAgIFxuICAgICAgICBpZiBzbGFzaC5maWxlRXhpc3RzIEBnaXRGaWxlXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHJlZlBhdGggPSBzbGFzaC5yZWFkVGV4dCBAZ2l0RmlsZVxuICAgICAgICAgICAgaWYgcmVmUGF0aC5zdGFydHNXaXRoICdyZWY6ICdcbiAgICAgICAgICAgICAgICBAZ2l0RmlsZSA9IHNsYXNoLmpvaW4gQGdpdERpciwgJy5naXQnIHJlZlBhdGguc2xpY2UoNSkudHJpbSgpXG4gICAgICAgICAgICAgICAgQHJlZiA9IHNsYXNoLnJlYWRUZXh0IEBnaXRGaWxlXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQHJlZiA9IHJlZlBhdGhcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIEB3YXRjaGVyID0gd2F0Y2guZmlsZSBAZ2l0RmlsZVxuICAgICAgICAgICAgQHdhdGNoZXIub24gJ2NoYW5nZScgKGluZm8pID0+XG4gICAgICAgICAgICAgICAgcmVmID0gc2xhc2gucmVhZFRleHQgQGdpdEZpbGVcbiAgICAgICAgICAgICAgICBpZiB2YWxpZChyZWYpIGFuZCBAcmVmICE9IHJlZlxuICAgICAgICAgICAgICAgICAgICBAcmVmID0gcmVmXG4gICAgICAgICAgICAgICAgICAgIGNiIEBnaXREaXJcbiAgICAgICAgICAgICAgICAgICAgcG9zdC5lbWl0ICdnaXRSZWZDaGFuZ2VkJyBAZ2l0RGlyXG5cbiAgICB1bndhdGNoOiAtPlxuICAgICAgICBcbiAgICAgICAgQHdhdGNoZXI/LmNsb3NlKClcbiAgICAgICAgZGVsZXRlIEB3YXRjaGVyXG4gICAgICAgICAgICAgICAgXG5tb2R1bGUuZXhwb3J0cyA9IEdpdFdhdGNoXG4iXX0=
//# sourceURL=../../coffee/git/watch.coffee