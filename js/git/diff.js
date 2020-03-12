// koffee 1.11.0

/*
0000000    000  00000000  00000000
000   000  000  000       000
000   000  000  000000    000000
000   000  000  000       000
0000000    000  000       000
 */
var _, childp, diff, empty, file, gitCmd, gitOpt, kstr, parseResult, ref, slash, valid;

ref = require('kxk'), _ = ref._, childp = ref.childp, empty = ref.empty, kstr = ref.kstr, slash = ref.slash, valid = ref.valid;

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlmZi5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi9jb2ZmZWUvZ2l0Iiwic291cmNlcyI6WyJkaWZmLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQTs7QUFRQSxNQUEyQyxPQUFBLENBQVEsS0FBUixDQUEzQyxFQUFFLFNBQUYsRUFBSyxtQkFBTCxFQUFhLGlCQUFiLEVBQW9CLGVBQXBCLEVBQTBCLGlCQUExQixFQUFpQzs7QUFFakMsTUFBQSxHQUFTLFNBQUMsSUFBRDtXQUFVLDRCQUFBLEdBQTRCLENBQUMsS0FBSyxDQUFDLElBQU4sQ0FBVyxJQUFYLENBQUQsQ0FBNUIsR0FBNkM7QUFBdkQ7O0FBQ1QsTUFBQSxHQUFTLFNBQUMsR0FBRDtXQUFVO1FBQUEsR0FBQSxFQUFJLEdBQUo7UUFBUyxRQUFBLEVBQVMsTUFBbEI7UUFBeUIsS0FBQSxFQUFNLENBQUMsTUFBRCxFQUFRLE1BQVIsRUFBZSxRQUFmLENBQS9COztBQUFWOztBQUVULElBQUEsR0FBTyxTQUFDLElBQUQsRUFBTyxFQUFQO0lBRUgsSUFBQSxHQUFPLEtBQUssQ0FBQyxPQUFOLENBQWMsSUFBZDtJQUVQLElBQUcsQ0FBQyxDQUFDLFVBQUYsQ0FBYSxFQUFiLENBQUg7ZUFDSSxLQUFLLENBQUMsTUFBTixDQUFhLElBQWIsRUFBbUIsU0FBQyxJQUFEO1lBQ2YsSUFBVSxLQUFBLENBQU0sSUFBTixDQUFWO2dCQUFBLEVBQUEsQ0FBRyxFQUFILEVBQUE7O21CQUNBLE1BQU0sQ0FBQyxJQUFQLENBQVksTUFBQSxDQUFPLElBQVAsQ0FBWixFQUEwQixNQUFBLENBQU8sS0FBSyxDQUFDLE9BQU4sQ0FBYyxLQUFLLENBQUMsR0FBTixDQUFVLElBQVYsQ0FBZCxDQUFQLENBQTFCLEVBQWdFLFNBQUMsR0FBRCxFQUFLLENBQUw7Z0JBQzVELElBQUcsS0FBQSxDQUFNLEdBQU4sQ0FBSDsyQkFDSSxFQUFBLENBQUcsRUFBSCxFQURKO2lCQUFBLE1BQUE7MkJBR0ks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QUNELE1BQU0sQ0FBQyxHQUFQLEdBQWE7QUFDYixxQkFBUywyR0FBVDtvQkFDSSxNQUFNLENBQUMsR0FBRyxDQUFDLElBQVgsQ0FBZ0I7d0JBQUEsQ0FBQSxHQUFBLENBQUEsRUFBSSxNQUFNLEVBQUMsR0FBRCxFQUFLLENBQUEsQ0FBQSxDQUFmO3FCQUFoQjtBQURKLGlCQUZDOztZQUtMLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBYixDQUFrQixNQUFsQixFQXBDSjs7SUFGSjtBQXdDQSxXQUFPO0FBN0NHOztBQXFEZCxJQUFHLE1BQU0sQ0FBQyxNQUFWO0lBRUksTUFBTSxDQUFDLE9BQVAsR0FBaUIsS0FGckI7Q0FBQSxNQUFBO0lBTUksSUFBRyxDQUFJLEtBQUEsQ0FBTSxPQUFPLENBQUMsSUFBSyxDQUFBLENBQUEsQ0FBbkIsQ0FBUDtRQUNJLElBQUEsR0FBTyxLQUFLLENBQUMsT0FBTixDQUFjLE9BQU8sQ0FBQyxJQUFLLENBQUEsQ0FBQSxDQUEzQixFQURYO0tBQUEsTUFBQTtRQUdJLElBQUEsR0FBTyxPQUFPLENBQUMsR0FBUixDQUFBLEVBSFg7O0lBS0EsT0FBQSxDQUFBLEdBQUEsQ0FBSSxJQUFBLENBQUssSUFBTCxDQUFKLEVBWEoiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMDAwMDAgICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMDBcbjAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgMDAwXG4wMDAgICAwMDAgIDAwMCAgMDAwMDAwICAgIDAwMDAwMFxuMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAwMDBcbjAwMDAwMDAgICAgMDAwICAwMDAgICAgICAgMDAwXG4jIyNcblxueyBfLCBjaGlsZHAsIGVtcHR5LCBrc3RyLCBzbGFzaCwgdmFsaWQgfSA9IHJlcXVpcmUgJ2t4aydcblxuZ2l0Q21kID0gKGZpbGUpIC0+IFwiZ2l0IC0tbm8tcGFnZXIgZGlmZiAtVTAgXFxcIiN7c2xhc2guZmlsZSBmaWxlfVxcXCJcIlxuZ2l0T3B0ID0gKGN3ZCkgIC0+IGN3ZDpjd2QsIGVuY29kaW5nOid1dGY4JyBzdGRpbzpbJ3BpcGUnICdwaXBlJyAnaWdub3JlJ11cblxuZGlmZiA9IChmaWxlLCBjYikgLT5cblxuICAgIGZpbGUgPSBzbGFzaC5yZXNvbHZlIGZpbGVcblxuICAgIGlmIF8uaXNGdW5jdGlvbiBjYlxuICAgICAgICBzbGFzaC5pc0ZpbGUgZmlsZSwgKHN0YXQpIC0+XG4gICAgICAgICAgICBjYih7fSkgaWYgZW1wdHkgc3RhdFxuICAgICAgICAgICAgY2hpbGRwLmV4ZWMgZ2l0Q21kKGZpbGUpLCBnaXRPcHQoc2xhc2gudW5zbGFzaCBzbGFzaC5kaXIgZmlsZSksIChlcnIscikgLT5cbiAgICAgICAgICAgICAgICBpZiB2YWxpZCBlcnJcbiAgICAgICAgICAgICAgICAgICAgY2Ige31cbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGNiIHBhcnNlUmVzdWx0IGZpbGUsIHJcbiAgICBlbHNlXG5cbiAgICAgICAgcmV0dXJuIHt9IGlmIG5vdCBzbGFzaC5pc0ZpbGUgZmlsZVxuICAgICAgICBwYXJzZVJlc3VsdCBmaWxlLCBjaGlsZHAuZXhlY1N5bmMgZ2l0Q21kKGZpbGUpLCBnaXRPcHQoc2xhc2gudW5zbGFzaCBzbGFzaC5kaXIgZmlsZSlcblxuIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMFxuIyAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMFxuIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwXG4jIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwMFxuXG5wYXJzZVJlc3VsdCA9IChmaWxlLCByZXN1bHQpIC0+XG5cbiAgICBpbmZvICA9IGZpbGU6ZmlsZSwgY2hhbmdlczpbXVxuICAgIGxpbmVzID0gKGtzdHIuc3RyaXBBbnNpIGwgZm9yIGwgaW4gcmVzdWx0LnNwbGl0ICdcXG4nKVxuXG4gICAgd2hpbGUgbGluZSA9IGxpbmVzLnNoaWZ0KClcblxuICAgICAgICBpZiBsaW5lLnN0YXJ0c1dpdGggJ0BAJ1xuICAgICAgICAgICAgW3gsIGJlZm9yZSwgYWZ0ZXJdID0gbGluZS5zcGxpdCAnICdcbiAgICAgICAgICAgIGFmdGVyU3BsaXQgPSBhZnRlci5zcGxpdCAnLCdcblxuICAgICAgICAgICAgbnVtT2xkID0gcGFyc2VJbnQoYmVmb3JlLnNwbGl0KCcsJylbMV0gPyAxKVxuICAgICAgICAgICAgbnVtTmV3ID0gcGFyc2VJbnQoYWZ0ZXJTcGxpdFsxXSA/IDEpXG4gICAgICAgICAgICBjaGFuZ2UgPSBsaW5lOiBwYXJzZUludChhZnRlclNwbGl0WzBdKVxuXG4gICAgICAgICAgICBvbGRMaW5lcyA9IFtdXG4gICAgICAgICAgICBmb3IgaSBpbiBbMC4uLm51bU9sZF1cbiAgICAgICAgICAgICAgICBvbGRMaW5lcy5wdXNoIGxpbmVzLnNoaWZ0KCkuc2xpY2UgMVxuICAgICAgICAgICAgbGluZXMuc2hpZnQoKSB3aGlsZSBfLmZpcnN0KGxpbmVzKVswXSA9PSAnXFxcXCdcblxuICAgICAgICAgICAgbmV3TGluZXMgPSBbXVxuICAgICAgICAgICAgZm9yIGkgaW4gWzAuLi5udW1OZXddXG4gICAgICAgICAgICAgICAgbmV3TGluZXMucHVzaCBsaW5lcy5zaGlmdCgpLnNsaWNlIDFcbiAgICAgICAgICAgIGxpbmVzLnNoaWZ0KCkgd2hpbGUgXy5maXJzdChsaW5lcylbMF0gPT0gJ1xcXFwnXG5cbiAgICAgICAgICAgIGNoYW5nZS5vbGQgPSBvbGRMaW5lcyBpZiBvbGRMaW5lcy5sZW5ndGhcbiAgICAgICAgICAgIGNoYW5nZS5uZXcgPSBuZXdMaW5lcyBpZiBuZXdMaW5lcy5sZW5ndGhcblxuICAgICAgICAgICAgaWYgbnVtT2xkIGFuZCBudW1OZXdcbiAgICAgICAgICAgICAgICBjaGFuZ2UubW9kID0gW11cbiAgICAgICAgICAgICAgICBmb3IgaSBpbiBbMC4uLk1hdGgubWluIG51bU9sZCwgbnVtTmV3XVxuICAgICAgICAgICAgICAgICAgICBjaGFuZ2UubW9kLnB1c2ggb2xkOmNoYW5nZS5vbGRbaV0sIG5ldzpjaGFuZ2UubmV3W2ldXG5cbiAgICAgICAgICAgIGlmIG51bU9sZCA+IG51bU5ld1xuICAgICAgICAgICAgICAgIGNoYW5nZS5kZWwgPSBbXVxuICAgICAgICAgICAgICAgIGZvciBpIGluIFtudW1OZXcuLi5udW1PbGRdXG4gICAgICAgICAgICAgICAgICAgIGNoYW5nZS5kZWwucHVzaCBvbGQ6Y2hhbmdlLm9sZFtpXVxuXG4gICAgICAgICAgICBlbHNlIGlmIG51bU5ldyA+IG51bU9sZFxuICAgICAgICAgICAgICAgIGNoYW5nZS5hZGQgPSBbXVxuICAgICAgICAgICAgICAgIGZvciBpIGluIFtudW1PbGQuLi5udW1OZXddXG4gICAgICAgICAgICAgICAgICAgIGNoYW5nZS5hZGQucHVzaCBuZXc6Y2hhbmdlLm5ld1tpXVxuXG4gICAgICAgICAgICBpbmZvLmNoYW5nZXMucHVzaCBjaGFuZ2VcblxuICAgIHJldHVybiBpbmZvXG5cbiMgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAwMDAwMFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMFxuIyAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDBcbiMgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDBcbiMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMFxuXG5pZiBtb2R1bGUucGFyZW50XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IGRpZmZcblxuZWxzZVxuXG4gICAgaWYgbm90IGVtcHR5IHByb2Nlc3MuYXJndlsyXVxuICAgICAgICBmaWxlID0gc2xhc2gucmVzb2x2ZSBwcm9jZXNzLmFyZ3ZbMl1cbiAgICBlbHNlXG4gICAgICAgIGZpbGUgPSBwcm9jZXNzLmN3ZCgpXG5cbiAgICBsb2cgZGlmZiBmaWxlXG4gICAgXG4iXX0=
//# sourceURL=../../coffee/git/diff.coffee