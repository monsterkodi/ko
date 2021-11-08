// koffee 1.19.0

/*
000      000  000   000  00000000  0000000    000  00000000  00000000  
000      000  0000  000  000       000   000  000  000       000       
000      000  000 0 000  0000000   000   000  000  000000    000000    
000      000  000  0000  000       000   000  000  000       000       
0000000  000  000   000  00000000  0000000    000  000       000
 */
var empty, last, lineDiff, ref;

ref = require('kxk'), empty = ref.empty, last = ref.last;

lineDiff = function(oldLine, newLine) {
    var changes, deletes, inserts, lst, nc, ni, oc, oi;
    changes = [];
    oi = 0;
    ni = 0;
    if (oldLine !== newLine) {
        oc = oldLine[oi];
        nc = newLine[ni];
        while (oi < oldLine.length) {
            if (nc == null) {
                changes.push({
                    change: 'delete',
                    old: oi,
                    "new": ni,
                    length: oldLine.length - oi
                });
                break;
            } else if (oc === nc) {
                oi += 1;
                oc = oldLine[oi];
                ni += 1;
                nc = newLine[ni];
            } else {
                inserts = newLine.slice(ni).indexOf(oc);
                deletes = oldLine.slice(oi).indexOf(nc);
                if (inserts > 0 && (deletes <= 0 || inserts < deletes)) {
                    changes.push({
                        change: 'insert',
                        old: oi,
                        "new": ni,
                        length: inserts
                    });
                    ni += inserts;
                    nc = newLine[ni];
                } else if (deletes > 0 && (inserts <= 0 || deletes < inserts)) {
                    changes.push({
                        change: 'delete',
                        old: oi,
                        "new": ni,
                        length: deletes
                    });
                    oi += deletes;
                    oc = oldLine[oi];
                } else {
                    lst = last(changes);
                    if ((lst != null ? lst.change : void 0) === 'change' && lst.old + lst.length === oi) {
                        lst.length += 1;
                    } else {
                        changes.push({
                            change: 'change',
                            old: oi,
                            "new": ni,
                            length: 1
                        });
                    }
                    oi += 1;
                    oc = oldLine[oi];
                    ni += 1;
                    nc = newLine[ni];
                }
            }
        }
        if (ni < newLine.length) {
            changes.push({
                change: 'insert',
                old: oi,
                "new": ni,
                length: newLine.length - ni
            });
        }
    }
    return changes;
};

lineDiff.isBoring = function(oldLine, newLine) {
    var c, changes, deletes, i, inserts, len;
    changes = lineDiff(oldLine, newLine);
    if (empty(changes)) {
        return true;
    }
    inserts = '';
    deletes = '';
    for (i = 0, len = changes.length; i < len; i++) {
        c = changes[i];
        switch (c.change) {
            case 'change':
                return false;
            case 'delete':
                deletes += oldLine.substr(c.old, c.length).trim();
                break;
            case 'insert':
                inserts += newLine.substr(c["new"], c.length).trim();
        }
    }
    return inserts === deletes;
};

module.exports = lineDiff;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGluZWRpZmYuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vY29mZmVlL3Rvb2xzIiwic291cmNlcyI6WyJsaW5lZGlmZi5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUE7O0FBUUEsTUFBa0IsT0FBQSxDQUFRLEtBQVIsQ0FBbEIsRUFBRSxpQkFBRixFQUFTOztBQUVULFFBQUEsR0FBVyxTQUFDLE9BQUQsRUFBVSxPQUFWO0FBRVAsUUFBQTtJQUFBLE9BQUEsR0FBVTtJQUVWLEVBQUEsR0FBSztJQUNMLEVBQUEsR0FBSztJQUVMLElBQUcsT0FBQSxLQUFXLE9BQWQ7UUFFSSxFQUFBLEdBQUssT0FBUSxDQUFBLEVBQUE7UUFDYixFQUFBLEdBQUssT0FBUSxDQUFBLEVBQUE7QUFFYixlQUFNLEVBQUEsR0FBSyxPQUFPLENBQUMsTUFBbkI7WUFFSSxJQUFPLFVBQVA7Z0JBQ0ksT0FBTyxDQUFDLElBQVIsQ0FBYTtvQkFBQSxNQUFBLEVBQU8sUUFBUDtvQkFBZ0IsR0FBQSxFQUFLLEVBQXJCO29CQUF5QixDQUFBLEdBQUEsQ0FBQSxFQUFLLEVBQTlCO29CQUFrQyxNQUFBLEVBQVEsT0FBTyxDQUFDLE1BQVIsR0FBZSxFQUF6RDtpQkFBYjtBQUNBLHNCQUZKO2FBQUEsTUFJSyxJQUFHLEVBQUEsS0FBTSxFQUFUO2dCQUVELEVBQUEsSUFBTTtnQkFDTixFQUFBLEdBQUssT0FBUSxDQUFBLEVBQUE7Z0JBQ2IsRUFBQSxJQUFNO2dCQUNOLEVBQUEsR0FBSyxPQUFRLENBQUEsRUFBQSxFQUxaO2FBQUEsTUFBQTtnQkFTRCxPQUFBLEdBQVUsT0FBTyxDQUFDLEtBQVIsQ0FBYyxFQUFkLENBQWlCLENBQUMsT0FBbEIsQ0FBMEIsRUFBMUI7Z0JBQ1YsT0FBQSxHQUFVLE9BQU8sQ0FBQyxLQUFSLENBQWMsRUFBZCxDQUFpQixDQUFDLE9BQWxCLENBQTBCLEVBQTFCO2dCQUVWLElBQUcsT0FBQSxHQUFVLENBQVYsSUFBZ0IsQ0FBQyxPQUFBLElBQVcsQ0FBWCxJQUFnQixPQUFBLEdBQVUsT0FBM0IsQ0FBbkI7b0JBRUksT0FBTyxDQUFDLElBQVIsQ0FBYTt3QkFBQSxNQUFBLEVBQU8sUUFBUDt3QkFBZ0IsR0FBQSxFQUFLLEVBQXJCO3dCQUF5QixDQUFBLEdBQUEsQ0FBQSxFQUFLLEVBQTlCO3dCQUFrQyxNQUFBLEVBQVEsT0FBMUM7cUJBQWI7b0JBQ0EsRUFBQSxJQUFNO29CQUNOLEVBQUEsR0FBSyxPQUFRLENBQUEsRUFBQSxFQUpqQjtpQkFBQSxNQU1LLElBQUcsT0FBQSxHQUFVLENBQVYsSUFBZ0IsQ0FBQyxPQUFBLElBQVcsQ0FBWCxJQUFnQixPQUFBLEdBQVUsT0FBM0IsQ0FBbkI7b0JBRUQsT0FBTyxDQUFDLElBQVIsQ0FBYTt3QkFBQSxNQUFBLEVBQU8sUUFBUDt3QkFBZ0IsR0FBQSxFQUFLLEVBQXJCO3dCQUF5QixDQUFBLEdBQUEsQ0FBQSxFQUFLLEVBQTlCO3dCQUFrQyxNQUFBLEVBQVEsT0FBMUM7cUJBQWI7b0JBQ0EsRUFBQSxJQUFNO29CQUNOLEVBQUEsR0FBSyxPQUFRLENBQUEsRUFBQSxFQUpaO2lCQUFBLE1BQUE7b0JBUUQsR0FBQSxHQUFNLElBQUEsQ0FBSyxPQUFMO29CQUNOLG1CQUFHLEdBQUcsQ0FBRSxnQkFBTCxLQUFlLFFBQWYsSUFBNEIsR0FBRyxDQUFDLEdBQUosR0FBVSxHQUFHLENBQUMsTUFBZCxLQUF3QixFQUF2RDt3QkFDSSxHQUFHLENBQUMsTUFBSixJQUFjLEVBRGxCO3FCQUFBLE1BQUE7d0JBR0ksT0FBTyxDQUFDLElBQVIsQ0FBYTs0QkFBQSxNQUFBLEVBQU8sUUFBUDs0QkFBZ0IsR0FBQSxFQUFLLEVBQXJCOzRCQUF5QixDQUFBLEdBQUEsQ0FBQSxFQUFLLEVBQTlCOzRCQUFrQyxNQUFBLEVBQVEsQ0FBMUM7eUJBQWIsRUFISjs7b0JBSUEsRUFBQSxJQUFNO29CQUNOLEVBQUEsR0FBSyxPQUFRLENBQUEsRUFBQTtvQkFDYixFQUFBLElBQU07b0JBQ04sRUFBQSxHQUFLLE9BQVEsQ0FBQSxFQUFBLEVBaEJaO2lCQWxCSjs7UUFOVDtRQTBDQSxJQUFHLEVBQUEsR0FBSyxPQUFPLENBQUMsTUFBaEI7WUFFSSxPQUFPLENBQUMsSUFBUixDQUFhO2dCQUFBLE1BQUEsRUFBUSxRQUFSO2dCQUFpQixHQUFBLEVBQUssRUFBdEI7Z0JBQTBCLENBQUEsR0FBQSxDQUFBLEVBQUssRUFBL0I7Z0JBQW1DLE1BQUEsRUFBUSxPQUFPLENBQUMsTUFBUixHQUFpQixFQUE1RDthQUFiLEVBRko7U0EvQ0o7O1dBbURBO0FBMURPOztBQWtFWCxRQUFRLENBQUMsUUFBVCxHQUFvQixTQUFDLE9BQUQsRUFBVSxPQUFWO0FBRWhCLFFBQUE7SUFBQSxPQUFBLEdBQVUsUUFBQSxDQUFTLE9BQVQsRUFBa0IsT0FBbEI7SUFDVixJQUFlLEtBQUEsQ0FBTSxPQUFOLENBQWY7QUFBQSxlQUFPLEtBQVA7O0lBQ0EsT0FBQSxHQUFVO0lBQ1YsT0FBQSxHQUFVO0FBQ1YsU0FBQSx5Q0FBQTs7QUFDSSxnQkFBTyxDQUFDLENBQUMsTUFBVDtBQUFBLGlCQUNTLFFBRFQ7QUFDdUIsdUJBQU87QUFEOUIsaUJBRVMsUUFGVDtnQkFFdUIsT0FBQSxJQUFXLE9BQU8sQ0FBQyxNQUFSLENBQWUsQ0FBQyxDQUFDLEdBQWpCLEVBQXNCLENBQUMsQ0FBQyxNQUF4QixDQUErQixDQUFDLElBQWhDLENBQUE7QUFBekI7QUFGVCxpQkFHUyxRQUhUO2dCQUd1QixPQUFBLElBQVcsT0FBTyxDQUFDLE1BQVIsQ0FBZSxDQUFDLEVBQUMsR0FBRCxFQUFoQixFQUFzQixDQUFDLENBQUMsTUFBeEIsQ0FBK0IsQ0FBQyxJQUFoQyxDQUFBO0FBSGxDO0FBREo7V0FLQSxPQUFBLEtBQVc7QUFYSzs7QUFhcEIsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMCAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgXG4wMDAgICAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIFxuMDAwICAgICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgMDAwMDAwICAgIDAwMDAwMCAgICBcbjAwMCAgICAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgXG4wMDAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIFxuIyMjXG5cbnsgZW1wdHksIGxhc3QgfSA9IHJlcXVpcmUgJ2t4aydcblxubGluZURpZmYgPSAob2xkTGluZSwgbmV3TGluZSkgLT5cbiAgICBcbiAgICBjaGFuZ2VzID0gW11cbiAgICBcbiAgICBvaSA9IDAgIyBpbmRleCBpbiBvbGRMaW5lXG4gICAgbmkgPSAwICMgaW5kZXggaW4gbmV3TGluZVxuXG4gICAgaWYgb2xkTGluZSAhPSBuZXdMaW5lXG4gICAgXG4gICAgICAgIG9jID0gb2xkTGluZVtvaV1cbiAgICAgICAgbmMgPSBuZXdMaW5lW25pXVxuICAgICAgICBcbiAgICAgICAgd2hpbGUgb2kgPCBvbGRMaW5lLmxlbmd0aFxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBub3QgbmM/ICMgbmV3IGxpbmUgaGFzIG5vdCBlbm91Z2ggY2hhcmFjdGVycywgbWFyayByZW1haW5pbmcgY2hhcmFjdGVycyBpbiBvbGQgbGluZSBhcyBkZWxldGVkXG4gICAgICAgICAgICAgICAgY2hhbmdlcy5wdXNoIGNoYW5nZTonZGVsZXRlJyBvbGQ6IG9pLCBuZXc6IG5pLCBsZW5ndGg6IG9sZExpbmUubGVuZ3RoLW9pXG4gICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGVsc2UgaWYgb2MgPT0gbmMgIyBzYW1lIGNoYXJhY3RlciBpbiBvbGQgYW5kIG5ld1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIG9pICs9IDFcbiAgICAgICAgICAgICAgICBvYyA9IG9sZExpbmVbb2ldXG4gICAgICAgICAgICAgICAgbmkgKz0gMVxuICAgICAgICAgICAgICAgIG5jID0gbmV3TGluZVtuaV1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGVsc2UgXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaW5zZXJ0cyA9IG5ld0xpbmUuc2xpY2UobmkpLmluZGV4T2Ygb2MgIyBpbnNlcnRpb25cbiAgICAgICAgICAgICAgICBkZWxldGVzID0gb2xkTGluZS5zbGljZShvaSkuaW5kZXhPZiBuYyAjIGRlbGV0aW9uXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgaW5zZXJ0cyA+IDAgYW5kIChkZWxldGVzIDw9IDAgb3IgaW5zZXJ0cyA8IGRlbGV0ZXMpXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBjaGFuZ2VzLnB1c2ggY2hhbmdlOidpbnNlcnQnIG9sZDogb2ksIG5ldzogbmksIGxlbmd0aDogaW5zZXJ0c1xuICAgICAgICAgICAgICAgICAgICBuaSArPSBpbnNlcnRzXG4gICAgICAgICAgICAgICAgICAgIG5jID0gbmV3TGluZVtuaV1cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgZWxzZSBpZiBkZWxldGVzID4gMCBhbmQgKGluc2VydHMgPD0gMCBvciBkZWxldGVzIDwgaW5zZXJ0cykgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGNoYW5nZXMucHVzaCBjaGFuZ2U6J2RlbGV0ZScgb2xkOiBvaSwgbmV3OiBuaSwgbGVuZ3RoOiBkZWxldGVzXG4gICAgICAgICAgICAgICAgICAgIG9pICs9IGRlbGV0ZXNcbiAgICAgICAgICAgICAgICAgICAgb2MgPSBvbGRMaW5lW29pXVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGVsc2UgIyBjaGFuZ2VcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGxzdCA9IGxhc3QgY2hhbmdlcyBcbiAgICAgICAgICAgICAgICAgICAgaWYgbHN0Py5jaGFuZ2UgPT0gJ2NoYW5nZScgYW5kIGxzdC5vbGQgKyBsc3QubGVuZ3RoID09IG9pXG4gICAgICAgICAgICAgICAgICAgICAgICBsc3QubGVuZ3RoICs9IDFcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgY2hhbmdlcy5wdXNoIGNoYW5nZTonY2hhbmdlJyBvbGQ6IG9pLCBuZXc6IG5pLCBsZW5ndGg6IDFcbiAgICAgICAgICAgICAgICAgICAgb2kgKz0gMVxuICAgICAgICAgICAgICAgICAgICBvYyA9IG9sZExpbmVbb2ldXG4gICAgICAgICAgICAgICAgICAgIG5pICs9IDFcbiAgICAgICAgICAgICAgICAgICAgbmMgPSBuZXdMaW5lW25pXVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIG5pIDwgbmV3TGluZS5sZW5ndGggIyBtYXJrIHJlbWFpbmcgY2hhcmFjdGVycyBpbiBuZXcgbGluZSBhcyBpbnNlcnRlZFxuICAgICAgICAgICAgXG4gICAgICAgICAgICBjaGFuZ2VzLnB1c2ggY2hhbmdlOiAnaW5zZXJ0JyBvbGQ6IG9pLCBuZXc6IG5pLCBsZW5ndGg6IG5ld0xpbmUubGVuZ3RoIC0gbmlcbiAgICBcbiAgICBjaGFuZ2VzXG5cbiMgMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgIFxuIyAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAwICBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgXG4jIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIFxuXG5saW5lRGlmZi5pc0JvcmluZyA9IChvbGRMaW5lLCBuZXdMaW5lKSAtPlxuICAgIFxuICAgIGNoYW5nZXMgPSBsaW5lRGlmZiBvbGRMaW5lLCBuZXdMaW5lXG4gICAgcmV0dXJuIHRydWUgaWYgZW1wdHkgY2hhbmdlc1xuICAgIGluc2VydHMgPSAnJ1xuICAgIGRlbGV0ZXMgPSAnJ1xuICAgIGZvciBjIGluIGNoYW5nZXNcbiAgICAgICAgc3dpdGNoIGMuY2hhbmdlXG4gICAgICAgICAgICB3aGVuICdjaGFuZ2UnIHRoZW4gcmV0dXJuIGZhbHNlXG4gICAgICAgICAgICB3aGVuICdkZWxldGUnIHRoZW4gZGVsZXRlcyArPSBvbGRMaW5lLnN1YnN0cihjLm9sZCwgYy5sZW5ndGgpLnRyaW0oKVxuICAgICAgICAgICAgd2hlbiAnaW5zZXJ0JyB0aGVuIGluc2VydHMgKz0gbmV3TGluZS5zdWJzdHIoYy5uZXcsIGMubGVuZ3RoKS50cmltKClcbiAgICBpbnNlcnRzID09IGRlbGV0ZXNcbiAgICBcbm1vZHVsZS5leHBvcnRzID0gbGluZURpZmZcbiJdfQ==
//# sourceURL=../../coffee/tools/linediff.coffee