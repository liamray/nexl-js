### nexl-js

- nexl is a javascript based read only configuration data storage where every single data element is a javascript variable
- it is intended to store applicative data/configuration outside the applications ( externally )
- data elements are computable if needed as a result of it&#39;s a javascript based
- data elements are accessible by nexl expressions which gives an ability to manipulate data on the fly


* * *

### Products

nexl offers the following products : [nexl-server](https://www.npmjs.com/package/nexl-server) and [nexl-client](https://www.npmjs.com/package/nexl-client)


##### nexl-server :

    - is a configuration data storage server
    - hosts a javascript files which are called nexl sources
    - exposes all javascript variables from nexl sources via web services


##### nexl-client :

    - is a web-based GUI application
    - displays data from remote nexl-server
    - simulates nexl-server's work locally
    - is intended to design and test data items for nexl-server



<br />

* * *

### How to install and run

nexl is a nodejs based application. Therefore you have to download and install [nodejs](https://nodejs.org/en/download/) first.<br/>
After that you can install and run nexl applications in command line

| PRODUCT | INSTALL | RUN |
| --- | --- | --- |
| nexl-server | npm i nexl-server -g | nexl-server |
| nexl-client | npm i nexl-client -g | nexl |




* * *


### Getting started

Let&#39;s host a **DISTANCE\_TO\_MOON = 384400000** data element on nexl-server, access it via web-service and then display in nexl-client

- run nexl-server
- create a **interesting-facts.js** file ( this is a nexl source ) and put it into **$HOME/nexl-sources** directory ( **%userprofile%\nexl-sources** in windows )
- in this file declare a **DISTANCE\_TO\_MOON** javascript variable and save the file :

           var DISTANCE_TO_MOON = 384400000;

- now you can access this data element by the following web-service

           http://localhost:8080/interesting-facts.js?expression=${DISTANCE_TO_MOON}

<br />

As you can see the URL consists of the following :

- **localhost:8080** is a host name which points to nexl-server

- **interesting-facts.js** is a filename in URL path

- **expression=${DISTANCE\_TO\_MOON}** is a query param which points to javascript variable from that file ( nexl source )

<br />

__${DISTANCE\_TO\_MOON}__ is called nexl expression

nexl expressions are representing javascript variables from the nexl sources by wrapping variable&#39;s name with **${...}** characters

nexl expressions allow to perform certain kind manipulations of variable&#39;s value. For example when you are trying to get a variable which was not declared you can apply a default value by using nexl expression.

nexl expressions will be discussed later.

<br />

Let&#39;s access our **DISTANCE\_TO\_MOON** variable in nexl-client

- run nexl-client
- click on &quot;New remote nexl source&quot; button
- in &quot;Remote server&quot; field write a **localhost:8080**
- click on &quot;Explore nexl source on remote server&quot; button and choose your file ( nexl source )
- click on &quot;Choose expression&quot; button and choose a **DISTANCE\_TO\_MOON** variable from the list ( nexl-client automatically wraps variable with **${...}** characters to make nexl expression )
- click &quot;Evaluate nexl expression&quot; button to get a variable&#39;s value from nexl-server ( or press F9 )
- in the output area you should see a value you assigned to that variable

<br />

Now let&#39;s consider how to simulate nexl-server&#39;s work locally

- click &quot;Open existing nexl source file&quot; button and open a **interesting-facts.js** file from your local file system
- next to &quot;Expression&quot;  field click a &quot;Choose expression&quot; button and choose a **DISTANCE\_TO\_MOON** variable as you did before
- click &quot;Evaluate nexl expression&quot; button ( or press F9 )
- you should see the same result in output area


* * *


### nexl expressions

nexl expression definition

        ${JS_VAR_NAME[modifier_id[modifier_value]][modifier_id[modifier_value]]...}

Modifiers are used to perform an additional tuning for variable&#39;s value. They are optional but very useful.

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
             



<br />

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




* * *


### nexl sources, include directive

nexl sources ( javascript files with data configuration ) are hosted by nexl-server in certain directory. It&#39;s possible to organize nexl sources in subdirectories. The web-services URL will be changed according to the directory structure.

For example if you put a **interesting-facts.js** file to **$HOME/nexl-sources/space** directory the URL will look like this :

        http://localhost:8080/space/interesting-facts.js?expression=${DISTANCE_TO_MOON}

<br />

It&#39;s possible to reuse a nexl sources within nexl-server. nexl has an include directive which  imports another nexl source. For example to import an external nexl source into **interesting-facts.js** file add the following :

        "@ /home/user/additional-nexl-sources/defs.js";

Relative path will be calculated relatively to **$HOME/nexl-sources** directory

        "@ ../defs.js";




* * *


### External arguments

You can provide an external arguments to nexl-server REST request. External arguments are key=value pairs which behave like javascript variables and accessed via nexl expressions. External arguments are passing by query param in URL. For example add the following to **interesting-facts.js** nexl source

        var ABOUT_BEETHOVEN = "Ludwig van Beethoven was born in ${YEAR}";

Now we can pass a **YEAR** external argument to evaluate a **${ABOUT_BEETHOVEN}** expression

        http://localhost:8080/interesting-facts.js?expression=${ABOUT_BEETHOVEN}&YEAR=1770


nexl-client has a graphical &quot;External Arguments&quot; section


* * *


### Important notes

- Be careful when declaring variable without **var** keyword. That kind of variables are treated as global variables and it can cause serious bugs in nexl expressions calculation




* * *


### Examples of nexl expressions**<br/>
Will be available soon


* * *

### Client side adapters

Will be available soon