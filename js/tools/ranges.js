// monsterkodi/kode 0.228.0

var _k_ = {list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}, in: function (a,l) {return (typeof l === 'string' && typeof a === 'string' && a.length ? '' : []).indexOf.call(l,a) >= 0}, isNum: function (o) {return !isNaN(o) && !isNaN(parseFloat(o)) && (isFinite(o) || o === Infinity || o === -Infinity)}}

var _

_ = require('kxk')._

class Ranges
{
    static pollute ()
    {
        var member

        var list = _k_.list(Object.getOwnPropertyNames(Ranges.prototype))
        for (var _14_19_ = 0; _14_19_ < list.length; _14_19_++)
        {
            member = list[_14_19_]
            if (_k_.in(member,['constructor']))
            {
                continue
            }
            global[member] = Ranges.prototype[member]
        }
        return Ranges
    }

    cursorDelta (c, dx, dy = 0)
    {
        c[0] += dx
        return c[1] += dy
    }

    cursorSet (c, x, y)
    {
        if (!(y != null) && x.length >= 2)
        {
            var _25_14_ = x; x = _25_14_[0]; y = _25_14_[1]

        }
        c[0] = x
        return c[1] = y
    }

    indentationInLine (l)
    {
        var s

        s = 0
        if ((l != null) && l.length > 0)
        {
            l = l.trimRight()
            while (l[s] === ' ')
            {
                s += 1
            }
        }
        return s
    }

    lastWordInLine (l)
    {
        var i

        l = l.trim()
        i = l.lastIndexOf(' ')
        return l.slice(i + 1)
    }

    numberOfCharsAtEnd (t, c)
    {
        var i, s

        s = 0
        i = t.length - 1
        while (i >= 0)
        {
            if (t[i] === c)
            {
                s++
                i--
            }
            else
            {
                break
            }
        }
        return s
    }

    rangeForPos (p)
    {
        return [p[1],[p[0],p[0]]]
    }

    rangeBetween (a, b)
    {
        var r

        if (isPos(a) && isPos(b))
        {
            return [Math.min(a[1],b[1]),[Math.min(a[0],b[0]),Math.max(a[0],b[0])]]
        }
        else if (isRange(a) && isRange(b))
        {
            r = [a,b]
            sortRanges(r)
            return rangeBetween(rangeEndPos(r[0]),rangeStartPos(r[1]))
        }
    }

    isPos (p)
    {
        return (p != null ? p.length : undefined) === 2 && _k_.isNum(p[0]) && _k_.isNum(p[1])
    }

    isRange (r)
    {
        return (r != null ? r.length : undefined) >= 2 && _k_.isNum(r[0]) && (r[1] != null ? r[1].length : undefined) >= 2 && _k_.isNum(r[1][0]) && _k_.isNum(r[1][1])
    }

    isSameRange (a, b)
    {
        return a[0] === b[0] && a[1][0] === b[1][0] && a[1][1] === b[1][1]
    }

    isSamePos (a, b)
    {
        return a[1] === b[1] && a[0] === b[0]
    }

    isPosInRange (p, r)
    {
        return (p[1] === r[0]) && ((r[1][0] <= p[0] && p[0] <= r[1][1]))
    }

    isPosInRanges (p, rgs)
    {
        var _66_58_

        return (rangeAtPosInRanges(p,rgs) != null)
    }

    isPosInPositions (p, ps)
    {
        var _67_52_

        return (posInPositions(p,ps) != null)
    }

    rangeEndPos (r)
    {
        return [r[1][1],r[0]]
    }

    rangeStartPos (r)
    {
        return [r[1][0],r[0]]
    }

    lengthOfRange (r)
    {
        return r[1][1] - r[1][0]
    }

    rangeIndexPos (r, i)
    {
        return [r[1][i],r[0]]
    }

    rangeGrownBy (r, d)
    {
        return [r[0],[r[1][0] - d,r[1][1] + d]]
    }

    positionsFromPosInPositions (p, pl)
    {
        return pl.filter(function (r)
        {
            return (r[1] > p[1]) || (r[1] === p[1]) && (r[0] >= p[0])
        })
    }

    positionsAtLineIndexInPositions (li, pl)
    {
        return pl.filter(function (p)
        {
            return p[1] === li
        })
    }

    positionsBelowLineIndexInPositions (li, pl)
    {
        return pl.filter(function (p)
        {
            return p[1] > li
        })
    }

    positionsAfterLineColInPositions (li, col, pl)
    {
        return pl.filter(function (p)
        {
            return p[1] === li && p[0] > col
        })
    }

    positionsNotInRanges (pss, rgs)
    {
        return pss.filter(function (p)
        {
            return !isPosInRanges(p,rgs)
        })
    }

    positionsBetweenPosAndPosInPositions (p1, p2, pl)
    {
        var a, b

        var _87_14_ = sortPositions([p1,p2]); a = _87_14_[0]; b = _87_14_[1]

        return pl.filter(function (r)
        {
            return (r[1] > a[1] || (r[1] === a[1]) && (r[0] >= a[0])) && (r[1] < b[1] || (r[1] === b[1]) && (r[0] <= b[0]))
        })
    }

    positionsInContinuousLine (pl)
    {
        var c, cp

        cp = pl[0]
        var list = _k_.list(pl.slice(1))
        for (var _93_14_ = 0; _93_14_ < list.length; _93_14_++)
        {
            c = list[_93_14_]
            if (c[0] !== cp[0])
            {
                return false
            }
            if (c[1] !== cp[1] + 1)
            {
                return false
            }
            cp = c
        }
        return true
    }

    manhattanDistance (a, b)
    {
        return Math.abs(a[1] - b[1]) + Math.abs(a[0] - b[0])
    }

    posInPositions (p, pl)
    {
        var c

        var list = _k_.list(pl)
        for (var _102_14_ = 0; _102_14_ < list.length; _102_14_++)
        {
            c = list[_102_14_]
            if (isSamePos(p,c))
            {
                return c
            }
        }
    }

    posClosestToPosInPositions (p, pl)
    {
        var mDist, minDist, minPos, ps

        minDist = 999999
        var list = _k_.list(pl)
        for (var _107_15_ = 0; _107_15_ < list.length; _107_15_++)
        {
            ps = list[_107_15_]
            mDist = manhattanDistance(ps,p)
            if (mDist < minDist)
            {
                minDist = mDist
                minPos = ps
            }
        }
        return (minPos != null ? minPos : pl.slice(-1)[0])
    }

    lineIndicesInPositions (pl)
    {
        var indices, p

        indices = []
        var list = _k_.list(pl)
        for (var _116_14_ = 0; _116_14_ < list.length; _116_14_++)
        {
            p = list[_116_14_]
            indices.push(p[1])
        }
        return _.uniq(indices).sort()
    }

    endPositionsFromRanges (ranges)
    {
        var r

        return (function () { var _120__64_ = []; var list = _k_.list(ranges); for (var _120_64_ = 0; _120_64_ < list.length; _120_64_++)  { r = list[_120_64_];_120__64_.push(rangeEndPos(r))  } return _120__64_ }).bind(this)()
    }

    startPositionsFromRanges (ranges)
    {
        var r

        return (function () { var _121__66_ = []; var list = _k_.list(ranges); for (var _121_66_ = 0; _121_66_ < list.length; _121_66_++)  { r = list[_121_66_];_121__66_.push(rangeStartPos(r))  } return _121__66_ }).bind(this)()
    }

    rangesFromPositions (pl)
    {
        var p

        return (function () { var _129__61_ = []; var list = _k_.list(pl); for (var _129_61_ = 0; _129_61_ < list.length; _129_61_++)  { p = list[_129_61_];_129__61_.push([p[1],[p[0],p[0]]])  } return _129__61_ }).bind(this)()
    }

    rangesAtLineIndexInRanges (li, ranges)
    {
        return ranges.filter(function (r)
        {
            return r[0] === li
        })
    }

    rangesForLineIndicesInRanges (lis, ranges)
    {
        return ranges.filter(function (r)
        {
            return _k_.in(r[0],lis)
        })
    }

    rangesAfterLineColInRanges (li, col, ranges)
    {
        return ranges.filter(function (r)
        {
            return r[0] === li && r[1][0] > col
        })
    }

    rangeAtPosInRanges (pos, ranges)
    {
        var r, ri

        if (ranges.length === 0)
        {
            return
        }
        for (var _136_19_ = ri = ranges.length - 1, _136_36_ = 0; (_136_19_ <= _136_36_ ? ri <= 0 : ri >= 0); (_136_19_ <= _136_36_ ? ++ri : --ri))
        {
            r = ranges[ri]
            if ((r[0] === pos[1]) && ((r[1][0] <= pos[0] && pos[0] <= r[1][1])))
            {
                return r
            }
        }
    }

    rangesBeforePosInRanges (pos, ranges)
    {
        var r, rs

        if (ranges.length === 0)
        {
            return []
        }
        rs = []
        var list = _k_.list(ranges)
        for (var _144_14_ = 0; _144_14_ < list.length; _144_14_++)
        {
            r = list[_144_14_]
            if ((r[0] > pos[1]) || ((r[0] === pos[1]) && (r[1][0] > pos[0])))
            {
                return rs
            }
            rs.push(r)
        }
        return rs
    }

    rangesAfterPosInRanges (pos, ranges)
    {
        var r, ri, rs

        if (ranges.length === 0)
        {
            return []
        }
        rs = []
        for (var _153_19_ = ri = ranges.length - 1, _153_36_ = 0; (_153_19_ <= _153_36_ ? ri <= 0 : ri >= 0); (_153_19_ <= _153_36_ ? ++ri : --ri))
        {
            r = ranges[ri]
            if ((r[0] < pos[1]) || ((r[0] === pos[1]) && (r[1][1] < pos[0])))
            {
                return rs
            }
            rs.unshift(r)
        }
        return rs
    }

    rangesSplitAtPosInRanges (pos, ranges)
    {
        var aft, at, bef, r, ri

        if (ranges.length === 0)
        {
            return [[],null,[]]
        }
        var _162_21_ = [[],null,[]]; bef = _162_21_[0]; at = _162_21_[1]; aft = _162_21_[2]

        for (var _163_19_ = ri = 0, _163_23_ = ranges.length; (_163_19_ <= _163_23_ ? ri < ranges.length : ri > ranges.length); (_163_19_ <= _163_23_ ? ++ri : --ri))
        {
            r = ranges[ri]
            if ((r[0] === pos[1]) && ((r[1][0] <= pos[0] && pos[0] <= r[1][1])))
            {
                at = r
                aft = ranges.slice(ri + 1)
                break
            }
            bef.push(r)
        }
        return [bef,at,aft]
    }

    rangeBeforePosInRanges (pos, ranges)
    {
        var r, ri

        if (ranges.length === 0)
        {
            return
        }
        for (var _174_19_ = ri = ranges.length - 1, _174_36_ = 0; (_174_19_ <= _174_36_ ? ri <= 0 : ri >= 0); (_174_19_ <= _174_36_ ? ++ri : --ri))
        {
            r = ranges[ri]
            if ((r[0] < pos[1]) || ((r[0] === pos[1]) && (r[1][1] < pos[0])))
            {
                return r
            }
        }
    }

    rangeAfterPosInRanges (pos, ranges)
    {
        var r

        var list = _k_.list(ranges)
        for (var _180_14_ = 0; _180_14_ < list.length; _180_14_++)
        {
            r = list[_180_14_]
            if ((r[0] > pos[1]) || ((r[0] === pos[1]) && (r[1][0] > pos[0])))
            {
                return r
            }
        }
    }

    rangeStartingOrEndingAtPosInRanges (p, ranges)
    {
        var r, ri

        if (ranges.length === 0)
        {
            return
        }
        for (var _186_19_ = ri = ranges.length - 1, _186_36_ = 0; (_186_19_ <= _186_36_ ? ri <= 0 : ri >= 0); (_186_19_ <= _186_36_ ? ++ri : --ri))
        {
            r = ranges[ri]
            if (r[0] === p[1])
            {
                if (r[1][0] === p[0] || r[1][1] === p[0])
                {
                    return r
                }
            }
        }
    }

    rangesFromTopToBotInRanges (top, bot, ranges)
    {
        return ranges.filter(function (r)
        {
            return (top <= r[0] && r[0] <= bot)
        })
    }

    rangeContainingRangeInRanges (r, ranges)
    {
        var cr

        if (cr = rangeAtPosInRanges(rangeStartPos(r),ranges))
        {
            if (cr[1][1] >= r[1][1])
            {
                return cr
            }
        }
    }

    rangesShrunkenBy (ranges, delta)
    {
        return ranges.filter(function (r)
        {
            return r[1][1] - r[1][0] >= 2 * delta
        }).map(function (r)
        {
            return [r[0],[r[1][0] + delta,r[1][1] - delta]]
        })
    }

    rangesNotEmptyInRanges (ranges)
    {
        return ranges.filter(function (r)
        {
            return r[1][1] - r[1][0]
        })
    }

    areSameRanges (ra, rb)
    {
        var i

        if (ra.length === rb.length)
        {
            for (var _206_22_ = i = 0, _206_26_ = ra.length; (_206_22_ <= _206_26_ ? i < ra.length : i > ra.length); (_206_22_ <= _206_26_ ? ++i : --i))
            {
                if (!isSameRange(ra[i],rb[i]))
                {
                    return false
                }
            }
            return true
        }
        return false
    }

    cleanRanges (ranges)
    {
        var p, r, ri

        sortRanges(ranges)
        if (ranges.length > 1)
        {
            for (var _220_23_ = ri = ranges.length - 1, _220_41_ = 0; (_220_23_ <= _220_41_ ? ri < 0 : ri > 0); (_220_23_ <= _220_41_ ? ++ri : --ri))
            {
                r = ranges[ri]
                p = ranges[ri - 1]
                if (r[0] === p[0])
                {
                    if (r[1][0] <= p[1][1])
                    {
                        p[1][1] = Math.max(p[1][1],r[1][1])
                        ranges.splice(ri,1)
                    }
                }
            }
        }
        return ranges
    }

    sortRanges (ranges)
    {
        return ranges.sort(function (a, b)
        {
            if (a[0] !== b[0])
            {
                return a[0] - b[0]
            }
            else
            {
                if (a[1][0] !== b[1][0])
                {
                    return a[1][0] - b[1][0]
                }
                else
                {
                    return a[1][1] - b[1][1]
                }
            }
        })
    }

    sortPositions (positions)
    {
        return positions.sort(function (a, b)
        {
            if (a[1] !== b[1])
            {
                return a[1] - b[1]
            }
            else
            {
                return a[0] - b[0]
            }
        })
    }
}

module.exports = Ranges.pollute()