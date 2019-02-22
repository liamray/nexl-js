#### What's nexl ?
nexl is a configuration hosting server.  
Configuration is stored in **native JavaScript files**, exposed via standard **HTTP protocol** and can be accessed by special **[expression language](http://www.nexl-js.com/introduction.html)**.  

nexl can be useful when you need to store and manage an application configuration externally instead of storing it hard coded.  
Another use case is when you need a centralized place to manage different kind of configurations.

#### Features

* JavaScript files [reuse](http://www.nexl-js.com/include-directive.html) on server side (files can include each other)
* Powerful [expression language](http://www.nexl-js.com/introduction.html) to retrieve data from JavaScript files
* Additionally expression language allows to aggregate data on the fly while retrieving (for example [merging two JavaScript objects](https://www.youtube.com/watch?v=p_dDtJ2BKEo&t=254) and then converting it to [XML/YAML/Property](https://www.youtube.com/watch?v=O_U1lAx4MMs))
* JavaScript [functions call](https://www.youtube.com/watch?v=c-on-20cZnM) to perform some additional data aggregation
* Viral [expressions interpolation](http://www.nexl-js.com/viral-expressions-interpolation.html) (i.e. you can inject expressions into your data which will be interpolated while retrieving it)
* [Nested expressions](http://www.nexl-js.com/nested-expressions.html) with unlimited depth
* External [arguments](http://www.nexl-js.com/arguments.html) to override existing data in JavaScript files
* Convenient [Web UI](http://www.nexl-js.com/the-main-screen.html) for configuration management and server administration
* [Security](http://www.nexl-js.com/security.html) and [permissions](http://www.nexl-js.com/users-and-permissions.html) support
* No agents needed on clients, nexl works via standard HTTP/HTTPS protocols

#### Installation
Before installing, [download and install Node.js](https://nodejs.org/en/download/).  
Node.js 6 or higher is required.  

Uninstall previously installed nexl version if exist:
```bash
> npm uninstall nexl -g
```


Install latest nexl version:
```bash
> npm i nexl -g
```


Run nexl:
```bash
> nexl
```

Open URL in browser:  
[http://localhost:8080](http://localhost:8080)

#### More
More about nexl on [http://www.nexl-js.com](http://www.nexl-js.com) site

Watch nexl demo:  
[![nexl demo](http://www.nexl-js.com/demo/3.1.0/demo.png)](http://www.nexl-js.com/demo/3.1.0/demo.php)