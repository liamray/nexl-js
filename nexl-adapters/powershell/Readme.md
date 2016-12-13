## nexl powershell adapter

nexl bash adapter offers a nexlEval() function to access data items on remote nexl server

##### nexlEval() function accepts the following parameters :
        args[0]      - nexl server ( for example : nexlserver:9191 )
        args[1]      - nexl source ( for example : /common/fact.js )
        args[2]      - nexl expression ( for example : ${DISTANCE_TO_MOON} )
        args[3], ... - [key=value] pairs of nexl parameters ( for example : ENV=TEST )
 

Requires powershell 3 or higher version

You have to check the exit status of nexlEval() function after execution ( %errorlevel% ). Be sure you get a zero status. Otherwise check a stderr for error message

Additionally you can use a <b>nexl-powershell-adapter.bat</b> batch file which is wrapping powershell script

* * *

##### Usage example in powershell :
    nexlEval "nexlserver:9191" "/common/facts.js" "${DISTANCE_TO_MOON}" "YEAR=1979"
