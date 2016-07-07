# todo/ideas

### file state
- save backup files?
- don't clear undo buffer on save?

#### search
- output search end?
- fix broken syntax highlighting when editing

#### autocomplete
- *autocomplete from similar files*
- *make autocomplete work with multicursors*
- fix editing scraps

#### windows
- cycle through windows command: windows list
- list buffers when clicking buffer number in titlebar

#### editor
- *alt-click: jump to definition*
- save and restore scrollX/Left
- check undo (merges too much?)
- make special stuff file type dependent
    - eg. add * to surround characters for md

#### editing
- *align cursors with inserting spaces when ctrl+alt+right*
- *ctrl+command+/  align cursors block*
- *dbg "class.method arg: #{arg}, ..."*
- *multicursors delete backwards over line boundaries only if command is down*
- invert selection (command+i, select full lines without cursors/selections)
- #< to add salter header of next word
- no surround for ' inside words
- insert spaces when pasting into multicursors
- select continuous,rectangular ranges with command+shift+M 
- remove from selection when alt/ctrl is down?
- don't scroll when no new range added with command+d
- delete forward swallows spaces?
- on second command+e: select including leading @ or surrounding '""'
- when pasting text at indent level, remove leading space columns
- multicursors when pasting multiple lines at col > 0
- indent more when inserting newline and next line is indented more?
- move mainCursor to leftmost/rightmost cursor in its line on 'left'/'right' actions

#### open
- command-p alias: -n for previuous files
- show relative path when navigating in history
- resolve environment variables

#### terminal
- *alias*
- *ansihtml*
- fix minimap update when deleting lines
- fix escape
- autocomplete
    - history
    - commands
    - dirs and files
    - /usr/local/bin, /usr/bin and /bin
- number history output and add !(n) command
- font zoom
      
#### logview
- font zoom
      
#### minimap 
- show selections, highlights and cursors

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
    