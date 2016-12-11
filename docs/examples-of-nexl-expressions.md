### ( this article is not finished yet... )
### Examples of nexl expressions


***

##### Simple expressions

nexl source file

        var x = 'Hello,World!';

| Expression | Result | Description
| --- | --- | ---
| ${x} | Hello,World! | nexl expression is referencing to <b>x</b> javascript variable
| ${count} | - | This expression will fail due to <b>count</b> variable is not defined
| ${count!C} |  | This expression is evaluating as empty string. The <b>count</b> variable is not defined, but here we have a <b>!C</b> modifier which tells us not to fail the expression
| ${count:10} | 10 | <b>count</b> variable is not defined, but default value is provided
| ${count:${Y}} | - | <b>count</b> variable is not defined. Trying to apply a default value which is a <b>${Y}</b> expression.<br/><b>${Y}</b> expression will be failed due to <b>Y</b> javascript variable is also undefined.<br/>Whole expression fill be failed
| ${count:${Y!C}:12} | 12 | Here we have two default values for <b>count</b> variable : <b>${Y!C}</b> and <b>12</b><br/><b>${Y!C}</b> expression tells us not to fail this expression if it is referencing to undefined variable<br/>Finally the <b>12</b> default value is applying for whole expression


    
 
***

##### Arrays 

nexl source file

        var devHosts = [ 'test', 'qa' ];
        var prodHosts = [ 'prod' ];
        
        var allHosts = [ '${devHosts}', '${prodHosts}' ]; // new array of devHosts and prodHosts 
        var mixedHosts = [ '${devHosts?,}', '${prodHosts}' ]; // new array of concateneted devHosts and prodHosts
        
        var port = 3915;
        var portsCollection = [ 8080, 3000 ];
        
        var urls = 'http://${allHosts}:${port}/rest'; // assembling url of allHosts arrays and port
        var urlsMultiple = 'http://${allHosts}:${portsCollection}/rest'; // cartesian product of allHosts array and portsCollection array


| Expression | Result | Description
| --- | --- | --- |
| ${devHosts} | test<br/>qa | Reference to javascript array. By default all elements on a new line
| ${devHosts?,} | test,qa | Concatenating array elements with <b>comma</b>
| ${allHosts} | test<br/>qa<br/>prod | <b>allHosts</b> is consisted of two arrays
| ${mixedHosts} | test,qa<br/>prod | 
| ${urls} | http://test:3915/rest<br/>http://qa:3915/rest<br/>http://prod:3915/rest |
| ${urls?;} | http://test:3915/rest;http://qa:3915/rest;http://prod:3915/rest |
| ${urlsMultiple} | http://test:8080/rest<br/>http://test:3000/rest<br/>http://qa:8080/rest<br/>http://qa:3000/rest<br/>http://prod:8080/rest<br/>http://prod:3000/rest | This is a cartesian product example when two nexl expressions reference to arrays 


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


| Expression | Result | Description
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
        
        
| Expression | Result | Description
| --- | --- | --- |
| ${liveKeyValueDemo<resolveMe} |  |
        

***

js function evaluation
<br/>
nexl engine instance