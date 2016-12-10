### nexl expressions

nexl expressions are representing javascript variables declared in nexl sources by wrapping variable name with **${...}** characters

nexl expressions can have a modifiers to perform an additional tuning for their values. They are optional but very useful. 

<br/>

##### nexl expression definition

        ${JS_VAR_NAME[modifier_id[modifier_value]][modifier_id[modifier_value]]...}

nexl suggests the following modifiers :

- Default value modifier
- Concat array elements modifier
- Object reverse resolution modifier
- Undefined variables control modifier
- Omit expression modifier
- Treat as modifier

<br />

For example let&#39;s consider a default value modifier which is applied when you are trying to get an undefined variable

           ${HOSTS_COUNT:10}

If the **HOSTS\_COUNT** variable is not defined, the **10** value will be applied as a default value. The **:** character is a modifier\_id and **10** is a modifier\_value

<br/>

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

nexl expressions can be nested with unlimited depth. For example :

${hosts.${domain}.${env}}

First nexl assembles a value for hosts.${domain}.${env} . Then this value will be substituted as a javascript variable ${...}

<br />

nexl expressions are viral with unlimited nested level. They can point to another nexl expression(s) in string javascript variables, in javascript arrays, in javascript objects. Even it can be applied as a key in a javascript object. Everything will be evaluated by nexl engine. For example :

            var PORT = 8080;
            
            var URL = "http://localhost:${PORT}/service";
            
            var urlsArray = [ "${URL}", "http://google.com" ];
            
            var urlsArrayConcatenated = "${urlsArray?,}";
            
            var obj = {
              length: "20",
              "${PORT}": "second"
            };

Try those examples in a nexl-client
