// koffee 1.11.0

/*
0000000    000  00000000  00000000
000   000  000  000       000
000   000  000  000000    000000
000   000  000  000       000
0000000    000  000       000
 */
var _, childp, diff, empty, file, gitCmd, gitOpt, kstr, parseResult, ref, slash, valid;

ref = require('kxk'), childp = ref.childp, slash = ref.slash, empty = ref.empty, valid = ref.valid, kstr = ref.kstr, _ = ref._;

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlmZi5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi9jb2ZmZWUvZ2l0Iiwic291cmNlcyI6WyJkaWZmLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQTs7QUFRQSxNQUEyQyxPQUFBLENBQVEsS0FBUixDQUEzQyxFQUFFLG1CQUFGLEVBQVUsaUJBQVYsRUFBaUIsaUJBQWpCLEVBQXdCLGlCQUF4QixFQUErQixlQUEvQixFQUFxQzs7QUFFckMsTUFBQSxHQUFTLFNBQUMsSUFBRDtXQUFVLDRCQUFBLEdBQTRCLENBQUMsS0FBSyxDQUFDLElBQU4sQ0FBVyxJQUFYLENBQUQsQ0FBNUIsR0FBNkM7QUFBdkQ7O0FBQ1QsTUFBQSxHQUFTLFNBQUMsR0FBRDtXQUFVO1FBQUEsR0FBQSxFQUFJLEdBQUo7UUFBUyxRQUFBLEVBQVMsTUFBbEI7UUFBMEIsS0FBQSxFQUFNLENBQUMsTUFBRCxFQUFTLE1BQVQsRUFBaUIsUUFBakIsQ0FBaEM7O0FBQVY7O0FBRVQsSUFBQSxHQUFPLFNBQUMsSUFBRCxFQUFPLEVBQVA7SUFFSCxJQUFBLEdBQU8sS0FBSyxDQUFDLE9BQU4sQ0FBYyxJQUFkO0lBRVAsSUFBRyxDQUFDLENBQUMsVUFBRixDQUFhLEVBQWIsQ0FBSDtlQUNJLEtBQUssQ0FBQyxNQUFOLENBQWEsSUFBYixFQUFtQixTQUFDLElBQUQ7WUFDZixJQUFVLEtBQUEsQ0FBTSxJQUFOLENBQVY7Z0JBQUEsRUFBQSxDQUFHLEVBQUgsRUFBQTs7bUJBQ0EsTUFBTSxDQUFDLElBQVAsQ0FBWSxNQUFBLENBQU8sSUFBUCxDQUFaLEVBQTBCLE1BQUEsQ0FBTyxLQUFLLENBQUMsT0FBTixDQUFjLEtBQUssQ0FBQyxHQUFOLENBQVUsSUFBVixDQUFkLENBQVAsQ0FBMUIsRUFBZ0UsU0FBQyxHQUFELEVBQUssQ0FBTDtnQkFDNUQsSUFBRyxLQUFBLENBQU0sR0FBTixDQUFIOzJCQUNJLEVBQUEsQ0FBRyxFQUFILEVBREo7aUJBQUEsTUFBQTsy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QVo7Z0JBQ0QsTUFBTSxDQUFDLEdBQVAsR0FBYTtBQUNiLHFCQUFTLDJHQUFUO29CQUNJLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBWCxDQUFnQjt3QkFBQSxDQUFBLEdBQUEsQ0FBQSxFQUFJLE1BQU0sRUFBQyxHQUFELEVBQUssQ0FBQSxDQUFBLENBQWY7cUJBQWhCO0FBREosaUJBRkM7O1lBS0wsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFiLENBQWtCLE1BQWxCLEVBcENKOztJQUZKO0FBd0NBLFdBQU87QUE3Q0c7O0FBcURkLElBQUcsTUFBTSxDQUFDLE1BQVY7SUFFSSxNQUFNLENBQUMsT0FBUCxHQUFpQixLQUZyQjtDQUFBLE1BQUE7SUFNSSxJQUFHLENBQUksS0FBQSxDQUFNLE9BQU8sQ0FBQyxJQUFLLENBQUEsQ0FBQSxDQUFuQixDQUFQO1FBQ0ksSUFBQSxHQUFPLEtBQUssQ0FBQyxPQUFOLENBQWMsT0FBTyxDQUFDLElBQUssQ0FBQSxDQUFBLENBQTNCLEVBRFg7S0FBQSxNQUFBO1FBR0ksSUFBQSxHQUFPLE9BQU8sQ0FBQyxHQUFSLENBQUEsRUFIWDs7SUFLQSxPQUFBLENBQUEsR0FBQSxDQUFJLElBQUEsQ0FBSyxJQUFMLENBQUosRUFYSiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwMDAwMCAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMFxuMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAwMDBcbjAwMCAgIDAwMCAgMDAwICAwMDAwMDAgICAgMDAwMDAwXG4wMDAgICAwMDAgIDAwMCAgMDAwICAgICAgIDAwMFxuMDAwMDAwMCAgICAwMDAgIDAwMCAgICAgICAwMDBcbiMjI1xuXG57IGNoaWxkcCwgc2xhc2gsIGVtcHR5LCB2YWxpZCwga3N0ciwgXyB9ID0gcmVxdWlyZSAna3hrJ1xuXG5naXRDbWQgPSAoZmlsZSkgLT4gXCJnaXQgLS1uby1wYWdlciBkaWZmIC1VMCBcXFwiI3tzbGFzaC5maWxlIGZpbGV9XFxcIlwiXG5naXRPcHQgPSAoY3dkKSAgLT4gY3dkOmN3ZCwgZW5jb2Rpbmc6J3V0ZjgnLCBzdGRpbzpbJ3BpcGUnLCAncGlwZScsICdpZ25vcmUnXVxuXG5kaWZmID0gKGZpbGUsIGNiKSAtPlxuXG4gICAgZmlsZSA9IHNsYXNoLnJlc29sdmUgZmlsZVxuXG4gICAgaWYgXy5pc0Z1bmN0aW9uIGNiXG4gICAgICAgIHNsYXNoLmlzRmlsZSBmaWxlLCAoc3RhdCkgLT5cbiAgICAgICAgICAgIGNiKHt9KSBpZiBlbXB0eSBzdGF0XG4gICAgICAgICAgICBjaGlsZHAuZXhlYyBnaXRDbWQoZmlsZSksIGdpdE9wdChzbGFzaC51bnNsYXNoIHNsYXNoLmRpciBmaWxlKSwgKGVycixyKSAtPlxuICAgICAgICAgICAgICAgIGlmIHZhbGlkIGVyclxuICAgICAgICAgICAgICAgICAgICBjYiB7fVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgY2IgcGFyc2VSZXN1bHQgZmlsZSwgclxuICAgIGVsc2VcblxuICAgICAgICByZXR1cm4ge30gaWYgbm90IHNsYXNoLmlzRmlsZSBmaWxlXG4gICAgICAgIHBhcnNlUmVzdWx0IGZpbGUsIGNoaWxkcC5leGVjU3luYyBnaXRDbWQoZmlsZSksIGdpdE9wdChzbGFzaC51bnNsYXNoIHNsYXNoLmRpciBmaWxlKVxuXG4jIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwXG4jIDAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwXG4jIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAwMDBcbiMgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwXG5cbnBhcnNlUmVzdWx0ID0gKGZpbGUsIHJlc3VsdCkgLT5cblxuICAgIGluZm8gID0gZmlsZTpmaWxlLCBjaGFuZ2VzOltdXG4gICAgbGluZXMgPSAoa3N0ci5zdHJpcEFuc2kgbCBmb3IgbCBpbiByZXN1bHQuc3BsaXQgJ1xcbicpXG5cbiAgICB3aGlsZSBsaW5lID0gbGluZXMuc2hpZnQoKVxuXG4gICAgICAgIGlmIGxpbmUuc3RhcnRzV2l0aCAnQEAnXG4gICAgICAgICAgICBbeCwgYmVmb3JlLCBhZnRlcl0gPSBsaW5lLnNwbGl0ICcgJ1xuICAgICAgICAgICAgYWZ0ZXJTcGxpdCA9IGFmdGVyLnNwbGl0ICcsJ1xuXG4gICAgICAgICAgICBudW1PbGQgPSBwYXJzZUludChiZWZvcmUuc3BsaXQoJywnKVsxXSA/IDEpXG4gICAgICAgICAgICBudW1OZXcgPSBwYXJzZUludChhZnRlclNwbGl0WzFdID8gMSlcbiAgICAgICAgICAgIGNoYW5nZSA9IGxpbmU6IHBhcnNlSW50KGFmdGVyU3BsaXRbMF0pXG5cbiAgICAgICAgICAgIG9sZExpbmVzID0gW11cbiAgICAgICAgICAgIGZvciBpIGluIFswLi4ubnVtT2xkXVxuICAgICAgICAgICAgICAgIG9sZExpbmVzLnB1c2ggbGluZXMuc2hpZnQoKS5zbGljZSAxXG4gICAgICAgICAgICBsaW5lcy5zaGlmdCgpIHdoaWxlIF8uZmlyc3QobGluZXMpWzBdID09ICdcXFxcJ1xuXG4gICAgICAgICAgICBuZXdMaW5lcyA9IFtdXG4gICAgICAgICAgICBmb3IgaSBpbiBbMC4uLm51bU5ld11cbiAgICAgICAgICAgICAgICBuZXdMaW5lcy5wdXNoIGxpbmVzLnNoaWZ0KCkuc2xpY2UgMVxuICAgICAgICAgICAgbGluZXMuc2hpZnQoKSB3aGlsZSBfLmZpcnN0KGxpbmVzKVswXSA9PSAnXFxcXCdcblxuICAgICAgICAgICAgY2hhbmdlLm9sZCA9IG9sZExpbmVzIGlmIG9sZExpbmVzLmxlbmd0aFxuICAgICAgICAgICAgY2hhbmdlLm5ldyA9IG5ld0xpbmVzIGlmIG5ld0xpbmVzLmxlbmd0aFxuXG4gICAgICAgICAgICBpZiBudW1PbGQgYW5kIG51bU5ld1xuICAgICAgICAgICAgICAgIGNoYW5nZS5tb2QgPSBbXVxuICAgICAgICAgICAgICAgIGZvciBpIGluIFswLi4uTWF0aC5taW4gbnVtT2xkLCBudW1OZXddXG4gICAgICAgICAgICAgICAgICAgIGNoYW5nZS5tb2QucHVzaCBvbGQ6Y2hhbmdlLm9sZFtpXSwgbmV3OmNoYW5nZS5uZXdbaV1cblxuICAgICAgICAgICAgaWYgbnVtT2xkID4gbnVtTmV3XG4gICAgICAgICAgICAgICAgY2hhbmdlLmRlbCA9IFtdXG4gICAgICAgICAgICAgICAgZm9yIGkgaW4gW251bU5ldy4uLm51bU9sZF1cbiAgICAgICAgICAgICAgICAgICAgY2hhbmdlLmRlbC5wdXNoIG9sZDpjaGFuZ2Uub2xkW2ldXG5cbiAgICAgICAgICAgIGVsc2UgaWYgbnVtTmV3ID4gbnVtT2xkXG4gICAgICAgICAgICAgICAgY2hhbmdlLmFkZCA9IFtdXG4gICAgICAgICAgICAgICAgZm9yIGkgaW4gW251bU9sZC4uLm51bU5ld11cbiAgICAgICAgICAgICAgICAgICAgY2hhbmdlLmFkZC5wdXNoIG5ldzpjaGFuZ2UubmV3W2ldXG5cbiAgICAgICAgICAgIGluZm8uY2hhbmdlcy5wdXNoIGNoYW5nZVxuXG4gICAgcmV0dXJuIGluZm9cblxuIyAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwXG4jIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwMDAwMFxuIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMFxuIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwXG5cbmlmIG1vZHVsZS5wYXJlbnRcblxuICAgIG1vZHVsZS5leHBvcnRzID0gZGlmZlxuXG5lbHNlXG5cbiAgICBpZiBub3QgZW1wdHkgcHJvY2Vzcy5hcmd2WzJdXG4gICAgICAgIGZpbGUgPSBzbGFzaC5yZXNvbHZlIHByb2Nlc3MuYXJndlsyXVxuICAgIGVsc2VcbiAgICAgICAgZmlsZSA9IHByb2Nlc3MuY3dkKClcblxuICAgIGxvZyBkaWZmIGZpbGVcbiAgICBcbiJdfQ==
//# sourceURL=../../coffee/git/diff.coffee