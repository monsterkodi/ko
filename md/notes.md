# todo/ideas

- fix|test search result editing
- refactor ranges

- other windows in titlebar
- add javascript methods to indexer at startup (eg. getOwnPropertyNames, Object, Array, etc)
- fix triple quote input|delete

- macro pref(s) to show prefs
- fix broken history in prefs

- source maps (konrad?)
- set breakpoints in electron

- fix shift click whith multiple selections 
- highlights:
    - unhighlight words when cursor moves outside word highlights
    - highlight selection when single selection is set

- list actions in help macro
- check large file performance
- make stickySelection mode more visible (show commandline?)
- set and restore cursors when search saves

- macro to list project|pkg dirs

- limit size of range for bracket matching 

#### editing
- rectangular text selection via mouse
- double click into selection: remove from selection when mod == ctrl 
- don't scroll when no new range added with command+d
- delete forward swallows spaces?
- when pasting text at indent level, remove leading space columns
- multicursors and indent when pasting multiple lines at single cursor in col > 0
- update cursor positions on foreign changes

#### editor
- fix horizontal scrolling
- jump to file (include|path)

#### commands
- ls (color-ls + meta?)
- tree?
- tabs?
- cat images?

#### terminal
- fix broken syntax highlighting when editing

#### nice to have
- git status in numbers
- dirty status in window list
- navigation overview as columns of minimaps (ctrl+alt+esc|up|down)
- resizable minimap
- shortcut for renaming file
- clean empty buffers on open file
- save window positions as layouts
- tail -f mode
    