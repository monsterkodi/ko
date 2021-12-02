// koffee 1.20.0

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
        if ((ref1 = slash.ext(actionFile)) !== 'js' && ref1 !== 'coffee' && ref1 !== 'kode') {
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVudS5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi9jb2ZmZWUvd2luIiwic291cmNlcyI6WyJtZW51LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQTs7QUFRQSxNQUE4QyxPQUFBLENBQVEsS0FBUixDQUE5QyxFQUFFLFNBQUYsRUFBSyx1QkFBTCxFQUFlLGVBQWYsRUFBcUIsV0FBckIsRUFBeUIsZUFBekIsRUFBK0IsaUJBQS9CLEVBQXNDOztBQUV0QyxNQUFBLEdBQVksT0FBQSxDQUFRLGtCQUFSOztBQUNaLFNBQUEsR0FBWSxPQUFBLENBQVEsNkJBQVI7O0FBQ1osS0FBQSxHQUFZLE9BQUEsQ0FBUSxtQkFBUjs7QUFFWixPQUFBLEdBQVUsU0FBQyxRQUFELEVBQVcsSUFBWDtBQUVOLFFBQUE7QUFBQSxTQUFBLDBDQUFBOztRQUNJLElBQUcsSUFBSSxDQUFDLElBQUwsS0FBYSxJQUFoQjtBQUNJLG1CQUFPLEtBRFg7O0FBREo7QUFGTTs7QUFNVixJQUFBLEdBQU8sU0FBQyxRQUFEO0FBRUgsUUFBQTtJQUFBLElBQUcsQ0FBQyxDQUFDLFVBQUYsQ0FBYSxRQUFRLENBQUMsY0FBdEIsQ0FBSDtRQUNJLFFBQUEsR0FBVyxDQUFDLENBQUMsU0FBRixDQUFZLFFBQVosRUFEZjtLQUFBLE1BQUE7UUFHSSxJQUFBLENBQUssa0JBQUwsRUFBd0IsT0FBTyxRQUEvQixFQUEwQyxRQUExQztRQUNBLFFBQUEsR0FBVyxHQUpmOztJQU1BLFdBQUEsR0FBYyxRQUFBLENBQVMsS0FBSyxDQUFDLElBQU4sQ0FBVyxTQUFYLEVBQXNCLG1CQUF0QixDQUFUO0lBQ2QsT0FBQSxHQUFVO1FBQUEsSUFBQSxFQUFNLEVBQU47O0lBRVYsUUFBQSxHQUFXO0FBQ1gsU0FBQSw2Q0FBQTs7UUFDSSxZQUFZLEtBQUssQ0FBQyxHQUFOLENBQVUsVUFBVixFQUFBLEtBQThCLElBQTlCLElBQUEsSUFBQSxLQUFtQyxRQUFuQyxJQUFBLElBQUEsS0FB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QiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAgICAgIDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbjAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAgIDAwMCAgMDAwICAgMDAwXG4wMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAgMCAwMDAgIDAwMCAgIDAwMFxuMDAwIDAgMDAwICAwMDAgICAgICAgMDAwICAwMDAwICAwMDAgICAwMDBcbjAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDBcbiMjI1xuXG57IF8sIGZpbGVsaXN0LCBrbG9nLCBvcywgcG9zdCwgc2xhc2gsIHdpbiB9ID0gcmVxdWlyZSAna3hrJ1xuXG5TeW50YXggICAgPSByZXF1aXJlICcuLi9lZGl0b3Ivc3ludGF4J1xuVHJhbnNmb3JtID0gcmVxdWlyZSAnLi4vZWRpdG9yL2FjdGlvbnMvdHJhbnNmb3JtJ1xuTWFjcm8gICAgID0gcmVxdWlyZSAnLi4vY29tbWFuZHMvbWFjcm8nXG5cbmdldE1lbnUgPSAodGVtcGxhdGUsIG5hbWUpIC0+XG5cbiAgICBmb3IgaXRlbSBpbiB0ZW1wbGF0ZVxuICAgICAgICBpZiBpdGVtLnRleHQgPT0gbmFtZVxuICAgICAgICAgICAgcmV0dXJuIGl0ZW1cblxubWVudSA9ICh0ZW1wbGF0ZSkgLT5cblxuICAgIGlmIF8uaXNGdW5jdGlvbiB0ZW1wbGF0ZS5oYXNPd25Qcm9wZXJ0eVxuICAgICAgICB0ZW1wbGF0ZSA9IF8uY2xvbmVEZWVwIHRlbXBsYXRlXG4gICAgZWxzZVxuICAgICAgICBrbG9nICdubyBvd24gcHJvcGVydHk/JyB0eXBlb2YodGVtcGxhdGUpLCB0ZW1wbGF0ZVxuICAgICAgICB0ZW1wbGF0ZSA9IHt9XG5cbiAgICBhY3Rpb25GaWxlcyA9IGZpbGVsaXN0IHNsYXNoLmpvaW4gX19kaXJuYW1lLCAnLi4vZWRpdG9yL2FjdGlvbnMnXG4gICAgc3VibWVudSA9IE1pc2M6IFtdXG5cbiAgICBFZGl0TWVudSA9IFtdXG4gICAgZm9yIGFjdGlvbkZpbGUgaW4gYWN0aW9uRmlsZXNcbiAgICAgICAgY29udGludWUgaWYgc2xhc2guZXh0KGFjdGlvbkZpbGUpIG5vdCBpbiBbJ2pzJyAnY29mZmVlJyAna29kZSddXG4gICAgICAgIGFjdGlvbnMgPSByZXF1aXJlIGFjdGlvbkZpbGVcbiAgICAgICAgZm9yIGtleSx2YWx1ZSBvZiBhY3Rpb25zXG4gICAgICAgICAgICBtZW51TmFtZSA9ICdNaXNjJ1xuICAgICAgICAgICAgaWYga2V5ID09ICdhY3Rpb25zJ1xuICAgICAgICAgICAgICAgIGlmIHZhbHVlWydtZW51J10/XG4gICAgICAgICAgICAgICAgICAgIG1lbnVOYW1lID0gdmFsdWVbJ21lbnUnXVxuICAgICAgICAgICAgICAgICAgICBzdWJtZW51W21lbnVOYW1lXSA/PSBbXVxuICAgICAgICAgICAgICAgIGZvciBrLHYgb2YgdmFsdWVcbiAgICAgICAgICAgICAgICAgICAgaWYgdi5uYW1lIGFuZCB2LmNvbWJvXG4gICAgICAgICAgICAgICAgICAgICAgICBtZW51QWN0aW9uID0gKGMpIC0+IChpLHdpbikgLT4gcG9zdC50b1dpbiB3aW4uaWQsICdtZW51QWN0aW9uJyBjXG4gICAgICAgICAgICAgICAgICAgICAgICBjb21ibyA9IHYuY29tYm9cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIG9zLnBsYXRmb3JtKCkgIT0gJ2RhcndpbicgYW5kIHYuYWNjZWxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb21ibyA9IHYuYWNjZWxcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0gPVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6ICAgdi5uYW1lXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWNjZWw6ICBjb21ib1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgdi5tZW51P1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1Ym1lbnVbdi5tZW51XSA/PSBbXVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgdi5zZXBhcmF0b3JcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWJtZW51W3YubWVudSA/IG1lbnVOYW1lXS5wdXNoIHRleHQ6ICcnXG4gICAgICAgICAgICAgICAgICAgICAgICBzdWJtZW51W3YubWVudSA/IG1lbnVOYW1lXS5wdXNoIGl0ZW1cblxuICAgIGZvciBrZXksIG1lbnUgb2Ygc3VibWVudVxuICAgICAgICBFZGl0TWVudS5wdXNoIHRleHQ6a2V5LCBtZW51Om1lbnVcblxuICAgIGVkaXRNZW51ID0gZ2V0TWVudSB0ZW1wbGF0ZSwgJ0VkaXQnXG4gICAgZWRpdE1lbnUubWVudSA9IGVkaXRNZW51Lm1lbnUuY29uY2F0IEVkaXRNZW51XG5cbiAgICBNYWNyb01lbnUgPSBbIHRleHQ6J01hY3JvJyBjb21ibzonY29tbWFuZCttJyBhY2NlbDonY3RybCttJyBjb21tYW5kOidtYWNybycgXVxuICAgIGZvciBtYWNybyBpbiBNYWNyby5tYWNyb05hbWVzXG4gICAgICAgIE1hY3JvTWVudS5wdXNoXG4gICAgICAgICAgICB0ZXh0OiAgIG1hY3JvXG4gICAgICAgICAgICBhY3Rhcmc6IG1hY3JvXG4gICAgICAgICAgICBhY3Rpb246ICdkb01hY3JvJ1xuXG4gICAgY29tbWFuZE1lbnUgPSBnZXRNZW51IHRlbXBsYXRlLCAnQ29tbWFuZCdcbiAgICBjb21tYW5kTWVudS5tZW51ID0gY29tbWFuZE1lbnUubWVudS5jb25jYXQgdGV4dDonTWFjcm8nIG1lbnU6TWFjcm9NZW51XG5cbiAgICBUcmFuc2Zvcm1NZW51ID0gW11cbiAgICBmb3IgdHJhbnNmb3JtTWVudSwgdHJhbnNmb3JtTGlzdCBvZiBUcmFuc2Zvcm0uVHJhbnNmb3JtLnRyYW5zZm9ybU1lbnVzXG4gICAgICAgIHRyYW5zZm9ybVN1Ym1lbnUgPSBbXVxuICAgICAgICBmb3IgdHJhbnNmb3JtIGluIHRyYW5zZm9ybUxpc3RcbiAgICAgICAgICAgIHRyYW5zZm9ybVN1Ym1lbnUucHVzaFxuICAgICAgICAgICAgICAgIHRleHQ6ICAgdHJhbnNmb3JtXG4gICAgICAgICAgICAgICAgYWN0YXJnOiB0cmFuc2Zvcm1cbiAgICAgICAgICAgICAgICBhY3Rpb246ICdkb1RyYW5zZm9ybSdcblxuICAgICAgICBUcmFuc2Zvcm1NZW51LnB1c2hcbiAgICAgICAgICAgIHRleHQ6IHRyYW5zZm9ybU1lbnVcbiAgICAgICAgICAgIG1lbnU6IHRyYW5zZm9ybVN1Ym1lbnVcblxuICAgIGVkaXRNZW51Lm1lbnUgPSBlZGl0TWVudS5tZW51LmNvbmNhdCB0ZXh0OidUcmFuc2Zvcm0nIG1lbnU6VHJhbnNmb3JtTWVudVxuXG4gICAgdGVtcGxhdGVcblxubW9kdWxlLmV4cG9ydHMgPSBtZW51XG4iXX0=
//# sourceURL=../../coffee/win/menu.coffee