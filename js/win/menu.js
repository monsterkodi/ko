// koffee 1.11.0

/*
00     00  00000000  000   000  000   000
000   000  000       0000  000  000   000
000000000  0000000   000 0 000  000   000
000 0 000  000       000  0000  000   000
000   000  00000000  000   000   0000000
 */
var Macro, Syntax, Transform, _, filelist, fs, getMenu, menu, os, post, ref, slash, win;

ref = require('kxk'), post = ref.post, filelist = ref.filelist, slash = ref.slash, win = ref.win, os = ref.os, fs = ref.fs, _ = ref._;

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
    var EditMenu, MacroMenu, RecentMenu, TransformMenu, actionFile, actionFiles, actions, combo, commandMenu, editMenu, f, fileMenu, fileSpan, item, j, k, key, l, len, len1, len2, len3, m, macro, menuAction, menuName, n, name1, recent, ref1, ref2, ref3, ref4, ref5, ref6, submenu, transform, transformList, transformMenu, transformSubmenu, v, value;
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
    fileSpan = function(f) {
        var span;
        if (f != null) {
            span = Syntax.spanForTextAndSyntax(slash.tilde(slash.dir(f)), 'browser');
            span += Syntax.spanForTextAndSyntax('/' + slash.base(f), 'browser');
        }
        return span;
    };
    RecentMenu = [];
    recent = (ref6 = window.state) != null ? ref6.get('recentFiles', []) : void 0;
    if (recent != null) {
        recent;
    } else {
        recent = [];
    }
    for (n = 0, len3 = recent.length; n < len3; n++) {
        f = recent[n];
        if (fs.existsSync(f)) {
            RecentMenu.unshift({
                html: fileSpan(f),
                arg: f,
                cb: function(arg) {
                    return post.emit('newTabWithFile', arg);
                }
            });
        }
    }
    if (RecentMenu.length) {
        RecentMenu.push({
            text: ''
        });
        RecentMenu.push({
            text: 'Clear List'
        });
        fileMenu = getMenu(template, 'File');
        fileMenu.menu = [
            {
                text: 'Recent',
                menu: RecentMenu
            }, {
                text: ''
            }
        ].concat(fileMenu.menu);
    }
    return template;
};

module.exports = menu;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVudS5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi9jb2ZmZWUvd2luIiwic291cmNlcyI6WyJtZW51LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQTs7QUFRQSxNQUE0QyxPQUFBLENBQVEsS0FBUixDQUE1QyxFQUFFLGVBQUYsRUFBUSx1QkFBUixFQUFrQixpQkFBbEIsRUFBeUIsYUFBekIsRUFBOEIsV0FBOUIsRUFBa0MsV0FBbEMsRUFBc0M7O0FBRXRDLE1BQUEsR0FBWSxPQUFBLENBQVEsa0JBQVI7O0FBQ1osU0FBQSxHQUFZLE9BQUEsQ0FBUSw2QkFBUjs7QUFDWixLQUFBLEdBQVksT0FBQSxDQUFRLG1CQUFSOztBQUVaLE9BQUEsR0FBVSxTQUFDLFFBQUQsRUFBVyxJQUFYO0FBRU4sUUFBQTtBQUFBLFNBQUEsMENBQUE7O1FBQ0ksSUFBRyxJQUFJLENBQUMsSUFBTCxLQUFhLElBQWhCO0FBQ0ksbUJBQU8sS0FEWDs7QUFESjtBQUZNOztBQU1WLElBQUEsR0FBTyxTQUFDLFFBQUQ7QUFFSCxRQUFBO0lBQUEsUUFBQSxHQUFXLENBQUMsQ0FBQyxTQUFGLENBQVksUUFBWjtJQUVYLFdBQUEsR0FBYyxRQUFBLENBQVMsS0FBSyxDQUFDLElBQU4sQ0FBVyxTQUFYLEVBQXNCLG1CQUF0QixDQUFUO0lBQ2QsT0FBQSxHQUFVO1FBQUEsSUFBQSxFQUFNLEVBQU47O0lBRVYsUUFBQSxHQUFXO0FBQ1gsU0FBQSw2Q0FBQTs7UUFDSSxZQUFZLEtBQUssQ0FBQyxHQUFOLENBQVUsVUFBVixFQUFBLEtBQThCLElBQTlCLElBQUEsSUFBQSxLQUFtQyxRQUEvQztBQUFBLHFCQUFBOztRQUNBLE9BQUEsR0FBVSxPQUFBLENBQVEsVUFBUjtBQUNWLGFBQUEsY0FBQTs7WUFDSSxRQUFBLEdBQVc7WUFDWCxJQUFHLEdBQUEsS0FBTyxTQUFWO2dCQUNJLElBQUcscUJBQUg7b0JBQ0ksUUFBQSxHQUFXLEtBQU0sQ0FBQSxNQUFBOzt3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QUEsR0FBTSxLQUFLLENBQUMsSUFBTixDQUFXLENBQVgsQ0FBbEMsRUFBaUQsU0FBakQsRUFGWjs7QUFHQSxlQUFPO0lBSkE7SUFNWCxVQUFBLEdBQWE7SUFFYixNQUFBLHVDQUFxQixDQUFFLEdBQWQsQ0FBa0IsYUFBbEIsRUFBZ0MsRUFBaEM7O1FBQ1Q7O1FBQUEsU0FBVTs7QUFDVixTQUFBLDBDQUFBOztRQUNJLElBQUcsRUFBRSxDQUFDLFVBQUgsQ0FBYyxDQUFkLENBQUg7WUFDSSxVQUFVLENBQUMsT0FBWCxDQUNJO2dCQUFBLElBQUEsRUFBTSxRQUFBLENBQVMsQ0FBVCxDQUFOO2dCQUNBLEdBQUEsRUFBSyxDQURMO2dCQUVBLEVBQUEsRUFBSSxTQUFDLEdBQUQ7MkJBQVMsSUFBSSxDQUFDLElBQUwsQ0FBVSxnQkFBVixFQUEyQixHQUEzQjtnQkFBVCxDQUZKO2FBREosRUFESjs7QUFESjtJQU9BLElBQUcsVUFBVSxDQUFDLE1BQWQ7UUFDSSxVQUFVLENBQUMsSUFBWCxDQUNJO1lBQUEsSUFBQSxFQUFNLEVBQU47U0FESjtRQUVBLFVBQVUsQ0FBQyxJQUFYLENBQ0k7WUFBQSxJQUFBLEVBQU0sWUFBTjtTQURKO1FBRUEsUUFBQSxHQUFXLE9BQUEsQ0FBUSxRQUFSLEVBQWtCLE1BQWxCO1FBQ1gsUUFBUSxDQUFDLElBQVQsR0FBZ0I7WUFBQztnQkFBQyxJQUFBLEVBQUssUUFBTjtnQkFBZSxJQUFBLEVBQUssVUFBcEI7YUFBRCxFQUFrQztnQkFBQyxJQUFBLEVBQUssRUFBTjthQUFsQztTQUE0QyxDQUFDLE1BQTdDLENBQW9ELFFBQVEsQ0FBQyxJQUE3RCxFQU5wQjs7V0FRQTtBQXpGRzs7QUEyRlAsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwICAgICAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4wMDAgICAwMDAgIDAwMCAgICAgICAwMDAwICAwMDAgIDAwMCAgIDAwMFxuMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwIDAgMDAwICAwMDAgICAwMDBcbjAwMCAwIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwMCAgMDAwICAgMDAwXG4wMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwXG4jIyNcblxueyBwb3N0LCBmaWxlbGlzdCwgc2xhc2gsIHdpbiwgb3MsIGZzLCBfIH0gPSByZXF1aXJlICdreGsnXG5cblN5bnRheCAgICA9IHJlcXVpcmUgJy4uL2VkaXRvci9zeW50YXgnXG5UcmFuc2Zvcm0gPSByZXF1aXJlICcuLi9lZGl0b3IvYWN0aW9ucy90cmFuc2Zvcm0nXG5NYWNybyAgICAgPSByZXF1aXJlICcuLi9jb21tYW5kcy9tYWNybydcblxuZ2V0TWVudSA9ICh0ZW1wbGF0ZSwgbmFtZSkgLT5cblxuICAgIGZvciBpdGVtIGluIHRlbXBsYXRlXG4gICAgICAgIGlmIGl0ZW0udGV4dCA9PSBuYW1lXG4gICAgICAgICAgICByZXR1cm4gaXRlbVxuXG5tZW51ID0gKHRlbXBsYXRlKSAtPlxuXG4gICAgdGVtcGxhdGUgPSBfLmNsb25lRGVlcCB0ZW1wbGF0ZVxuXG4gICAgYWN0aW9uRmlsZXMgPSBmaWxlbGlzdCBzbGFzaC5qb2luIF9fZGlybmFtZSwgJy4uL2VkaXRvci9hY3Rpb25zJ1xuICAgIHN1Ym1lbnUgPSBNaXNjOiBbXVxuXG4gICAgRWRpdE1lbnUgPSBbXVxuICAgIGZvciBhY3Rpb25GaWxlIGluIGFjdGlvbkZpbGVzXG4gICAgICAgIGNvbnRpbnVlIGlmIHNsYXNoLmV4dChhY3Rpb25GaWxlKSBub3QgaW4gWydqcycgJ2NvZmZlZSddXG4gICAgICAgIGFjdGlvbnMgPSByZXF1aXJlIGFjdGlvbkZpbGVcbiAgICAgICAgZm9yIGtleSx2YWx1ZSBvZiBhY3Rpb25zXG4gICAgICAgICAgICBtZW51TmFtZSA9ICdNaXNjJ1xuICAgICAgICAgICAgaWYga2V5ID09ICdhY3Rpb25zJ1xuICAgICAgICAgICAgICAgIGlmIHZhbHVlWydtZW51J10/XG4gICAgICAgICAgICAgICAgICAgIG1lbnVOYW1lID0gdmFsdWVbJ21lbnUnXVxuICAgICAgICAgICAgICAgICAgICBzdWJtZW51W21lbnVOYW1lXSA/PSBbXVxuICAgICAgICAgICAgICAgIGZvciBrLHYgb2YgdmFsdWVcbiAgICAgICAgICAgICAgICAgICAgaWYgdi5uYW1lIGFuZCB2LmNvbWJvXG4gICAgICAgICAgICAgICAgICAgICAgICBtZW51QWN0aW9uID0gKGMpIC0+IChpLHdpbikgLT4gcG9zdC50b1dpbiB3aW4uaWQsICdtZW51QWN0aW9uJyBjXG4gICAgICAgICAgICAgICAgICAgICAgICBjb21ibyA9IHYuY29tYm9cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIG9zLnBsYXRmb3JtKCkgIT0gJ2RhcndpbicgYW5kIHYuYWNjZWxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb21ibyA9IHYuYWNjZWxcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0gPVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6ICAgdi5uYW1lXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWNjZWw6ICBjb21ib1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgdi5tZW51P1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1Ym1lbnVbdi5tZW51XSA/PSBbXVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgdi5zZXBhcmF0b3JcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWJtZW51W3YubWVudSA/IG1lbnVOYW1lXS5wdXNoIHRleHQ6ICcnXG4gICAgICAgICAgICAgICAgICAgICAgICBzdWJtZW51W3YubWVudSA/IG1lbnVOYW1lXS5wdXNoIGl0ZW1cbiAgICAgICAgICAgICAgICAjIHN1Ym1lbnVbbWVudU5hbWVdLnB1c2ggdGV4dDogJydcblxuICAgIGZvciBrZXksIG1lbnUgb2Ygc3VibWVudVxuICAgICAgICBFZGl0TWVudS5wdXNoIHRleHQ6a2V5LCBtZW51Om1lbnVcblxuICAgIGVkaXRNZW51ID0gZ2V0TWVudSB0ZW1wbGF0ZSwgJ0VkaXQnXG4gICAgZWRpdE1lbnUubWVudSA9IGVkaXRNZW51Lm1lbnUuY29uY2F0IEVkaXRNZW51XG5cbiAgICBNYWNyb01lbnUgPSBbIHRleHQ6J01hY3JvJyBjb21ibzonY29tbWFuZCttJyBhY2NlbDonY3RybCttJyBjb21tYW5kOidtYWNybycgXVxuICAgIGZvciBtYWNybyBpbiBNYWNyby5tYWNyb05hbWVzXG4gICAgICAgIE1hY3JvTWVudS5wdXNoXG4gICAgICAgICAgICB0ZXh0OiAgIG1hY3JvXG4gICAgICAgICAgICBhY3Rhcmc6IG1hY3JvXG4gICAgICAgICAgICBhY3Rpb246ICdkb01hY3JvJ1xuXG4gICAgY29tbWFuZE1lbnUgPSBnZXRNZW51IHRlbXBsYXRlLCAnQ29tbWFuZCdcbiAgICBjb21tYW5kTWVudS5tZW51ID0gY29tbWFuZE1lbnUubWVudS5jb25jYXQgdGV4dDonTWFjcm8nIG1lbnU6TWFjcm9NZW51XG5cbiAgICBUcmFuc2Zvcm1NZW51ID0gW11cbiAgICBmb3IgdHJhbnNmb3JtTWVudSwgdHJhbnNmb3JtTGlzdCBvZiBUcmFuc2Zvcm0uVHJhbnNmb3JtLnRyYW5zZm9ybU1lbnVzXG4gICAgICAgIHRyYW5zZm9ybVN1Ym1lbnUgPSBbXVxuICAgICAgICBmb3IgdHJhbnNmb3JtIGluIHRyYW5zZm9ybUxpc3RcbiAgICAgICAgICAgIHRyYW5zZm9ybVN1Ym1lbnUucHVzaFxuICAgICAgICAgICAgICAgIHRleHQ6ICAgdHJhbnNmb3JtXG4gICAgICAgICAgICAgICAgYWN0YXJnOiB0cmFuc2Zvcm1cbiAgICAgICAgICAgICAgICBhY3Rpb246ICdkb1RyYW5zZm9ybSdcblxuICAgICAgICBUcmFuc2Zvcm1NZW51LnB1c2hcbiAgICAgICAgICAgIHRleHQ6IHRyYW5zZm9ybU1lbnVcbiAgICAgICAgICAgIG1lbnU6IHRyYW5zZm9ybVN1Ym1lbnVcblxuICAgIGVkaXRNZW51Lm1lbnUgPSBlZGl0TWVudS5tZW51LmNvbmNhdCB0ZXh0OidUcmFuc2Zvcm0nIG1lbnU6VHJhbnNmb3JtTWVudVxuXG4gICAgZmlsZVNwYW4gPSAoZikgLT5cbiAgICAgICAgaWYgZj9cbiAgICAgICAgICAgIHNwYW4gID0gU3ludGF4LnNwYW5Gb3JUZXh0QW5kU3ludGF4IHNsYXNoLnRpbGRlKHNsYXNoLmRpcihmKSksICdicm93c2VyJ1xuICAgICAgICAgICAgc3BhbiArPSBTeW50YXguc3BhbkZvclRleHRBbmRTeW50YXggJy8nICsgc2xhc2guYmFzZShmKSwgJ2Jyb3dzZXInXG4gICAgICAgIHJldHVybiBzcGFuXG5cbiAgICBSZWNlbnRNZW51ID0gW11cblxuICAgIHJlY2VudCA9IHdpbmRvdy5zdGF0ZT8uZ2V0ICdyZWNlbnRGaWxlcycgW11cbiAgICByZWNlbnQgPz0gW11cbiAgICBmb3IgZiBpbiByZWNlbnRcbiAgICAgICAgaWYgZnMuZXhpc3RzU3luYyBmXG4gICAgICAgICAgICBSZWNlbnRNZW51LnVuc2hpZnRcbiAgICAgICAgICAgICAgICBodG1sOiBmaWxlU3BhbiBmXG4gICAgICAgICAgICAgICAgYXJnOiBmXG4gICAgICAgICAgICAgICAgY2I6IChhcmcpIC0+IHBvc3QuZW1pdCAnbmV3VGFiV2l0aEZpbGUnIGFyZ1xuXG4gICAgaWYgUmVjZW50TWVudS5sZW5ndGhcbiAgICAgICAgUmVjZW50TWVudS5wdXNoXG4gICAgICAgICAgICB0ZXh0OiAnJ1xuICAgICAgICBSZWNlbnRNZW51LnB1c2hcbiAgICAgICAgICAgIHRleHQ6ICdDbGVhciBMaXN0J1xuICAgICAgICBmaWxlTWVudSA9IGdldE1lbnUgdGVtcGxhdGUsICdGaWxlJ1xuICAgICAgICBmaWxlTWVudS5tZW51ID0gW3t0ZXh0OidSZWNlbnQnIG1lbnU6UmVjZW50TWVudX0sIHt0ZXh0OicnfV0uY29uY2F0IGZpbGVNZW51Lm1lbnVcblxuICAgIHRlbXBsYXRlXG5cbm1vZHVsZS5leHBvcnRzID0gbWVudVxuIl19
//# sourceURL=../../coffee/win/menu.coffee