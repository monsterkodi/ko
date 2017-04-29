#  0000000   0000000  000   000  00000000  00     00  00000000  
# 000       000       000   000  000       000   000  000       
# 0000000   000       000000000  0000000   000000000  0000000   
#      000  000       000   000  000       000 0 000  000       
# 0000000    0000000  000   000  00000000  000   000  00000000  

{ prefs, elem, post, path, log, $, _
} = require 'kxk'

class Scheme
    
    @toggle: (schemes = ['dark', 'bright']) ->
        
        link =$ '.scheme-link'
        currentScheme = path.basename path.dirname link.href
        
        nextSchemeIndex = ( schemes.indexOf(currentScheme) + 1) % schemes.length
        nextScheme = schemes[nextSchemeIndex]
        
        Scheme.set nextScheme
    
    @set: (scheme) ->
        
        for link in document.querySelectorAll '.scheme-link'
            css = path.basename link.href
            newlink = elem 'link', 
                href:  "css/#{scheme}/#{css}"
                rel:   'stylesheet'
                type:  'text/css'
                class: 'scheme-link'
                
            link.parentNode.replaceChild newlink, link
            
        prefs.set 'scheme', scheme    
        post.emit 'schemeChanged', scheme
        
module.exports = Scheme

