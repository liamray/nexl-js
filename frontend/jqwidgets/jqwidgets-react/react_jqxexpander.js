/*
jQWidgets v5.7.2 (2018-Apr)
Copyright (c) 2011-2018 jQWidgets.
License: https://jqwidgets.com/license/
*/

import React from 'react';

const JQXLite = window.JQXLite;

export const jqx = window.jqx;

export default class JqxExpander extends React.Component {
    componentDidMount() {
        let options = this.manageAttributes();
        this.createComponent(options);
    };
    manageAttributes() {
        let properties = ['animationType','arrowPosition','collapseAnimationDuration','disabled','expanded','expandAnimationDuration','height','headerPosition','initContent','rtl','showArrow','theme','toggleMode','width'];
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
        JQXLite(this.componentSelector).jqxExpander(options);
    };
    setOptions(options) {
        JQXLite(this.componentSelector).jqxExpander('setOptions', options);
    };
    getOptions() {
        if(arguments.length === 0) {
            throw Error('At least one argument expected in getOptions()!');
        }
        let resultToReturn = {};
        for(let i = 0; i < arguments.length; i++) {
            resultToReturn[arguments[i]] = JQXLite(this.componentSelector).jqxExpander(arguments[i]);
        }
        return resultToReturn;
    };
    on(name,callbackFn) {
        JQXLite(this.componentSelector).on(name,callbackFn);
    };
    off(name) {
        JQXLite(this.componentSelector).off(name);
    };
    animationType(arg) {
        if (arg !== undefined) {
            JQXLite(this.componentSelector).jqxExpander('animationType', arg)
        } else {
            return JQXLite(this.componentSelector).jqxExpander('animationType');
        }
    };
    arrowPosition(arg) {
        if (arg !== undefined) {
            JQXLite(this.componentSelector).jqxExpander('arrowPosition', arg)
        } else {
            return JQXLite(this.componentSelector).jqxExpander('arrowPosition');
        }
    };
    collapseAnimationDuration(arg) {
        if (arg !== undefined) {
            JQXLite(this.componentSelector).jqxExpander('collapseAnimationDuration', arg)
        } else {
            return JQXLite(this.componentSelector).jqxExpander('collapseAnimationDuration');
        }
    };
    disabled(arg) {
        if (arg !== undefined) {
            JQXLite(this.componentSelector).jqxExpander('disabled', arg)
        } else {
            return JQXLite(this.componentSelector).jqxExpander('disabled');
        }
    };
    expanded(arg) {
        if (arg !== undefined) {
            JQXLite(this.componentSelector).jqxExpander('expanded', arg)
        } else {
            return JQXLite(this.componentSelector).jqxExpander('expanded');
        }
    };
    expandAnimationDuration(arg) {
        if (arg !== undefined) {
            JQXLite(this.componentSelector).jqxExpander('expandAnimationDuration', arg)
        } else {
            return JQXLite(this.componentSelector).jqxExpander('expandAnimationDuration');
        }
    };
    height(arg) {
        if (arg !== undefined) {
            JQXLite(this.componentSelector).jqxExpander('height', arg)
        } else {
            return JQXLite(this.componentSelector).jqxExpander('height');
        }
    };
    headerPosition(arg) {
        if (arg !== undefined) {
            JQXLite(this.componentSelector).jqxExpander('headerPosition', arg)
        } else {
            return JQXLite(this.componentSelector).jqxExpander('headerPosition');
        }
    };
    initContent(arg) {
        if (arg !== undefined) {
            JQXLite(this.componentSelector).jqxExpander('initContent', arg)
        } else {
            return JQXLite(this.componentSelector).jqxExpander('initContent');
        }
    };
    rtl(arg) {
        if (arg !== undefined) {
            JQXLite(this.componentSelector).jqxExpander('rtl', arg)
        } else {
            return JQXLite(this.componentSelector).jqxExpander('rtl');
        }
    };
    showArrow(arg) {
        if (arg !== undefined) {
            JQXLite(this.componentSelector).jqxExpander('showArrow', arg)
        } else {
            return JQXLite(this.componentSelector).jqxExpander('showArrow');
        }
    };
    theme(arg) {
        if (arg !== undefined) {
            JQXLite(this.componentSelector).jqxExpander('theme', arg)
        } else {
            return JQXLite(this.componentSelector).jqxExpander('theme');
        }
    };
    toggleMode(arg) {
        if (arg !== undefined) {
            JQXLite(this.componentSelector).jqxExpander('toggleMode', arg)
        } else {
            return JQXLite(this.componentSelector).jqxExpander('toggleMode');
        }
    };
    width(arg) {
        if (arg !== undefined) {
            JQXLite(this.componentSelector).jqxExpander('width', arg)
        } else {
            return JQXLite(this.componentSelector).jqxExpander('width');
        }
    };
    collapse() {
        JQXLite(this.componentSelector).jqxExpander('collapse');  
    };
    disable() {
        JQXLite(this.componentSelector).jqxExpander('disable');  
    };
    destroy() {
        JQXLite(this.componentSelector).jqxExpander('destroy');  
    };
    enable() {
        JQXLite(this.componentSelector).jqxExpander('enable');  
    };
    expand() {
        JQXLite(this.componentSelector).jqxExpander('expand');  
    };
    focus() {
        JQXLite(this.componentSelector).jqxExpander('focus');  
    };
    getContent() {
        return JQXLite(this.componentSelector).jqxExpander('getContent');  
    };
    getHeaderContent() {
        return JQXLite(this.componentSelector).jqxExpander('getHeaderContent');  
    };
    invalidate() {
        JQXLite(this.componentSelector).jqxExpander('invalidate');  
    };
    refresh() {
        JQXLite(this.componentSelector).jqxExpander('refresh');  
    };
    performRender() {
        JQXLite(this.componentSelector).jqxExpander('render');
    };
    setHeaderContent(headerContent) {
        JQXLite(this.componentSelector).jqxExpander('setHeaderContent', headerContent);  
    };
    setContent(content) {
        JQXLite(this.componentSelector).jqxExpander('setContent', content);  
    };
    render() {
        let id = 'jqxExpander' + JQXLite.generateID();
        this.componentSelector = '#' + id;
        return (
            <div id={id}>{this.props.value}{this.props.children}</div>
        )
    };
};

