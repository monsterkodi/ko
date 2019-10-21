// koffee 1.4.0

/*
0000000    000  00000000  00000000
000   000  000  000       000
000   000  000  000000    000000
000   000  000  000       000
0000000    000  000       000
 */
var _, childp, diff, empty, file, gitCmd, gitOpt, kstr, parseResult, ref, slash, valid;

ref = require('kxk'), childp = ref.childp, slash = ref.slash, kstr = ref.kstr, valid = ref.valid, empty = ref.empty, _ = ref._;

gitCmd = function(file) {
    return "git --no-pager diff -U0 \"" + (slash.file(file)) + "\"";
};

gitOpt = function(cwd) {
    return {
        cwd: cwd,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore']
    };
};

diff = function(file, cb) {
    file = slash.resolve(file);
    if (_.isFunction(cb)) {
        return slash.isFile(file, function(stat) {
            if (empty(stat)) {
                cb({});
            }
            return childp.exec(gitCmd(file), gitOpt(slash.unslash(slash.dir(file))), function(err, r) {
                if (valid(err)) {
                    return cb({});
                } else {
                    return cb(parseResult(file, r));
                }
            });
        });
    } else {
        if (!slash.isFile(file)) {
            return {};
        }
        return parseResult(file, childp.execSync(gitCmd(file), gitOpt(slash.unslash(slash.dir(file)))));
    }
};

parseResult = function(file, result) {
    var after, afterSplit, before, change, i, info, j, k, l, line, lines, m, n, newLines, numNew, numOld, o, oldLines, ref1, ref10, ref2, ref3, ref4, ref5, ref6, ref7, ref8, ref9, x;
    info = {
        file: file,
        changes: []
    };
    lines = (function() {
        var j, len, ref1, results;
        ref1 = result.split('\n');
        results = [];
        for (j = 0, len = ref1.length; j < len; j++) {
            l = ref1[j];
            results.push(kstr.stripAnsi(l));
        }
        return results;
    })();
    while (line = lines.shift()) {
        if (line.startsWith('@@')) {
            ref1 = line.split(' '), x = ref1[0], before = ref1[1], after = ref1[2];
            afterSplit = after.split(',');
            numOld = parseInt((ref2 = before.split(',')[1]) != null ? ref2 : 1);
            numNew = parseInt((ref3 = afterSplit[1]) != null ? ref3 : 1);
            change = {
                line: parseInt(afterSplit[0])
            };
            oldLines = [];
            for (i = j = 0, ref4 = numOld; 0 <= ref4 ? j < ref4 : j > ref4; i = 0 <= ref4 ? ++j : --j) {
                oldLines.push(lines.shift().slice(1));
            }
            while (_.first(lines)[0] === '\\') {
                lines.shift();
            }
            newLines = [];
            for (i = k = 0, ref5 = numNew; 0 <= ref5 ? k < ref5 : k > ref5; i = 0 <= ref5 ? ++k : --k) {
                newLines.push(lines.shift().slice(1));
            }
            while (_.first(lines)[0] === '\\') {
                lines.shift();
            }
            if (oldLines.length) {
                change.old = oldLines;
            }
            if (newLines.length) {
                change["new"] = newLines;
            }
            if (numOld && numNew) {
                change.mod = [];
                for (i = m = 0, ref6 = Math.min(numOld, numNew); 0 <= ref6 ? m < ref6 : m > ref6; i = 0 <= ref6 ? ++m : --m) {
                    change.mod.push({
                        old: change.old[i],
                        "new": change["new"][i]
                    });
                }
            }
            if (numOld > numNew) {
                change.del = [];
                for (i = n = ref7 = numNew, ref8 = numOld; ref7 <= ref8 ? n < ref8 : n > ref8; i = ref7 <= ref8 ? ++n : --n) {
                    change.del.push({
                        old: change.old[i]
                    });
                }
            } else if (numNew > numOld) {
                change.add = [];
                for (i = o = ref9 = numOld, ref10 = numNew; ref9 <= ref10 ? o < ref10 : o > ref10; i = ref9 <= ref10 ? ++o : --o) {
                    change.add.push({
                        "new": change["new"][i]
                    });
                }
            }
            info.changes.push(change);
        }
    }
    return info;
};

if (module.parent) {
    module.exports = diff;
} else {
    if (!empty(process.argv[2])) {
        file = slash.resolve(process.argv[2]);
    } else {
        file = process.cwd();
    }
    console.log(diff(file));
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlmZi5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUE7O0FBUUEsTUFBMkMsT0FBQSxDQUFRLEtBQVIsQ0FBM0MsRUFBRSxtQkFBRixFQUFVLGlCQUFWLEVBQWlCLGVBQWpCLEVBQXVCLGlCQUF2QixFQUE4QixpQkFBOUIsRUFBcUM7O0FBSXJDLE1BQUEsR0FBUyxTQUFDLElBQUQ7V0FBVSw0QkFBQSxHQUE0QixDQUFDLEtBQUssQ0FBQyxJQUFOLENBQVcsSUFBWCxDQUFELENBQTVCLEdBQTZDO0FBQXZEOztBQUNULE1BQUEsR0FBUyxTQUFDLEdBQUQ7V0FBVTtRQUFBLEdBQUEsRUFBSSxHQUFKO1FBQVMsUUFBQSxFQUFTLE1BQWxCO1FBQTBCLEtBQUEsRUFBTSxDQUFDLE1BQUQsRUFBUyxNQUFULEVBQWlCLFFBQWpCLENBQWhDOztBQUFWOztBQUVULElBQUEsR0FBTyxTQUFDLElBQUQsRUFBTyxFQUFQO0lBRUgsSUFBQSxHQUFPLEtBQUssQ0FBQyxPQUFOLENBQWMsSUFBZDtJQUVQLElBQUcsQ0FBQyxDQUFDLFVBQUYsQ0FBYSxFQUFiLENBQUg7ZUFDSSxLQUFLLENBQUMsTUFBTixDQUFhLElBQWIsRUFBbUIsU0FBQyxJQUFEO1lBQ2YsSUFBVSxLQUFBLENBQU0sSUFBTixDQUFWO2dCQUFBLEVBQUEsQ0FBRyxFQUFILEVBQUE7O21CQUNBLE1BQU0sQ0FBQyxJQUFQLENBQVksTUFBQSxDQUFPLElBQVAsQ0FBWixFQUEwQixNQUFBLENBQU8sS0FBSyxDQUFDLE9BQU4sQ0FBYyxLQUFLLENBQUMsR0FBTixDQUFVLElBQVYsQ0FBZCxDQUFQLENBQTFCLEVBQWdFLFNBQUMsR0FBRCxFQUFLLENBQUw7Z0JBQzVELElBQUcsS0FBQSxDQUFNLEdBQU4sQ0FBSDsyQkFDSSxFQUFBLENBQUcsRUFBSCxFQURKO2lCQUFBLE1BQUE7MkJBR0ksRUFBQSxDQUFHLFdBQUEsQ0FBWSxJ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QWE7QUFDYixxQkFBUywyR0FBVDtvQkFDSSxNQUFNLENBQUMsR0FBRyxDQUFDLElBQVgsQ0FBZ0I7d0JBQUEsQ0FBQSxHQUFBLENBQUEsRUFBSSxNQUFNLEVBQUMsR0FBRCxFQUFLLENBQUEsQ0FBQSxDQUFmO3FCQUFoQjtBQURKLGlCQUZDOztZQUtMLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBYixDQUFrQixNQUFsQixFQXBDSjs7SUFGSjtBQXdDQSxXQUFPO0FBOUNHOztBQXNEZCxJQUFHLE1BQU0sQ0FBQyxNQUFWO0lBRUksTUFBTSxDQUFDLE9BQVAsR0FBaUIsS0FGckI7Q0FBQSxNQUFBO0lBTUksSUFBRyxDQUFJLEtBQUEsQ0FBTSxPQUFPLENBQUMsSUFBSyxDQUFBLENBQUEsQ0FBbkIsQ0FBUDtRQUNJLElBQUEsR0FBTyxLQUFLLENBQUMsT0FBTixDQUFjLE9BQU8sQ0FBQyxJQUFLLENBQUEsQ0FBQSxDQUEzQixFQURYO0tBQUEsTUFBQTtRQUdJLElBQUEsR0FBTyxPQUFPLENBQUMsR0FBUixDQUFBLEVBSFg7O0lBS0EsT0FBQSxDQUFBLEdBQUEsQ0FBSSxJQUFBLENBQUssSUFBTCxDQUFKLEVBWEoiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMDAwMDAgICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMDBcbjAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgMDAwXG4wMDAgICAwMDAgIDAwMCAgMDAwMDAwICAgIDAwMDAwMFxuMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAwMDBcbjAwMDAwMDAgICAgMDAwICAwMDAgICAgICAgMDAwXG4jIyNcblxueyBjaGlsZHAsIHNsYXNoLCBrc3RyLCB2YWxpZCwgZW1wdHksIF8gfSA9IHJlcXVpcmUgJ2t4aydcblxuIyBzdHJpcEFuc2kgPSByZXF1aXJlICdzdHJpcC1hbnNpJ1xuXG5naXRDbWQgPSAoZmlsZSkgLT4gXCJnaXQgLS1uby1wYWdlciBkaWZmIC1VMCBcXFwiI3tzbGFzaC5maWxlIGZpbGV9XFxcIlwiXG5naXRPcHQgPSAoY3dkKSAgLT4gY3dkOmN3ZCwgZW5jb2Rpbmc6J3V0ZjgnLCBzdGRpbzpbJ3BpcGUnLCAncGlwZScsICdpZ25vcmUnXVxuXG5kaWZmID0gKGZpbGUsIGNiKSAtPlxuXG4gICAgZmlsZSA9IHNsYXNoLnJlc29sdmUgZmlsZVxuXG4gICAgaWYgXy5pc0Z1bmN0aW9uIGNiXG4gICAgICAgIHNsYXNoLmlzRmlsZSBmaWxlLCAoc3RhdCkgLT5cbiAgICAgICAgICAgIGNiKHt9KSBpZiBlbXB0eSBzdGF0XG4gICAgICAgICAgICBjaGlsZHAuZXhlYyBnaXRDbWQoZmlsZSksIGdpdE9wdChzbGFzaC51bnNsYXNoIHNsYXNoLmRpciBmaWxlKSwgKGVycixyKSAtPlxuICAgICAgICAgICAgICAgIGlmIHZhbGlkIGVyclxuICAgICAgICAgICAgICAgICAgICBjYiB7fVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgY2IgcGFyc2VSZXN1bHQgZmlsZSwgclxuICAgIGVsc2VcblxuICAgICAgICByZXR1cm4ge30gaWYgbm90IHNsYXNoLmlzRmlsZSBmaWxlXG4gICAgICAgIHBhcnNlUmVzdWx0IGZpbGUsIGNoaWxkcC5leGVjU3luYyBnaXRDbWQoZmlsZSksIGdpdE9wdChzbGFzaC51bnNsYXNoIHNsYXNoLmRpciBmaWxlKVxuXG4jIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwXG4jIDAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwXG4jIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAwMDBcbiMgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwXG5cbnBhcnNlUmVzdWx0ID0gKGZpbGUsIHJlc3VsdCkgLT5cblxuICAgIGluZm8gID0gZmlsZTpmaWxlLCBjaGFuZ2VzOltdXG4gICAgIyBsaW5lcyA9IChzdHJpcEFuc2kgbCBmb3IgbCBpbiByZXN1bHQuc3BsaXQgJ1xcbicpXG4gICAgbGluZXMgPSAoa3N0ci5zdHJpcEFuc2kgbCBmb3IgbCBpbiByZXN1bHQuc3BsaXQgJ1xcbicpXG5cbiAgICB3aGlsZSBsaW5lID0gbGluZXMuc2hpZnQoKVxuXG4gICAgICAgIGlmIGxpbmUuc3RhcnRzV2l0aCAnQEAnXG4gICAgICAgICAgICBbeCwgYmVmb3JlLCBhZnRlcl0gPSBsaW5lLnNwbGl0ICcgJ1xuICAgICAgICAgICAgYWZ0ZXJTcGxpdCA9IGFmdGVyLnNwbGl0ICcsJ1xuXG4gICAgICAgICAgICBudW1PbGQgPSBwYXJzZUludChiZWZvcmUuc3BsaXQoJywnKVsxXSA/IDEpXG4gICAgICAgICAgICBudW1OZXcgPSBwYXJzZUludChhZnRlclNwbGl0WzFdID8gMSlcbiAgICAgICAgICAgIGNoYW5nZSA9IGxpbmU6IHBhcnNlSW50KGFmdGVyU3BsaXRbMF0pXG5cbiAgICAgICAgICAgIG9sZExpbmVzID0gW11cbiAgICAgICAgICAgIGZvciBpIGluIFswLi4ubnVtT2xkXVxuICAgICAgICAgICAgICAgIG9sZExpbmVzLnB1c2ggbGluZXMuc2hpZnQoKS5zbGljZSAxXG4gICAgICAgICAgICBsaW5lcy5zaGlmdCgpIHdoaWxlIF8uZmlyc3QobGluZXMpWzBdID09ICdcXFxcJ1xuXG4gICAgICAgICAgICBuZXdMaW5lcyA9IFtdXG4gICAgICAgICAgICBmb3IgaSBpbiBbMC4uLm51bU5ld11cbiAgICAgICAgICAgICAgICBuZXdMaW5lcy5wdXNoIGxpbmVzLnNoaWZ0KCkuc2xpY2UgMVxuICAgICAgICAgICAgbGluZXMuc2hpZnQoKSB3aGlsZSBfLmZpcnN0KGxpbmVzKVswXSA9PSAnXFxcXCdcblxuICAgICAgICAgICAgY2hhbmdlLm9sZCA9IG9sZExpbmVzIGlmIG9sZExpbmVzLmxlbmd0aFxuICAgICAgICAgICAgY2hhbmdlLm5ldyA9IG5ld0xpbmVzIGlmIG5ld0xpbmVzLmxlbmd0aFxuXG4gICAgICAgICAgICBpZiBudW1PbGQgYW5kIG51bU5ld1xuICAgICAgICAgICAgICAgIGNoYW5nZS5tb2QgPSBbXVxuICAgICAgICAgICAgICAgIGZvciBpIGluIFswLi4uTWF0aC5taW4gbnVtT2xkLCBudW1OZXddXG4gICAgICAgICAgICAgICAgICAgIGNoYW5nZS5tb2QucHVzaCBvbGQ6Y2hhbmdlLm9sZFtpXSwgbmV3OmNoYW5nZS5uZXdbaV1cblxuICAgICAgICAgICAgaWYgbnVtT2xkID4gbnVtTmV3XG4gICAgICAgICAgICAgICAgY2hhbmdlLmRlbCA9IFtdXG4gICAgICAgICAgICAgICAgZm9yIGkgaW4gW251bU5ldy4uLm51bU9sZF1cbiAgICAgICAgICAgICAgICAgICAgY2hhbmdlLmRlbC5wdXNoIG9sZDpjaGFuZ2Uub2xkW2ldXG5cbiAgICAgICAgICAgIGVsc2UgaWYgbnVtTmV3ID4gbnVtT2xkXG4gICAgICAgICAgICAgICAgY2hhbmdlLmFkZCA9IFtdXG4gICAgICAgICAgICAgICAgZm9yIGkgaW4gW251bU9sZC4uLm51bU5ld11cbiAgICAgICAgICAgICAgICAgICAgY2hhbmdlLmFkZC5wdXNoIG5ldzpjaGFuZ2UubmV3W2ldXG5cbiAgICAgICAgICAgIGluZm8uY2hhbmdlcy5wdXNoIGNoYW5nZVxuXG4gICAgcmV0dXJuIGluZm9cblxuIyAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwXG4jIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwMDAwMFxuIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMFxuIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwXG5cbmlmIG1vZHVsZS5wYXJlbnRcblxuICAgIG1vZHVsZS5leHBvcnRzID0gZGlmZlxuXG5lbHNlXG5cbiAgICBpZiBub3QgZW1wdHkgcHJvY2Vzcy5hcmd2WzJdXG4gICAgICAgIGZpbGUgPSBzbGFzaC5yZXNvbHZlIHByb2Nlc3MuYXJndlsyXVxuICAgIGVsc2VcbiAgICAgICAgZmlsZSA9IHByb2Nlc3MuY3dkKClcblxuICAgIGxvZyBkaWZmIGZpbGVcbiJdfQ==
//# sourceURL=../../coffee/git/diff.coffee