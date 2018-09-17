/*
jQWidgets v6.0.6 (2018-August)
Copyright (c) 2011-2018 jQWidgets.
License: https://jqwidgets.com/license/
*/
/* eslint-disable */

import '../jqwidgets/styles/jqx.base.css';
import '../jqwidgets/jqxcore.js';
import '../jqwidgets/jqxbuttons.js';
import '../jqwidgets/jqxdropdownbutton.js';
import '../jqwidgets/jqxradiobutton.js';
import '../jqwidgets/jqxcolorpicker.js';

import React from 'react';

const JQXLite = window.JQXLite;

export const jqx = window.jqx;

export default class JqxColorPicker extends React.Component {
    componentDidMount() {
        let options = this.manageAttributes();
        this.createComponent(options);
    };
    manageAttributes() {
        let properties = ['color','colorMode','disabled','height','showTransparent','width'];
        let options = {};
        for(let item in this.props) {
              if(item === 'settings') {
                  for(let itemTwo in this.props[item]) {
                      options[itemTwo] = this.props[item][itemTwo];
                      }
                } else {
                      if(properties.indexOf(item) !== -1) {
                        options[item] = this.props[item];
                      }
                }
          }
          return options;
      };
    createComponent(options) {
        if(!this.style) {
              for (let style in this.props.style) {
                  JQXLite(this.componentSelector).css(style, this.props.style[style]);
              }
        }
        if(this.props.className !== undefined) {
            let classes = this.props.className.split(' ');
            for (let i = 0; i < classes.length; i++ ) {
                JQXLite(this.componentSelector).addClass(classes[i]);
            }
        }
        if(!this.template) {
              JQXLite(this.componentSelector).html(this.props.template);
        }
        JQXLite(this.componentSelector).jqxColorPicker(options);
    };
    setOptions(options) {
        JQXLite(this.componentSelector).jqxColorPicker('setOptions', options);
    };
    getOptions() {
        if(arguments.length === 0) {
            throw Error('At least one argument expected in getOptions()!');
        }
        let resultToReturn = {};
        for(let i = 0; i < arguments.length; i++) {
            resultToReturn[arguments[i]] = JQXLite(this.componentSelector).jqxColorPicker(arguments[i]);
        }
        return resultToReturn;
    };
    on(name,callbackFn) {
        JQXLite(this.componentSelector).on(name,callbackFn);
    };
    off(name) {
        JQXLite(this.componentSelector).off(name);
    };
    color(arg) {
        if (arg !== undefined) {
            JQXLite(this.componentSelector).jqxColorPicker('color', arg)
        } else {
            return JQXLite(this.componentSelector).jqxColorPicker('color');
        }
    };
    colorMode(arg) {
        if (arg !== undefined) {
            JQXLite(this.componentSelector).jqxColorPicker('colorMode', arg)
        } else {
            return JQXLite(this.componentSelector).jqxColorPicker('colorMode');
        }
    };
    disabled(arg) {
        if (arg !== undefined) {
            JQXLite(this.componentSelector).jqxColorPicker('disabled', arg)
        } else {
            return JQXLite(this.componentSelector).jqxColorPicker('disabled');
        }
    };
    height(arg) {
        if (arg !== undefined) {
            JQXLite(this.componentSelector).jqxColorPicker('height', arg)
        } else {
            return JQXLite(this.componentSelector).jqxColorPicker('height');
        }
    };
    showTransparent(arg) {
        if (arg !== undefined) {
            JQXLite(this.componentSelector).jqxColorPicker('showTransparent', arg)
        } else {
            return JQXLite(this.componentSelector).jqxColorPicker('showTransparent');
        }
    };
    width(arg) {
        if (arg !== undefined) {
            JQXLite(this.componentSelector).jqxColorPicker('width', arg)
        } else {
            return JQXLite(this.componentSelector).jqxColorPicker('width');
        }
    };
    getColor() {
        return JQXLite(this.componentSelector).jqxColorPicker('getColor');  
    };
    setColor(color) {
        JQXLite(this.componentSelector).jqxColorPicker('setColor', color);  
    };
    render() {
        let id = 'jqxColorPicker' + JQXLite.generateID();
        this.componentSelector = '#' + id;
        return (
            <div id={id}>{this.props.value}{this.props.children}</div>
        )
    };
};

