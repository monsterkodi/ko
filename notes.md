# todo/ideas

#### find
- *keep command+e search string longer*
- highlight while entering
- display number of matches somewhere

#### search
- *make search results clickable*
- insert salter headers
- output search end
- make search results editable
- make search results keyboard navigatable

#### windows
- cycle through windows command: windows list

#### editor
- *send changes between windows*
- *store unsaved changes in prefs*
- *autocomplete from similar files*
- *alt-click: jump to definition*
- *make pasteable from clippo*
- check undo (merges too much?)
- don't clear undo buffer on save?
- save backup files?
- history of file locations
- make special stuff file type dependent
    - eg. add * to surround characters for md
    - comment line characters (# or //)

#### editing
- *move to indentation first on command+left*
- *#< to add salter header of next word*
- *align cursors with inserting spaces when ctrl+alt+right*
- *ctrl+command+/  align cursors block*
- *dbg "class.method arg: #{arg}, ..."*
- *command-enter: deselect, insert newline, indent, and single cursor*
- don't scroll when no new range added with command+d
- fix command+up main cursor vanishes at top
- delete forward swallows spaces?
- on second command+e: select including leading @
- when pasting text at indent level, remove leading space columns
- multicursors when pasting multiple lines at col > 0
- indent more when inserting newline and next line is indented more?
- move mainCursor to leftmost/rightmost cursor in its line on 'left'/'right' actions
- highlight cursor line(s?)

#### open
- show relative path when navigating in history

#### terminal
- *output command*
- *alias*
- *ansihtml*
- limit history length
- add special column (on top of numbers) for input marker and search result lines
- shortcuts to hide editor / center input
- autocomplete
    - dirs and files
    - /usr/local/bin, /usr/bin and /bin
- font zoom shortcut
- number history output and add !# command
      
#### logview
- font zoom shortcut
      
#### minimap
- show selections, highlights and cursors
    
#### selection
- two selection modes
- active (cursor inside)
- passive (cursor movement won't destroy, but next selection will)
- shift move cursor down
- extend selection to end of line if previous line is fully selected
    
#### minimap 
- shift drag: extend selection
- command drag: don't clear selection and don't single select
- smoother (subline offset) scrolling

#### syntax
- pug, html, js

#### commands
- tree
- tabs?
- ls
- shell
- execute
- cat
    - images

#### nice to have
- clean empty buffers on open file
- help (shortcuts)
- save window positions as layouts
- bracket matching
- git status in gutter?
- show invisbles (spaces,tabs,etc)
- shortcut for renaming file
- tail -f mode
- markdown mode (replace - with ●)
    