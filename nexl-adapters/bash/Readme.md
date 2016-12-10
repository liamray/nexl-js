## nexl bash adapter

nexl bash adapter offers a nexlEval function to access data items on remote nexl server

##### nexlEval function accepts the following parameters :
        $1            nexl server address and port
        $2            nexl source
        $3            nexl expression
        $4, $5, ...   arguments ( optional )
 
This function performs a HTTP request to remote nexl server. To control a http timeout provide a NEXL_HTTP_TIMEOUT global variable. The default value is 10 seconds.

You have to check the exit status of nexlEval function after execution ( $? ). Be sure you get a zero status. Otherwise check a stderr for error message
 
Please pay attention ! You have to escape a $ sign for nexl expression, otherwise it will be treated as a shell variable

* * *

##### Usage example :
    #!/bin/bash
    ...
    DTM=$( nexlEval "nexlserver:8181" "/misc/interesting-facts.js" "\${DISTANCE_TO_MOON}" "YEAR=1979" )
