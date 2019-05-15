###
 0000000  000   000  0000000    
000       000 0 000  000   000  
000       000000000  000   000  
000       000   000  000   000  
 0000000  00     00  0000000    
###

{ slash, post, elem, $ } = require 'kxk'

syntax = require '../editor/syntax'

class CWD

    constructor: () ->
                    
        @elem = elem class: 'cwd'

        $('commandline-span').appendChild @elem
        
        post.on 'stash',   @stash
        post.on 'restore', @restore
        post.on 'cwdSet',  @onCwdSet
        
        # @onCwdSet window.commandline.commands.term.cwd 
        @restore()
            
    onCwdSet: (@cwd) =>
        
        text = slash.tilde @cwd
        html = syntax.spanForTextAndSyntax text, 'browser'
        @elem.innerHTML = html
    
    visible: -> @elem.style.display != 'none'

    restore: => @toggle() if window.stash.get('cwd', false) != @visible()
    stash:   => window.stash.set 'cwd', @visible()

    toggle: -> 
        @elem.style.display = @visible() and 'none' or 'unset'
        @stash()

module.exports = CWD
