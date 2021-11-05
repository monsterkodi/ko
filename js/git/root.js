// koffee 1.16.0

/*
00000000    0000000    0000000   000000000  
000   000  000   000  000   000     000     
0000000    000   000  000   000     000     
000   000  000   000  000   000     000     
000   000   0000000    0000000      000
 */
var _, childp, dir, empty, fixPath, gitCmd, gitOpt, ref, root, slash, valid;

ref = require('kxk'), _ = ref._, childp = ref.childp, empty = ref.empty, slash = ref.slash, valid = ref.valid;

fixPath = function(p) {
    var ref1;
    p = p.trim();
    if ((p[0] === (ref1 = p[2]) && ref1 === '/')) {
        p = p[1].toUpperCase() + ':' + p.slice(2);
    }
    return slash.resolve(p);
};

gitCmd = 'git rev-parse --show-toplevel';

gitOpt = function(cwd) {
    return {
        cwd: cwd,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore']
    };
};

root = function(pth, cb) {
    var err;
    pth = slash.resolve(pth);
    if (_.isFunction(cb)) {
        if (empty(pth)) {
            return cb('');
        } else {
            pth = slash.unslash(pth);
            return slash.dirExists(pth, function(stat) {
                pth = valid(stat) ? slash.unslash(pth) : slash.dir(pth);
                if (empty(pth)) {
                    return cb('');
                } else {
                    return childp.exec(gitCmd, gitOpt(pth), function(err, r) {
                        if (valid(err)) {
                            return cb('');
                        } else {
                            return cb(fixPath(r));
                        }
                    });
                }
            });
        }
    } else {
        if (empty(pth)) {
            return '';
        }
        try {
            pth = slash.dirExists(pth) ? slash.unslash(pth) : slash.dir(pth);
            if (empty(pth)) {
                return '';
            }
            return fixPath(childp.execSync(gitCmd, gitOpt(pth)));
        } catch (error) {
            err = error;
            return '';
        }
    }
};

if (module.parent) {
    module.exports = root;
} else {
    if (!empty(process.argv[2])) {
        dir = slash.resolve(process.argv[2]);
    } else {
        dir = process.cwd();
    }
    console.log(root(dir));
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm9vdC5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi9jb2ZmZWUvZ2l0Iiwic291cmNlcyI6WyJyb290LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQTs7QUFRQSxNQUFxQyxPQUFBLENBQVEsS0FBUixDQUFyQyxFQUFFLFNBQUYsRUFBSyxtQkFBTCxFQUFhLGlCQUFiLEVBQW9CLGlCQUFwQixFQUEyQjs7QUFFM0IsT0FBQSxHQUFVLFNBQUMsQ0FBRDtBQUVOLFFBQUE7SUFBQSxDQUFBLEdBQUksQ0FBQyxDQUFDLElBQUYsQ0FBQTtJQUNKLElBQUcsQ0FBQSxDQUFFLENBQUEsQ0FBQSxDQUFGLGFBQVEsQ0FBRSxDQUFBLENBQUEsRUFBVixRQUFBLEtBQWdCLEdBQWhCLENBQUg7UUFDSSxDQUFBLEdBQUksQ0FBRSxDQUFBLENBQUEsQ0FBRSxDQUFDLFdBQUwsQ0FBQSxDQUFBLEdBQXFCLEdBQXJCLEdBQTJCLENBQUMsQ0FBQyxLQUFGLENBQVEsQ0FBUixFQURuQzs7QUFFQSxXQUFPLEtBQUssQ0FBQyxPQUFOLENBQWMsQ0FBZDtBQUxEOztBQU9WLE1BQUEsR0FBUzs7QUFDVCxNQUFBLEdBQVMsU0FBQyxHQUFEO1dBQVM7UUFBQSxHQUFBLEVBQUksR0FBSjtRQUFTLFFBQUEsRUFBUyxNQUFsQjtRQUF5QixLQUFBLEVBQU0sQ0FBQyxNQUFELEVBQVEsTUFBUixFQUFlLFFBQWYsQ0FBL0I7O0FBQVQ7O0FBRVQsSUFBQSxHQUFPLFNBQUMsR0FBRCxFQUFNLEVBQU47QUFFSCxRQUFBO0lBQUEsR0FBQSxHQUFNLEtBQUssQ0FBQyxPQUFOLENBQWMsR0FBZDtJQUVOLElBQUcsQ0FBQyxDQUFDLFVBQUYsQ0FBYSxFQUFiLENBQUg7UUFFSSxJQUFHLEtBQUEsQ0FBTSxHQUFOLENBQUg7bUJBQ0ksRUFBQSxDQUFHLEVBQUgsRUFESjtTQUFBLE1BQUE7WUFHSSxHQUFBLEdBQU0sS0FBSyxDQUFDLE9BQU4sQ0FBYyxHQUFkO21CQUVOLEtBQUssQ0FBQyxTQUFOLENBQWdCLEdBQWhCLEVBQXFCLFNBQUMsSUFBRDtnQkFDakIsR0FBQSxHQUFTLEtBQUEsQ0FBTSxJQUFOLENBQUgsR0FBb0IsS0FBSyxDQUFDLE9BQU4sQ0FBYyxHQUFkLENBQXBCLEdBQTRDLEtBQUssQ0FBQyxHQUFOLENBQVUsR0FBVjtnQkFDbEQsSUFBRyxLQUFBLENBQU0sR0FBTixDQUFIOzJCQUNJLEVBQUEsQ0FBRyxFQUFILEVBREo7aUJBQUEsTUFBQTsyQkFHSSxNQUFNLENBQUMsSUFBUCxDQUFZLE1BQVosRUFBb0IsTUFBQSxDQUFPLEdBQVAsQ0FBcEIsRUFBaUMsU0FBQyxHQUFELEVBQUssQ0FBTDt3QkFDN0IsSUFBRyxLQUFBLENBQU0sR0FBTixDQUFIO21DQUNJLEVBQUEsQ0FBRyxFQUFILEVBREo7eUJBQUEsTUFBQTttQ0FHSSxFQUFBLENBQUcsT0FBQSxDQUFRLENBQVIsQ0FBSCxFQUhKOztvQkFENkIsQ0FBakMsRUFISjs7WUFGaUIsQ0FBckIsRUFMSjtTQUZKO0tBQUEsTUFBQTtRQW1CSSxJQUFhLEtBQUEsQ0FBTSxHQUFOLENBQWI7QUFBQSxtQkFBTyxHQUFQOztBQUVBO1lBQ0ksR0FBQSxHQUFTLEtBQUssQ0FBQyxTQUFOLENBQWdCLEdBQWhCLENBQUgsR0FBNkIsS0FBSyxDQUFDLE9BQU4sQ0FBYyxHQUFkLENBQTdCLEdBQXFELEtBQUssQ0FBQyxHQUFOLENBQVUsR0FBVjtZQUMzRCxJQUFhLEtBQUEsQ0FBTSxHQUFOLENBQWI7QUFBQSx1QkFBTyxHQUFQOztBQUNBLG1CQUFPLE9BQUEsQ0FBUSxNQUFNLENBQUMsUUFBUCxDQUFnQixNQUFoQixFQUF3QixNQUFBLENBQU8sR0FBUCxDQUF4QixDQUFSLEVBSFg7U0FBQSxhQUFBO1lBS007QUFDRixtQkFBTyxHQU5YO1NBckJKOztBQUpHOztBQXVDUCxJQUFHLE1BQU0sQ0FBQyxNQUFWO0lBRUksTUFBTSxDQUFDLE9BQVAsR0FBaUIsS0FGckI7Q0FBQSxNQUFBO0lBS0ksSUFBRyxDQUFJLEtBQUEsQ0FBTSxPQUFPLENBQUMsSUFBSyxDQUFBLENBQUEsQ0FBbkIsQ0FBUDtRQUNJLEdBQUEsR0FBTSxLQUFLLENBQUMsT0FBTixDQUFjLE9BQU8sQ0FBQyxJQUFLLENBQUEsQ0FBQSxDQUEzQixFQURWO0tBQUEsTUFBQTtRQUdJLEdBQUEsR0FBTSxPQUFPLENBQUMsR0FBUixDQUFBLEVBSFY7O0lBS0EsT0FBQSxDQUFBLEdBQUEsQ0FBSSxJQUFBLENBQUssR0FBTCxDQUFKLEVBVkoiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4wMDAgICAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAgICAwMDAgICAgIFxuIyMjXG5cbnsgXywgY2hpbGRwLCBlbXB0eSwgc2xhc2gsIHZhbGlkIH0gPSByZXF1aXJlICdreGsnXG5cbmZpeFBhdGggPSAocCkgLT5cbiAgICBcbiAgICBwID0gcC50cmltKClcbiAgICBpZiBwWzBdID09IHBbMl0gPT0gJy8nXG4gICAgICAgIHAgPSBwWzFdLnRvVXBwZXJDYXNlKCkgKyAnOicgKyBwLnNsaWNlIDJcbiAgICByZXR1cm4gc2xhc2gucmVzb2x2ZSBwICAgIFxuXG5naXRDbWQgPSAnZ2l0IHJldi1wYXJzZSAtLXNob3ctdG9wbGV2ZWwnXG5naXRPcHQgPSAoY3dkKSAtPiBjd2Q6Y3dkLCBlbmNvZGluZzondXRmOCcgc3RkaW86WydwaXBlJyAncGlwZScgJ2lnbm9yZSddXG4gICAgXG5yb290ID0gKHB0aCwgY2IpIC0+XG5cbiAgICBwdGggPSBzbGFzaC5yZXNvbHZlIHB0aFxuICAgIFxuICAgIGlmIF8uaXNGdW5jdGlvbiBjYlxuICAgICAgICBcbiAgICAgICAgaWYgZW1wdHkgcHRoXG4gICAgICAgICAgICBjYiAnJ1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBwdGggPSBzbGFzaC51bnNsYXNoIHB0aFxuICAgICAgICAgICAgXG4gICAgICAgICAgICBzbGFzaC5kaXJFeGlzdHMgcHRoLCAoc3RhdCkgLT5cbiAgICAgICAgICAgICAgICBwdGggPSBpZiB2YWxpZChzdGF0KSB0aGVuIHNsYXNoLnVuc2xhc2gocHRoKSBlbHNlIHNsYXNoLmRpcihwdGgpXG4gICAgICAgICAgICAgICAgaWYgZW1wdHkgcHRoXG4gICAgICAgICAgICAgICAgICAgIGNiICcnIFxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgY2hpbGRwLmV4ZWMgZ2l0Q21kLCBnaXRPcHQocHRoKSwgKGVycixyKSAtPlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgdmFsaWQgZXJyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2IgJycgXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2IgZml4UGF0aCByXG4gICAgZWxzZVxuICAgIFxuICAgICAgICByZXR1cm4gJycgaWYgZW1wdHkgcHRoXG4gICAgICAgIFxuICAgICAgICB0cnlcbiAgICAgICAgICAgIHB0aCA9IGlmIHNsYXNoLmRpckV4aXN0cyhwdGgpIHRoZW4gc2xhc2gudW5zbGFzaChwdGgpIGVsc2Ugc2xhc2guZGlyKHB0aClcbiAgICAgICAgICAgIHJldHVybiAnJyBpZiBlbXB0eSBwdGhcbiAgICAgICAgICAgIHJldHVybiBmaXhQYXRoIGNoaWxkcC5leGVjU3luYyBnaXRDbWQsIGdpdE9wdChwdGgpXG4gICAgICAgICAgICBcbiAgICAgICAgY2F0Y2ggZXJyXG4gICAgICAgICAgICByZXR1cm4gJydcblxuIyAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgXG4jIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwMDAwMCAgIFxuIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICBcbiMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgXG5cbmlmIG1vZHVsZS5wYXJlbnRcbiAgICBcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHJvb3RcbiAgICBcbmVsc2VcbiAgICBpZiBub3QgZW1wdHkgcHJvY2Vzcy5hcmd2WzJdXG4gICAgICAgIGRpciA9IHNsYXNoLnJlc29sdmUgcHJvY2Vzcy5hcmd2WzJdXG4gICAgZWxzZVxuICAgICAgICBkaXIgPSBwcm9jZXNzLmN3ZCgpXG4gICAgICAgIFxuICAgIGxvZyByb290IGRpclxuICAgICJdfQ==
//# sourceURL=../../coffee/git/root.coffee