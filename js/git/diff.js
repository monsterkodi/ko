// koffee 0.56.0

/*
0000000    000  00000000  00000000
000   000  000  000       000
000   000  000  000000    000000
000   000  000  000       000
0000000    000  000       000
 */
var _, childp, diff, empty, file, gitCmd, gitOpt, parseResult, ref, slash, stripAnsi, valid;

ref = require('kxk'), childp = ref.childp, slash = ref.slash, valid = ref.valid, empty = ref.empty, _ = ref._;

stripAnsi = require('strip-ansi');

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
            results.push(stripAnsi(l));
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlmZi5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUE7O0FBUUEsTUFBcUMsT0FBQSxDQUFRLEtBQVIsQ0FBckMsRUFBRSxtQkFBRixFQUFVLGlCQUFWLEVBQWlCLGlCQUFqQixFQUF3QixpQkFBeEIsRUFBK0I7O0FBRS9CLFNBQUEsR0FBWSxPQUFBLENBQVEsWUFBUjs7QUFFWixNQUFBLEdBQVMsU0FBQyxJQUFEO1dBQVUsNEJBQUEsR0FBNEIsQ0FBQyxLQUFLLENBQUMsSUFBTixDQUFXLElBQVgsQ0FBRCxDQUE1QixHQUE2QztBQUF2RDs7QUFDVCxNQUFBLEdBQVMsU0FBQyxHQUFEO1dBQVU7UUFBQSxHQUFBLEVBQUksR0FBSjtRQUFTLFFBQUEsRUFBUyxNQUFsQjtRQUEwQixLQUFBLEVBQU0sQ0FBQyxNQUFELEVBQVMsTUFBVCxFQUFpQixRQUFqQixDQUFoQzs7QUFBVjs7QUFFVCxJQUFBLEdBQU8sU0FBQyxJQUFELEVBQU8sRUFBUDtJQUVILElBQUEsR0FBTyxLQUFLLENBQUMsT0FBTixDQUFjLElBQWQ7SUFFUCxJQUFHLENBQUMsQ0FBQyxVQUFGLENBQWEsRUFBYixDQUFIO2VBQ0ksS0FBSyxDQUFDLE1BQU4sQ0FBYSxJQUFiLEVBQW1CLFNBQUMsSUFBRDtZQUNmLElBQVUsS0FBQSxDQUFNLElBQU4sQ0FBVjtnQkFBQSxFQUFBLENBQUcsRUFBSCxFQUFBOzttQkFDQSxNQUFNLENBQUMsSUFBUCxDQUFZLE1BQUEsQ0FBTyxJQUFQLENBQVosRUFBMEIsTUFBQSxDQUFPLEtBQUssQ0FBQyxPQUFOLENBQWMsS0FBSyxDQUFDLEdBQU4sQ0FBVSxJQUFWLENBQWQsQ0FBUCxDQUExQixFQUFnRSxTQUFDLEdBQUQsRUFBSyxDQUFMO2dCQUM1RCxJQUFHLEtBQUEsQ0FBTSxHQUFOLENBQUg7MkJBQ0ksRUFBQSxDQUFHLEVBQUgsRUFESjtpQkFBQSxNQUFBOzJCQUdJLEVB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QyxHQUFQLEdBQWE7QUFDYixxQkFBUywyR0FBVDtvQkFDSSxNQUFNLENBQUMsR0FBRyxDQUFDLElBQVgsQ0FBZ0I7d0JBQUEsQ0FBQSxHQUFBLENBQUEsRUFBSSxNQUFNLEVBQUMsR0FBRCxFQUFLLENBQUEsQ0FBQSxDQUFmO3FCQUFoQjtBQURKLGlCQUZDOztZQUtMLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBYixDQUFrQixNQUFsQixFQXBDSjs7SUFGSjtBQXdDQSxXQUFPO0FBN0NHOztBQXFEZCxJQUFHLE1BQU0sQ0FBQyxNQUFWO0lBRUksTUFBTSxDQUFDLE9BQVAsR0FBaUIsS0FGckI7Q0FBQSxNQUFBO0lBTUksSUFBRyxDQUFJLEtBQUEsQ0FBTSxPQUFPLENBQUMsSUFBSyxDQUFBLENBQUEsQ0FBbkIsQ0FBUDtRQUNJLElBQUEsR0FBTyxLQUFLLENBQUMsT0FBTixDQUFjLE9BQU8sQ0FBQyxJQUFLLENBQUEsQ0FBQSxDQUEzQixFQURYO0tBQUEsTUFBQTtRQUdJLElBQUEsR0FBTyxPQUFPLENBQUMsR0FBUixDQUFBLEVBSFg7O0lBS0EsT0FBQSxDQUFBLEdBQUEsQ0FBSSxJQUFBLENBQUssSUFBTCxDQUFKLEVBWEoiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMDAwMDAgICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMDBcbjAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgMDAwXG4wMDAgICAwMDAgIDAwMCAgMDAwMDAwICAgIDAwMDAwMFxuMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAwMDBcbjAwMDAwMDAgICAgMDAwICAwMDAgICAgICAgMDAwXG4jIyNcblxueyBjaGlsZHAsIHNsYXNoLCB2YWxpZCwgZW1wdHksIF8gfSA9IHJlcXVpcmUgJ2t4aydcblxuc3RyaXBBbnNpID0gcmVxdWlyZSAnc3RyaXAtYW5zaSdcblxuZ2l0Q21kID0gKGZpbGUpIC0+IFwiZ2l0IC0tbm8tcGFnZXIgZGlmZiAtVTAgXFxcIiN7c2xhc2guZmlsZSBmaWxlfVxcXCJcIlxuZ2l0T3B0ID0gKGN3ZCkgIC0+IGN3ZDpjd2QsIGVuY29kaW5nOid1dGY4Jywgc3RkaW86WydwaXBlJywgJ3BpcGUnLCAnaWdub3JlJ11cblxuZGlmZiA9IChmaWxlLCBjYikgLT5cblxuICAgIGZpbGUgPSBzbGFzaC5yZXNvbHZlIGZpbGVcblxuICAgIGlmIF8uaXNGdW5jdGlvbiBjYlxuICAgICAgICBzbGFzaC5pc0ZpbGUgZmlsZSwgKHN0YXQpIC0+XG4gICAgICAgICAgICBjYih7fSkgaWYgZW1wdHkgc3RhdFxuICAgICAgICAgICAgY2hpbGRwLmV4ZWMgZ2l0Q21kKGZpbGUpLCBnaXRPcHQoc2xhc2gudW5zbGFzaCBzbGFzaC5kaXIgZmlsZSksIChlcnIscikgLT5cbiAgICAgICAgICAgICAgICBpZiB2YWxpZCBlcnJcbiAgICAgICAgICAgICAgICAgICAgY2Ige31cbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGNiIHBhcnNlUmVzdWx0IGZpbGUsIHJcbiAgICBlbHNlXG5cbiAgICAgICAgcmV0dXJuIHt9IGlmIG5vdCBzbGFzaC5pc0ZpbGUgZmlsZVxuICAgICAgICBwYXJzZVJlc3VsdCBmaWxlLCBjaGlsZHAuZXhlY1N5bmMgZ2l0Q21kKGZpbGUpLCBnaXRPcHQoc2xhc2gudW5zbGFzaCBzbGFzaC5kaXIgZmlsZSlcblxuIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMFxuIyAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMFxuIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwXG4jIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwMFxuXG5wYXJzZVJlc3VsdCA9IChmaWxlLCByZXN1bHQpIC0+XG5cbiAgICBpbmZvICA9IGZpbGU6ZmlsZSwgY2hhbmdlczpbXVxuICAgIGxpbmVzID0gKHN0cmlwQW5zaSBsIGZvciBsIGluIHJlc3VsdC5zcGxpdCAnXFxuJylcblxuICAgIHdoaWxlIGxpbmUgPSBsaW5lcy5zaGlmdCgpXG5cbiAgICAgICAgaWYgbGluZS5zdGFydHNXaXRoICdAQCdcbiAgICAgICAgICAgIFt4LCBiZWZvcmUsIGFmdGVyXSA9IGxpbmUuc3BsaXQgJyAnXG4gICAgICAgICAgICBhZnRlclNwbGl0ID0gYWZ0ZXIuc3BsaXQgJywnXG5cbiAgICAgICAgICAgIG51bU9sZCA9IHBhcnNlSW50KGJlZm9yZS5zcGxpdCgnLCcpWzFdID8gMSlcbiAgICAgICAgICAgIG51bU5ldyA9IHBhcnNlSW50KGFmdGVyU3BsaXRbMV0gPyAxKVxuICAgICAgICAgICAgY2hhbmdlID0gbGluZTogcGFyc2VJbnQoYWZ0ZXJTcGxpdFswXSlcblxuICAgICAgICAgICAgb2xkTGluZXMgPSBbXVxuICAgICAgICAgICAgZm9yIGkgaW4gWzAuLi5udW1PbGRdXG4gICAgICAgICAgICAgICAgb2xkTGluZXMucHVzaCBsaW5lcy5zaGlmdCgpLnNsaWNlIDFcbiAgICAgICAgICAgIGxpbmVzLnNoaWZ0KCkgd2hpbGUgXy5maXJzdChsaW5lcylbMF0gPT0gJ1xcXFwnXG5cbiAgICAgICAgICAgIG5ld0xpbmVzID0gW11cbiAgICAgICAgICAgIGZvciBpIGluIFswLi4ubnVtTmV3XVxuICAgICAgICAgICAgICAgIG5ld0xpbmVzLnB1c2ggbGluZXMuc2hpZnQoKS5zbGljZSAxXG4gICAgICAgICAgICBsaW5lcy5zaGlmdCgpIHdoaWxlIF8uZmlyc3QobGluZXMpWzBdID09ICdcXFxcJ1xuXG4gICAgICAgICAgICBjaGFuZ2Uub2xkID0gb2xkTGluZXMgaWYgb2xkTGluZXMubGVuZ3RoXG4gICAgICAgICAgICBjaGFuZ2UubmV3ID0gbmV3TGluZXMgaWYgbmV3TGluZXMubGVuZ3RoXG5cbiAgICAgICAgICAgIGlmIG51bU9sZCBhbmQgbnVtTmV3XG4gICAgICAgICAgICAgICAgY2hhbmdlLm1vZCA9IFtdXG4gICAgICAgICAgICAgICAgZm9yIGkgaW4gWzAuLi5NYXRoLm1pbiBudW1PbGQsIG51bU5ld11cbiAgICAgICAgICAgICAgICAgICAgY2hhbmdlLm1vZC5wdXNoIG9sZDpjaGFuZ2Uub2xkW2ldLCBuZXc6Y2hhbmdlLm5ld1tpXVxuXG4gICAgICAgICAgICBpZiBudW1PbGQgPiBudW1OZXdcbiAgICAgICAgICAgICAgICBjaGFuZ2UuZGVsID0gW11cbiAgICAgICAgICAgICAgICBmb3IgaSBpbiBbbnVtTmV3Li4ubnVtT2xkXVxuICAgICAgICAgICAgICAgICAgICBjaGFuZ2UuZGVsLnB1c2ggb2xkOmNoYW5nZS5vbGRbaV1cblxuICAgICAgICAgICAgZWxzZSBpZiBudW1OZXcgPiBudW1PbGRcbiAgICAgICAgICAgICAgICBjaGFuZ2UuYWRkID0gW11cbiAgICAgICAgICAgICAgICBmb3IgaSBpbiBbbnVtT2xkLi4ubnVtTmV3XVxuICAgICAgICAgICAgICAgICAgICBjaGFuZ2UuYWRkLnB1c2ggbmV3OmNoYW5nZS5uZXdbaV1cblxuICAgICAgICAgICAgaW5mby5jaGFuZ2VzLnB1c2ggY2hhbmdlXG5cbiAgICByZXR1cm4gaW5mb1xuXG4jIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDBcbiMgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAwMDAwXG4jIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwXG4jIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDBcblxuaWYgbW9kdWxlLnBhcmVudFxuXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBkaWZmXG5cbmVsc2VcblxuICAgIGlmIG5vdCBlbXB0eSBwcm9jZXNzLmFyZ3ZbMl1cbiAgICAgICAgZmlsZSA9IHNsYXNoLnJlc29sdmUgcHJvY2Vzcy5hcmd2WzJdXG4gICAgZWxzZVxuICAgICAgICBmaWxlID0gcHJvY2Vzcy5jd2QoKVxuXG4gICAgbG9nIGRpZmYgZmlsZVxuIl19
//# sourceURL=../../coffee/git/diff.coffee