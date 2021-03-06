/**
 * @license   http://www.gnu.org/licenses/gpl.html GPL Version 3
 * @author    Volker Theile <volker.theile@openmediavault.org>
 * @author    OpenMediaVault Plugin Developers <plugins@omv-extras.org>
 * @copyright Copyright (c) 2009-2013 Volker Theile
 * @copyright Copyright (c) 2013-2016 OpenMediaVault Plugin Developers
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */
// require("js/omv/WorkspaceManager.js")
// require("js/omv/workspace/form/Panel.js")
// require("js/omv/data/Store.js")
// require("js/omv/data/Model.js")

Ext.define("OMV.module.admin.service.calibre.Settings", {
    extend : "OMV.workspace.form.Panel",
    uses   : [
        "OMV.data.Model",
        "OMV.data.Store"
    ],

    rpcService   : "Calibre",
    rpcGetMethod : "getSettings",
    rpcSetMethod : "setSettings",

    plugins      : [{
        ptype        : "linkedfields",
        correlations : [{
            name : [
                "data.sharedfolderref"
            ],
            conditions : [{
                name  : "enable",
                value : true
            }],
            properties : [
                "!allowBlank",
                "!allowNone"
            ]
        },{
            name : [
                "enable"
            ],
            conditions : [{
                name  : "enable",
                value : true 
            }],
            properties : function(valid, field) {
                this.setButtonDisabled("openweb", !valid);
            }
        }]
    }],

    initComponent : function() {
        var me = this;

        me.on('load', function () {
            var checked = me.findField('enable').checked;
            var showtab = me.findField('showtab').checked;
            var parent = me.up('tabpanel');

            if (!parent)
                return;

            var booksPanel = parent.down('panel[title=' + _("Books") + ']');
            var webPanel = parent.down('panel[title=' + _("Web Interface") + ']');

            if (webPanel) {
                checked ? booksPanel.enable() : booksPanel.disable();
            }

            if (webPanel) {
                checked ? webPanel.enable() : webPanel.disable();
                showtab ? webPanel.tab.show() : webPanel.tab.hide();
            }
        });

        me.callParent(arguments);
    },

    getButtonItems : function() {
        var me = this;
        var items = me.callParent(arguments);
        items.push({
            id       : me.getId() + "-update",
            xtype    : "button",
            text     : _("Update Calibre"),
            icon     : "images/add.png",
            iconCls  : Ext.baseCSSPrefix + "btn-icon-16x16",
            scope    : me,
            handler  : Ext.Function.bind(me.onUpdateButton, me, [ me ])
        },{
            id       : me.getId() + "-openweb",
            xtype    : "button",
            text     : _("Open Web Interface"),
            icon     : "images/calibre.png",
            iconCls  : Ext.baseCSSPrefix + "btn-icon-16x16",
            disabled : true,
            scope    : me,
            handler  : Ext.Function.bind(me.onOpenWebButton, me, [ me ])
        });
        return items;
    },

    getFormItems : function() {
        var me = this;
        return [{
            xtype    : "fieldset",
            title    : "General settings",
            defaults : {
                labelSeparator : ""
            },
            items : [{
                xtype      : "checkbox",
                name       : "enable",
                fieldLabel : _("Enable"),
                checked    : false
            },{
                xtype      : "sharedfoldercombo",
                name       : "data.sharedfolderref",
                fieldLabel : _("Data directory"),
                allowNone  : true,
                plugins    : [{
                    ptype : "fieldinfo",
                    text  : _("The location where Calibre stores its data.")
                }]
            },{
                xtype         : "numberfield",
                name          : "port",
                fieldLabel    : _("Port"),
                vtype         : "port",
                minValue      : 1,
                maxValue      : 65535,
                allowDecimals : false,
                allowNegative : false,
                allowBlank    : false,
                value         : 8080,
                plugins    : [{
                    ptype : "fieldinfo",
                    text  : _("Port to listen on.")
                }]
            },{
                xtype      : "textfield",
                name       : "username",
                fieldLabel : _("Username"),
                allowBlank : true,
                plugins    : [{
                    ptype : "fieldinfo",
                    text  : _("Username for access - optional")
                }]
            },{
                xtype      : "textfield",
                name       : "password",
                fieldLabel : _("Password"),
                allowBlank : true,
                plugins    : [{
                    ptype : "fieldinfo",
                    text  : _("Set a password to restrict access - optional")
                }]
            },{
                xtype      : "textfield",
                name       : "coversize",
                fieldLabel : _("Cover Size"),
                allowBlank : true,
                plugins    : [{
                    ptype : "fieldinfo",
                    text  : _("The maximum size for displayed covers. Default is '600x800' - optional")
                }]
            },{
                xtype      : "checkbox",
                name       : "showtab",
                fieldLabel : _("Show Tab"),
                boxLabel   : _("Show tab containing web interface frame."),
                checked    : false
            }]
        },{
            xtype         : "fieldset",
            title         : _("Book Import"),
            fieldDefaults : {
                labelSeparator : ""
            },
            items : [{
                xtype      : "sharedfoldercombo",
                name       : "import.sharedfolderref",
                fieldLabel : _("Shared folder"),
                allowNone  : true,
                allowBlank : true,
                plugins    : [{
                    ptype : "fieldinfo",
                    text  : _("The location of books to import.")
                }]
            },{
                xtype   : "button",
                name    : "import",
                text    : _("Import"),
                scope   : this,
                handler : Ext.Function.bind(me.onImportButton, me, [ me ]),
                margin  : "0 0 7 0"
            }]
        }];
    },

    onImportButton : function() {
        var me = this;
        var wnd = Ext.create("OMV.window.Execute", {
            title           : _("Importing..."),
            rpcService      : "Calibre",
            rpcMethod       : "doImport",
            rpcParams       : {
                sharedfolderref : me.getForm().findField("import.sharedfolderref").getValue()
            },
            rpcIgnoreErrors : true,
            hideStartButton : true,
            hideStopButton  : false,
            listeners       : {
                scope     : me,
                finish    : function(wnd, response) {
                    wnd.appendValue(_("Done..."));
                    wnd.setButtonDisabled("close", false);
                },
                exception : function(wnd, error) {
                    OMV.MessageBox.error(null, error);
                    wnd.setButtonDisabled("close", false);
                }
            }
        });
        wnd.setButtonDisabled("close", true);
        wnd.show();
        wnd.start();
    },

    onOpenWebButton : function() {
        var me = this;
        window.open("http://" + window.location.hostname + ":" + me.getForm().findField("port").getValue(), "_blank");
    },

    onUpdateButton: function() {
        var me = this;
        var wnd = Ext.create("OMV.window.Execute", {
            title      : _("Update Calibre..."),
            rpcService : "Calibre",
            rpcMethod  : "doUpdate",
            hideStartButton : true,
            hideStopButton  : true,
            listeners       : {
                scope     : me,
                finish    : function(wnd, response) {
                    wnd.appendValue(_("Done..."));
                    wnd.setButtonDisabled("close", false);
                },
                exception : function(wnd, error) {
                    OMV.MessageBox.error(null, error);
                    wnd.setButtonDisabled("close", false);
                }
            }
        });
        wnd.setButtonDisabled("close", true);
        wnd.show();
        wnd.start();
    }
});

OMV.WorkspaceManager.registerPanel({
    id        : "settings",
    path      : "/service/calibre",
    text      : _("Settings"),
    position  : 10,
    className : "OMV.module.admin.service.calibre.Settings"
});
