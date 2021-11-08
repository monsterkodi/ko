// koffee 1.19.0

/*
000  000   000  0000000    00000000  000   000  00000000   00000000         000    
000  0000  000  000   000  000        000 000   000   000  000   000        000    
000  000 0 000  000   000  0000000     00000    00000000   0000000          000    
000  000  0000  000   000  000        000 000   000        000   000  000   000    
000  000   000  0000000    00000000  000   000  000        000   000   0000000
 */
var ignore, indexKoFiles, indexProject, info, shouldIndex, slash, walkdir,
    indexOf = [].indexOf;

ignore = require('ignore');

slash = require('kslash');

walkdir = require('walkdir');

shouldIndex = function(path, stat) {
    var exts, ref;
    exts = ['coffee', 'styl', 'pug', 'md', 'noon', 'txt', 'json', 'sh', 'py', 'cpp', 'cc', 'c', 'cs', 'h', 'hpp', 'js'];
    if (ref = slash.ext(path), indexOf.call(exts, ref) >= 0) {
        if (stat.size > 654321) {
            return false;
        } else {
            return true;
        }
    }
    return false;
};

indexKoFiles = function(kofiles, info) {
    var absDir, cfg, dir, ign, j, kodata, kofile, len, noon, opt, ref, ref1;
    for (j = 0, len = kofiles.length; j < len; j++) {
        kofile = kofiles[j];
        noon = require('noon');
        kodata = noon.load(kofile);
        if (!kodata.index) {
            return;
        }
        ref = kodata.index;
        for (dir in ref) {
            cfg = ref[dir];
            opt = {
                max_depth: (ref1 = cfg.depth) != null ? ref1 : 4,
                no_return: true
            };
            ign = ignore();
            if (cfg.ignore) {
                ign.add(cfg.ignore);
            }
            absDir = slash.join(slash.dir(kofile), dir);
            walkdir.sync(absDir, opt, function(path, stat) {
                if (ign.ignores(slash.relative(path, dir))) {
                    return this.ignore(path);
                } else if (stat.isFile()) {
                    if (shouldIndex(path, stat)) {
                        return info.files.push(slash.path(path));
                    }
                }
            });
        }
    }
};

indexProject = function(file) {
    var depth, dir, ign, info, kofiles, opt;
    depth = 20;
    dir = slash.pkg(file);
    if (!dir) {
        depth = 3;
        if (slash.isFile(file)) {
            dir = slash.dir(file);
        } else if (slash.isDir(file)) {
            dir = file;
        }
    }
    if (!dir) {
        return;
    }
    kofiles = [];
    info = {
        dir: dir,
        files: []
    };
    ign = ignore();
    opt = {
        max_depth: depth,
        no_return: true
    };
    walkdir.sync(dir, opt, function(path, stat) {
        var addIgnores, gitignore;
        addIgnores = function(gitignore) {
            var gitdir, gitign;
            gitign = slash.readText(gitignore);
            gitign = gitign.split(/\r?\n/);
            gitign = gitign.filter(function(i) {
                return ((i != null ? i.startsWith : void 0) != null) && !i.startsWith("#");
            });
            gitdir = slash.dir(gitignore);
            if (!slash.samePath(gitdir, dir)) {
                gitign = gitign.map(function(i) {
                    if (i[0] === '!') {
                        return '!' + slash.relative(gitdir, dir) + i.slice(1);
                    } else {
                        return slash.relative(gitdir, dir) + i;
                    }
                });
            }
            return ign.add(gitign);
        };
        if (ign.ignores(slash.relative(path, dir))) {
            this.ignore(path);
            return;
        }
        if (stat.isDirectory()) {
            gitignore = slash.join(path, '.gitignore');
            if (slash.isFile(gitignore)) {
                return addIgnores(gitignore);
            }
        } else {
            file = slash.file(path);
            if (file === '.gitignore') {
                addIgnores(path);
                return;
            }
            if (file === '.ko.noon') {
                kofiles.push(path);
            }
            if (shouldIndex(path, stat)) {
                return info.files.push(slash.path(path));
            }
        }
    });
    indexKoFiles(kofiles, info);
    return info;
};

if (module.parent) {
    module.exports = indexProject;
} else {
    info = indexProject(slash.resolve(process.argv[2]));
    console.log(info.files.length + " files");
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXhwcmouanMiLCJzb3VyY2VSb290IjoiLi4vLi4vY29mZmVlL21haW4iLCJzb3VyY2VzIjpbImluZGV4cHJqLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSxxRUFBQTtJQUFBOztBQVFBLE1BQUEsR0FBVSxPQUFBLENBQVEsUUFBUjs7QUFDVixLQUFBLEdBQVUsT0FBQSxDQUFRLFFBQVI7O0FBQ1YsT0FBQSxHQUFVLE9BQUEsQ0FBUSxTQUFSOztBQUVWLFdBQUEsR0FBYyxTQUFDLElBQUQsRUFBTyxJQUFQO0FBRVYsUUFBQTtJQUFBLElBQUEsR0FBTyxDQUFFLFFBQUYsRUFBVyxNQUFYLEVBQWtCLEtBQWxCLEVBQXdCLElBQXhCLEVBQTZCLE1BQTdCLEVBQW9DLEtBQXBDLEVBQTBDLE1BQTFDLEVBQWlELElBQWpELEVBQXNELElBQXRELEVBQTJELEtBQTNELEVBQWlFLElBQWpFLEVBQXNFLEdBQXRFLEVBQTBFLElBQTFFLEVBQStFLEdBQS9FLEVBQW1GLEtBQW5GLEVBQXlGLElBQXpGO0lBQ1AsVUFBRyxLQUFLLENBQUMsR0FBTixDQUFVLElBQVYsQ0FBQSxFQUFBLGFBQW1CLElBQW5CLEVBQUEsR0FBQSxNQUFIO1FBQ0ksSUFBRyxJQUFJLENBQUMsSUFBTCxHQUFZLE1BQWY7QUFDSSxtQkFBTyxNQURYO1NBQUEsTUFBQTtBQUdJLG1CQUFPLEtBSFg7U0FESjs7V0FLQTtBQVJVOztBQVVkLFlBQUEsR0FBZSxTQUFDLE9BQUQsRUFBVSxJQUFWO0FBRVgsUUFBQTtBQUFBLFNBQUEseUNBQUE7O1FBRUksSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSO1FBQ1AsTUFBQSxHQUFTLElBQUksQ0FBQyxJQUFMLENBQVUsTUFBVjtRQUNULElBQVUsQ0FBSSxNQUFNLENBQUMsS0FBckI7QUFBQSxtQkFBQTs7QUFFQTtBQUFBLGFBQUEsVUFBQTs7WUFFSSxHQUFBLEdBQ0k7Z0JBQUEsU0FBQSxzQ0FBdUIsQ0FBdkI7Z0JB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LEdBQXJCLENBQVosQ0FBSDtZQUNJLElBQUMsQ0FBQSxNQUFELENBQVEsSUFBUjtBQUNBLG1CQUZKOztRQUlBLElBQUcsSUFBSSxDQUFDLFdBQUwsQ0FBQSxDQUFIO1lBQ0ksU0FBQSxHQUFZLEtBQUssQ0FBQyxJQUFOLENBQVcsSUFBWCxFQUFpQixZQUFqQjtZQUNaLElBQUcsS0FBSyxDQUFDLE1BQU4sQ0FBYSxTQUFiLENBQUg7dUJBQ0ksVUFBQSxDQUFXLFNBQVgsRUFESjthQUZKO1NBQUEsTUFBQTtZQUtJLElBQUEsR0FBTyxLQUFLLENBQUMsSUFBTixDQUFXLElBQVg7WUFDUCxJQUFHLElBQUEsS0FBUSxZQUFYO2dCQUNJLFVBQUEsQ0FBVyxJQUFYO0FBQ0EsdUJBRko7O1lBSUEsSUFBRyxJQUFBLEtBQVEsVUFBWDtnQkFDSSxPQUFPLENBQUMsSUFBUixDQUFhLElBQWIsRUFESjs7WUFHQSxJQUFHLFdBQUEsQ0FBWSxJQUFaLEVBQWtCLElBQWxCLENBQUg7dUJBQ0ksSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFYLENBQWdCLEtBQUssQ0FBQyxJQUFOLENBQVcsSUFBWCxDQUFoQixFQURKO2FBYko7O0lBbkJtQixDQUF2QjtJQW1DQSxZQUFBLENBQWEsT0FBYixFQUFzQixJQUF0QjtXQUVBO0FBN0RXOztBQStEZixJQUFHLE1BQU0sQ0FBQyxNQUFWO0lBRUksTUFBTSxDQUFDLE9BQVAsR0FBaUIsYUFGckI7Q0FBQSxNQUFBO0lBS0ksSUFBQSxHQUFPLFlBQUEsQ0FBYSxLQUFLLENBQUMsT0FBTixDQUFjLE9BQU8sQ0FBQyxJQUFLLENBQUEsQ0FBQSxDQUEzQixDQUFiO0lBQTBDLE9BQUEsQ0FDakQsR0FEaUQsQ0FDMUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFaLEdBQW1CLFFBRHdCLEVBTHJEIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAwICAgICAgICAgMDAwICAgIFxuMDAwICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgIDAwMCAgICBcbjAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgIDAwMDAwICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgICAgICAgICAwMDAgICAgXG4wMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgIFxuMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgICBcbiMjI1xuXG5pZ25vcmUgID0gcmVxdWlyZSAnaWdub3JlJ1xuc2xhc2ggICA9IHJlcXVpcmUgJ2tzbGFzaCdcbndhbGtkaXIgPSByZXF1aXJlICd3YWxrZGlyJ1xuXG5zaG91bGRJbmRleCA9IChwYXRoLCBzdGF0KSAtPlxuICAgIFxuICAgIGV4dHMgPSBbICdjb2ZmZWUnICdzdHlsJyAncHVnJyAnbWQnICdub29uJyAndHh0JyAnanNvbicgJ3NoJyAncHknICdjcHAnICdjYycgJ2MnICdjcycgJ2gnICdocHAnICdqcycgXVxuICAgIGlmIHNsYXNoLmV4dChwYXRoKSBpbiBleHRzXG4gICAgICAgIGlmIHN0YXQuc2l6ZSA+IDY1NDMyMVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgZmFsc2VcblxuaW5kZXhLb0ZpbGVzID0gKGtvZmlsZXMsIGluZm8pIC0+XG4gICAgXG4gICAgZm9yIGtvZmlsZSBpbiBrb2ZpbGVzXG4gICAgICAgIFxuICAgICAgICBub29uID0gcmVxdWlyZSAnbm9vbidcbiAgICAgICAga29kYXRhID0gbm9vbi5sb2FkIGtvZmlsZVxuICAgICAgICByZXR1cm4gaWYgbm90IGtvZGF0YS5pbmRleFxuICAgICAgICBcbiAgICAgICAgZm9yIGRpcixjZmcgb2Yga29kYXRhLmluZGV4XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIG9wdCA9IFxuICAgICAgICAgICAgICAgIG1heF9kZXB0aDogY2ZnLmRlcHRoID8gNFxuICAgICAgICAgICAgICAgIG5vX3JldHVybjogdHJ1ZVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgaWduID0gaWdub3JlKClcbiAgICAgICAgICAgIGlnbi5hZGQgY2ZnLmlnbm9yZSBpZiBjZmcuaWdub3JlXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGFic0RpciA9IHNsYXNoLmpvaW4gc2xhc2guZGlyKGtvZmlsZSksIGRpclxuICAgICAgICAgICAgXG4gICAgICAgICAgICB3YWxrZGlyLnN5bmMgYWJzRGlyLCBvcHQsIChwYXRoLCBzdGF0KSAtPlxuICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgaWduLmlnbm9yZXMgc2xhc2gucmVsYXRpdmUgcGF0aCwgZGlyXG4gICAgICAgICAgICAgICAgICAgIEBpZ25vcmUgcGF0aFxuICAgICAgICAgICAgICAgIGVsc2UgaWYgc3RhdC5pc0ZpbGUoKSBcbiAgICAgICAgICAgICAgICAgICAgaWYgc2hvdWxkSW5kZXggcGF0aCwgc3RhdFxuICAgICAgICAgICAgICAgICAgICAgICAgaW5mby5maWxlcy5wdXNoIHNsYXNoLnBhdGggcGF0aFxuXG5pbmRleFByb2plY3QgPSAoZmlsZSkgLT5cblxuICAgIGRlcHRoID0gMjBcbiAgICBcbiAgICBkaXIgPSBzbGFzaC5wa2cgZmlsZVxuICAgIFxuICAgIGlmIG5vdCBkaXJcbiAgICAgICAgZGVwdGggPSAzXG4gICAgICAgIGlmIHNsYXNoLmlzRmlsZSBmaWxlXG4gICAgICAgICAgICBkaXIgPSBzbGFzaC5kaXIgZmlsZVxuICAgICAgICBlbHNlIGlmIHNsYXNoLmlzRGlyIGZpbGVcbiAgICAgICAgICAgIGRpciA9IGZpbGVcbiAgICAgICAgICAgIFxuICAgIHJldHVybiBpZiBub3QgZGlyXG4gICAgXG4gICAga29maWxlcyA9IFtdXG4gICAgaW5mbyA9IGRpcjpkaXIsIGZpbGVzOltdXG5cbiAgICBpZ24gPSBpZ25vcmUoKVxuICAgIFxuICAgIG9wdCA9IFxuICAgICAgICBtYXhfZGVwdGg6IGRlcHRoXG4gICAgICAgIG5vX3JldHVybjogdHJ1ZVxuICAgICAgICAgICAgICAgIFxuICAgIHdhbGtkaXIuc3luYyBkaXIsIG9wdCwgKHBhdGgsIHN0YXQpIC0+XG4gICAgICAgIFxuICAgICAgICBhZGRJZ25vcmVzID0gKGdpdGlnbm9yZSkgLT4gXG4gICAgICAgICAgICBnaXRpZ24gPSBzbGFzaC5yZWFkVGV4dCBnaXRpZ25vcmVcbiAgICAgICAgICAgIGdpdGlnbiA9IGdpdGlnbi5zcGxpdCAvXFxyP1xcbi9cbiAgICAgICAgICAgIGdpdGlnbiA9IGdpdGlnbi5maWx0ZXIgKGkpIC0+IGk/LnN0YXJ0c1dpdGg/IGFuZCBub3QgaS5zdGFydHNXaXRoIFwiI1wiXG4gICAgICAgICAgICBnaXRkaXIgPSBzbGFzaC5kaXIgZ2l0aWdub3JlXG4gICAgICAgICAgICBpZiBub3Qgc2xhc2guc2FtZVBhdGggZ2l0ZGlyLCBkaXJcbiAgICAgICAgICAgICAgICBnaXRpZ24gPSBnaXRpZ24ubWFwIChpKSAtPiBcbiAgICAgICAgICAgICAgICAgICAgaWYgaVswXT09JyEnXG4gICAgICAgICAgICAgICAgICAgICAgICAnIScgKyBzbGFzaC5yZWxhdGl2ZShnaXRkaXIsIGRpcikgKyBpLnNsaWNlIDFcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgc2xhc2gucmVsYXRpdmUoZ2l0ZGlyLCBkaXIpICsgaVxuICAgICAgICAgICAgaWduLmFkZCBnaXRpZ25cbiAgICAgICAgXG4gICAgICAgIGlmIGlnbi5pZ25vcmVzIHNsYXNoLnJlbGF0aXZlIHBhdGgsIGRpclxuICAgICAgICAgICAgQGlnbm9yZSBwYXRoXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgXG4gICAgICAgIGlmIHN0YXQuaXNEaXJlY3RvcnkoKVxuICAgICAgICAgICAgZ2l0aWdub3JlID0gc2xhc2guam9pbiBwYXRoLCAnLmdpdGlnbm9yZSdcbiAgICAgICAgICAgIGlmIHNsYXNoLmlzRmlsZSBnaXRpZ25vcmVcbiAgICAgICAgICAgICAgICBhZGRJZ25vcmVzIGdpdGlnbm9yZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBmaWxlID0gc2xhc2guZmlsZSBwYXRoXG4gICAgICAgICAgICBpZiBmaWxlID09ICcuZ2l0aWdub3JlJ1xuICAgICAgICAgICAgICAgIGFkZElnbm9yZXMgcGF0aFxuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgZmlsZSA9PSAnLmtvLm5vb24nICMgPz8/XG4gICAgICAgICAgICAgICAga29maWxlcy5wdXNoIHBhdGhcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIHNob3VsZEluZGV4IHBhdGgsIHN0YXRcbiAgICAgICAgICAgICAgICBpbmZvLmZpbGVzLnB1c2ggc2xhc2gucGF0aCBwYXRoXG4gICAgICAgICAgICAgICAgXG4gICAgaW5kZXhLb0ZpbGVzIGtvZmlsZXMsIGluZm9cbiAgICAgIFxuICAgIGluZm9cblxuaWYgbW9kdWxlLnBhcmVudFxuICAgIFxuICAgIG1vZHVsZS5leHBvcnRzID0gaW5kZXhQcm9qZWN0XG4gICAgXG5lbHNlXG4gICAgaW5mbyA9IGluZGV4UHJvamVjdCBzbGFzaC5yZXNvbHZlIHByb2Nlc3MuYXJndlsyXVxuICAgIGxvZyBcIiN7aW5mby5maWxlcy5sZW5ndGh9IGZpbGVzXCJcbiAgICAiXX0=
//# sourceURL=../../coffee/main/indexprj.coffee