### ( this article is not finished yet... )
### Examples of nexl expressions

***

#### Simple expressions

nexl source file

        var x = 'Hello,World!';

| Expression | Result | Explanation
| --- | --- | ---
| ${x} | Hello,World! | nexl expression is referencing to <b>x</b> javascript variable from nexl source file
| ${count} | - | This expression will be failed due to <b>count</b> variable is not defined in nexl source file<br/>( but if you provide the <b>count</b> variable as external it will be evaluated successfully )
| ${count!C} |  | This expression is evaluating to empty string. The <b>count</b> variable is not defined, but here we have a <b>!C</b> modifier which tells us not to fail the expression
| ${count:10} | 10 | <b>count</b> variable is not defined, but default value is provided
| ${count:${Y}} | - | <b>count</b> variable is not defined. Trying to apply a default value which is a <b>${Y}</b> expression.<br/><b>${Y}</b> expression will be failed due to <b>Y</b> javascript variable is also undefined.<br/>Whole expression fill be failed
| ${count:${Y!C}:12} | 12 | Here we have two default values for <b>count</b> variable : <b>${Y!C}</b> and <b>12</b><br/>The <b>${Y!C}</b> is a nexl expression with <b>!C</b> modifier which tells us to continue expression evaluation even if the <b>Y</b> variable is not defined. In this case the <b>Y</b> variable is really undefined. Thus the next default value will be applied which is <b>12</b>

***



#### Arrays 

nexl source file

        var devHosts = [ 'test', 'qa' ];
        var prodHosts = [ 'prod' ];
        
        var allHosts = [ '${devHosts}', '${prodHosts}' ]; // joining the devHosts and prodHosts arrays
        var mixedHosts = [ '${devHosts?,}', '${prodHosts}' ]; // joining the concatenated elements of devHosts array and prodHosts
        
        var port = 3915;
        var portsCollection = [ 8080, 3000 ];
        
        var urls = 'http://${allHosts}:${port}/rest'; // assembling url of allHosts array and port ( explaining below )
        var urlsMultiple = 'http://${allHosts}:${portsCollection}/rest'; // cartesian product of allHosts array and portsCollection array ( explaining below )


| Expression | Result | Explanation
| --- | --- | --- |
| ${devHosts} | test<br/>qa | Referencing to a javascript array. By default all elements on a new line
| ${devHosts?,} | test,qa | Concatenating array elements with <b>comma</b>
| ${allHosts} | test<br/>qa<br/>prod | Is a join of devHosts and prodHosts array 
| ${mixedHosts} | test,qa<br/>prod | Is a join of concatenated elements of devHosts array and prodHosts array 
| ${mixedHosts?;} | test,qa;prod | All arrays elements are concatenated with <b>;</b> symbol ( the elements are : 'test,qa' and 'prod' )
| ${urls} | http://test:3915/rest<br/>http://qa:3915/rest<br/>http://prod:3915/rest | <b>urls</b> variable contains two nexl expressions : <b>${allHosts}</b> and <b>${port}</b> . The first expression points to array therefore we have an array as a result
| ${urls?;} | http://test:3915/rest;http://qa:3915/rest;http://prod:3915/rest | Array elements are concatenated with <b>;</b> symbol
| ${urlsMultiple} | http://test:8080/rest<br/>http://test:3000/rest<br/>http://qa:8080/rest<br/>http://qa:3000/rest<br/>http://prod:8080/rest<br/>http://prod:3000/rest |  <b>urlsMultiple</b> variable contains two nexl expressions <b>${allHosts}</b> and <b>${portsCollection}</b> where each expression is array. Therefore we get a cartesian product of two arrays

***

#### Omit whole expression modifier

nexl source file

        var text = 'Hello,${person!C}';
        var fact = [ 'bear',  'has',  '${cnt!C}',  'teeth' ];

| Expression | Result | Explanation
| --- | --- | ---
| ${text} | Hello, | This expression consists of <b>${person}</b> expression with <b>!C</b> modifier. The <b>person</b> variable is not defined therefore the <b>${person!C}</b> expression is treating as empty string
| ${text-} |  | Sometimes we need to omit the whole expression if it contains an undefined variable. We can achieve it by adding the <b>-</b> modifier. This is evaluating to empty string due to <b>${text-}</b> expression has a subexpression <b>${person!C}</b> with undefined value
| ${facts} | bear<br/>has<br/><br/>teeth | As you see the <b>${cnt!C}</b> expression from <b>facts</b> array is treating as empty string
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
        // you can also provide them as an external args ( except REVERSE_KEY_MULTI )
        var ENV = 'PROD';
        var INSTANCE = 'SECOND';
        var REVERSE_KEY = 'qasrv2';
        var REVERSE_KEY_MULTI = [ 'qasrv2', 'Neptune' ] ;


| Expression | Result | Explanation
| --- | --- | --- |
| ${hostsByEnv} | hostsByEnv JSON | This is evaluating as a JSON object of hostsByEnv
| ${hostsByEnv~K} | TEST<br/>QA<br/>PROD | Array of hostsByEnv's keys
| ${hostsByEnv~K?,} | TEST,QA,PROD | The keys are joined with <b>,</b> symbol
| ${hostsByEnv~V} | testsrv1<br/>qasrv1<br/>qasrv2<br/>Mercury<br/>Venus<br/>Earth<br/>Mars<br/>Jupiter<br/>Saturn<br/>Uranus<br/>Neptune | Array of hostsByEnv's values
| ${ENV~O} | {"ENV":"QA"} | The <b>ENV</b> varaible is forced to convert to JSON object
| ${hostsByEnv.${ENV}} | {"FIRST":["Mercury","Venus","Earth"],<br/>"SECOND":["Mars","Jupiter","Saturn"],<br/>"THIRD":["Uranus","Neptune"]} | The <b>ENV</b> variable is equals to <b>PROD</b> therefore nexl engine evaluates the the <b>${hostsByEnv.PROD}</b> expression which points to JSON object
| ${hostsByEnv.${SPECIAL_ENV!C}} | hostsByEnv JSON | The <b>SPECIAL_ENV</b> variable is not defined and has a <b>!C</b> modifier. Therefore it is evaliating as empty string.<br/>Now we heave a <b>${hostsByEnv.}</b> expression. nexl engine eliminates unnecessary dots for sub expressions and this will be evaluated as <b>${hostsByEnv}</b> expression
| ${hostsByEnv.${ENV}.${INSTANCE}} | Mars<br/>Jupiter<br/>Saturn | The <b>ENV</b> variable is equals to <b>PROD</b>, the <b>INSTANCE</b> variable is equals to <b>SECOND</b>. Therefore we have the following nexl expression to evaluate : <b>${hostsByEnv.PROD.SECOND}</b> which is points to the <b>[ 'Mars', 'Jupiter', 'Saturn' ]</b> array<br/><br/>This expression has a problem. Saying the <b>ENV</b> variable is equals to TEST. nexl engine will try to evaluate the following : <b>${hostsByEnv.TEST.SECOND}</b> . If you take a look to a <b>hostsByEnv</b> object you will figure you that <b>TEST</b> doesn't have the <b>SECOND</b> property. Therefore this expression will be failed. We have to improve our expression to solve this problem. See next example
| ${hostsByEnv.${SPECIAL_ENV}.${INSTANCE}:${hostsByEnv.${SPECIAL_ENV}}} | depends on <b>SPECIAL_ENV</b> | This expression fixes that problem by using of default value modifier.
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
