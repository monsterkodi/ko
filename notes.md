# todo/ideas

*replace prefs with nconf?*

#### find
- *keep command+e search string longer*
- display number of matches somewhere

#### search
- *make search results clickable*
- insert salter headers
- output search end
- make search results editable
- make search results keyboard navigatable

#### windows
- cycle through windows command: windows list
- *window id in titlebar*
- command+n to switch to window with id n
- recent files in titlebar?

#### editor
- *autocomplete from similar files*
- *alt-click: jump to definition*
- *send changes between windows*
- *store unsaved changes in prefs*
- check undo (merges too much?)
- don't clear undo buffer on save?
- save backup files?
- history of file locations
- make special stuff file type dependent
    - eg. add * to surround characters for md
    - comment line characters (# or //)

#### editing
- *#< to add salter header of next word*
- *align cursors with inserting spaces when ctrl+alt+right*
- *ctrl+command+/  align cursors block*
- *dbg "class.method arg: #{arg}, ..."*
- *delete backwards over line boundaries only if command is down*
- clamp cursors after pasting
- select continuous,rectangular ranges with command+shift+M 
- remove from selection when alt/ctrl is down?
- make autocomplete work with multicursors
- command+d activates multicursors
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
- *when navigating, don't filter files in @dir*
- command-p alias: -n for previuous files
- show relative path when navigating in history

#### terminal
- *output command*
- *alias*
- *ansihtml*
- limit history length
- add special column (on top of numbers) for input marker and search result lines
- autocomplete
    - dirs and files
    - /usr/local/bin, /usr/bin and /bin
- number history output and add !(n) command
- font zoom
      
#### logview
- font zoom
      
#### minimap
- show selections, highlights and cursors
    
#### selection
- two selection modes
    - active (cursor inside)
    - passive (cursor movement won't destroy, but next selection will)
- shift move cursor down
    
#### minimap 
- shift drag: extend selection
- command drag: don't clear selection and don't single select

#### syntax
- pug, html, js, bash
- look at hashbang if no extname

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
    