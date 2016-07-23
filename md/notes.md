# todo/ideas

- *make goto work with partial func names*
- *add cursor positions to navigation history when goto in or jumping to file*
- *open previous on second start of open command*

- *jump to file (require|path)*
- *jump to list when multiple matches*

- colorize term/coffee history

#### indexer
- *keep index up to date when (file) changes*

#### open
- *automatically start konrad in pkg dir*
- resolve environment variables
- shared recent files of stacked windows

#### editing
- select continuous, rectangular ranges with command+shift+M 
- remove from selection when alt/ctrl is down?
- don't scroll when no new range added with command+d
- delete forward swallows spaces?
- when pasting text at indent level, remove leading space columns
- multicursors and indent when pasting multiple lines at single cursor in col > 0

#### coffee syntax
- fix
    prev: -> @navigate -1    
    next: -> @navigate 1
    for i in [1...@clones.length]

#### file state
- save backup files?
- don't clear undo buffer on save?

#### editor
- save and restore scrollX/Left
- check undo (merges too much?)

#### terminal
- *autocomplete dirs and files*

#### commands
- ls (color-ls + meta?)
- tree?
- tabs?
- cat images?

#### search
- fix broken syntax highlighting when editing

#### tool
- measure
- color

#### nice to have
- dirty status in window list
- navigation overview as columns of minimaps (ctrl+alt+esc|up|down)
- resizable minimap
- clean empty buffers on open file
- help (shortcuts)
- save window positions as layouts
- bracket matching
- git status in numbers
- shortcut for renaming file
- tail -f mode
    