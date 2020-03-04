// koffee 1.11.0

/*
00000000    0000000    0000000   000000000  
000   000  000   000  000   000     000     
0000000    000   000  000   000     000     
000   000  000   000  000   000     000     
000   000   0000000    0000000      000
 */
var _, childp, dir, empty, fixPath, gitCmd, gitOpt, ref, root, slash, valid;

ref = require('kxk'), childp = ref.childp, slash = ref.slash, empty = ref.empty, valid = ref.valid, _ = ref._;

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm9vdC5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi9jb2ZmZWUvZ2l0Iiwic291cmNlcyI6WyJyb290LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQTs7QUFRQSxNQUFxQyxPQUFBLENBQVEsS0FBUixDQUFyQyxFQUFFLG1CQUFGLEVBQVUsaUJBQVYsRUFBaUIsaUJBQWpCLEVBQXdCLGlCQUF4QixFQUErQjs7QUFFL0IsT0FBQSxHQUFVLFNBQUMsQ0FBRDtBQUVOLFFBQUE7SUFBQSxDQUFBLEdBQUksQ0FBQyxDQUFDLElBQUYsQ0FBQTtJQUNKLElBQUcsQ0FBQSxDQUFFLENBQUEsQ0FBQSxDQUFGLGFBQVEsQ0FBRSxDQUFBLENBQUEsRUFBVixRQUFBLEtBQWdCLEdBQWhCLENBQUg7UUFDSSxDQUFBLEdBQUksQ0FBRSxDQUFBLENBQUEsQ0FBRSxDQUFDLFdBQUwsQ0FBQSxDQUFBLEdBQXFCLEdBQXJCLEdBQTJCLENBQUMsQ0FBQyxLQUFGLENBQVEsQ0FBUixFQURuQzs7QUFFQSxXQUFPLEtBQUssQ0FBQyxPQUFOLENBQWMsQ0FBZDtBQUxEOztBQU9WLE1BQUEsR0FBVTs7QUFDVixNQUFBLEdBQVMsU0FBQyxHQUFEO1dBQVM7UUFBQSxHQUFBLEVBQUksR0FBSjtRQUFTLFFBQUEsRUFBUyxNQUFsQjtRQUF5QixLQUFBLEVBQU0sQ0FBQyxNQUFELEVBQVEsTUFBUixFQUFlLFFBQWYsQ0FBL0I7O0FBQVQ7O0FBRVQsSUFBQSxHQUFPLFNBQUMsR0FBRCxFQUFNLEVBQU47QUFFSCxRQUFBO0lBQUEsR0FBQSxHQUFNLEtBQUssQ0FBQyxPQUFOLENBQWMsR0FBZDtJQUVOLElBQUcsQ0FBQyxDQUFDLFVBQUYsQ0FBYSxFQUFiLENBQUg7UUFFSSxJQUFHLEtBQUEsQ0FBTSxHQUFOLENBQUg7bUJBQ0ksRUFBQSxDQUFHLEVBQUgsRUFESjtTQUFBLE1BQUE7WUFHSSxHQUFBLEdBQU0sS0FBSyxDQUFDLE9BQU4sQ0FBYyxHQUFkO21CQUVOLEtBQUssQ0FBQyxTQUFOLENBQWdCLEdBQWhCLEVBQXFCLFNBQUMsSUFBRDtnQkFDakIsR0FBQSxHQUFTLEtBQUEsQ0FBTSxJQUFOLENBQUgsR0FBb0IsS0FBSyxDQUFDLE9BQU4sQ0FBYyxHQUFkLENBQXBCLEdBQTRDLEtBQUssQ0FBQyxHQUFOLENBQVUsR0FBVjtnQkFDbEQsSUFBRyxLQUFBLENBQU0sR0FBTixDQUFIOzJCQUNJLEVBQUEsQ0FBRyxFQUFILEVBREo7aUJBQUEsTUFBQTsyQkFHSSxNQUFNLENBQUMsSUFBUCxDQUFZLE1BQVosRUFBb0IsTUFBQSxDQUFPLEdBQVAsQ0FBcEIsRUFBaUMsU0FBQyxHQUFELEVBQUssQ0FBTDt3QkFDN0IsSUFBRyxLQUFBLENBQU0sR0FBTixDQUFIO21DQUNJLEVBQUEsQ0FBRyxFQUFILEVBREo7eUJBQUEsTUFBQTttQ0FHSSxFQUFBLENBQUcsT0FBQSxDQUFRLENBQVIsQ0FBSCxFQUhKOztvQkFENkIsQ0FBakMsRUFISjs7WUFGaUIsQ0FBckIsRUFMSjtTQUZKO0tBQUEsTUFBQTtRQW1CSSxJQUFhLEtBQUEsQ0FBTSxHQUFOLENBQWI7QUFBQSxtQkFBTyxHQUFQOztBQUVBO1lBQ0ksR0FBQSxHQUFTLEtBQUssQ0FBQyxTQUFOLENBQWdCLEdBQWhCLENBQUgsR0FBNkIsS0FBSyxDQUFDLE9BQU4sQ0FBYyxHQUFkLENBQTdCLEdBQXFELEtBQUssQ0FBQyxHQUFOLENBQVUsR0FBVjtZQUMzRCxJQUFhLEtBQUEsQ0FBTSxHQUFOLENBQWI7QUFBQSx1QkFBTyxHQUFQOztBQUNBLG1CQUFPLE9BQUEsQ0FBUSxNQUFNLENBQUMsUUFBUCxDQUFnQixNQUFoQixFQUF3QixNQUFBLENBQU8sR0FBUCxDQUF4QixDQUFSLEVBSFg7U0FBQSxhQUFBO1lBS007QUFDRixtQkFBTyxHQU5YO1NBckJKOztBQUpHOztBQXVDUCxJQUFHLE1BQU0sQ0FBQyxNQUFWO0lBRUksTUFBTSxDQUFDLE9BQVAsR0FBaUIsS0FGckI7Q0FBQSxNQUFBO0lBS0ksSUFBRyxDQUFJLEtBQUEsQ0FBTSxPQUFPLENBQUMsSUFBSyxDQUFBLENBQUEsQ0FBbkIsQ0FBUDtRQUNJLEdBQUEsR0FBTSxLQUFLLENBQUMsT0FBTixDQUFjLE9BQU8sQ0FBQyxJQUFLLENBQUEsQ0FBQSxDQUEzQixFQURWO0tBQUEsTUFBQTtRQUdJLEdBQUEsR0FBTSxPQUFPLENBQUMsR0FBUixDQUFBLEVBSFY7O0lBS0EsT0FBQSxDQUFBLEdBQUEsQ0FBSSxJQUFBLENBQUssR0FBTCxDQUFKLEVBVkoiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4wMDAgICAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAgICAwMDAgICAgIFxuIyMjXG5cbnsgY2hpbGRwLCBzbGFzaCwgZW1wdHksIHZhbGlkLCBfIH0gPSByZXF1aXJlICdreGsnXG5cbmZpeFBhdGggPSAocCkgLT5cbiAgICBcbiAgICBwID0gcC50cmltKClcbiAgICBpZiBwWzBdID09IHBbMl0gPT0gJy8nXG4gICAgICAgIHAgPSBwWzFdLnRvVXBwZXJDYXNlKCkgKyAnOicgKyBwLnNsaWNlIDJcbiAgICByZXR1cm4gc2xhc2gucmVzb2x2ZSBwICAgIFxuXG5naXRDbWQgID0gJ2dpdCByZXYtcGFyc2UgLS1zaG93LXRvcGxldmVsJ1xuZ2l0T3B0ID0gKGN3ZCkgLT4gY3dkOmN3ZCwgZW5jb2Rpbmc6J3V0ZjgnIHN0ZGlvOlsncGlwZScgJ3BpcGUnICdpZ25vcmUnXVxuICAgIFxucm9vdCA9IChwdGgsIGNiKSAtPlxuXG4gICAgcHRoID0gc2xhc2gucmVzb2x2ZSBwdGhcbiAgICBcbiAgICBpZiBfLmlzRnVuY3Rpb24gY2JcbiAgICAgICAgXG4gICAgICAgIGlmIGVtcHR5IHB0aFxuICAgICAgICAgICAgY2IgJydcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcHRoID0gc2xhc2gudW5zbGFzaCBwdGhcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgc2xhc2guZGlyRXhpc3RzIHB0aCwgKHN0YXQpIC0+XG4gICAgICAgICAgICAgICAgcHRoID0gaWYgdmFsaWQoc3RhdCkgdGhlbiBzbGFzaC51bnNsYXNoKHB0aCkgZWxzZSBzbGFzaC5kaXIocHRoKVxuICAgICAgICAgICAgICAgIGlmIGVtcHR5IHB0aFxuICAgICAgICAgICAgICAgICAgICBjYiAnJyBcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGNoaWxkcC5leGVjIGdpdENtZCwgZ2l0T3B0KHB0aCksIChlcnIscikgLT5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIHZhbGlkIGVyclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNiICcnIFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNiIGZpeFBhdGggclxuICAgIGVsc2VcbiAgICBcbiAgICAgICAgcmV0dXJuICcnIGlmIGVtcHR5IHB0aFxuICAgICAgICBcbiAgICAgICAgdHJ5XG4gICAgICAgICAgICBwdGggPSBpZiBzbGFzaC5kaXJFeGlzdHMocHRoKSB0aGVuIHNsYXNoLnVuc2xhc2gocHRoKSBlbHNlIHNsYXNoLmRpcihwdGgpXG4gICAgICAgICAgICByZXR1cm4gJycgaWYgZW1wdHkgcHRoXG4gICAgICAgICAgICByZXR1cm4gZml4UGF0aCBjaGlsZHAuZXhlY1N5bmMgZ2l0Q21kLCBnaXRPcHQocHRoKVxuICAgICAgICAgICAgXG4gICAgICAgIGNhdGNoIGVyclxuICAgICAgICAgICAgcmV0dXJuICcnXG5cbiMgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAwMDAwMCAgXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIFxuIyAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAgICBcbiMgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgXG4jIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuXG5pZiBtb2R1bGUucGFyZW50XG4gICAgXG4gICAgbW9kdWxlLmV4cG9ydHMgPSByb290XG4gICAgXG5lbHNlXG4gICAgaWYgbm90IGVtcHR5IHByb2Nlc3MuYXJndlsyXVxuICAgICAgICBkaXIgPSBzbGFzaC5yZXNvbHZlIHByb2Nlc3MuYXJndlsyXVxuICAgIGVsc2VcbiAgICAgICAgZGlyID0gcHJvY2Vzcy5jd2QoKVxuICAgICAgICBcbiAgICBsb2cgcm9vdCBkaXJcbiAgICAiXX0=
//# sourceURL=../../coffee/git/root.coffee