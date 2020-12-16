// koffee 1.14.0

/*
 0000000  000000000   0000000   000000000  000   000   0000000  
000          000     000   000     000     000   000  000       
0000000      000     000000000     000     000   000  0000000   
     000     000     000   000     000     000   000       000  
0000000      000     000   000     000      0000000   0000000
 */
var _, childp, dir, empty, gitCmd, gitOpt, parseResult, ref, slash, status, valid;

ref = require('kxk'), childp = ref.childp, slash = ref.slash, empty = ref.empty, valid = ref.valid, _ = ref._;

gitCmd = 'git status --porcelain';

gitOpt = function(gitDir) {
    return {
        encoding: 'utf8',
        cwd: slash.unslash(gitDir),
        stdio: ['pipe', 'pipe', 'ignore']
    };
};

status = function(gitDir, cb) {
    var err, r;
    if (_.isFunction(cb)) {
        if (empty(gitDir)) {
            return cb({});
        } else {
            try {
                return childp.exec(gitCmd, gitOpt(gitDir), function(err, r) {
                    if (valid(err)) {
                        return cb({});
                    } else {
                        return cb(parseResult(gitDir, r));
                    }
                });
            } catch (error) {
                err = error;
                return cb({});
            }
        }
    } else {
        if (empty(gitDir)) {
            return {};
        }
        try {
            r = childp.execSync(gitCmd, gitOpt(gitDir));
        } catch (error) {
            err = error;
            return {};
        }
        return parseResult(gitDir, r);
    }
};

parseResult = function(gitDir, result) {
    var dirSet, file, header, info, line, lines, rel;
    if (result.startsWith('fatal:')) {
        return {};
    }
    lines = result.split('\n');
    info = {
        gitDir: gitDir,
        changed: [],
        deleted: [],
        added: []
    };
    dirSet = new Set;
    while (line = lines.shift()) {
        rel = line.slice(3);
        file = slash.join(gitDir, line.slice(3));
        while ((rel = slash.dir(rel)) !== '') {
            dirSet.add(rel);
        }
        header = line.slice(0, 2);
        switch (header) {
            case ' D':
                info.deleted.push(file);
                break;
            case ' M':
                info.changed.push(file);
                break;
            case '??':
                info.added.push(file);
        }
    }
    info.dirs = Array.from(dirSet).map(function(d) {
        return slash.join(gitDir, d);
    });
    return info;
};

if (module.parent) {
    module.exports = status;
} else {
    if (!empty(process.argv[2])) {
        dir = slash.resolve(process.argv[2]);
    } else {
        dir = process.cwd();
    }
    console.log(status(dir));
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdHVzLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uL2NvZmZlZS9naXQiLCJzb3VyY2VzIjpbInN0YXR1cy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUE7O0FBUUEsTUFBcUMsT0FBQSxDQUFRLEtBQVIsQ0FBckMsRUFBRSxtQkFBRixFQUFVLGlCQUFWLEVBQWlCLGlCQUFqQixFQUF3QixpQkFBeEIsRUFBK0I7O0FBRS9CLE1BQUEsR0FBUzs7QUFDVCxNQUFBLEdBQVMsU0FBQyxNQUFEO1dBQVk7UUFBQSxRQUFBLEVBQVUsTUFBVjtRQUFpQixHQUFBLEVBQUssS0FBSyxDQUFDLE9BQU4sQ0FBYyxNQUFkLENBQXRCO1FBQTZDLEtBQUEsRUFBTSxDQUFDLE1BQUQsRUFBUSxNQUFSLEVBQWUsUUFBZixDQUFuRDs7QUFBWjs7QUFFVCxNQUFBLEdBQVMsU0FBQyxNQUFELEVBQVMsRUFBVDtBQUVMLFFBQUE7SUFBQSxJQUFHLENBQUMsQ0FBQyxVQUFGLENBQWEsRUFBYixDQUFIO1FBRUksSUFBRyxLQUFBLENBQU0sTUFBTixDQUFIO21CQUNJLEVBQUEsQ0FBRyxFQUFILEVBREo7U0FBQSxNQUFBO0FBR0k7dUJBQ0ksTUFBTSxDQUFDLElBQVAsQ0FBWSxNQUFaLEVBQW9CLE1BQUEsQ0FBTyxNQUFQLENBQXBCLEVBQW9DLFNBQUMsR0FBRCxFQUFLLENBQUw7b0JBQ2hDLElBQUcsS0FBQSxDQUFNLEdBQU4sQ0FBSDsrQkFDSSxFQUFBLENBQUcsRUFBSCxFQURKO3FCQUFBLE1BQUE7K0JBR0ksRUFBQSxDQUFHLFdBQUEsQ0FBWSxNQUFaLEVBQW9CLENBQXBCLENBQUgsRUFISjs7Z0JBRGdDLENBQXBDLEVBREo7YUFBQSxhQUFBO2dCQU1NO3VCQUNGLEVBQUEsQ0FBRyxFQUFILEVBUEo7YUFISjtTQUZKO0tBQUEsTUFBQTtRQWNJLElBQWEsS0FBQSxDQUFNLE1BQU4sQ0FBYjtBQUFBLG1CQUFPLEdBQVA7O0FBQ0E7WUFDSSxDQUFBLEdBQUksTUFBTSxDQUFDLFFBQVAsQ0FBZ0IsTUFBaEIsRUFBd0IsTUFBQSxDQUFPLE1BQVAsQ0FBeEIsRUFEUjtTQUFBLGFBQUE7WUFFTTtBQUNGLG1CQUFPLEdBSFg7O2VBS0EsV0FBQSxDQUFZLE1BQVosRUFBb0IsQ0FBcEIsRUFwQko7O0FBRks7O0FBOEJULFdBQUEsR0FBYyxTQUFDLE1BQUQsRUFBUyxNQUFUO0FBRVYsUUFBQTtJQUFBLElBQUcsTUFBTSxDQUFDLFVBQVAsQ0FBa0IsUUFBbEIsQ0FBSDtBQUFtQyxlQUFPLEdBQTFDOztJQUVBLEtBQUEsR0FBUSxNQUFNLENBQUMsS0FBUCxDQUFhLElBQWI7SUFFUixJQUFBLEdBQ0k7UUFBQSxNQUFBLEVBQVMsTUFBVDtRQUNBLE9BQUEsRUFBUyxFQURUO1FBRUEsT0FBQSxFQUFTLEVBRlQ7UUFHQSxLQUFBLEVBQVMsRUFIVDs7SUFLSixNQUFBLEdBQVMsSUFBSTtBQUViLFdBQU0sSUFBQSxHQUFPLEtBQUssQ0FBQyxLQUFOLENBQUEsQ0FBYjtRQUNJLEdBQUEsR0FBUyxJQUFJLENBQUMsS0FBTCxDQUFXLENBQVg7UUFDVCxJQUFBLEdBQVMsS0FBSyxDQUFDLElBQU4sQ0FBVyxNQUFYLEVBQW1CLElBQUksQ0FBQyxLQUFMLENBQVcsQ0FBWCxDQUFuQjtBQUNULGVBQU0sQ0FBQyxHQUFBLEdBQU0sS0FBSyxDQUFDLEdBQU4sQ0FBVSxHQUFWLENBQVAsQ0FBQSxLQUF5QixFQUEvQjtZQUNJLE1BQU0sQ0FBQyxHQUFQLENBQVcsR0FBWDtRQURKO1FBR0EsTUFBQSxHQUFTLElBQUksQ0FBQyxLQUFMLENBQVcsQ0FBWCxFQUFhLENBQWI7QUFDVCxnQkFBTyxNQUFQO0FBQUEsaUJBQ1MsSUFEVDtnQkFDbUIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFiLENBQWtCLElBQWxCO0FBQVY7QUFEVCxpQkFFUyxJQUZUO2dCQUVtQixJQUFJLENBQUMsT0FBTyxDQUFDLElBQWIsQ0FBa0IsSUFBbEI7QUFBVjtBQUZULGlCQUdTLElBSFQ7Z0JBR21CLElBQUksQ0FBQyxLQUFPLENBQUMsSUFBYixDQUFrQixJQUFsQjtBQUhuQjtJQVBKO0lBWUEsSUFBSSxDQUFDLElBQUwsR0FBWSxLQUFLLENBQUMsSUFBTixDQUFXLE1BQVgsQ0FBa0IsQ0FBQyxHQUFuQixDQUF1QixTQUFDLENBQUQ7ZUFBTyxLQUFLLENBQUMsSUFBTixDQUFXLE1BQVgsRUFBbUIsQ0FBbkI7SUFBUCxDQUF2QjtXQUNaO0FBM0JVOztBQW1DZCxJQUFHLE1BQU0sQ0FBQyxNQUFWO0lBRUksTUFBTSxDQUFDLE9BQVAsR0FBaUIsT0FGckI7Q0FBQSxNQUFBO0lBS0ksSUFBRyxDQUFJLEtBQUEsQ0FBTSxPQUFPLENBQUMsSUFBSyxDQUFBLENBQUEsQ0FBbkIsQ0FBUDtRQUNJLEdBQUEsR0FBTSxLQUFLLENBQUMsT0FBTixDQUFjLE9BQU8sQ0FBQyxJQUFLLENBQUEsQ0FBQSxDQUEzQixFQURWO0tBQUEsTUFBQTtRQUdJLEdBQUEsR0FBTSxPQUFPLENBQUMsR0FBUixDQUFBLEVBSFY7O0lBS0EsT0FBQSxDQUFBLEdBQUEsQ0FBSSxNQUFBLENBQU8sR0FBUCxDQUFKLEVBVkoiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbiAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICBcbjAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgICBcbjAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICBcbiAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgICAgICAgMDAwICBcbjAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbiMjI1xuXG57IGNoaWxkcCwgc2xhc2gsIGVtcHR5LCB2YWxpZCwgXyB9ID0gcmVxdWlyZSAna3hrJ1xuXG5naXRDbWQgPSAnZ2l0IHN0YXR1cyAtLXBvcmNlbGFpbidcbmdpdE9wdCA9IChnaXREaXIpIC0+IGVuY29kaW5nOsKgJ3V0ZjgnIGN3ZDogc2xhc2gudW5zbGFzaChnaXREaXIpLCBzdGRpbzpbJ3BpcGUnICdwaXBlJyAnaWdub3JlJ11cblxuc3RhdHVzID0gKGdpdERpciwgY2IpIC0+XG5cbiAgICBpZiBfLmlzRnVuY3Rpb24gY2JcbiAgICAgICAgXG4gICAgICAgIGlmIGVtcHR5IGdpdERpclxuICAgICAgICAgICAgY2Ige31cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgdHJ5XG4gICAgICAgICAgICAgICAgY2hpbGRwLmV4ZWMgZ2l0Q21kLCBnaXRPcHQoZ2l0RGlyKSwgKGVycixyKSAtPlxuICAgICAgICAgICAgICAgICAgICBpZiB2YWxpZCBlcnJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNiIHt9XG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIGNiIHBhcnNlUmVzdWx0IGdpdERpciwgclxuICAgICAgICAgICAgY2F0Y2ggZXJyXG4gICAgICAgICAgICAgICAgY2Ige31cbiAgICBlbHNlXG4gICAgICAgIHJldHVybiB7fSBpZiBlbXB0eSBnaXREaXJcbiAgICAgICAgdHJ5XG4gICAgICAgICAgICByID0gY2hpbGRwLmV4ZWNTeW5jIGdpdENtZCwgZ2l0T3B0IGdpdERpclxuICAgICAgICBjYXRjaCBlcnJcbiAgICAgICAgICAgIHJldHVybiB7fVxuICAgICAgICBcbiAgICAgICAgcGFyc2VSZXN1bHQgZ2l0RGlyLCByXG4gICAgXG4jIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMCAgXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgXG4jIDAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgXG4jIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAwMDAgICAgICAgXG4jIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwMCAgXG5cbnBhcnNlUmVzdWx0ID0gKGdpdERpciwgcmVzdWx0KSAtPlxuICAgIFxuICAgIGlmIHJlc3VsdC5zdGFydHNXaXRoICdmYXRhbDonIHRoZW4gcmV0dXJuIHt9XG4gICAgXG4gICAgbGluZXMgPSByZXN1bHQuc3BsaXQgJ1xcbidcblxuICAgIGluZm8gPSBcbiAgICAgICAgZ2l0RGlyOiAgZ2l0RGlyXG4gICAgICAgIGNoYW5nZWQ6IFtdXG4gICAgICAgIGRlbGV0ZWQ6IFtdXG4gICAgICAgIGFkZGVkOiAgIFtdXG4gICAgICAgIFxuICAgIGRpclNldCA9IG5ldyBTZXRcbiAgICBcbiAgICB3aGlsZSBsaW5lID0gbGluZXMuc2hpZnQoKVxuICAgICAgICByZWwgICAgPSBsaW5lLnNsaWNlIDNcbiAgICAgICAgZmlsZSAgID0gc2xhc2guam9pbiBnaXREaXIsIGxpbmUuc2xpY2UgM1xuICAgICAgICB3aGlsZSAocmVsID0gc2xhc2guZGlyIHJlbCkgIT0gJydcbiAgICAgICAgICAgIGRpclNldC5hZGQgcmVsXG4gICAgICAgICAgICBcbiAgICAgICAgaGVhZGVyID0gbGluZS5zbGljZSAwLDJcbiAgICAgICAgc3dpdGNoIGhlYWRlclxuICAgICAgICAgICAgd2hlbiAnIEQnIHRoZW4gaW5mby5kZWxldGVkLnB1c2ggZmlsZVxuICAgICAgICAgICAgd2hlbiAnIE0nIHRoZW4gaW5mby5jaGFuZ2VkLnB1c2ggZmlsZVxuICAgICAgICAgICAgd2hlbiAnPz8nIHRoZW4gaW5mby5hZGRlZCAgLnB1c2ggZmlsZVxuICAgICAgICAgICAgXG4gICAgaW5mby5kaXJzID0gQXJyYXkuZnJvbShkaXJTZXQpLm1hcCAoZCkgLT4gc2xhc2guam9pbiBnaXREaXIsIGRcbiAgICBpbmZvXG5cbiMgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAwMDAwMCAgXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIFxuIyAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAgICBcbiMgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgXG4jIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuXG5pZiBtb2R1bGUucGFyZW50XG4gICAgXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBzdGF0dXNcbiAgICBcbmVsc2VcbiAgICBpZiBub3QgZW1wdHkgcHJvY2Vzcy5hcmd2WzJdXG4gICAgICAgIGRpciA9IHNsYXNoLnJlc29sdmUgcHJvY2Vzcy5hcmd2WzJdXG4gICAgZWxzZVxuICAgICAgICBkaXIgPSBwcm9jZXNzLmN3ZCgpXG4gICAgXG4gICAgbG9nIHN0YXR1cyBkaXJcbiAgICAiXX0=
//# sourceURL=../../coffee/git/status.coffee