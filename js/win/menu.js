// koffee 1.12.0

/*
00     00  00000000  000   000  000   000
000   000  000       0000  000  000   000
000000000  0000000   000 0 000  000   000
000 0 000  000       000  0000  000   000
000   000  00000000  000   000   0000000
 */
var Macro, Syntax, Transform, _, filelist, getMenu, menu, os, post, ref, slash, win;

ref = require('kxk'), _ = ref._, filelist = ref.filelist, os = ref.os, post = ref.post, slash = ref.slash, win = ref.win;

Syntax = require('../editor/syntax');

Transform = require('../editor/actions/transform');

Macro = require('../commands/macro');

getMenu = function(template, name) {
    var item, j, len;
    for (j = 0, len = template.length; j < len; j++) {
        item = template[j];
        if (item.text === name) {
            return item;
        }
    }
};

menu = function(template) {
    var EditMenu, MacroMenu, TransformMenu, actionFile, actionFiles, actions, combo, commandMenu, editMenu, item, j, k, key, l, len, len1, len2, m, macro, menuAction, menuName, name1, ref1, ref2, ref3, ref4, ref5, submenu, transform, transformList, transformMenu, transformSubmenu, v, value;
    template = _.cloneDeep(template);
    actionFiles = filelist(slash.join(__dirname, '../editor/actions'));
    submenu = {
        Misc: []
    };
    EditMenu = [];
    for (j = 0, len = actionFiles.length; j < len; j++) {
        actionFile = actionFiles[j];
        if ((ref1 = slash.ext(actionFile)) !== 'js' && ref1 !== 'coffee') {
            continue;
        }
        actions = require(actionFile);
        for (key in actions) {
            value = actions[key];
            menuName = 'Misc';
            if (key === 'actions') {
                if (value['menu'] != null) {
                    menuName = value['menu'];
                    if (submenu[menuName] != null) {
                        submenu[menuName];
                    } else {
                        submenu[menuName] = [];
                    }
                }
                for (k in value) {
                    v = value[k];
                    if (v.name && v.combo) {
                        menuAction = function(c) {
                            return function(i, win) {
                                return post.toWin(win.id, 'menuAction', c);
                            };
                        };
                        combo = v.combo;
                        if (os.platform() !== 'darwin' && v.accel) {
                            combo = v.accel;
                        }
                        item = {
                            text: v.name,
                            accel: combo
                        };
                        if (v.menu != null) {
                            if (submenu[name1 = v.menu] != null) {
                                submenu[name1];
                            } else {
                                submenu[name1] = [];
                            }
                        }
                        if (v.separator) {
                            submenu[(ref2 = v.menu) != null ? ref2 : menuName].push({
                                text: ''
                            });
                        }
                        submenu[(ref3 = v.menu) != null ? ref3 : menuName].push(item);
                    }
                }
            }
        }
    }
    for (key in submenu) {
        menu = submenu[key];
        EditMenu.push({
            text: key,
            menu: menu
        });
    }
    editMenu = getMenu(template, 'Edit');
    editMenu.menu = editMenu.menu.concat(EditMenu);
    MacroMenu = [
        {
            text: 'Macro',
            combo: 'command+m',
            accel: 'ctrl+m',
            command: 'macro'
        }
    ];
    ref4 = Macro.macroNames;
    for (l = 0, len1 = ref4.length; l < len1; l++) {
        macro = ref4[l];
        MacroMenu.push({
            text: macro,
            actarg: macro,
            action: 'doMacro'
        });
    }
    commandMenu = getMenu(template, 'Command');
    commandMenu.menu = commandMenu.menu.concat({
        text: 'Macro',
        menu: MacroMenu
    });
    TransformMenu = [];
    ref5 = Transform.Transform.transformMenus;
    for (transformMenu in ref5) {
        transformList = ref5[transformMenu];
        transformSubmenu = [];
        for (m = 0, len2 = transformList.length; m < len2; m++) {
            transform = transformList[m];
            transformSubmenu.push({
                text: transform,
                actarg: transform,
                action: 'doTransform'
            });
        }
        TransformMenu.push({
            text: transformMenu,
            menu: transformSubmenu
        });
    }
    editMenu.menu = editMenu.menu.concat({
        text: 'Transform',
        menu: TransformMenu
    });
    return template;
};

module.exports = menu;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVudS5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi9jb2ZmZWUvd2luIiwic291cmNlcyI6WyJtZW51LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQTs7QUFRQSxNQUF3QyxPQUFBLENBQVEsS0FBUixDQUF4QyxFQUFFLFNBQUYsRUFBSyx1QkFBTCxFQUFlLFdBQWYsRUFBbUIsZUFBbkIsRUFBeUIsaUJBQXpCLEVBQWdDOztBQUVoQyxNQUFBLEdBQVksT0FBQSxDQUFRLGtCQUFSOztBQUNaLFNBQUEsR0FBWSxPQUFBLENBQVEsNkJBQVI7O0FBQ1osS0FBQSxHQUFZLE9BQUEsQ0FBUSxtQkFBUjs7QUFFWixPQUFBLEdBQVUsU0FBQyxRQUFELEVBQVcsSUFBWDtBQUVOLFFBQUE7QUFBQSxTQUFBLDBDQUFBOztRQUNJLElBQUcsSUFBSSxDQUFDLElBQUwsS0FBYSxJQUFoQjtBQUNJLG1CQUFPLEtBRFg7O0FBREo7QUFGTTs7QUFNVixJQUFBLEdBQU8sU0FBQyxRQUFEO0FBRUgsUUFBQTtJQUFBLFFBQUEsR0FBVyxDQUFDLENBQUMsU0FBRixDQUFZLFFBQVo7SUFFWCxXQUFBLEdBQWMsUUFBQSxDQUFTLEtBQUssQ0FBQyxJQUFOLENBQVcsU0FBWCxFQUFzQixtQkFBdEIsQ0FBVDtJQUNkLE9BQUEsR0FBVTtRQUFBLElBQUEsRUFBTSxFQUFOOztJQUVWLFFBQUEsR0FBVztBQUNYLFNBQUEsNkNBQUE7O1FBQ0ksWUFBWSxLQUFLLENBQUMsR0FBTixDQUFVLFVBQVYsRUFBQSxLQUE4QixJQUE5QixJQUFBLElBQUEsS0FBbUMsUUFBL0M7QUFBQSxxQkFBQTs7UUFDQSxPQUFBLEdBQVUsT0FBQSxDQUFRLFVBQVI7QUFDVixhQUFBLGNBQUE7O1lBQ0ksUUFBQSxHQUFXO1lBQ1gsSUFBRyxHQUFBLEtBQU8sU0FBVjtnQkFDSSxJQUFHLHFCQUFIO29CQUNJLFFBQUEsR0FBVyxLQUFNLENBQUEsTUFBQTs7d0JBQ2pCLE9BQVEsQ0FBQSxRQUFBOzt3QkFBUixPQUFRLENBQUEsUUFBQSxJQUFhO3FCQUZ6Qjs7QUFHQSxxQkFBQSxVQUFBOztvQkFDSSxJQUFHLENBQUMsQ0FBQyxJQUFGLElBQVcsQ0FBQyxDQUFDLEtBQWhCO3dCQUNJLFVBQUEsR0FBYSxTQUFDLENBQUQ7bUNBQU8sU0FBQyxDQUFELEVBQUcsR0FBSDt1Q0FBVyxJQUFJLENBQUMsS0FBTCxDQUFXLEdBQUcsQ0FBQyxFQUFmLEVBQW1CLFlBQW5CLEVBQWdDLENBQWhDOzRCQUFYO3dCQUFQO3dCQUNiLEtBQUEsR0FBUSxDQUFDLENBQUM7d0JBQ1YsSUFBRyxFQUFFLENBQUMsUUFBSCxDQUFBLENBQUEsS0FBaUIsUUFBakIsSUFBOEIsQ0FBQyxDQUFDLEtBQW5DOzRCQUNJLEtBQUEsR0FBUSxDQUFDLENBQUMsTUFEZDs7d0JBRUEsSUFBQSxHQUNJOzRCQUFBLElBQUEsRUFBUSxDQUFDLENBQUMsSUFBVjs0QkFDQSxLQUFBLEVBQVEsS0FEUjs7d0JBRUosSUFBRyxjQUFIOztnQ0FDSTs7Z0NBQUEsaUJBQW1COzZCQUR2Qjs7d0JBRUEsSUFBRyxDQUFDLENBQUMsU0FBTDs0QkFDSSxPQUFRLGtDQUFTLFFBQVQsQ0FBa0IsQ0FBQyxJQUEzQixDQUFnQztnQ0FBQSxJQUFBLEVBQU0sRUFBTjs2QkFBaEMsRUFESjs7d0JBRUEsT0FBUSxrQ0FBUyxRQUFULENBQWtCLENBQUMsSUFBM0IsQ0FBZ0MsSUFBaEMsRUFaSjs7QUFESixpQkFKSjs7QUFGSjtBQUhKO0FBd0JBLFNBQUEsY0FBQTs7UUFDSSxRQUFRLENBQUMsSUFBVCxDQUFjO1lBQUEsSUFBQSxFQUFLLEdBQUw7WUFBVSxJQUFBLEVBQUssSUFBZjtTQUFkO0FBREo7SUFHQSxRQUFBLEdBQVcsT0FBQSxDQUFRLFFBQVIsRUFBa0IsTUFBbEI7SUFDWCxRQUFRLENBQUMsSUFBVCxHQUFnQixRQUFRLENBQUMsSUFBSSxDQUFDLE1BQWQsQ0FBcUIsUUFBckI7SUFFaEIsU0FBQSxHQUFZO1FBQUU7WUFBQSxJQUFBLEVBQUssT0FBTDtZQUFhLEtBQUEsRUFBTSxXQUFuQjtZQUErQixLQUFBLEVBQU0sUUFBckM7WUFBOEMsT0FBQSxFQUFRLE9BQXREO1NBQUY7O0FBQ1o7QUFBQSxTQUFBLHdDQUFBOztRQUNJLFNBQVMsQ0FBQyxJQUFWLENBQ0k7WUFBQSxJQUFBLEVBQVEsS0FBUjtZQUNBLE1BQUEsRUFBUSxLQURSO1lBRUEsTUFBQSxFQUFRLFNBRlI7U0FESjtBQURKO0lBTUEsV0FBQSxHQUFjLE9BQUEsQ0FBUSxRQUFSLEVBQWtCLFNBQWxCO0lBQ2QsV0FBVyxDQUFDLElBQVosR0FBbUIsV0FBVyxDQUFDLElBQUksQ0FBQyxNQUFqQixDQUF3QjtRQUFBLElBQUEsRUFBSyxPQUFMO1FBQWEsSUFBQSxFQUFLLFNBQWxCO0tBQXhCO0lBRW5CLGFBQUEsR0FBZ0I7QUFDaEI7QUFBQSxTQUFBLHFCQUFBOztRQUNJLGdCQUFBLEdBQW1CO0FBQ25CLGFBQUEsaURBQUE7O1lBQ0ksZ0JBQWdCLENBQUMsSUFBakIsQ0FDSTtnQkFBQSxJQUFBLEVBQVEsU0FBUjtnQkFDQSxNQUFBLEVBQVEsU0FEUjtnQkFFQSxNQUFBLEVBQVEsYUFGUjthQURKO0FBREo7UUFNQSxhQUFhLENBQUMsSUFBZCxDQUNJO1lBQUEsSUFBQSxFQUFNLGFBQU47WUFDQSxJQUFBLEVBQU0sZ0JBRE47U0FESjtBQVJKO0lBWUEsUUFBUSxDQUFDLElBQVQsR0FBZ0IsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFkLENBQXFCO1FBQUEsSUFBQSxFQUFLLFdBQUw7UUFBaUIsSUFBQSxFQUFLLGFBQXRCO0tBQXJCO1dBRWhCO0FBL0RHOztBQWlFUCxNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAgICAgIDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbjAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAgIDAwMCAgMDAwICAgMDAwXG4wMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAgMCAwMDAgIDAwMCAgIDAwMFxuMDAwIDAgMDAwICAwMDAgICAgICAgMDAwICAwMDAwICAwMDAgICAwMDBcbjAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDBcbiMjI1xuXG57IF8sIGZpbGVsaXN0LCBvcywgcG9zdCwgc2xhc2gsIHdpbiB9ID0gcmVxdWlyZSAna3hrJ1xuXG5TeW50YXggICAgPSByZXF1aXJlICcuLi9lZGl0b3Ivc3ludGF4J1xuVHJhbnNmb3JtID0gcmVxdWlyZSAnLi4vZWRpdG9yL2FjdGlvbnMvdHJhbnNmb3JtJ1xuTWFjcm8gICAgID0gcmVxdWlyZSAnLi4vY29tbWFuZHMvbWFjcm8nXG5cbmdldE1lbnUgPSAodGVtcGxhdGUsIG5hbWUpIC0+XG5cbiAgICBmb3IgaXRlbSBpbiB0ZW1wbGF0ZVxuICAgICAgICBpZiBpdGVtLnRleHQgPT0gbmFtZVxuICAgICAgICAgICAgcmV0dXJuIGl0ZW1cblxubWVudSA9ICh0ZW1wbGF0ZSkgLT5cblxuICAgIHRlbXBsYXRlID0gXy5jbG9uZURlZXAgdGVtcGxhdGVcblxuICAgIGFjdGlvbkZpbGVzID0gZmlsZWxpc3Qgc2xhc2guam9pbiBfX2Rpcm5hbWUsICcuLi9lZGl0b3IvYWN0aW9ucydcbiAgICBzdWJtZW51ID0gTWlzYzogW11cblxuICAgIEVkaXRNZW51ID0gW11cbiAgICBmb3IgYWN0aW9uRmlsZSBpbiBhY3Rpb25GaWxlc1xuICAgICAgICBjb250aW51ZSBpZiBzbGFzaC5leHQoYWN0aW9uRmlsZSkgbm90IGluIFsnanMnICdjb2ZmZWUnXVxuICAgICAgICBhY3Rpb25zID0gcmVxdWlyZSBhY3Rpb25GaWxlXG4gICAgICAgIGZvciBrZXksdmFsdWUgb2YgYWN0aW9uc1xuICAgICAgICAgICAgbWVudU5hbWUgPSAnTWlzYydcbiAgICAgICAgICAgIGlmIGtleSA9PSAnYWN0aW9ucydcbiAgICAgICAgICAgICAgICBpZiB2YWx1ZVsnbWVudSddP1xuICAgICAgICAgICAgICAgICAgICBtZW51TmFtZSA9IHZhbHVlWydtZW51J11cbiAgICAgICAgICAgICAgICAgICAgc3VibWVudVttZW51TmFtZV0gPz0gW11cbiAgICAgICAgICAgICAgICBmb3Igayx2IG9mIHZhbHVlXG4gICAgICAgICAgICAgICAgICAgIGlmIHYubmFtZSBhbmQgdi5jb21ib1xuICAgICAgICAgICAgICAgICAgICAgICAgbWVudUFjdGlvbiA9IChjKSAtPiAoaSx3aW4pIC0+IHBvc3QudG9XaW4gd2luLmlkLCAnbWVudUFjdGlvbicgY1xuICAgICAgICAgICAgICAgICAgICAgICAgY29tYm8gPSB2LmNvbWJvXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBvcy5wbGF0Zm9ybSgpICE9ICdkYXJ3aW4nIGFuZCB2LmFjY2VsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tYm8gPSB2LmFjY2VsXG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtID1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiAgIHYubmFtZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjY2VsOiAgY29tYm9cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIHYubWVudT9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWJtZW51W3YubWVudV0gPz0gW11cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIHYuc2VwYXJhdG9yXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VibWVudVt2Lm1lbnUgPyBtZW51TmFtZV0ucHVzaCB0ZXh0OiAnJ1xuICAgICAgICAgICAgICAgICAgICAgICAgc3VibWVudVt2Lm1lbnUgPyBtZW51TmFtZV0ucHVzaCBpdGVtXG5cbiAgICBmb3Iga2V5LCBtZW51IG9mIHN1Ym1lbnVcbiAgICAgICAgRWRpdE1lbnUucHVzaCB0ZXh0OmtleSwgbWVudTptZW51XG5cbiAgICBlZGl0TWVudSA9IGdldE1lbnUgdGVtcGxhdGUsICdFZGl0J1xuICAgIGVkaXRNZW51Lm1lbnUgPSBlZGl0TWVudS5tZW51LmNvbmNhdCBFZGl0TWVudVxuXG4gICAgTWFjcm9NZW51ID0gWyB0ZXh0OidNYWNybycgY29tYm86J2NvbW1hbmQrbScgYWNjZWw6J2N0cmwrbScgY29tbWFuZDonbWFjcm8nIF1cbiAgICBmb3IgbWFjcm8gaW4gTWFjcm8ubWFjcm9OYW1lc1xuICAgICAgICBNYWNyb01lbnUucHVzaFxuICAgICAgICAgICAgdGV4dDogICBtYWNyb1xuICAgICAgICAgICAgYWN0YXJnOiBtYWNyb1xuICAgICAgICAgICAgYWN0aW9uOiAnZG9NYWNybydcblxuICAgIGNvbW1hbmRNZW51ID0gZ2V0TWVudSB0ZW1wbGF0ZSwgJ0NvbW1hbmQnXG4gICAgY29tbWFuZE1lbnUubWVudSA9IGNvbW1hbmRNZW51Lm1lbnUuY29uY2F0IHRleHQ6J01hY3JvJyBtZW51Ok1hY3JvTWVudVxuXG4gICAgVHJhbnNmb3JtTWVudSA9IFtdXG4gICAgZm9yIHRyYW5zZm9ybU1lbnUsIHRyYW5zZm9ybUxpc3Qgb2YgVHJhbnNmb3JtLlRyYW5zZm9ybS50cmFuc2Zvcm1NZW51c1xuICAgICAgICB0cmFuc2Zvcm1TdWJtZW51ID0gW11cbiAgICAgICAgZm9yIHRyYW5zZm9ybSBpbiB0cmFuc2Zvcm1MaXN0XG4gICAgICAgICAgICB0cmFuc2Zvcm1TdWJtZW51LnB1c2hcbiAgICAgICAgICAgICAgICB0ZXh0OiAgIHRyYW5zZm9ybVxuICAgICAgICAgICAgICAgIGFjdGFyZzogdHJhbnNmb3JtXG4gICAgICAgICAgICAgICAgYWN0aW9uOiAnZG9UcmFuc2Zvcm0nXG5cbiAgICAgICAgVHJhbnNmb3JtTWVudS5wdXNoXG4gICAgICAgICAgICB0ZXh0OiB0cmFuc2Zvcm1NZW51XG4gICAgICAgICAgICBtZW51OiB0cmFuc2Zvcm1TdWJtZW51XG5cbiAgICBlZGl0TWVudS5tZW51ID0gZWRpdE1lbnUubWVudS5jb25jYXQgdGV4dDonVHJhbnNmb3JtJyBtZW51OlRyYW5zZm9ybU1lbnVcblxuICAgIHRlbXBsYXRlXG5cbm1vZHVsZS5leHBvcnRzID0gbWVudVxuIl19
//# sourceURL=../../coffee/win/menu.coffee