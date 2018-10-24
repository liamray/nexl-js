#### What's nexl ?
nexl is a configuration storage system. Configuration is stored in native JavaScript files, exposed via standard HTTP protocol and can be accessed by special expression language

nexl can be useful when you need to manage some project data without re-deploying a project or restarting a server. JavaScript files are flexible enough to build a convenient configuration infrastructure suitable for almost any project.

#### nexl has a lot of usable features:

* JavaScript files reuse on server side (files can include each other)
* Powerful expression language to retrieve data from JavaScript files<br/>
* Additionally expression language allows to aggregate data on the fly while retrieving (for example merging two JavaScript objects and then converting it to XML/YAML/Property)
* JavaScript functions call to perform some additional data aggregation
* Viral expressions interpolation (i.e. you can inject expressions into your data which will be interpolated while retrieving it)
* Nested expressions with unlimited depth
* External arguments to override existing data in JavaScript files
* Convenient Web UI for configuration management and server administration
* Security and permissions support
* No agents needed on clients, nexl works via standard HTTP/HTTPS protocols

More about nexl on [http://www.nexl-js.com](http://www.nexl-js.com)
