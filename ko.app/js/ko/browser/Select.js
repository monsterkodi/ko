var _k_

class Select
{
    constructor (browser)
    {
        this.browser = browser
    
        this.rows = []
        this.active = null
    }

    files ()
    {
        return this.items().map(function (item)
        {
            return item.path
        })
    }

    items ()
    {
        var rows

        rows = this.rows.filter(function (row)
        {
            return row.item.file !== '..'
        })
        return rows.map(function (row)
        {
            return row.item
        })
    }

    freeIndex ()
    {
        var index

        if (!this.active)
        {
            return -1
        }
        index = this.active.index()
        while (index < this.active.column.numRows() - 1)
        {
            index += 1
            if (!this.active.column.rows[index].isSelected())
            {
                return index
            }
        }
        index = this.active.index()
        while (index > 0)
        {
            index -= 1
            if (!this.active.column.rows[index].isSelected())
            {
                return index
            }
        }
        return -1
    }

    clear ()
    {
        var row, _44_25_

        var list = ((_44_25_=this.rows) != null ? _44_25_ : [])
        for (var _44_16_ = 0; _44_16_ < list.length; _44_16_++)
        {
            row = list[_44_16_]
            row.clearSelected()
        }
        this.rows = []
        return this.active = null
    }

    toggle (row)
    {
        var _54_32_

        if (row.column !== (this.active != null ? this.active.column : undefined))
        {
            this.row(row)
            return
        }
        if (row.isSelected())
        {
            row.clearActive()
            row.clearSelected()
            return this.rows.splice(this.rows.indexOf(row),1)
        }
        else
        {
            row.setSelected()
            this.active = row
            return this.rows.push(row)
        }
    }

    row (row, activate = true)
    {
        var _72_18_, _73_19_

        if (!row)
        {
            return
        }
        if ((this.active != null ? this.active.column : undefined) === row.column && activate)
        {
            ;(this.active != null ? this.active.clearActive() : undefined)
        }
        this.clear()
        this.rows = [row]
        this.active = row
        row.setSelected()
        if (!row.isActive() && activate)
        {
            return row.activate()
        }
    }

    to (row, moveActive = false)
    {
        var from, index, r, to, _108_19_

        if (!row)
        {
            return
        }
        if (row === this.active)
        {
            return
        }
        if (!this.active)
        {
            return
        }
        if (row.column !== this.active.column)
        {
            this.row(row)
            return
        }
        if (row.index() > this.active.index())
        {
            from = this.active.index() + 1
            to = row.index()
        }
        else
        {
            from = row.index()
            to = this.active.index() - 1
        }
        for (var _101_22_ = index = from, _101_28_ = to; (_101_22_ <= _101_28_ ? index <= to : index >= to); (_101_22_ <= _101_28_ ? ++index : --index))
        {
            r = this.active.column.rows[index]
            if (!r.isSelected())
            {
                r.setSelected()
                this.rows.push(r)
            }
        }
        if (moveActive)
        {
            ;(this.active != null ? this.active.clearActive() : undefined)
            this.active = row
            return this.active.setActive()
        }
    }
}

export default Select;