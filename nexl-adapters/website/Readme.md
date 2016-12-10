## nexl web-site adapter

nexl web-site adapter is intended to access data items on remote nexl server from web sites.

This adapter is based on JSONP technology to access a remote nexl server outside the web-site's domain.

nexl web-site adapter is using a jQuery API ( must be included in web-page ) 

Use the following function to access nexl server : module.nexlWebAdapter.nexlEval()

Function definition : nexlEval(params, callback, errorCallback)

- params is an object which should have the following : 
    - nexlServer
    - nexlSource
    - nexlExpression
    - nexlArgs ( optional parameter which is object itself and contains key:value pairs as arguments )
    - httpTimeout ( optional. 10 seconds by default )
- callback ( the first argument of this function is a data from nexl server )
- errorCallback ( optional function which is fired on error and has 3 error arguments )
      

* * *

#### Usage example
    var params = {
        nexlServer: 'nexlserver:8181',
        nexlSource: '/misc/interesting-facts.js',
        nexlExpression: '${DISTANCE_TO_MOON}',
        nexlArgs: {
            YEAR: 1979
        }
    };

    module.nexlWebAdapter.nexlEval(params, function (data) {
        alert(data);
    }, function(x, opts, error) {
        // jquery error
        alert(x + '\n' + opts + '\n' + error);
    });
