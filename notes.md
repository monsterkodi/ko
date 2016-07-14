# todo/ideas

### file state
- save backup files?
- don't clear undo buffer on save?

#### search
- fix broken syntax highlighting when editing

#### windows
- list buffers when clicking buffer number in titlebar

#### editor
- save and restore scrollX/Left
- check undo (merges too much?)
- make special stuff file type dependent
    - eg. add * to surround characters for md

#### editing
- #< to add salter header of next word
- no surround for ' inside words
- select continuous,rectangular ranges with command+shift+M 
- remove from selection when alt/ctrl is down?
- don't scroll when no new range added with command+d
- delete forward swallows spaces?
- on second command+e: select including leading @ or surrounding '""'
- when pasting text at indent level, remove leading space columns
- multicursors when pasting multiple lines at col > 0
- indent more when inserting newline and next line is indented more?

#### open
- show relative path when navigating in history
- resolve environment variables

#### terminal
- fix escape
- autocomplete
    - history
    - commands
    - dirs and files
    - /usr/local/bin, /usr/bin and /bin
- number history output and add !(n) command
      
#### commands
- tree
- tabs?
- ls
- shell
- execute
- cat
    - images

#### nice to have
- resizable minimap
- clean empty buffers on open file
- help (shortcuts)
- save window positions as layouts
- bracket matching
- git status in gutter?
- shortcut for renaming file
- tail -f mode
- markdown mode (replace - with ●)
    