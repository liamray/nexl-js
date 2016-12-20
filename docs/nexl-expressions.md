### nexl expressions

##### Introduction

nexl expressions are javascript variables or functions wrapped with <b>${...}</b> characters.<br/>
nexl expressions give you an access to a javascript variables and functions located in nexl source file.<br/> 
The <b>${DISTANCE_TO_MOON}</b> expression evaluates to the value of <b>DISTANCE_TO_MOON</b> javascript variable declared in nexl source file.

By using of nexl expression you can access properties of javascript objects.<br/>
The <b>${Person.age}</b> expression accesses the <b>age</b> property from <b>Person</b> object.<br/>

Expressions are dynamic, everything is being evaluated.<br/>
Consider the following expression <b>${Person.${property}}</b> . The <b>${property}</b> is an expression itself. First nexl engine substitutes the value of <b>property</b> variable and the whole expression will be evaluated.<br/> 

To evaluate a javascript function wrap function name with <b>${...}</b> characters.<br/>
The <b>${testFunc()}</b> expression runs the <b>testFunc()</b> function and evaluates to a value which that function returns.<br/>
Expression with parametrized function <b>${testFunc('${param1}')}</b>. nexl engine will evaluate a <b>${param1}</b> expression first and then it will be passed to the function.

Additionally nexl expressions allow to perform different kind of manipulations with a javascript variables ( and functions ). For example to apply a default value for undefined variable.<br/>
The <b>${DISTANCE_TO_MOON:384400}</b> expression evaluates to <b>384400</b> value if the <b>DISTANCE_TO_MOON</b> variable is not defined in nexl source file.<br/> 
It's called default value modifier.
The <b>:</b> character is a modifier id and the <b>384400</b> is a modifier value.<br/>
<br/>

##### nexl expression definition

        ${JS_VAR_NAME|JS_FUNCTION(FUNC_PARAMS)[modifier_id[modifier_value]][modifier_id[modifier_value]]...}


##### modifiers
| Modifier id | Modifier name
| --- | --- |
| : | Default value modifier |
| ? | Concat array elements modifier |
| < | Object reverse resolution modifier |
| ! | Undefined variables control modifier |
| -<br/>+ | Omit expression modifier |
| ~ | Treat as modifier |

<br />




**Default value modifier**

    modifier_id is :
    modifier_value can be a text or another nexl expression

    This modifier is applied when the variable is not declared
    You can use unlimited amount of this modifier for single expression
    
    Example
        Using text as a default value for undefined X variable
            ${X:hello}
        
        Using nexl expression as a default value for undefined X variable
            ${X:${Y}}
        
        In the next example first trying to use a ${Y} expression as a default value, if this expression is also undefined, the text will be applied
            ${X:${Y}:hello}
        

<br/>

**Concat array elements modifier**

    modifier_id is ?
    modifier_value is a delimiter to concat array elements
     
    When the javascript variable points to array you can control how to concatenate array elements
    
    Example
        ${arr?,} concatenates array elements with comma


<br/>

**Object reverse resolution modifier**

    modifier_id is <
    modifier_value is a text or another nexl expression to resolve object's key
    
    This modifier is using when we need to resolve a key by value in the object.
     
    Example
        declare the following object in nexl source
            var fruitsObj = { 
                'Tomato' : 'red',
                'Cucumber' : 'green',        
                'Banana' : 'yellow' 
            };
            
        the ${fruitsObj<yellow} expression 
        will be evaluated as 'Banana'
         
        this following expression resolves a fruit name by color provided in ${COLOR} expression
            ${fruitsObj<${COLOR}}
        

<br/>

**Undefined variables control modifier**

    modifier_id is !
    modifier_value can be C or A

    Controls behaviour of nexl engine for undefined variables. Available options are
        !C continue evaluate value ( ignore undefined variables )
        !A abort evaluation and throw error
        
    The default option is !A
    
    Example
        Abort variable evaluation if host variable is not defined
            ${host!A}
        Don't abort variable evaluation is it's not defined, use empty string for its value
            ${host!C}


<br/>

**Omit expression modifier**

    modifier_id is -
    modifier_value doesn't have
    
    This modifier omits the whole expression if expression's value contains at least one undefined variable
    
    Example
        declare the following in nexl source
            var x = "http://localhost:${PORT!C}/test";
        
        the following expression will be evaluated as empty string due to this modifier omits the whole expression ( PORT variable is not defined )
            ${x-} 
            
        Please pay attention that PORT variable has a !C which prevents throwing error

<br/>

**Don't omit expression modifier**

    modifier_id is +
    modifier_value doesn't have
    
    This modifier is opposite to previous modifier. This is a default behaviour of nexl engine 


<br/>

**Treat as modifier**

    modifier_id is ~
    modifier_value O, K, V
    
    This modifier transforms objects according to their modifier_value
        ~K resolves object's keys
        ~V resolves object's values
        ~O transforms variables to objects
    
    In the future versions more options will be added
     
     Example
        declare the following object in nexl source
            var fruitsObj = { 
                'Tomato' : 'red',
                'Cucumber' : 'green',        
                'Banana' : 'yellow' 
            };
        
        the ${obj~K} expression
        will be evaluated as [ 'Tomato', 'Cucumber', 'Banana' ]
        
        the ${obj~V} expression
        will be evaluated as [ 'red', 'green', 'yellow' ]
            
        declare the following in nexl source
            var radius = 10;
        the ${radius~O} expression
        will be evaluated as { "radius" : 10 }
             


<br/>

***
<br/>

[Examples of nexl expressions](examples-of-nexl-expressions.md)