###
000      000  000   000  00000000  0000000    000  00000000  00000000  
000      000  0000  000  000       000   000  000  000       000       
000      000  000 0 000  0000000   000   000  000  000000    000000    
000      000  000  0000  000       000   000  000  000       000       
0000000  000  000   000  00000000  0000000    000  000       000       
###

{ empty, last } = require 'kxk'

lineDiff = (oldLine, newLine) ->
    
    changes = []
    
    oi = 0 # index in oldLine
    ni = 0 # index in newLine

    if oldLine != newLine
    
        oc = oldLine[oi]
        nc = newLine[ni]
        
        while oi < oldLine.length
            
            if not nc? # new line has not enough characters, mark remaining characters in old line as deleted
                changes.push change: 'delete', old: oi, new: ni, length: oldLine.length-oi
                break
                
            else if oc == nc # same character in old and new
                
                oi += 1
                oc = oldLine[oi]
                ni += 1
                nc = newLine[ni]
                
            else 
                
                inserts = newLine.slice(ni).indexOf oc # insertion
                deletes = oldLine.slice(oi).indexOf nc # deletion
                
                if inserts > 0 and (deletes <= 0 or inserts < deletes)
                    
                    changes.push change: 'insert', old: oi, new: ni, length: inserts
                    ni += inserts
                    nc = newLine[ni]
                    
                else if deletes > 0 and (inserts <= 0 or deletes < inserts)                                    
                    
                    changes.push change: 'delete', old: oi, new: ni, length: deletes
                    oi += deletes
                    oc = oldLine[oi]
                
                else # change
                    
                    lst = last changes 
                    if lst?.change == 'change' and lst.old + lst.length == oi
                        lst.length += 1
                    else
                        changes.push change: 'change', old: oi, new: ni, length: 1
                    oi += 1
                    oc = oldLine[oi]
                    ni += 1
                    nc = newLine[ni]
                        
        if ni < newLine.length # mark remaing characters in new line as inserted
            
            changes.push change: 'insert', old: oi, new: ni, length: newLine.length - ni
    
    changes

# 0000000     0000000   00000000   000  000   000   0000000   
# 000   000  000   000  000   000  000  0000  000  000        
# 0000000    000   000  0000000    000  000 0 000  000  0000  
# 000   000  000   000  000   000  000  000  0000  000   000  
# 0000000     0000000   000   000  000  000   000   0000000   

lineDiff.isBoring = (oldLine, newLine) ->
    
    changes = lineDiff oldLine, newLine
    return true if empty changes
    inserts = ''
    deletes = ''
    for c in changes
        switch c.change
            when 'change' then return false
            when 'delete' then deletes += oldLine.substr(c.old, c.length).trim()
            when 'insert' then inserts += newLine.substr(c.new, c.length).trim()
    inserts == deletes
    
module.exports = lineDiff
