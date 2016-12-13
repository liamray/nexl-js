########################################################################
# powershell adapter for remote nexl server
# Copyright (c) 2016 Yevgeny Sergeyev
# License : Apache 2.0

# use a nexlEval function to retrieve data items from remote nexl server
# See Readme.md for more information
########################################################################


# args[0]      - nexl server ( for example : nexlserver:9191 )
# args[1]      - nexl source ( for example : /common/fact.js )
# args[2]      - nexl expression ( for example : ${T_DUMP} )
# args[3], ... - [key=value] pairs of nexl parameters ( for example : ENV=TEST )
function nexlEval
{
	# checking for ps version
	$ver = $PSVersionTable.PSVersion.Major
	if ( $ver -lt 3 )
	{
		throw "PowerShell 3 required. Your current version is ${ver}"
	}


	# collecting params
	$nexlServer = $args[0]
	$nexlSource = $args[1] -replace "^\/+","" # removing leading slash if presents
	$nexlSource = [uri]::EscapeDataString($nexlSource) # escaping URI characters ( for example SPACE will be replaced with %20 )
	$nexlExpression = $args[2]


	# iterating over the rest params and accumulating in $nexlParams
	For ($i=3; $i -le $args.Length - 1; $i++)
	{
		$nexlParams += $args[$i] + "&"
	}
	

	# building REST Url
	$FullUrl = "http://{0}/{1}?expression={2}&{3}" -f $nexlServer, $nexlSource, $nexlExpression, $nexlParams

	# invoking web service
	try {
		$result=Invoke-RestMethod -Uri "$FullUrl"
	} catch {
		handleError
		exit 1
	}

	# is result a PSCustomObject ?
	If ( $result.GetType().name.equals( 'PSCustomObject' )) {
		# converting to raw
		$result=Write-Output $result | ConvertTo-Json
	}

	$result
}

function handleError
{
	Write-Error $_.Exception.GetBaseException().Message.toString()
	
	$msg = "{0}, HTTP_STATUS = [{1}], url = [{2}]" -f $_.Exception.Response.StatusDescription, $_.Exception.Response.StatusCode.value__, $FullUrl
	Write-Error $msg
	
	if ( $_.Exception.Response -eq $null )
	{
		# nothing to add
		return
	}
	
	$result = $_.Exception.Response.GetResponseStream()
	$reader = New-Object System.IO.StreamReader($result)
	$reader.BaseStream.Position = 0
	$reader.DiscardBufferedData()
	$responseBody = $reader.ReadToEnd();

	Write-Error $responseBody
}


# evaluating...
nexlEval @args
