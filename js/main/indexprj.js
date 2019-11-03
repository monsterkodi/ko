// koffee 1.4.0

/*
000  000   000  0000000    00000000  000   000  00000000   00000000         000    
000  0000  000  000   000  000        000 000   000   000  000   000        000    
000  000 0 000  000   000  0000000     00000    00000000   0000000          000    
000  000  0000  000   000  000        000 000   000        000   000  000   000    
000  000   000  0000000    00000000  000   000  000        000   000   0000000
 */
var File, empty, fs, ignore, indexKoFiles, indexProject, info, noon, ref, shouldIndex, slash, walkdir,
    indexOf = [].indexOf;

ref = require('kxk'), walkdir = ref.walkdir, slash = ref.slash, empty = ref.empty, noon = ref.noon, fs = ref.fs;

ignore = require('ignore');

File = require('../tools/file');

shouldIndex = function(path, stat) {
    var ref1;
    if (ref1 = slash.ext(path), indexOf.call(File.sourceFileExtensions, ref1) >= 0) {
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXhwcmouanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLGlHQUFBO0lBQUE7O0FBUUEsTUFBc0MsT0FBQSxDQUFRLEtBQVIsQ0FBdEMsRUFBRSxxQkFBRixFQUFXLGlCQUFYLEVBQWtCLGlCQUFsQixFQUF5QixlQUF6QixFQUErQjs7QUFFL0IsTUFBQSxHQUFTLE9BQUEsQ0FBUSxRQUFSOztBQUNULElBQUEsR0FBTyxPQUFBLENBQVEsZUFBUjs7QUFFUCxXQUFBLEdBQWMsU0FBQyxJQUFELEVBQU8sSUFBUDtBQUVWLFFBQUE7SUFBQSxXQUFHLEtBQUssQ0FBQyxHQUFOLENBQVUsSUFBVixDQUFBLEVBQUEsYUFBbUIsSUFBSSxDQUFDLG9CQUF4QixFQUFBLElBQUEsTUFBSDtRQUNJLElBQUcsSUFBSSxDQUFDLElBQUwsR0FBWSxNQUFmO0FBQ0ksbUJBQU8sTUFEWDtTQUFBLE1BQUE7QUFHSSxtQkFBTyxLQUhYO1NBREo7O1dBS0E7QUFQVTs7QUFTZCxZQUFBLEdBQWUsU0FBQyxPQUFELEVBQVUsSUFBVjtBQUVYLFFBQUE7QUFBQSxTQUFBLHlDQUFBOztRQUVJLE1BQUEsR0FBUyxJQUFJLENBQUMsSUFBTCxDQUFVLE1BQVY7UUFDVCxJQUFVLEtBQUEsQ0FBTSxNQUFNLENBQUMsS0FBYixDQUFWO0FBQUEsbUJBQUE7O0FBRUE7QUFBQSxhQUFBLFdBQUE7O1lBRUksR0FBQSxHQUNJO2dCQUFBLFNBQUEsc0NBQXVCLENBQXZCO2dCQUNBLFNBQUEsRUFBVyxJQURYOztZQUdKLEdBQUEsR0FBTSxNQUFBLENBQUE7WUFDTixJQUFzQixDQUFJLEtBQUEsQ0FBTSxHQUFHLENBQUMsTUFBVixDQUExQjtnQkFBQSxHQUFHLENBQUMsR0FBSixDQUFRLEdBQUcsQ0FBQyxNQUFaLEVBQUE7O1lBRUEsTUFBQSxHQUFTLEtBQUssQ0FBQyxJQUFOLENBQVcsS0FBSyxDQUFDLEdBQU4s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QUFpQixZQUFqQjtZQUNaLElBQUcsS0FBSyxDQUFDLE1BQU4sQ0FBYSxTQUFiLENBQUg7dUJBQ0ksVUFBQSxDQUFXLFNBQVgsRUFESjthQUZKO1NBQUEsTUFBQTtZQUtJLElBQUEsR0FBTyxLQUFLLENBQUMsSUFBTixDQUFXLElBQVg7WUFDUCxJQUFHLElBQUEsS0FBUSxZQUFYO2dCQUNJLFVBQUEsQ0FBVyxJQUFYO0FBQ0EsdUJBRko7O1lBSUEsSUFBRyxJQUFBLEtBQVEsVUFBWDtnQkFDSSxPQUFPLENBQUMsSUFBUixDQUFhLElBQWIsRUFESjs7WUFHQSxJQUFHLFdBQUEsQ0FBWSxJQUFaLEVBQWtCLElBQWxCLENBQUg7dUJBQ0ksSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFYLENBQWdCLEtBQUssQ0FBQyxJQUFOLENBQVcsSUFBWCxDQUFoQixFQURKO2FBYko7O0lBbkJtQixDQUF2QjtJQW1DQSxZQUFBLENBQWEsT0FBYixFQUFzQixJQUF0QjtXQUVBO0FBN0RXOztBQStEZixJQUFHLE1BQU0sQ0FBQyxNQUFWO0lBRUksTUFBTSxDQUFDLE9BQVAsR0FBaUIsYUFGckI7Q0FBQSxNQUFBO0lBS0ksSUFBQSxHQUFPLFlBQUEsQ0FBYSxLQUFLLENBQUMsT0FBTixDQUFjLE9BQU8sQ0FBQyxJQUFLLENBQUEsQ0FBQSxDQUEzQixDQUFiO0lBQTBDLE9BQUEsQ0FDakQsR0FEaUQsQ0FDMUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFaLEdBQW1CLFFBRHdCLEVBTHJEIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAwICAgICAgICAgMDAwICAgIFxuMDAwICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgIDAwMCAgICBcbjAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgIDAwMDAwICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgICAgICAgICAwMDAgICAgXG4wMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgIFxuMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgICBcbiMjI1xuXG57IHdhbGtkaXIsIHNsYXNoLCBlbXB0eSwgbm9vbiwgZnMgfSA9IHJlcXVpcmUgJ2t4aydcblxuaWdub3JlID0gcmVxdWlyZSAnaWdub3JlJ1xuRmlsZSA9IHJlcXVpcmUgJy4uL3Rvb2xzL2ZpbGUnXG5cbnNob3VsZEluZGV4ID0gKHBhdGgsIHN0YXQpIC0+XG4gICAgXG4gICAgaWYgc2xhc2guZXh0KHBhdGgpIGluIEZpbGUuc291cmNlRmlsZUV4dGVuc2lvbnNcbiAgICAgICAgaWYgc3RhdC5zaXplID4gNjU0MzIxXG4gICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICBmYWxzZVxuXG5pbmRleEtvRmlsZXMgPSAoa29maWxlcywgaW5mbykgLT5cbiAgICBcbiAgICBmb3Iga29maWxlIGluIGtvZmlsZXNcbiAgICAgICAgXG4gICAgICAgIGtvZGF0YSA9IG5vb24ubG9hZCBrb2ZpbGVcbiAgICAgICAgcmV0dXJuIGlmIGVtcHR5IGtvZGF0YS5pbmRleFxuICAgICAgICBcbiAgICAgICAgZm9yIGRpcixjZmcgb2Yga29kYXRhLmluZGV4XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIG9wdCA9IFxuICAgICAgICAgICAgICAgIG1heF9kZXB0aDogY2ZnLmRlcHRoID8gNFxuICAgICAgICAgICAgICAgIG5vX3JldHVybjogdHJ1ZVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgaWduID0gaWdub3JlKClcbiAgICAgICAgICAgIGlnbi5hZGQgY2ZnLmlnbm9yZSBpZiBub3QgZW1wdHkgY2ZnLmlnbm9yZVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBhYnNEaXIgPSBzbGFzaC5qb2luIHNsYXNoLmRpcihrb2ZpbGUpLCBkaXJcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgd2Fsa2Rpci5zeW5jIGFic0Rpciwgb3B0LCAocGF0aCwgc3RhdCkgLT5cbiAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIGlnbi5pZ25vcmVzIHNsYXNoLnJlbGF0aXZlIHBhdGgsIGRpclxuICAgICAgICAgICAgICAgICAgICBAaWdub3JlIHBhdGhcbiAgICAgICAgICAgICAgICBlbHNlIGlmIHN0YXQuaXNGaWxlKCkgXG4gICAgICAgICAgICAgICAgICAgIGlmIHNob3VsZEluZGV4IHBhdGgsIHN0YXRcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZm8uZmlsZXMucHVzaCBzbGFzaC5wYXRoIHBhdGhcblxuaW5kZXhQcm9qZWN0ID0gKGZpbGUpIC0+XG5cbiAgICBkZXB0aCA9IDIwXG4gICAgXG4gICAgZGlyID0gc2xhc2gucGtnIGZpbGVcbiAgICBcbiAgICBpZiBub3QgZGlyXG4gICAgICAgIGRlcHRoID0gM1xuICAgICAgICBpZiBzbGFzaC5pc0ZpbGUgZmlsZVxuICAgICAgICAgICAgZGlyID0gc2xhc2guZGlyIGZpbGVcbiAgICAgICAgZWxzZSBpZiBzbGFzaC5pc0RpciBmaWxlXG4gICAgICAgICAgICBkaXIgPSBmaWxlXG4gICAgICAgICAgICBcbiAgICByZXR1cm4gaWYgbm90IGRpclxuICAgIFxuICAgIGtvZmlsZXMgPSBbXVxuICAgIGluZm8gPSBkaXI6ZGlyLCBmaWxlczpbXVxuXG4gICAgaWduID0gaWdub3JlKClcbiAgICBcbiAgICBvcHQgPSBcbiAgICAgICAgbWF4X2RlcHRoOiBkZXB0aFxuICAgICAgICBub19yZXR1cm46IHRydWVcbiAgICAgICAgICAgICAgICBcbiAgICB3YWxrZGlyLnN5bmMgZGlyLCBvcHQsIChwYXRoLCBzdGF0KSAtPlxuICAgICAgICBcbiAgICAgICAgYWRkSWdub3JlcyA9IChnaXRpZ25vcmUpIC0+IFxuICAgICAgICAgICAgZ2l0aWduID0gZnMucmVhZEZpbGVTeW5jIGdpdGlnbm9yZSwgJ3V0ZjgnXG4gICAgICAgICAgICBnaXRpZ24gPSBnaXRpZ24uc3BsaXQgL1xccj9cXG4vXG4gICAgICAgICAgICBnaXRpZ24gPSBnaXRpZ24uZmlsdGVyIChpKSAtPiBub3QgZW1wdHkoaSkgYW5kIG5vdCBpLnN0YXJ0c1dpdGggXCIjXCJcbiAgICAgICAgICAgIGdpdGRpciA9IHNsYXNoLmRpciBnaXRpZ25vcmVcbiAgICAgICAgICAgIGlmIG5vdCBzbGFzaC5zYW1lUGF0aCBnaXRkaXIsIGRpclxuICAgICAgICAgICAgICAgIGdpdGlnbiA9IGdpdGlnbi5tYXAgKGkpIC0+IFxuICAgICAgICAgICAgICAgICAgICBpZiBpWzBdPT0nISdcbiAgICAgICAgICAgICAgICAgICAgICAgICchJyArIHNsYXNoLnJlbGF0aXZlKGdpdGRpciwgZGlyKSArIGkuc2xpY2UgMVxuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBzbGFzaC5yZWxhdGl2ZShnaXRkaXIsIGRpcikgKyBpXG4gICAgICAgICAgICBpZ24uYWRkIGdpdGlnblxuICAgICAgICBcbiAgICAgICAgaWYgaWduLmlnbm9yZXMgc2xhc2gucmVsYXRpdmUgcGF0aCwgZGlyXG4gICAgICAgICAgICBAaWdub3JlIHBhdGhcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICBcbiAgICAgICAgaWYgc3RhdC5pc0RpcmVjdG9yeSgpXG4gICAgICAgICAgICBnaXRpZ25vcmUgPSBzbGFzaC5qb2luIHBhdGgsICcuZ2l0aWdub3JlJ1xuICAgICAgICAgICAgaWYgc2xhc2guaXNGaWxlIGdpdGlnbm9yZVxuICAgICAgICAgICAgICAgIGFkZElnbm9yZXMgZ2l0aWdub3JlXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGZpbGUgPSBzbGFzaC5maWxlIHBhdGhcbiAgICAgICAgICAgIGlmIGZpbGUgPT0gJy5naXRpZ25vcmUnXG4gICAgICAgICAgICAgICAgYWRkSWdub3JlcyBwYXRoXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBmaWxlID09ICcua28ubm9vbicgIyA/Pz9cbiAgICAgICAgICAgICAgICBrb2ZpbGVzLnB1c2ggcGF0aFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgc2hvdWxkSW5kZXggcGF0aCwgc3RhdFxuICAgICAgICAgICAgICAgIGluZm8uZmlsZXMucHVzaCBzbGFzaC5wYXRoIHBhdGhcbiAgICAgICAgICAgICAgICBcbiAgICBpbmRleEtvRmlsZXMga29maWxlcywgaW5mb1xuICAgICAgXG4gICAgaW5mb1xuXG5pZiBtb2R1bGUucGFyZW50XG4gICAgXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBpbmRleFByb2plY3RcbiAgICBcbmVsc2VcbiAgICBpbmZvID0gaW5kZXhQcm9qZWN0IHNsYXNoLnJlc29sdmUgcHJvY2Vzcy5hcmd2WzJdXG4gICAgbG9nIFwiI3tpbmZvLmZpbGVzLmxlbmd0aH0gZmlsZXNcIlxuICAgICJdfQ==
//# sourceURL=../../coffee/main/indexprj.coffee