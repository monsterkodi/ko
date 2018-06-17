###
 0000000  00000000    0000000  00     00   0000000   00000000   
000       000   000  000       000   000  000   000  000   000  
0000000   0000000    000       000000000  000000000  00000000   
     000  000   000  000       000 0 000  000   000  000        
0000000   000   000   0000000  000   000  000   000  000        
###

{ fs, valid, empty, slash, log, _ } = require 'kxk'

sourceMap  = require 'source-map'
mapConvert = require 'convert-source-map'
regex      = /^\s+at\s+(\S+)\s+\((.*):(\d+):(\d+)\)/

# 00000000  000  000      00000000  00000000    0000000    0000000  
# 000       000  000      000       000   000  000   000  000       
# 000000    000  000      0000000   00000000   000   000  0000000   
# 000       000  000      000       000        000   000       000  
# 000       000  0000000  00000000  000         0000000   0000000   

filePos = (line) ->

    if match = regex.exec line
        
        result =
            func: match[1].replace '.<anonymous>', ''
            file: match[2]
            line: match[3]
            col:  match[4]
        
        if slash.ext(result.file) == 'js'
            
            mappedLine = toCoffee result.file, result.line, result.col
            
            if mappedLine?
                result.file = mappedLine[0]
                result.line = mappedLine[1]
                result.col  = mappedLine[2]
    result

#  0000000  000000000   0000000    0000000  000   000  
# 000          000     000   000  000       000  000   
# 0000000      000     000000000  000       0000000    
#      000     000     000   000  000       000  000   
# 0000000      000     000   000   0000000  000   000  

errorStack = (err) ->
    
    lines = []
    
    for stackLine in err.stack.split '\n' 
        
        if fp = filePos stackLine
            lines.push "       #{_.padEnd fp.func, 30} #{fp.file}:#{fp.line}" 
        else
            lines.push stackLine 
  
    lines.join '\n'

# 000000000  00000000    0000000    0000000  00000000  
#    000     000   000  000   000  000       000       
#    000     0000000    000000000  000       0000000   
#    000     000   000  000   000  000       000       
#    000     000   000  000   000   0000000  00000000  

errorTrace = (err) ->
    
    lines = []
    text  = []

    for stackLine in err.stack.split '\n' 
        
        if fp = filePos stackLine
            lines.push fp
        else
            text.push stackLine 
  
    lines:  lines
    text:   text.join '\n'
    
# 000000000   0000000          0000000   0000000   00000000  00000000  00000000  00000000  
#    000     000   000        000       000   000  000       000       000       000       
#    000     000   000        000       000   000  000000    000000    0000000   0000000   
#    000     000   000        000       000   000  000       000       000       000       
#    000      0000000          0000000   0000000   000       000       00000000  00000000  

toCoffee  = (jsFile, jsLine, jsCol=0) ->

    jsLine = parseInt jsLine
    jsCol  = parseInt jsCol
    
    coffeeFile = slash.path jsFile
    coffeeLine = jsLine
    coffeeCol  = jsCol
        
    if slash.fileExists jsFile
        mapData = mapConvert.fromSource(fs.readFileSync jsFile, 'utf8')?.toObject()
        if valid mapData
            mapData.sources[0] = slash.resolve slash.join slash.dir(jsFile), mapData?.sources[0] if mapData?.sources[0]
            consumer = new sourceMap.SourceMapConsumer(mapData)
            if consumer.originalPositionFor
                pos = consumer.originalPositionFor line:jsLine, column:jsCol, bias:sourceMap.SourceMapConsumer.LEAST_UPPER_BOUND
                if pos.line and pos.column
                    coffeeFile = mapData.sources[0]
                    coffeeLine = pos.line 
                    coffeeCol  = pos.column
        
    [coffeeFile, coffeeLine, coffeeCol]

# 000000000   0000000               000   0000000  
#    000     000   000              000  000       
#    000     000   000              000  0000000   
#    000     000   000        000   000       000  
#    000      0000000          0000000   0000000   

toJs = (coffeeFile, coffeeLine, coffeeCol=0) ->
    
    jsFile = coffeeFile.replace /\/coffee\//, '/js/'
    jsFile = jsFile.replace /\.coffee$/, '.js'
    
    if not slash.fileExists jsFile 
        if not jsLine? then return null
        return [null, null, null]
        
    if not coffeeLine? then return jsFile
    
    mapFile = jsFile
    
    if slash.fileExists mapFile

        mapData = mapConvert.fromSource(fs.readFileSync mapFile, 'utf8').toObject()

        consumer = new sourceMap.SourceMapConsumer mapData
        
        if consumer?.allGeneratedPositionsFor?
            srcFile = 'js/'+jsFile.split('/js/')[1]
            poss = consumer.allGeneratedPositionsFor source:srcFile, line:coffeeLine, column:coffeeCol
            if not poss.length and coffeeCol
                poss = consumer.allGeneratedPositionsFor source:srcFile, line:coffeeLine, column:0
        else
            log consumer?, consumer?.allGeneratedPositionsFor?
            log 'no allGeneratedPositionsFor in', consumer
            
        return [jsFile,null,null] if empty poss
        jsLine = poss[0].line
        jsCol  = poss[0].column
    else
        jsLine = null
        jsCol  = null
        
    [jsFile, jsLine, jsCol]
        
module.exports =
    toJs:       toJs
    toCoffee:   toCoffee
    errorStack: errorStack
    errorTrace: errorTrace
    
    