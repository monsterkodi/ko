// monsterkodi/kode 0.234.0

var _k_ = {last: function (o) {return o != null ? o.length ? o[o.length-1] : undefined : o}, empty: function (l) {return l==='' || l===null || l===undefined || l!==l || typeof(l) === 'object' && Object.keys(l).length === 0}, list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}}

var kxk, lineDiff

kxk = require('kxk')
last = kxk.last


lineDiff = function (oldLine, newLine)
{
    var changes, deletes, inserts, lst, nc, ni, oc, oi

    changes = []
    oi = 0
    ni = 0
    if (oldLine !== newLine)
    {
        oc = oldLine[oi]
        nc = newLine[ni]
        while (oi < oldLine.length)
        {
            if (!(nc != null))
            {
                changes.push({change:'delete',old:oi,new:ni,length:oldLine.length - oi})
                break
            }
            else if (oc === nc)
            {
                oi += 1
                oc = oldLine[oi]
                ni += 1
                nc = newLine[ni]
            }
            else
            {
                inserts = newLine.slice(ni).indexOf(oc)
                deletes = oldLine.slice(oi).indexOf(nc)
                if (inserts > 0 && (deletes <= 0 || inserts < deletes))
                {
                    changes.push({change:'insert',old:oi,new:ni,length:inserts})
                    ni += inserts
                    nc = newLine[ni]
                }
                else if (deletes > 0 && (inserts <= 0 || deletes < inserts))
                {
                    changes.push({change:'delete',old:oi,new:ni,length:deletes})
                    oi += deletes
                    oc = oldLine[oi]
                }
                else
                {
                    lst = _k_.last(changes)
                    if ((lst != null ? lst.change : undefined) === 'change' && lst.old + lst.length === oi)
                    {
                        lst.length += 1
                    }
                    else
                    {
                        changes.push({change:'change',old:oi,new:ni,length:1})
                    }
                    oi += 1
                    oc = oldLine[oi]
                    ni += 1
                    nc = newLine[ni]
                }
            }
        }
        if (ni < newLine.length)
        {
            changes.push({change:'insert',old:oi,new:ni,length:newLine.length - ni})
        }
    }
    return changes
}

lineDiff.isBoring = function (oldLine, newLine)
{
    var c, changes, deletes, inserts

    changes = lineDiff(oldLine,newLine)
    if (_k_.empty(changes))
    {
        return true
    }
    inserts = ''
    deletes = ''
    var list = _k_.list(changes)
    for (var _84_10_ = 0; _84_10_ < list.length; _84_10_++)
    {
        c = list[_84_10_]
        switch (c.change)
        {
            case 'change':
                return false

            case 'delete':
                deletes += oldLine.substr(c.old,c.length).trim()
                break
            case 'insert':
                inserts += newLine.substr(c.new,c.length).trim()
                break
        }

    }
    return inserts === deletes
}
module.exports = lineDiff