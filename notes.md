# todo/ideas

#### find
- *search in multiple files*
- keep command+e search string longer
- highlight while entering
- display number of matches somewhere

#### search
- insert salter headers
- output search end
- make search results clickable
- make search results editable
- make search results keyboard navigatable

#### editor
- *autocomplete*
    - from buffer
    - from similar files
- alt-click: jump to definition
- check undo (merges too much?)
- save cursors/selection/scroll before reloading window
- don't clear undo buffer on save?
- save backup files?
- history of file locations
- make special stuff file type dependent
    - eg. add * to surround characters for md
    - comment line characters

#### editing
- *trim indentation spaces when joining lines*
- fancy close terminal, commandline or on esc when no highlight is canceled
- delete forward swallows spaces?
- on second command+e: select including leading @
- #< to add salter header of next word
- when pasting text at indent level, remove leading space columns
- *align cursors with inserting spaces when ctrl+alt+right*
- *ctrl+command+/  align cursors block*
- *insert newline when pasting and cursor at start of line*
- *indent one level more when inserting newline ...*
    - after =>, -> 
    - when next line is indented one level more
- dbg "class.method arg: #{arg}, ..."
- fix surround at end of line
- command-enter: deselect, insert newline, indent, and single cursor

#### cursors
- *remember last cursor*
- *highlight last cursor*
- highlight cursor line(s?)
- insert spaces when inserting at virtual cursors
- *paste multiple lines into multiple selections/cursors*

#### open
- don't select recent when pwd was changed
- show relative path when navigating in history

#### terminal
- limit history length
- *output command*
- *alias*
- *ansihtml*
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
- help (shortcuts)
- save window positions as layouts
- bracket matching
- git status in gutter?
- show invisbles (spaces,tabs,etc)
- shortcut for renaming file
- tail -f mode
- markdown mode (replace - with ●)
- cosmetic
    - fix highlight rounded borders     
    