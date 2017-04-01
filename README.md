### What is nexl-js

nexl-js is :

    1. REST server
    2. Scripting language

<u>nexl REST server</u> hosts JavaScripts files and exposes their primitives, arrays and objects via REST API. You might need it to store a distributed configuration/data of different servers, clients etc. in a centralized place.

<u>nexl scripting language</u> is intended to perform a wide variety of data manipulations with JavaScript primitives, arrays and objects hosted by <u>nexl REST server</u> in a single nexl expression. For example you can merge two or more JavaScript objects and produce an XML of them; or to join few arrays, eliminate duplicate elements, sort the rest elements and join them with comma.

In other words you store your configuration/data in native JavaScript form and access it via REST by using nexl expression language which gives you a lot of power to make data manipulations on the fly.

### Products and installation

There are two cross platform products : <u>nexl-server</u> and <u>nexl-client</u>.

<u>nexl-server</u> is a REST server which hosts and exposes JavaScript files.

<u>nexl-client</u> is a GUI application to interact with nexl-server and to simulate server&#39;s work locally.

<b>Installation</b>

1. Download and install a latest version of [nodejs](https://nodejs.org/en/download/).
2. Open a command line and write the following to install nexl-server and nexl-client:<br/>
&nbsp;&nbsp;&nbsp;a) npm install nexl-server -g<br/>
&nbsp;&nbsp;&nbsp;b) npm install nexl-client -g


### Creating simple JS file and exposing it via REST

Create <u>nexl-sources</u> directory in your <b>${HOME}</b> directory (<b>%userprofile%</b> in Windows).

Create a <u>example.js</u> file with the following content and put it in the <u>nexl-sources</u> directory :

    distanceToMoon = 384400;
    fruits = ['Mango', 'Banana', 'Orange', 'Annona', 'Grape'];
    person = {
      name: 'Alex';,
      age: 25,
      country: 'Canada'
    };

Open command line and type there <b>nexl-server</b> to start <u>nexl-server</u>.

![](http://www.nexl-js.com/images/image01.png "nexl-server") 

Now the <u>example.js</u> file is exposed via REST.

You can access <u>distanceToMoon</u>, <u>fruits</u> and <u>person</u> variables from that file by the following URLs :

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[http://localhost:8080/example.js?expression=${distanceToMoon}](http://localhost:8080/example.js?expression=%24%7BdistanceToMoon%7D)

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[http://localhost:8080/example.js?expression=${fruits}](http://localhost:8080/example.js?expression=%24%7Bfruits%7D)

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[http://localhost:8080/example.js?expression=${person}](http://localhost:8080/example.js?expression=%24%7Bperson%7D)

<b>${distanceToMoon}</b>, <b>${fruits}</b> and <b>${person}</b> are nexl expressions.

Let&#39;s show a power of nexl expressions what they can do.

| Expression | Explanation |
| --- | --- |
| [${fruits&amp;,}](http://localhost:8080/example.js?expression=%24%7Bfruits%26,%7D) | Joins elements of fruits array with comma |
| [${fruits#S}](http://localhost:8080/example.js?expression=%24%7Bfruits%23S%7D) | Sorts fruits array |
| [${fruits#S&amp;\n}](http://localhost:8080/example.js?expression=%24%7Bfruits%23S%26\n%7D) | First sorts fruits array and then joins array elements with LF |
| [${person~X}](http://localhost:8080/example.js?expression=%24%7Bperson~X%7D) | Produces an XML from person object |

To be continued below

### nexl-client GUI application

Let&#39;s continue demonstrating nexl expressions in more convenient way by using <u>nexl-client</u> GUI application.

Run <u>nexl-client</u> by typing <b>nexl</b> in command line. It will open your default browser with nexl client application ( it&#39;s recommended to use a Chrome or FireFox browsers ).

![](http://www.nexl-js.com/images/image02.png "nexl-client")
 
Click <b>"New remote nexl source"</b> button.

Enter <u>localhost:8080</u> in <b>"Remote server"</b> field.

Enter <u>example.js</u> in <b>"nexl source"</b> field.

And finally start entering nexl expressions from previous and following examples into <b>"Expression"</b> field to evaluate them on remote nexl-server.

Press <b>F9</b> to evaluate nexl expression ( or click <b>"Evaluate nexl expression"</b> green button )

![](http://www.nexl-js.com/images/image00.png "remote nexl source")

### nexl expressions examples ( continued )

| nexl expression | Explanation |
| --- | --- |
| ${person.name} | First resolves person object and then resolves a name property of that object |
| ${fruits#S} | Resolves a fruits array and sorts it |
| ${fruits#S&amp;,} | First sorts fruits array and then joins all elements with comma |
| ${fruits[-1]} | Resolves a second element from the end of fruits array |
| ${person~K} | Resolves a key set of person object as array |
| ${person~V&amp;,} | Resolves all values of person object as array and then joins all array elements with comma |
| ${person~K#s[$]} | Resolves a key set of person object as array, sorts them in descending order, resolves last array element |
| ${person.country[3..$]^U1} | Resolves a country property of person object, substrings it from fourth element to the end and then capitalizes a first letter |
| ${person~X}${person~Y}${person~P} | Produces an XML, YAML and key-value pairs ( property file ) from person object |
| ${person&lt;Alex} | Resolves a key of person object by &#39;Alex&#39; string value ( i.e. makes object property reverse resolution ).The result is array |
| ${person&lt;Alex[0]} | Resolves a key of person object by &#39;Alex&#39; value as array and then resolves a first array element |
| ${person~K+${person~V}&amp;\t} | Joins two arrays. The first array is a key set of a person object, the second array are values of a person object. Finally joins all array elements with tab character |
| ${distanceToMoon~O} | Converts a distanceToMoon primitive number to JavaScript object |
| ${distanceToMoon~O~P} | Converts a distanceToMoon primitive number to JavaScript object and then produces a key-value pair of it distanceToMoon=384400 |
| ${distanceToMoon~O+${person}} | Converts a distanceToMoon primitive number to JavaScript object and then merges to him person object |
| ${Math.PI} | Resolves a PI property from Math object |
| ${Math.PI&#124;Math.round()} | Resolves a PI property from Math object and pushes it to stack. Calles a Math.round() function which automatically gets a Math.PI argument from the stack |
| ${Math.PI&#124;distanceToMoon&#124;Math.max()} | Pushes a Math.PI to the stack, then pushes a distanceToMoon to the stack. Finally calls a Math.max() function which gets arguments from the stack |



Visit [http://www.nexl-js.com](http://www.nexl-js.com) website for more information about nexl server, client and expression language.