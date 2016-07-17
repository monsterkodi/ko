# todo/ideas

- *history overview as columns of minimaps* ctrl+alt+esc|up|down

- *jump to file (require|path)*
- *jump to list when multiple matches*
- display dirty status in window list

#### indexer
- *keep index up to date when file changes*

#### open
- show relative path when navigating in history
- resolve environment variables
- shared recent files of stacked windows

#### tool
- measure 
- color

#### macro
- *require*

#### file state
- save backup files?
- don't clear undo buffer on save?

#### search
- fix broken syntax highlighting when editing

#### editor
- save and restore scrollX/Left
- check undo (merges too much?)
- make special stuff file type dependent
    - eg. add * to surround characters for md

#### editing
- autocomplete navigate backwards from bottom
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

#### terminal
- *autocomplete*
    - history
    - commands
    - dirs and files
    - /usr/local/bin, /usr/bin and /bin
- number history output and add !(n) command

#### commands
- *autocomplete*
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
- git status in numbers
- shortcut for renaming file
- tail -f mode
    