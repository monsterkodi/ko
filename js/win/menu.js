// koffee 1.19.0

/*
00     00  00000000  000   000  000   000
000   000  000       0000  000  000   000
000000000  0000000   000 0 000  000   000
000 0 000  000       000  0000  000   000
000   000  00000000  000   000   0000000
 */
var Macro, Syntax, Transform, _, filelist, getMenu, klog, menu, os, post, ref, slash, win;

ref = require('kxk'), _ = ref._, filelist = ref.filelist, klog = ref.klog, os = ref.os, post = ref.post, slash = ref.slash, win = ref.win;

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
    if (_.isFunction(template.hasOwnProperty)) {
        template = _.cloneDeep(template);
    } else {
        klog('no own property?', typeof template, template);
        template = {};
    }
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVudS5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi9jb2ZmZWUvd2luIiwic291cmNlcyI6WyJtZW51LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQTs7QUFRQSxNQUE4QyxPQUFBLENBQVEsS0FBUixDQUE5QyxFQUFFLFNBQUYsRUFBSyx1QkFBTCxFQUFlLGVBQWYsRUFBcUIsV0FBckIsRUFBeUIsZUFBekIsRUFBK0IsaUJBQS9CLEVBQXNDOztBQUV0QyxNQUFBLEdBQVksT0FBQSxDQUFRLGtCQUFSOztBQUNaLFNBQUEsR0FBWSxPQUFBLENBQVEsNkJBQVI7O0FBQ1osS0FBQSxHQUFZLE9BQUEsQ0FBUSxtQkFBUjs7QUFFWixPQUFBLEdBQVUsU0FBQyxRQUFELEVBQVcsSUFBWDtBQUVOLFFBQUE7QUFBQSxTQUFBLDBDQUFBOztRQUNJLElBQUcsSUFBSSxDQUFDLElBQUwsS0FBYSxJQUFoQjtBQUNJLG1CQUFPLEtBRFg7O0FBREo7QUFGTTs7QUFNVixJQUFBLEdBQU8sU0FBQyxRQUFEO0FBRUgsUUFBQTtJQUFBLElBQUcsQ0FBQyxDQUFDLFVBQUYsQ0FBYSxRQUFRLENBQUMsY0FBdEIsQ0FBSDtRQUNJLFFBQUEsR0FBVyxDQUFDLENBQUMsU0FBRixDQUFZLFFBQVosRUFEZjtLQUFBLE1BQUE7UUFHSSxJQUFBLENBQUssa0JBQUwsRUFBd0IsT0FBTyxRQUEvQixFQUEwQyxRQUExQztRQUNBLFFBQUEsR0FBVyxHQUpmOztJQU1BLFdBQUEsR0FBYyxRQUFBLENBQVMsS0FBSyxDQUFDLElBQU4sQ0FBVyxTQUFYLEVBQXNCLG1CQUF0QixDQUFUO0lBQ2QsT0FBQSxHQUFVO1FBQUEsSUFBQSxFQUFNLEVBQU47O0lBRVYsUUFBQSxHQUFXO0FBQ1gsU0FBQSw2Q0FBQTs7UUFDSSxZQUFZLEtBQUssQ0FBQyxHQUFOLENBQVUsVUFBVixFQUFBLEtBQThCLElBQTlCLElBQUEsSUFBQSxLQUFtQyxRQUEvQztBQUFBLHFCQUFBOztR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IyMjXG4wMCAgICAgMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuMDAwICAgMDAwICAwMDAgICAgICAgMDAwMCAgMDAwICAwMDAgICAwMDBcbjAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMCAwIDAwMCAgMDAwICAgMDAwXG4wMDAgMCAwMDAgIDAwMCAgICAgICAwMDAgIDAwMDAgIDAwMCAgIDAwMFxuMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMFxuIyMjXG5cbnsgXywgZmlsZWxpc3QsIGtsb2csIG9zLCBwb3N0LCBzbGFzaCwgd2luIH0gPSByZXF1aXJlICdreGsnXG5cblN5bnRheCAgICA9IHJlcXVpcmUgJy4uL2VkaXRvci9zeW50YXgnXG5UcmFuc2Zvcm0gPSByZXF1aXJlICcuLi9lZGl0b3IvYWN0aW9ucy90cmFuc2Zvcm0nXG5NYWNybyAgICAgPSByZXF1aXJlICcuLi9jb21tYW5kcy9tYWNybydcblxuZ2V0TWVudSA9ICh0ZW1wbGF0ZSwgbmFtZSkgLT5cblxuICAgIGZvciBpdGVtIGluIHRlbXBsYXRlXG4gICAgICAgIGlmIGl0ZW0udGV4dCA9PSBuYW1lXG4gICAgICAgICAgICByZXR1cm4gaXRlbVxuXG5tZW51ID0gKHRlbXBsYXRlKSAtPlxuXG4gICAgaWYgXy5pc0Z1bmN0aW9uIHRlbXBsYXRlLmhhc093blByb3BlcnR5XG4gICAgICAgIHRlbXBsYXRlID0gXy5jbG9uZURlZXAgdGVtcGxhdGVcbiAgICBlbHNlXG4gICAgICAgIGtsb2cgJ25vIG93biBwcm9wZXJ0eT8nIHR5cGVvZih0ZW1wbGF0ZSksIHRlbXBsYXRlXG4gICAgICAgIHRlbXBsYXRlID0ge31cblxuICAgIGFjdGlvbkZpbGVzID0gZmlsZWxpc3Qgc2xhc2guam9pbiBfX2Rpcm5hbWUsICcuLi9lZGl0b3IvYWN0aW9ucydcbiAgICBzdWJtZW51ID0gTWlzYzogW11cblxuICAgIEVkaXRNZW51ID0gW11cbiAgICBmb3IgYWN0aW9uRmlsZSBpbiBhY3Rpb25GaWxlc1xuICAgICAgICBjb250aW51ZSBpZiBzbGFzaC5leHQoYWN0aW9uRmlsZSkgbm90IGluIFsnanMnICdjb2ZmZWUnXVxuICAgICAgICBhY3Rpb25zID0gcmVxdWlyZSBhY3Rpb25GaWxlXG4gICAgICAgIGZvciBrZXksdmFsdWUgb2YgYWN0aW9uc1xuICAgICAgICAgICAgbWVudU5hbWUgPSAnTWlzYydcbiAgICAgICAgICAgIGlmIGtleSA9PSAnYWN0aW9ucydcbiAgICAgICAgICAgICAgICBpZiB2YWx1ZVsnbWVudSddP1xuICAgICAgICAgICAgICAgICAgICBtZW51TmFtZSA9IHZhbHVlWydtZW51J11cbiAgICAgICAgICAgICAgICAgICAgc3VibWVudVttZW51TmFtZV0gPz0gW11cbiAgICAgICAgICAgICAgICBmb3Igayx2IG9mIHZhbHVlXG4gICAgICAgICAgICAgICAgICAgIGlmIHYubmFtZSBhbmQgdi5jb21ib1xuICAgICAgICAgICAgICAgICAgICAgICAgbWVudUFjdGlvbiA9IChjKSAtPiAoaSx3aW4pIC0+IHBvc3QudG9XaW4gd2luLmlkLCAnbWVudUFjdGlvbicgY1xuICAgICAgICAgICAgICAgICAgICAgICAgY29tYm8gPSB2LmNvbWJvXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBvcy5wbGF0Zm9ybSgpICE9ICdkYXJ3aW4nIGFuZCB2LmFjY2VsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tYm8gPSB2LmFjY2VsXG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtID1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiAgIHYubmFtZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjY2VsOiAgY29tYm9cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIHYubWVudT9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWJtZW51W3YubWVudV0gPz0gW11cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIHYuc2VwYXJhdG9yXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VibWVudVt2Lm1lbnUgPyBtZW51TmFtZV0ucHVzaCB0ZXh0OiAnJ1xuICAgICAgICAgICAgICAgICAgICAgICAgc3VibWVudVt2Lm1lbnUgPyBtZW51TmFtZV0ucHVzaCBpdGVtXG5cbiAgICBmb3Iga2V5LCBtZW51IG9mIHN1Ym1lbnVcbiAgICAgICAgRWRpdE1lbnUucHVzaCB0ZXh0OmtleSwgbWVudTptZW51XG5cbiAgICBlZGl0TWVudSA9IGdldE1lbnUgdGVtcGxhdGUsICdFZGl0J1xuICAgIGVkaXRNZW51Lm1lbnUgPSBlZGl0TWVudS5tZW51LmNvbmNhdCBFZGl0TWVudVxuXG4gICAgTWFjcm9NZW51ID0gWyB0ZXh0OidNYWNybycgY29tYm86J2NvbW1hbmQrbScgYWNjZWw6J2N0cmwrbScgY29tbWFuZDonbWFjcm8nIF1cbiAgICBmb3IgbWFjcm8gaW4gTWFjcm8ubWFjcm9OYW1lc1xuICAgICAgICBNYWNyb01lbnUucHVzaFxuICAgICAgICAgICAgdGV4dDogICBtYWNyb1xuICAgICAgICAgICAgYWN0YXJnOiBtYWNyb1xuICAgICAgICAgICAgYWN0aW9uOiAnZG9NYWNybydcblxuICAgIGNvbW1hbmRNZW51ID0gZ2V0TWVudSB0ZW1wbGF0ZSwgJ0NvbW1hbmQnXG4gICAgY29tbWFuZE1lbnUubWVudSA9IGNvbW1hbmRNZW51Lm1lbnUuY29uY2F0IHRleHQ6J01hY3JvJyBtZW51Ok1hY3JvTWVudVxuXG4gICAgVHJhbnNmb3JtTWVudSA9IFtdXG4gICAgZm9yIHRyYW5zZm9ybU1lbnUsIHRyYW5zZm9ybUxpc3Qgb2YgVHJhbnNmb3JtLlRyYW5zZm9ybS50cmFuc2Zvcm1NZW51c1xuICAgICAgICB0cmFuc2Zvcm1TdWJtZW51ID0gW11cbiAgICAgICAgZm9yIHRyYW5zZm9ybSBpbiB0cmFuc2Zvcm1MaXN0XG4gICAgICAgICAgICB0cmFuc2Zvcm1TdWJtZW51LnB1c2hcbiAgICAgICAgICAgICAgICB0ZXh0OiAgIHRyYW5zZm9ybVxuICAgICAgICAgICAgICAgIGFjdGFyZzogdHJhbnNmb3JtXG4gICAgICAgICAgICAgICAgYWN0aW9uOiAnZG9UcmFuc2Zvcm0nXG5cbiAgICAgICAgVHJhbnNmb3JtTWVudS5wdXNoXG4gICAgICAgICAgICB0ZXh0OiB0cmFuc2Zvcm1NZW51XG4gICAgICAgICAgICBtZW51OiB0cmFuc2Zvcm1TdWJtZW51XG5cbiAgICBlZGl0TWVudS5tZW51ID0gZWRpdE1lbnUubWVudS5jb25jYXQgdGV4dDonVHJhbnNmb3JtJyBtZW51OlRyYW5zZm9ybU1lbnVcblxuICAgIHRlbXBsYXRlXG5cbm1vZHVsZS5leHBvcnRzID0gbWVudVxuIl19
//# sourceURL=../../coffee/win/menu.coffee