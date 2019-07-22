// koffee 1.3.0

/*
000  000   000  0000000    00000000  000   000  00000000   00000000         000    
000  0000  000  000   000  000        000 000   000   000  000   000        000    
000  000 0 000  000   000  0000000     00000    00000000   0000000          000    
000  000  0000  000   000  000        000 000   000        000   000  000   000    
000  000   000  0000000    00000000  000   000  000        000   000   0000000
 */
var empty, fs, ignore, indexKoFiles, indexProject, info, noon, ref, shouldIndex, slash, sourceFileExtensions, walkdir,
    indexOf = [].indexOf;

ref = require('kxk'), slash = ref.slash, walkdir = ref.walkdir, empty = ref.empty, noon = ref.noon, fs = ref.fs;

ignore = require('ignore');

sourceFileExtensions = ['koffee', 'coffee', 'styl', 'pug', 'md', 'noon', 'txt', 'json', 'sh', 'py', 'cpp', 'cc', 'c', 'cs', 'h', 'hpp', 'ts', 'js'];

shouldIndex = function(path, stat) {
    var ref1;
    if (ref1 = slash.ext(path), indexOf.call(sourceFileExtensions, ref1) >= 0) {
        if (stat.size > 654321) {
            return false;
        } else {
            return true;
        }
    }
    return false;
};

indexKoFiles = function(kofiles, info) {
    var absDir, cfg, dir, ign, j, kodata, kofile, len, opt, ref1, ref2;
    for (j = 0, len = kofiles.length; j < len; j++) {
        kofile = kofiles[j];
        kodata = noon.load(kofile);
        if (empty(kodata.index)) {
            return;
        }
        ref1 = kodata.index;
        for (dir in ref1) {
            cfg = ref1[dir];
            opt = {
                max_depth: (ref2 = cfg.depth) != null ? ref2 : 4,
                no_return: true
            };
            ign = ignore();
            if (!empty(cfg.ignore)) {
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
            gitign = fs.readFileSync(gitignore, 'utf8');
            gitign = gitign.split(/\r?\n/);
            gitign = gitign.filter(function(i) {
                return !empty(i) && !i.startsWith("#");
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXhwcmouanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLGlIQUFBO0lBQUE7O0FBUUEsTUFBc0MsT0FBQSxDQUFRLEtBQVIsQ0FBdEMsRUFBRSxpQkFBRixFQUFTLHFCQUFULEVBQWtCLGlCQUFsQixFQUF5QixlQUF6QixFQUErQjs7QUFFL0IsTUFBQSxHQUFTLE9BQUEsQ0FBUSxRQUFSOztBQUVULG9CQUFBLEdBQXVCLENBQUUsUUFBRixFQUFZLFFBQVosRUFBc0IsTUFBdEIsRUFBOEIsS0FBOUIsRUFBcUMsSUFBckMsRUFBMkMsTUFBM0MsRUFBbUQsS0FBbkQsRUFBMEQsTUFBMUQsRUFBa0UsSUFBbEUsRUFBd0UsSUFBeEUsRUFBOEUsS0FBOUUsRUFBcUYsSUFBckYsRUFBMkYsR0FBM0YsRUFBZ0csSUFBaEcsRUFBc0csR0FBdEcsRUFBMkcsS0FBM0csRUFBa0gsSUFBbEgsRUFBd0gsSUFBeEg7O0FBRXZCLFdBQUEsR0FBYyxTQUFDLElBQUQsRUFBTyxJQUFQO0FBRVYsUUFBQTtJQUFBLFdBQUcsS0FBSyxDQUFDLEdBQU4sQ0FBVSxJQUFWLENBQUEsRUFBQSxhQUFtQixvQkFBbkIsRUFBQSxJQUFBLE1BQUg7UUFDSSxJQUFHLElBQUksQ0FBQyxJQUFMLEdBQVksTUFBZjtBQUNJLG1CQUFPLE1BRFg7U0FBQSxNQUFBO0FBR0ksbUJBQU8sS0FIWDtTQURKOztXQUtBO0FBUFU7O0FBU2QsWUFBQSxHQUFlLFNBQUMsT0FBRCxFQUFVLElBQVY7QUFFWCxRQUFBO0FBQUEsU0FBQSx5Q0FBQTs7UUFFSSxNQUFBLEdBQVMsSUFBSSxDQUFDLElBQUwsQ0FBVSxNQUFWO1FBQ1QsSUFBVSxLQUFBLENBQU0sTUFBTSxDQUFDLEtBQWIsQ0FBVjtBQUFBLG1CQUFBOztBQUVBO0FBQUEsYUFBQSxXQUFBOztZQUVJLEdBQUEsR0FDSTtnQkFBQSxTQUFBLHNDQUF1QixDQUF2Qjtn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MDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwMCAgICAgICAgIDAwMCAgICBcbjAwMCAgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAgICAgXG4wMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgICAwMDAwMCAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAgICAgICAgMDAwICAgIFxuMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgMDAwICAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICBcbjAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAgMDAwMDAwMCAgICAgXG4jIyNcblxueyBzbGFzaCwgd2Fsa2RpciwgZW1wdHksIG5vb24sIGZzIH0gPSByZXF1aXJlICdreGsnXG5cbmlnbm9yZSA9IHJlcXVpcmUgJ2lnbm9yZSdcblxuc291cmNlRmlsZUV4dGVuc2lvbnMgPSBbICdrb2ZmZWUnLCAnY29mZmVlJywgJ3N0eWwnLCAncHVnJywgJ21kJywgJ25vb24nLCAndHh0JywgJ2pzb24nLCAnc2gnLCAncHknLCAnY3BwJywgJ2NjJywgJ2MnLCAnY3MnLCAnaCcsICdocHAnLCAndHMnLCAnanMnXVxuXG5zaG91bGRJbmRleCA9IChwYXRoLCBzdGF0KSAtPlxuICAgIFxuICAgIGlmIHNsYXNoLmV4dChwYXRoKSBpbiBzb3VyY2VGaWxlRXh0ZW5zaW9uc1xuICAgICAgICBpZiBzdGF0LnNpemUgPiA2NTQzMjFcbiAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgIGZhbHNlXG5cbmluZGV4S29GaWxlcyA9IChrb2ZpbGVzLCBpbmZvKSAtPlxuICAgIFxuICAgIGZvciBrb2ZpbGUgaW4ga29maWxlc1xuICAgICAgICBcbiAgICAgICAga29kYXRhID0gbm9vbi5sb2FkIGtvZmlsZVxuICAgICAgICByZXR1cm4gaWYgZW1wdHkga29kYXRhLmluZGV4XG4gICAgICAgIFxuICAgICAgICBmb3IgZGlyLGNmZyBvZiBrb2RhdGEuaW5kZXhcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgb3B0ID0gXG4gICAgICAgICAgICAgICAgbWF4X2RlcHRoOiBjZmcuZGVwdGggPyA0XG4gICAgICAgICAgICAgICAgbm9fcmV0dXJuOiB0cnVlXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBpZ24gPSBpZ25vcmUoKVxuICAgICAgICAgICAgaWduLmFkZCBjZmcuaWdub3JlIGlmIG5vdCBlbXB0eSBjZmcuaWdub3JlXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGFic0RpciA9IHNsYXNoLmpvaW4gc2xhc2guZGlyKGtvZmlsZSksIGRpclxuICAgICAgICAgICAgXG4gICAgICAgICAgICB3YWxrZGlyLnN5bmMgYWJzRGlyLCBvcHQsIChwYXRoLCBzdGF0KSAtPlxuICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgaWduLmlnbm9yZXMgc2xhc2gucmVsYXRpdmUgcGF0aCwgZGlyXG4gICAgICAgICAgICAgICAgICAgIEBpZ25vcmUgcGF0aFxuICAgICAgICAgICAgICAgIGVsc2UgaWYgc3RhdC5pc0ZpbGUoKSBcbiAgICAgICAgICAgICAgICAgICAgaWYgc2hvdWxkSW5kZXggcGF0aCwgc3RhdFxuICAgICAgICAgICAgICAgICAgICAgICAgaW5mby5maWxlcy5wdXNoIHNsYXNoLnBhdGggcGF0aFxuXG5pbmRleFByb2plY3QgPSAoZmlsZSkgLT5cblxuICAgIGRlcHRoID0gMjBcbiAgICBcbiAgICBkaXIgPSBzbGFzaC5wa2cgZmlsZVxuICAgIFxuICAgIGlmIG5vdCBkaXJcbiAgICAgICAgZGVwdGggPSAzXG4gICAgICAgIGlmIHNsYXNoLmlzRmlsZSBmaWxlXG4gICAgICAgICAgICBkaXIgPSBzbGFzaC5kaXIgZmlsZVxuICAgICAgICBlbHNlIGlmIHNsYXNoLmlzRGlyIGZpbGVcbiAgICAgICAgICAgIGRpciA9IGZpbGVcbiAgICAgICAgICAgIFxuICAgIHJldHVybiBpZiBub3QgZGlyXG4gICAgXG4gICAga29maWxlcyA9IFtdXG4gICAgaW5mbyA9IGRpcjpkaXIsIGZpbGVzOltdXG5cbiAgICBpZ24gPSBpZ25vcmUoKVxuICAgIFxuICAgIG9wdCA9IFxuICAgICAgICBtYXhfZGVwdGg6IGRlcHRoXG4gICAgICAgIG5vX3JldHVybjogdHJ1ZVxuICAgICAgICAgICAgICAgIFxuICAgIHdhbGtkaXIuc3luYyBkaXIsIG9wdCwgKHBhdGgsIHN0YXQpIC0+XG4gICAgICAgIFxuICAgICAgICBhZGRJZ25vcmVzID0gKGdpdGlnbm9yZSkgLT4gXG4gICAgICAgICAgICBnaXRpZ24gPSBmcy5yZWFkRmlsZVN5bmMgZ2l0aWdub3JlLCAndXRmOCdcbiAgICAgICAgICAgIGdpdGlnbiA9IGdpdGlnbi5zcGxpdCAvXFxyP1xcbi9cbiAgICAgICAgICAgIGdpdGlnbiA9IGdpdGlnbi5maWx0ZXIgKGkpIC0+IG5vdCBlbXB0eShpKSBhbmQgbm90IGkuc3RhcnRzV2l0aCBcIiNcIlxuICAgICAgICAgICAgZ2l0ZGlyID0gc2xhc2guZGlyIGdpdGlnbm9yZVxuICAgICAgICAgICAgaWYgbm90IHNsYXNoLnNhbWVQYXRoIGdpdGRpciwgZGlyXG4gICAgICAgICAgICAgICAgZ2l0aWduID0gZ2l0aWduLm1hcCAoaSkgLT4gXG4gICAgICAgICAgICAgICAgICAgIGlmIGlbMF09PSchJ1xuICAgICAgICAgICAgICAgICAgICAgICAgJyEnICsgc2xhc2gucmVsYXRpdmUoZ2l0ZGlyLCBkaXIpICsgaS5zbGljZSAxXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIHNsYXNoLnJlbGF0aXZlKGdpdGRpciwgZGlyKSArIGlcbiAgICAgICAgICAgIGlnbi5hZGQgZ2l0aWduXG4gICAgICAgIFxuICAgICAgICBpZiBpZ24uaWdub3JlcyBzbGFzaC5yZWxhdGl2ZSBwYXRoLCBkaXJcbiAgICAgICAgICAgIEBpZ25vcmUgcGF0aFxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIFxuICAgICAgICBpZiBzdGF0LmlzRGlyZWN0b3J5KClcbiAgICAgICAgICAgIGdpdGlnbm9yZSA9IHNsYXNoLmpvaW4gcGF0aCwgJy5naXRpZ25vcmUnXG4gICAgICAgICAgICBpZiBzbGFzaC5pc0ZpbGUgZ2l0aWdub3JlXG4gICAgICAgICAgICAgICAgYWRkSWdub3JlcyBnaXRpZ25vcmVcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgZmlsZSA9IHNsYXNoLmZpbGUgcGF0aFxuICAgICAgICAgICAgaWYgZmlsZSA9PSAnLmdpdGlnbm9yZSdcbiAgICAgICAgICAgICAgICBhZGRJZ25vcmVzIHBhdGhcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIGZpbGUgPT0gJy5rby5ub29uJyAjID8/P1xuICAgICAgICAgICAgICAgIGtvZmlsZXMucHVzaCBwYXRoXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBzaG91bGRJbmRleCBwYXRoLCBzdGF0XG4gICAgICAgICAgICAgICAgaW5mby5maWxlcy5wdXNoIHNsYXNoLnBhdGggcGF0aFxuICAgICAgICAgICAgICAgIFxuICAgIGluZGV4S29GaWxlcyBrb2ZpbGVzLCBpbmZvXG4gICAgICBcbiAgICBpbmZvXG5cbmlmIG1vZHVsZS5wYXJlbnRcbiAgICBcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGluZGV4UHJvamVjdFxuICAgIFxuZWxzZVxuICAgIGluZm8gPSBpbmRleFByb2plY3Qgc2xhc2gucmVzb2x2ZSBwcm9jZXNzLmFyZ3ZbMl1cbiAgICBsb2cgXCIje2luZm8uZmlsZXMubGVuZ3RofSBmaWxlc1wiXG4gICAgIl19
//# sourceURL=../../coffee/main/indexprj.coffee