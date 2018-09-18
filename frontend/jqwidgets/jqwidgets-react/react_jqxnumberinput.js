/*
jQWidgets v5.7.2 (2018-Apr)
Copyright (c) 2011-2018 jQWidgets.
License: https://jqwidgets.com/license/
*/

import React from 'react';

const JQXLite = window.JQXLite;

export const jqx = window.jqx;

export default class JqxNumberInput extends React.Component {
    componentDidMount() {
        let options = this.manageAttributes();
        this.createComponent(options);
    };
    manageAttributes() {
        let properties = ['allowNull','decimal','disabled','decimalDigits','decimalSeparator','digits','groupSeparator','groupSize','height','inputMode','min','max','negativeSymbol','placeHolder','promptChar','rtl','readOnly','spinMode','spinButtons','spinButtonsWidth','spinButtonsStep','symbol','symbolPosition','textAlign','template','theme','value','width'];
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
        JQXLite(this.componentSelector).jqxNumberInput(options);
    };
    setOptions(options) {
        JQXLite(this.componentSelector).jqxNumberInput('setOptions', options);
    };
    getOptions() {
        if(arguments.length === 0) {
            throw Error('At least one argument expected in getOptions()!');
        }
        let resultToReturn = {};
        for(let i = 0; i < arguments.length; i++) {
            resultToReturn[arguments[i]] = JQXLite(this.componentSelector).jqxNumberInput(arguments[i]);
        }
        return resultToReturn;
    };
    on(name,callbackFn) {
        JQXLite(this.componentSelector).on(name,callbackFn);
    };
    off(name) {
        JQXLite(this.componentSelector).off(name);
    };
    allowNull(arg) {
        if (arg !== undefined) {
            JQXLite(this.componentSelector).jqxNumberInput('allowNull', arg)
        } else {
            return JQXLite(this.componentSelector).jqxNumberInput('allowNull');
        }
    };
    decimal(arg) {
        if (arg !== undefined) {
            JQXLite(this.componentSelector).jqxNumberInput('decimal', arg)
        } else {
            return JQXLite(this.componentSelector).jqxNumberInput('decimal');
        }
    };
    disabled(arg) {
        if (arg !== undefined) {
            JQXLite(this.componentSelector).jqxNumberInput('disabled', arg)
        } else {
            return JQXLite(this.componentSelector).jqxNumberInput('disabled');
        }
    };
    decimalDigits(arg) {
        if (arg !== undefined) {
            JQXLite(this.componentSelector).jqxNumberInput('decimalDigits', arg)
        } else {
            return JQXLite(this.componentSelector).jqxNumberInput('decimalDigits');
        }
    };
    decimalSeparator(arg) {
        if (arg !== undefined) {
            JQXLite(this.componentSelector).jqxNumberInput('decimalSeparator', arg)
        } else {
            return JQXLite(this.componentSelector).jqxNumberInput('decimalSeparator');
        }
    };
    digits(arg) {
        if (arg !== undefined) {
            JQXLite(this.componentSelector).jqxNumberInput('digits', arg)
        } else {
            return JQXLite(this.componentSelector).jqxNumberInput('digits');
        }
    };
    groupSeparator(arg) {
        if (arg !== undefined) {
            JQXLite(this.componentSelector).jqxNumberInput('groupSeparator', arg)
        } else {
            return JQXLite(this.componentSelector).jqxNumberInput('groupSeparator');
        }
    };
    groupSize(arg) {
        if (arg !== undefined) {
            JQXLite(this.componentSelector).jqxNumberInput('groupSize', arg)
        } else {
            return JQXLite(this.componentSelector).jqxNumberInput('groupSize');
        }
    };
    height(arg) {
        if (arg !== undefined) {
            JQXLite(this.componentSelector).jqxNumberInput('height', arg)
        } else {
            return JQXLite(this.componentSelector).jqxNumberInput('height');
        }
    };
    inputMode(arg) {
        if (arg !== undefined) {
            JQXLite(this.componentSelector).jqxNumberInput('inputMode', arg)
        } else {
            return JQXLite(this.componentSelector).jqxNumberInput('inputMode');
        }
    };
    min(arg) {
        if (arg !== undefined) {
            JQXLite(this.componentSelector).jqxNumberInput('min', arg)
        } else {
            return JQXLite(this.componentSelector).jqxNumberInput('min');
        }
    };
    max(arg) {
        if (arg !== undefined) {
            JQXLite(this.componentSelector).jqxNumberInput('max', arg)
        } else {
            return JQXLite(this.componentSelector).jqxNumberInput('max');
        }
    };
    negativeSymbol(arg) {
        if (arg !== undefined) {
            JQXLite(this.componentSelector).jqxNumberInput('negativeSymbol', arg)
        } else {
            return JQXLite(this.componentSelector).jqxNumberInput('negativeSymbol');
        }
    };
    placeHolder(arg) {
        if (arg !== undefined) {
            JQXLite(this.componentSelector).jqxNumberInput('placeHolder', arg)
        } else {
            return JQXLite(this.componentSelector).jqxNumberInput('placeHolder');
        }
    };
    promptChar(arg) {
        if (arg !== undefined) {
            JQXLite(this.componentSelector).jqxNumberInput('promptChar', arg)
        } else {
            return JQXLite(this.componentSelector).jqxNumberInput('promptChar');
        }
    };
    rtl(arg) {
        if (arg !== undefined) {
            JQXLite(this.componentSelector).jqxNumberInput('rtl', arg)
        } else {
            return JQXLite(this.componentSelector).jqxNumberInput('rtl');
        }
    };
    readOnly(arg) {
        if (arg !== undefined) {
            JQXLite(this.componentSelector).jqxNumberInput('readOnly', arg)
        } else {
            return JQXLite(this.componentSelector).jqxNumberInput('readOnly');
        }
    };
    spinMode(arg) {
        if (arg !== undefined) {
            JQXLite(this.componentSelector).jqxNumberInput('spinMode', arg)
        } else {
            return JQXLite(this.componentSelector).jqxNumberInput('spinMode');
        }
    };
    spinButtons(arg) {
        if (arg !== undefined) {
            JQXLite(this.componentSelector).jqxNumberInput('spinButtons', arg)
        } else {
            return JQXLite(this.componentSelector).jqxNumberInput('spinButtons');
        }
    };
    spinButtonsWidth(arg) {
        if (arg !== undefined) {
            JQXLite(this.componentSelector).jqxNumberInput('spinButtonsWidth', arg)
        } else {
            return JQXLite(this.componentSelector).jqxNumberInput('spinButtonsWidth');
        }
    };
    spinButtonsStep(arg) {
        if (arg !== undefined) {
            JQXLite(this.componentSelector).jqxNumberInput('spinButtonsStep', arg)
        } else {
            return JQXLite(this.componentSelector).jqxNumberInput('spinButtonsStep');
        }
    };
    symbol(arg) {
        if (arg !== undefined) {
            JQXLite(this.componentSelector).jqxNumberInput('symbol', arg)
        } else {
            return JQXLite(this.componentSelector).jqxNumberInput('symbol');
        }
    };
    symbolPosition(arg) {
        if (arg !== undefined) {
            JQXLite(this.componentSelector).jqxNumberInput('symbolPosition', arg)
        } else {
            return JQXLite(this.componentSelector).jqxNumberInput('symbolPosition');
        }
    };
    textAlign(arg) {
        if (arg !== undefined) {
            JQXLite(this.componentSelector).jqxNumberInput('textAlign', arg)
        } else {
            return JQXLite(this.componentSelector).jqxNumberInput('textAlign');
        }
    };
    template(arg) {
        if (arg !== undefined) {
            JQXLite(this.componentSelector).jqxNumberInput('template', arg)
        } else {
            return JQXLite(this.componentSelector).jqxNumberInput('template');
        }
    };
    theme(arg) {
        if (arg !== undefined) {
            JQXLite(this.componentSelector).jqxNumberInput('theme', arg)
        } else {
            return JQXLite(this.componentSelector).jqxNumberInput('theme');
        }
    };
    value(arg) {
        if (arg !== undefined) {
            JQXLite(this.componentSelector).jqxNumberInput('value', arg)
        } else {
            return JQXLite(this.componentSelector).jqxNumberInput('value');
        }
    };
    width(arg) {
        if (arg !== undefined) {
            JQXLite(this.componentSelector).jqxNumberInput('width', arg)
        } else {
            return JQXLite(this.componentSelector).jqxNumberInput('width');
        }
    };
    clear() {
        JQXLite(this.componentSelector).jqxNumberInput('clear');  
    };
    destroy() {
        JQXLite(this.componentSelector).jqxNumberInput('destroy');  
    };
    focus() {
        JQXLite(this.componentSelector).jqxNumberInput('focus');  
    };
    getDecimal() {
        return JQXLite(this.componentSelector).jqxNumberInput('getDecimal');  
    };
    setDecimal(index) {
        JQXLite(this.componentSelector).jqxNumberInput('setDecimal', index);  
    };
    val(value) {
        if (value !== undefined) {
            JQXLite(this.componentSelector).jqxNumberInput('val',  value)
        } else {
            return JQXLite(this.componentSelector).jqxNumberInput('val');
        }
    };

    render() {
        let id = 'jqxNumberInput' + JQXLite.generateID();
        this.componentSelector = '#' + id;
        return (
            <div id={id}></div>
        )
    };
};

