### ( this article is not finished yet... )
### Examples of nexl expressions

***

##### Simple expressions

nexl source file

        var x = 'Hello,World!';

| Expression | Result | Explanation
| --- | --- | ---
| ${x} | Hello,World! | nexl expression is referencing to <b>x</b> javascript variable from nexl source file
| ${count} | - | This expression will be failed due to <b>count</b> variable is not defined in nexl source file<br/>( but if you provide the <b>count</b> variable as external it will be evaluated successfully )
| ${count!C} |  | This expression is evaluating as empty string. The <b>count</b> variable is not defined, but here we have a <b>!C</b> modifier which tells us not to fail the expression
| ${count:10} | 10 | <b>count</b> variable is not defined, but default value is provided
| ${count:${Y}} | - | <b>count</b> variable is not defined. Trying to apply a default value which is a <b>${Y}</b> expression.<br/><b>${Y}</b> expression will be failed due to <b>Y</b> javascript variable is also undefined.<br/>Whole expression fill be failed
| ${count:${Y!C}:12} | 12 | Here we have two default values for <b>count</b> variable : <b>${Y!C}</b> and <b>12</b><br/><b>${Y!C}</b> expression tells us not to fail this expression if it is referencing to undefined variable<br/>Finally the <b>12</b> default value is applying for whole expression

***



##### Arrays 

nexl source file

        var devHosts = [ 'test', 'qa' ];
        var prodHosts = [ 'prod' ];
        
        var allHosts = [ '${devHosts}', '${prodHosts}' ]; // joining devHosts and prodHosts arrays into new allHosts array
        var mixedHosts = [ '${devHosts?,}', '${prodHosts}' ]; // joining the concatenated elements of devHosts array and prodHosts array into new mixedHosts array
        
        var port = 3915;
        var portsCollection = [ 8080, 3000 ];
        
        var urls = 'http://${allHosts}:${port}/rest'; // assembling url of allHosts array and port
        var urlsMultiple = 'http://${allHosts}:${portsCollection}/rest'; // cartesian product of allHosts array and portsCollection array


| Expression | Result | Explanation
| --- | --- | --- |
| ${devHosts} | test<br/>qa | Reference to javascript array. By default all elements on a new line
| ${devHosts?,} | test,qa | Concatenating array elements with <b>comma</b>
| ${allHosts} | test<br/>qa<br/>prod | Is a join of devHosts and prodHosts array 
| ${mixedHosts} | test,qa<br/>prod | Is a join of concatenated elements of devHosts array and prodHosts array 
| ${mixedHosts?;} | test,qa;prod | All arrays elements are concatenated with <b>;</b> symbol
| ${urls} | http://test:3915/rest<br/>http://qa:3915/rest<br/>http://prod:3915/rest | <b>urls</b> variable contains two nexl expressions : <b>${allHosts}</b> and <b>${port}</b> . The first expression points to array therefore we have an array as a result
| ${urls?;} | http://test:3915/rest;http://qa:3915/rest;http://prod:3915/rest | Array elements are concatenated with <b>;</b> symbol
| ${urlsMultiple} | http://test:8080/rest<br/>http://test:3000/rest<br/>http://qa:8080/rest<br/>http://qa:3000/rest<br/>http://prod:8080/rest<br/>http://prod:3000/rest |  <b>urlsMultiple</b> variable contains two nexl expressions <b>${allHosts}</b> and <b>${portsCollection}</b> where each expression is array. Therefore we get a cartesian product of two arrays

***

##### Omit whole expression modifier

nexl source file

        var greeting = 'Hello,${person!C}';
        var fact = [ 'bear',  'has',  '${cnt!C}',  'teeth' ];

| Expression | Result | Explanation
| --- | --- | ---
| ${greeting} | Hello, | This expression consists of <b>${person}</b> expression. The <b>person</b> variable is not defined therefore the <b>${person}</b> expression is treating as empty string
| ${greeting-} |  | Sometimes we need to omit the whole expression if it contains an undefined variable. We can achieve it by adding the <b>-</b> modifier. This is evaluating as empty string
| ${facts} | bear<br/>has<br/><br/>teeth | As you see the <b>${cnt}</b> expression from <b>facts</b> array is treating as empty string
| ${facts-} | bear<br/>has<br/>teeth | By using the <b>-</b> modifier we are omitting the array element which points to undefined variable


***
##### Objects


nexl source file

        var hostsByEnv = {
            TEST: 'testsrv1',
            QA: [ 'qasrv1', 'qasrv2' ],
            PROD: {
                FIRST: [ 'Mercury', 'Venus', 'Earth' ],
                SECOND: [ 'Mars', 'Jupiter', 'Saturn' ],
                THIRD: [ 'Uranus', 'Neptune' ]
            }
        };
        
        
        // play out with the following parameters
        // you can also provide them as external args
        var ENV = 'PROD';
        var INSTANCE = 'SECOND';
        var REVERSE_KEY = 'qasrv2';
        var REVERSE_KEY_MULTI = [ 'qasrv2', 'Neptune' ] ;


| Expression | Result | Explanation
| --- | --- | --- |
| ${hostsByEnv} |  |
| ${hostsByEnv~K} |  |
| ${hostsByEnv~V} |  |
| ${ENV~O} |  |
| ${hostsByEnv.${ENV}} |  |
| ${hostsByEnv.${ENV!C}} |  | If you don't provide a ENV variable, ...
| ${hostsByEnv.${ENV}.${INSTANCE}} |  |
| ${hostsByEnv.${ENV!A}.${INSTANCE}:${hostsByEnv.${ENV}}} |  |
| ${hostsByEnv<${REVERSE_KEY}} |  |
| ${hostsByEnv<${REVERSE_KEY_MULTI}} |  |

<br/>
<br/>
nexl source file

        var liveKeyValueDemo = {
            '${key}': '${value}'
        };
        
        
        var key = 'Hello World !';
        var value = 'resolveMe';
        
        
| Expression | Result | Explanation
| --- | --- | --- |
| ${liveKeyValueDemo<resolveMe} |  |
        

***

js function evaluation
<br/>
nexl engine instance