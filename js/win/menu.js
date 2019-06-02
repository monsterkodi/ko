// koffee 0.56.0

/*
00     00  00000000  000   000  000   000
000   000  000       0000  000  000   000
000000000  0000000   000 0 000  000   000
000 0 000  000       000  0000  000   000
000   000  00000000  000   000   0000000
 */
var Macro, Syntax, Transform, _, filelist, fs, getMenu, menu, os, post, ref, slash;

ref = require('kxk'), filelist = ref.filelist, post = ref.post, slash = ref.slash, os = ref.os, fs = ref.fs, _ = ref._;

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
                submenu[menuName].push({
                    text: ''
                });
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVudS5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUE7O0FBUUEsTUFBdUMsT0FBQSxDQUFRLEtBQVIsQ0FBdkMsRUFBRSx1QkFBRixFQUFZLGVBQVosRUFBa0IsaUJBQWxCLEVBQXlCLFdBQXpCLEVBQTZCLFdBQTdCLEVBQWlDOztBQUVqQyxNQUFBLEdBQVksT0FBQSxDQUFRLGtCQUFSOztBQUNaLFNBQUEsR0FBWSxPQUFBLENBQVEsNkJBQVI7O0FBQ1osS0FBQSxHQUFZLE9BQUEsQ0FBUSxtQkFBUjs7QUFFWixPQUFBLEdBQVUsU0FBQyxRQUFELEVBQVcsSUFBWDtBQUVOLFFBQUE7QUFBQSxTQUFBLDBDQUFBOztRQUNJLElBQUcsSUFBSSxDQUFDLElBQUwsS0FBYSxJQUFoQjtBQUNJLG1CQUFPLEtBRFg7O0FBREo7QUFGTTs7QUFNVixJQUFBLEdBQU8sU0FBQyxRQUFEO0FBRUgsUUFBQTtJQUFBLFFBQUEsR0FBVyxDQUFDLENBQUMsU0FBRixDQUFZLFFBQVo7SUFFWCxXQUFBLEdBQWMsUUFBQSxDQUFTLEtBQUssQ0FBQyxJQUFOLENBQVcsU0FBWCxFQUFzQixtQkFBdEIsQ0FBVDtJQUNkLE9BQUEsR0FBVTtRQUFBLElBQUEsRUFBTSxFQUFOOztJQUVWLFFBQUEsR0FBVztBQUNYLFNBQUEsNkNBQUE7O1FBQ0ksWUFBWSxLQUFLLENBQUMsR0FBTixDQUFVLFVBQVYsRUFBQSxLQUE4QixJQUE5QixJQUFBLElBQUEsS0FBb0MsUUFBaEQ7QUFBQSxxQkFBQTs7UUFDQSxPQUFBLEdBQVUsT0FBQSxDQUFRLFVBQVI7QUFDVixhQUFBLGNBQUE7O1lBQ0ksUUFBQSxHQUFXO1lBQ1gsSUFBRyxHQUFBLEtBQU8sU0FBVjtnQkFDSSxJQUFHLHFCQUFIO29CQUNJLFFBQUEsR0FBVyxLQUFNLENBQUEsTUFBQTs7d0JBQ2pCLE9BQVEsQ0FBQSxRQUFBOzt3QkFBUixPQUFRLENBQUEs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QUFBLElBQVEsTUFBTSxDQUFDLG9CQUFQLENBQTRCLEdBQUEsR0FBTSxLQUFLLENBQUMsSUFBTixDQUFXLENBQVgsQ0FBbEMsRUFBaUQsU0FBakQsRUFGWjs7QUFHQSxlQUFPO0lBSkE7SUFNWCxVQUFBLEdBQWE7SUFFYixNQUFBLHVDQUFxQixDQUFFLEdBQWQsQ0FBa0IsYUFBbEIsRUFBaUMsRUFBakM7O1FBQ1Q7O1FBQUEsU0FBVTs7QUFDVixTQUFBLDBDQUFBOztRQUNJLElBQUcsRUFBRSxDQUFDLFVBQUgsQ0FBYyxDQUFkLENBQUg7WUFDSSxVQUFVLENBQUMsT0FBWCxDQUNJO2dCQUFBLElBQUEsRUFBTSxRQUFBLENBQVMsQ0FBVCxDQUFOO2dCQUNBLEdBQUEsRUFBSyxDQURMO2dCQUVBLEVBQUEsRUFBSSxTQUFDLEdBQUQ7MkJBQVMsSUFBSSxDQUFDLElBQUwsQ0FBVSxnQkFBVixFQUE0QixHQUE1QjtnQkFBVCxDQUZKO2FBREosRUFESjs7QUFESjtJQU9BLElBQUcsVUFBVSxDQUFDLE1BQWQ7UUFDSSxVQUFVLENBQUMsSUFBWCxDQUNJO1lBQUEsSUFBQSxFQUFNLEVBQU47U0FESjtRQUVBLFVBQVUsQ0FBQyxJQUFYLENBQ0k7WUFBQSxJQUFBLEVBQU0sWUFBTjtTQURKO1FBRUEsUUFBQSxHQUFXLE9BQUEsQ0FBUSxRQUFSLEVBQWtCLE1BQWxCO1FBQ1gsUUFBUSxDQUFDLElBQVQsR0FBZ0I7WUFBQztnQkFBQyxJQUFBLEVBQUssUUFBTjtnQkFBZ0IsSUFBQSxFQUFNLFVBQXRCO2FBQUQsRUFBb0M7Z0JBQUMsSUFBQSxFQUFLLEVBQU47YUFBcEM7U0FBOEMsQ0FBQyxNQUEvQyxDQUFzRCxRQUFRLENBQUMsSUFBL0QsRUFOcEI7O1dBUUE7QUF6Rkc7O0FBMkZQLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMCAgICAgMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuMDAwICAgMDAwICAwMDAgICAgICAgMDAwMCAgMDAwICAwMDAgICAwMDBcbjAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMCAwIDAwMCAgMDAwICAgMDAwXG4wMDAgMCAwMDAgIDAwMCAgICAgICAwMDAgIDAwMDAgIDAwMCAgIDAwMFxuMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMFxuIyMjXG5cbnsgZmlsZWxpc3QsIHBvc3QsIHNsYXNoLCBvcywgZnMsIF8gfSA9IHJlcXVpcmUgJ2t4aydcblxuU3ludGF4ICAgID0gcmVxdWlyZSAnLi4vZWRpdG9yL3N5bnRheCdcblRyYW5zZm9ybSA9IHJlcXVpcmUgJy4uL2VkaXRvci9hY3Rpb25zL3RyYW5zZm9ybSdcbk1hY3JvICAgICA9IHJlcXVpcmUgJy4uL2NvbW1hbmRzL21hY3JvJ1xuXG5nZXRNZW51ID0gKHRlbXBsYXRlLCBuYW1lKSAtPlxuXG4gICAgZm9yIGl0ZW0gaW4gdGVtcGxhdGVcbiAgICAgICAgaWYgaXRlbS50ZXh0ID09IG5hbWVcbiAgICAgICAgICAgIHJldHVybiBpdGVtXG5cbm1lbnUgPSAodGVtcGxhdGUpIC0+XG5cbiAgICB0ZW1wbGF0ZSA9IF8uY2xvbmVEZWVwIHRlbXBsYXRlXG5cbiAgICBhY3Rpb25GaWxlcyA9IGZpbGVsaXN0IHNsYXNoLmpvaW4gX19kaXJuYW1lLCAnLi4vZWRpdG9yL2FjdGlvbnMnXG4gICAgc3VibWVudSA9IE1pc2M6IFtdXG5cbiAgICBFZGl0TWVudSA9IFtdXG4gICAgZm9yIGFjdGlvbkZpbGUgaW4gYWN0aW9uRmlsZXNcbiAgICAgICAgY29udGludWUgaWYgc2xhc2guZXh0KGFjdGlvbkZpbGUpIG5vdCBpbiBbJ2pzJywgJ2NvZmZlZSddXG4gICAgICAgIGFjdGlvbnMgPSByZXF1aXJlIGFjdGlvbkZpbGVcbiAgICAgICAgZm9yIGtleSx2YWx1ZSBvZiBhY3Rpb25zXG4gICAgICAgICAgICBtZW51TmFtZSA9ICdNaXNjJ1xuICAgICAgICAgICAgaWYga2V5ID09ICdhY3Rpb25zJ1xuICAgICAgICAgICAgICAgIGlmIHZhbHVlWydtZW51J10/XG4gICAgICAgICAgICAgICAgICAgIG1lbnVOYW1lID0gdmFsdWVbJ21lbnUnXVxuICAgICAgICAgICAgICAgICAgICBzdWJtZW51W21lbnVOYW1lXSA/PSBbXVxuICAgICAgICAgICAgICAgIGZvciBrLHYgb2YgdmFsdWVcbiAgICAgICAgICAgICAgICAgICAgaWYgdi5uYW1lIGFuZCB2LmNvbWJvXG4gICAgICAgICAgICAgICAgICAgICAgICBtZW51QWN0aW9uID0gKGMpIC0+IChpLHdpbikgLT4gcG9zdC50b1dpbiB3aW4uaWQsICdtZW51QWN0aW9uJywgY1xuICAgICAgICAgICAgICAgICAgICAgICAgY29tYm8gPSB2LmNvbWJvXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBvcy5wbGF0Zm9ybSgpICE9ICdkYXJ3aW4nIGFuZCB2LmFjY2VsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tYm8gPSB2LmFjY2VsXG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtID1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiAgIHYubmFtZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjY2VsOiAgY29tYm9cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIHYubWVudT9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWJtZW51W3YubWVudV0gPz0gW11cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIHYuc2VwYXJhdG9yXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VibWVudVt2Lm1lbnUgPyBtZW51TmFtZV0ucHVzaCB0ZXh0OiAnJ1xuICAgICAgICAgICAgICAgICAgICAgICAgc3VibWVudVt2Lm1lbnUgPyBtZW51TmFtZV0ucHVzaCBpdGVtXG4gICAgICAgICAgICAgICAgc3VibWVudVttZW51TmFtZV0ucHVzaCB0ZXh0OiAnJ1xuXG4gICAgZm9yIGtleSwgbWVudSBvZiBzdWJtZW51XG4gICAgICAgIEVkaXRNZW51LnB1c2ggdGV4dDprZXksIG1lbnU6bWVudVxuXG4gICAgZWRpdE1lbnUgPSBnZXRNZW51IHRlbXBsYXRlLCAnRWRpdCdcbiAgICBlZGl0TWVudS5tZW51ID0gZWRpdE1lbnUubWVudS5jb25jYXQgRWRpdE1lbnVcblxuICAgIE1hY3JvTWVudSA9IFsgdGV4dDonTWFjcm8nLCBjb21ibzonY29tbWFuZCttJywgYWNjZWw6J2N0cmwrbScsIGNvbW1hbmQ6J21hY3JvJyBdXG4gICAgZm9yIG1hY3JvIGluIE1hY3JvLm1hY3JvTmFtZXNcbiAgICAgICAgTWFjcm9NZW51LnB1c2hcbiAgICAgICAgICAgIHRleHQ6ICAgbWFjcm9cbiAgICAgICAgICAgIGFjdGFyZzogbWFjcm9cbiAgICAgICAgICAgIGFjdGlvbjogJ2RvTWFjcm8nXG5cbiAgICBjb21tYW5kTWVudSA9IGdldE1lbnUgdGVtcGxhdGUsICdDb21tYW5kJ1xuICAgIGNvbW1hbmRNZW51Lm1lbnUgPSBjb21tYW5kTWVudS5tZW51LmNvbmNhdCB0ZXh0OidNYWNybycsIG1lbnU6TWFjcm9NZW51XG5cbiAgICBUcmFuc2Zvcm1NZW51ID0gW11cbiAgICBmb3IgdHJhbnNmb3JtTWVudSwgdHJhbnNmb3JtTGlzdCBvZiBUcmFuc2Zvcm0uVHJhbnNmb3JtLnRyYW5zZm9ybU1lbnVzXG4gICAgICAgIHRyYW5zZm9ybVN1Ym1lbnUgPSBbXVxuICAgICAgICBmb3IgdHJhbnNmb3JtIGluIHRyYW5zZm9ybUxpc3RcbiAgICAgICAgICAgIHRyYW5zZm9ybVN1Ym1lbnUucHVzaFxuICAgICAgICAgICAgICAgIHRleHQ6ICAgdHJhbnNmb3JtXG4gICAgICAgICAgICAgICAgYWN0YXJnOiB0cmFuc2Zvcm1cbiAgICAgICAgICAgICAgICBhY3Rpb246ICdkb1RyYW5zZm9ybSdcblxuICAgICAgICBUcmFuc2Zvcm1NZW51LnB1c2hcbiAgICAgICAgICAgIHRleHQ6IHRyYW5zZm9ybU1lbnVcbiAgICAgICAgICAgIG1lbnU6IHRyYW5zZm9ybVN1Ym1lbnVcblxuICAgIGVkaXRNZW51Lm1lbnUgPSBlZGl0TWVudS5tZW51LmNvbmNhdCB0ZXh0OidUcmFuc2Zvcm0nLCBtZW51OlRyYW5zZm9ybU1lbnVcblxuICAgIGZpbGVTcGFuID0gKGYpIC0+XG4gICAgICAgIGlmIGY/XG4gICAgICAgICAgICBzcGFuICA9IFN5bnRheC5zcGFuRm9yVGV4dEFuZFN5bnRheCBzbGFzaC50aWxkZShzbGFzaC5kaXIoZikpLCAnYnJvd3NlcidcbiAgICAgICAgICAgIHNwYW4gKz0gU3ludGF4LnNwYW5Gb3JUZXh0QW5kU3ludGF4ICcvJyArIHNsYXNoLmJhc2UoZiksICdicm93c2VyJ1xuICAgICAgICByZXR1cm4gc3BhblxuXG4gICAgUmVjZW50TWVudSA9IFtdXG5cbiAgICByZWNlbnQgPSB3aW5kb3cuc3RhdGU/LmdldCAncmVjZW50RmlsZXMnLCBbXVxuICAgIHJlY2VudCA/PSBbXVxuICAgIGZvciBmIGluIHJlY2VudFxuICAgICAgICBpZiBmcy5leGlzdHNTeW5jIGZcbiAgICAgICAgICAgIFJlY2VudE1lbnUudW5zaGlmdFxuICAgICAgICAgICAgICAgIGh0bWw6IGZpbGVTcGFuIGZcbiAgICAgICAgICAgICAgICBhcmc6IGZcbiAgICAgICAgICAgICAgICBjYjogKGFyZykgLT4gcG9zdC5lbWl0ICduZXdUYWJXaXRoRmlsZScsIGFyZ1xuXG4gICAgaWYgUmVjZW50TWVudS5sZW5ndGhcbiAgICAgICAgUmVjZW50TWVudS5wdXNoXG4gICAgICAgICAgICB0ZXh0OiAnJ1xuICAgICAgICBSZWNlbnRNZW51LnB1c2hcbiAgICAgICAgICAgIHRleHQ6ICdDbGVhciBMaXN0J1xuICAgICAgICBmaWxlTWVudSA9IGdldE1lbnUgdGVtcGxhdGUsICdGaWxlJ1xuICAgICAgICBmaWxlTWVudS5tZW51ID0gW3t0ZXh0OidSZWNlbnQnLCBtZW51OiBSZWNlbnRNZW51fSwge3RleHQ6Jyd9XS5jb25jYXQgZmlsZU1lbnUubWVudVxuXG4gICAgdGVtcGxhdGVcblxubW9kdWxlLmV4cG9ydHMgPSBtZW51XG4iXX0=
//# sourceURL=../../coffee/win/menu.coffee