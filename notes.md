# todo/ideas

#### find
- **search in multiple files**
- **scroll find result to top of view**
- escape dots in search string
- highlight while entering

#### editor
- autocomple
    - from buffer
    - from similar files

#### open
- fix click
- don't select recent when pwd was changed
- fix selection index of last file 

#### terminal
- *ansihtml*
- autocomplete
    - dirs and files
    - /usr/local/bin, /usr/bin and /bin
      
#### misc    
- command-enter: deselect, insert newline, indent, and single cursor
- comment line characters per filetype    
- remember scroll positions per file
    
#### cursors
- remember last cursor
- highlight last cursor
- highlight cursor line(s?)
- insert spaces when inserting at virtual cursors
- paste multiple lines into multiple selections/cursors

#### selection
- fix selection after comment lines
- two selection modes
- active (cursor inside)
- passive (cursor movement won't destroy, but next selection will)
- restore cursor and scroll
- on watcher reload
- on save/saveAs reload
- shift move cursor down
- extend selection to end of line if previous line is fully selected
    
#### editing
- dont switch to multicursors on shift-right/left
- insert newline if pasting fully selected lines
- indent one level more when inserting newline ...
    - after =>, -> 
    - when next line is indented one level more
- surround selection with #{} if inside string
    - autoconvert '' to "" when #{} entered
- dbg "class.method arg: #{arg}, ..."
- history of file locations

#### minimap 
- shift drag: extend selection
- command drag: don't clear selection and don't single select
- more linear scrolling when dragging

#### syntax
- fix md
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
- bracket matching
- git status in gutter?
- show invisbles (spaces,tabs,etc)
- history,console,terminal
- shortcut for renaming file
- pin
     - command
     - shortcut
- tail -f mode
- markdown mode (replace - with ●)
- cosmetic
  - fix highlight rounded borders     