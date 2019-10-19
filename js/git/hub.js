// koffee 1.3.0

/*
000   000  000   000  0000000    
000   000  000   000  000   000  
000000000  000   000  0000000    
000   000  000   000  000   000  
000   000   0000000   0000000
 */
var Hub, _, diff, diffs, empty, filter, info, post, ref, root, roots, stati, status, valid, watch, watchers;

ref = require('kxk'), post = ref.post, valid = ref.valid, empty = ref.empty, filter = ref.filter, _ = ref._;

watch = require('./watch');

status = require('./status');

diff = require('./diff');

info = require('./info');

root = require('./root');

watchers = {};

roots = {};

stati = {};

diffs = {};

Hub = (function() {
    function Hub() {}

    Hub.refresh = function() {
        stati = {};
        roots = {};
        return diffs = {};
    };

    Hub.watch = function(gitDir) {
        if (watchers[gitDir]) {
            return;
        }
        return watchers[gitDir] = new watch(gitDir, Hub.onGitRefChanged);
    };

    Hub.onGitRefChanged = function(gitDir) {
        delete stati[gitDir];
        diffs = filter(diffs, function(v, k) {
            return !(typeof k.startsWith === "function" ? k.startsWith(gitDir) : void 0);
        });
        return Hub.status(gitDir, function(status) {
            return post.emit('gitStatus', gitDir, status);
        });
    };

    Hub.onSaved = function(file) {
        if (diffs[file]) {
            delete diffs[file];
            Hub.diff(file, function(changes) {
                return post.emit('gitDiff', file, changes);
            });
        }
        return Hub.applyRoot(file, function(gitDir) {
            if (gitDir) {
                return Hub.onGitRefChanged(gitDir);
            }
        });
    };

    Hub.diff = function(file, cb) {
        if (diffs[file]) {
            return cb(diffs[file]);
        } else {
            return diff(file, function(changes) {
                diffs[file] = changes;
                return cb(changes);
            });
        }
    };

    Hub.status = function(dirOrFile, cb) {
        var rootStatus;
        rootStatus = function(cb) {
            return function(gitDir) {
                if (stati[gitDir]) {
                    return cb(stati[gitDir]);
                } else {
                    return status(gitDir, function(info) {
                        stati[gitDir] = info;
                        return cb(info);
                    });
                }
            };
        };
        return Hub.applyRoot(dirOrFile, rootStatus(cb));
    };

    Hub.statusFiles = function(status) {
        var file, files, i, j, key, len, len1, ref1, ref2;
        files = {};
        ref1 = ['changed', 'added', 'dirs'];
        for (i = 0, len = ref1.length; i < len; i++) {
            key = ref1[i];
            if (valid(status[key])) {
                ref2 = status[key];
                for (j = 0, len1 = ref2.length; j < len1; j++) {
                    file = ref2[j];
                    files[file] = key;
                }
            }
        }
        return files;
    };

    Hub.info = function(dirOrFile, cb) {
        var rootInfo;
        rootInfo = function(cb) {
            return function(gitDir) {
                return info(gitDir, function(info) {
                    return cb(info);
                });
            };
        };
        return Hub.applyRoot(dirOrFile, rootInfo(cb));
    };

    Hub.applyRoot = function(dirOrFile, cb) {
        if (roots[dirOrFile]) {
            return cb(roots[dirOrFile]);
        } else {
            return root(dirOrFile, function(gitDir) {
                roots[dirOrFile] = gitDir;
                roots[gitDir] = gitDir;
                Hub.watch(gitDir);
                return cb(gitDir);
            });
        }
    };

    return Hub;

})();

post.on('saved', Hub.onSaved);

module.exports = Hub;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHViLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQTs7QUFRQSxNQUFvQyxPQUFBLENBQVEsS0FBUixDQUFwQyxFQUFFLGVBQUYsRUFBUSxpQkFBUixFQUFlLGlCQUFmLEVBQXNCLG1CQUF0QixFQUE4Qjs7QUFFOUIsS0FBQSxHQUFXLE9BQUEsQ0FBUSxTQUFSOztBQUNYLE1BQUEsR0FBVyxPQUFBLENBQVEsVUFBUjs7QUFDWCxJQUFBLEdBQVcsT0FBQSxDQUFRLFFBQVI7O0FBQ1gsSUFBQSxHQUFXLE9BQUEsQ0FBUSxRQUFSOztBQUNYLElBQUEsR0FBVyxPQUFBLENBQVEsUUFBUjs7QUFFWCxRQUFBLEdBQVc7O0FBQ1gsS0FBQSxHQUFXOztBQUNYLEtBQUEsR0FBVzs7QUFDWCxLQUFBLEdBQVc7O0FBRUw7OztJQUVGLEdBQUMsQ0FBQSxPQUFELEdBQVUsU0FBQTtRQUVOLEtBQUEsR0FBUTtRQUNSLEtBQUEsR0FBUTtlQUNSLEtBQUEsR0FBUTtJQUpGOztJQVlWLEdBQUMsQ0FBQSxLQUFELEdBQVEsU0FBQyxNQUFEO1FBRUosSUFBVSxRQUFTLENBQUEsTUFBQSxDQUFuQjtBQUFBLG1CQUFBOztlQUNBLFFBQVMsQ0FBQSxNQUFBLENBQVQsR0FBbUIsSUFBSSxLQUFKLENBQVUsTUFBVixFQUFrQixHQUFHLENBQUMsZUFBdEI7SUFIZjs7SUFLUixHQUFDLENBQUEsZUFBRCxHQUFrQixTQUFDLE1BQUQ7UUFFZCxPQUFPLEtBQU0sQ0FBQSxNQUFBO1FBRWIsS0FBQSxHQUFRLE1BQUEsQ0FBTyxLQUFQLEVBQWMsU0FBQyxDQUFELEVBQUcsQ0FBSDttQkFDbEIsdUNBQUksQ0FBQyxDQUFDLFdBQVk7UUFEQSxDQUFkO2VBR1IsR0FBRyxDQUFDLE1BQUosQ0FBVyxNQUFYLEVBQW1CLFNBQUMsTUFBRDttQkFDZixJQUFJLENBQUMsSUFBTCxDQUFVLFdBQVYsRUFBdUIsTUFBdkIs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b250ZW50IjpbIiMjI1xuMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbjAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIFxuMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4wMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICBcbiMjI1xuXG57IHBvc3QsIHZhbGlkLCBlbXB0eSwgZmlsdGVyLCBfIH0gPSByZXF1aXJlICdreGsnXG5cbndhdGNoICAgID0gcmVxdWlyZSAnLi93YXRjaCdcbnN0YXR1cyAgID0gcmVxdWlyZSAnLi9zdGF0dXMnXG5kaWZmICAgICA9IHJlcXVpcmUgJy4vZGlmZidcbmluZm8gICAgID0gcmVxdWlyZSAnLi9pbmZvJ1xucm9vdCAgICAgPSByZXF1aXJlICcuL3Jvb3QnXG5cbndhdGNoZXJzID0ge31cbnJvb3RzICAgID0ge31cbnN0YXRpICAgID0ge31cbmRpZmZzICAgID0ge31cblxuY2xhc3MgSHViXG4gICAgXG4gICAgQHJlZnJlc2g6IC0+IFxuICAgICAgICBcbiAgICAgICAgc3RhdGkgPSB7fVxuICAgICAgICByb290cyA9IHt9XG4gICAgICAgIGRpZmZzID0ge31cbiAgICBcbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwIDAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAgICAgIDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgQHdhdGNoOiAoZ2l0RGlyKSAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIHdhdGNoZXJzW2dpdERpcl1cbiAgICAgICAgd2F0Y2hlcnNbZ2l0RGlyXSA9IG5ldyB3YXRjaCBnaXREaXIsIEh1Yi5vbkdpdFJlZkNoYW5nZWRcbiAgICAgICAgICAgIFxuICAgIEBvbkdpdFJlZkNoYW5nZWQ6IChnaXREaXIpIC0+XG4gICAgICAgIFxuICAgICAgICBkZWxldGUgc3RhdGlbZ2l0RGlyXVxuICAgICAgICBcbiAgICAgICAgZGlmZnMgPSBmaWx0ZXIgZGlmZnMsICh2LGspIC0+IFxuICAgICAgICAgICAgbm90IGsuc3RhcnRzV2l0aD8gZ2l0RGlyXG4gICAgICAgICAgICBcbiAgICAgICAgSHViLnN0YXR1cyBnaXREaXIsIChzdGF0dXMpIC0+IFxuICAgICAgICAgICAgcG9zdC5lbWl0ICdnaXRTdGF0dXMnLCBnaXREaXIsIHN0YXR1c1xuICAgICAgICBcbiAgICBAb25TYXZlZDogKGZpbGUpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBkaWZmc1tmaWxlXVxuICAgICAgICAgICAgZGVsZXRlIGRpZmZzW2ZpbGVdXG4gICAgICAgICAgICBIdWIuZGlmZiBmaWxlLCAoY2hhbmdlcykgLT4gXG4gICAgICAgICAgICAgICAgcG9zdC5lbWl0ICdnaXREaWZmJywgZmlsZSwgY2hhbmdlc1xuICAgICAgICAgICAgICAgIFxuICAgICAgICBIdWIuYXBwbHlSb290IGZpbGUsIChnaXREaXIpIC0+XG4gICAgICAgICAgICBIdWIub25HaXRSZWZDaGFuZ2VkIGdpdERpciBpZiBnaXREaXJcbiAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAwMCAgICAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAgICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIFxuICAgIFxuICAgIEBkaWZmOiAoZmlsZSwgY2IpIC0+XG4gICAgICAgICAgICAgICBcbiAgICAgICAgaWYgZGlmZnNbZmlsZV1cbiAgICAgICAgICAgIGNiIGRpZmZzW2ZpbGVdXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGRpZmYgZmlsZSwgKGNoYW5nZXMpIC0+IFxuICAgICAgICAgICAgICAgIGRpZmZzW2ZpbGVdID0gY2hhbmdlc1xuICAgICAgICAgICAgICAgIGNiIGNoYW5nZXNcbiAgICBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICBcbiAgICAjICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgICAgICAgMDAwICBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbiAgICBcbiAgICBAc3RhdHVzOiAoZGlyT3JGaWxlLCBjYikgLT5cbiAgICAgICAgXG4gICAgICAgIHJvb3RTdGF0dXMgPSAoY2IpIC0+IChnaXREaXIpIC0+XG4gICAgICAgICAgICBpZiBzdGF0aVtnaXREaXJdXG4gICAgICAgICAgICAgICAgY2Igc3RhdGlbZ2l0RGlyXVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHN0YXR1cyBnaXREaXIsIChpbmZvKSAtPiBcbiAgICAgICAgICAgICAgICAgICAgc3RhdGlbZ2l0RGlyXSA9IGluZm9cbiAgICAgICAgICAgICAgICAgICAgY2IgaW5mb1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgSHViLmFwcGx5Um9vdCBkaXJPckZpbGUsIHJvb3RTdGF0dXMgY2JcbiAgICAgICAgICAgICAgXG4gICAgQHN0YXR1c0ZpbGVzOiAoc3RhdHVzKSAtPlxuICAgICAgICBcbiAgICAgICAgZmlsZXMgPSB7fVxuICAgICAgICBmb3Iga2V5IGluIFsnY2hhbmdlZCcsICdhZGRlZCcsICdkaXJzJ11cbiAgICAgICAgICAgIGlmIHZhbGlkIHN0YXR1c1trZXldXG4gICAgICAgICAgICAgICAgZm9yIGZpbGUgaW4gc3RhdHVzW2tleV1cbiAgICAgICAgICAgICAgICAgICAgZmlsZXNbZmlsZV0gPSBrZXlcbiAgICAgICAgZmlsZXNcbiAgICAgICAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAwMDAwICAgXG4gICAgXG4gICAgQGluZm86IChkaXJPckZpbGUsIGNiKSAtPlxuICAgICAgICBcbiAgICAgICAgcm9vdEluZm8gPSAoY2IpIC0+IChnaXREaXIpIC0+IGluZm8gZ2l0RGlyLCAoaW5mbykgLT4gY2IgaW5mb1xuICAgICAgICBcbiAgICAgICAgSHViLmFwcGx5Um9vdCBkaXJPckZpbGUsIHJvb3RJbmZvIGNiXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwICAgICAgMDAwICAgMDAwICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAgICAgICAgIDAwMDAwICAgICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAgMDAwICAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgIDAwMDAwMDAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgQGFwcGx5Um9vdDogKGRpck9yRmlsZSwgY2IpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiByb290c1tkaXJPckZpbGVdXG4gICAgICAgICAgICBjYiByb290c1tkaXJPckZpbGVdXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHJvb3QgZGlyT3JGaWxlLCAoZ2l0RGlyKSAtPlxuICAgICAgICAgICAgICAgIHJvb3RzW2Rpck9yRmlsZV0gPSBnaXREaXJcbiAgICAgICAgICAgICAgICByb290c1tnaXREaXJdICAgID0gZ2l0RGlyXG4gICAgICAgICAgICAgICAgSHViLndhdGNoIGdpdERpclxuICAgICAgICAgICAgICAgIGNiIGdpdERpciAgIFxuICAgICAgICAgICAgXG5wb3N0Lm9uICdzYXZlZCcsIEh1Yi5vblNhdmVkXG4gICAgICAgIFxubW9kdWxlLmV4cG9ydHMgPSBIdWJcbiJdfQ==
//# sourceURL=../../coffee/git/hub.coffee