###
000000000   0000000   0000000
   000     000   000  000   000
   000     000000000  0000000
   000     000   000  000   000
   000     000   000  0000000
###

{ elem, kerror, post, slash, tooltip } = require 'kxk'

File    = require '../tools/file'
render  = require '../editor/render'
syntax  = require '../editor/syntax'

class Tab

    @: (@tabs, @file) ->

        @dirty = false
        @pinned = false
        @div = elem class: 'tab' text: ''
        @tabs.div.appendChild @div

        if not @file.startsWith 'untitled'
            @pkg = slash.pkg @file
            @pkg = slash.basename @pkg if @pkg?

        @update()

        post.emit 'watch' @file

    foreignChanges: (lineChanges) ->

        @foreign ?= []
        @foreign.push lineChanges
        @update()

    reload: ->

        delete @state
        @dirty = false
        @update()

    #  0000000   0000000   000   000  00000000
    # 000       000   000  000   000  000
    # 0000000   000000000   000 000   0000000
    #      000  000   000     000     000
    # 0000000   000   000      0      00000000

    saveChanges: ->

        if @state

            if @foreign?.length
                for changes in @foreign
                    for change in changes
                        switch change.change
                            when 'changed'  then @state.state = @state.state.changeLine change.doIndex, change.after
                            when 'inserted' then @state.state = @state.state.insertLine change.doIndex, change.after
                            when 'deleted'  then @state.state = @state.state.deleteLine change.doIndex

            if @state.state
                File.save @state.file, @state.state.text(), (err) =>
                    return kerror "tab.saveChanges failed #{err}" if err
                    @revert()
            else
                kerror 'tab.saveChanges -- nothing to save?'
        else
            post.emit 'saveChanges'

    setFile: (newFile) ->
        
        if not slash.samePath @file, newFile
            # klog 'tab.setFile' slash.path newFile
            @file = slash.path newFile
            post.emit 'watch' @file
            @update()
            
    #  0000000  000000000   0000000   000000000  00000000
    # 000          000     000   000     000     000
    # 0000000      000     000000000     000     0000000
    #      000     000     000   000     000     000
    # 0000000      000     000   000     000     00000000

    storeState: ->

        if window.editor.currentFile
            @state = window.editor.do.tabState()

    restoreState: ->

        return kerror 'no file in state?' @state if not @state?.file?
        window.editor.do.setTabState @state
        delete @state

    # 000   000  00000000   0000000     0000000   000000000  00000000
    # 000   000  000   000  000   000  000   000     000     000
    # 000   000  00000000   000   000  000000000     000     0000000
    # 000   000  000        000   000  000   000     000     000
    #  0000000   000        0000000    000   000     000     00000000

    update: ->

        @div.innerHTML = ''
        @div.classList.toggle 'dirty' @dirty

        sep = '●'
        sep = '■' if window.editor.newlineCharacters == '\r\n'
        @div.appendChild elem 'span' class:'dot' text:sep

        sep = "<span class='dot'>►</span>"
        @pkgDiv = elem 'span' class:'pkg' html: @pkg and (@pkg + sep) or ''
        @div.appendChild @pkgDiv

        diss = syntax.dissForTextAndSyntax slash.basename(@file), 'ko'
        name = elem 'span' class:'name' html:render.line diss, charWidth:0
        @div.appendChild name

        html = ''
        if @pinned
            html = """
            <svg width="100%" height="100%" viewBox="0 0 30 30">
                <circle cx="15" cy="12" r="4" />
                <line x1="15" y1="16"  x2="15"  y2="22" stroke-linecap="round"></line>
            </svg>
            """
        else if @tmpTab
            html = """
            <svg width="100%" height="100%" viewBox="0 0 30 30">
                <circle cx="15" cy="10" r="2" />
                <circle cx="15" cy="15" r="2" />
                <circle cx="15" cy="20" r="2" />
            </svg>
            """
                
        @div.appendChild elem class:'tabstate' html:html, click:@togglePinned

        if @file?
            diss = syntax.dissForTextAndSyntax slash.tilde(@file), 'ko'
            html = render.line diss, charWidth:0
            @tooltip = new tooltip elem:name, html:html, x:0

        @div.appendChild elem 'span' class:'dot' text:'●' if @dirty
        @

    index: -> @tabs.tabs.indexOf @
    prev:  -> @tabs.tab @index()-1 if @index() > 0
    next:  -> @tabs.tab @index()+1 if @index() < @tabs.numTabs()-1
    nextOrPrev: -> @next() ? @prev()

    close: ->

        post.emit 'unwatch' @file

        if @dirty
            @saveChanges()

        @div.remove()
        @tooltip?.del()
        post.emit 'tabClosed' @file
        @

    hidePkg: -> @pkgDiv?.style.display = 'none'
    showPkg: -> @pkgDiv?.style.display = 'initial'

    # 0000000    000  00000000   000000000  000   000
    # 000   000  000  000   000     000      000 000
    # 000   000  000  0000000       000       00000
    # 000   000  000  000   000     000        000
    # 0000000    000  000   000     000        000

    setDirty: (dirty) ->

        if @dirty != dirty
            @dirty = dirty
            if @dirty then delete @tmpTab
            @update()
        @
        
    togglePinned: =>
        
        @pinned = not @pinned
        delete @tmpTab
        @update()
        @

    # 00000000   00000000  000   000  00000000  00000000   000000000
    # 000   000  000       000   000  000       000   000     000
    # 0000000    0000000    000 000   0000000   0000000       000
    # 000   000  000          000     000       000   000     000
    # 000   000  00000000      0      00000000  000   000     000

    revert: ->

        delete @foreign
        delete @state
        @dirty = false
        @update()
        @tabs.update()
        @

    #  0000000    0000000  000000000  000  000   000   0000000   000000000  00000000
    # 000   000  000          000     000  000   000  000   000     000     000
    # 000000000  000          000     000   000 000   000000000     000     0000000
    # 000   000  000          000     000     000     000   000     000     000
    # 000   000   0000000     000     000      0      000   000     000     00000000

    activate: ->

        post.emit 'jumpToFile' file:@file
        @

    finishActivation: ->

        @setActive()

        if @state?
            @restoreState()

        if @foreign?.length
            for changes in @foreign
                window.editor.do.foreignChanges changes
            delete @foreign

        @tabs.update()
        @

    #  0000000    0000000  000000000  000  000   000  00000000
    # 000   000  000          000     000  000   000  000
    # 000000000  000          000     000   000 000   0000000
    # 000   000  000          000     000     000     000
    # 000   000   0000000     000     000      0      00000000

    isActive: -> @div.classList.contains 'active'

    setActive: ->

        if not @isActive()
            @div.classList.add 'active'
        @

    clearActive: ->

        @div.classList.remove 'active'
        @

module.exports = Tab
