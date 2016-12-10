#!/bin/bash

########################################################################
# bash adapter for remote nexl server
# Copyright (c) 2016 Yevgeny Sergeyev
# License : Apache 2.0

# use nexlEval function to retrieve data items from remote nexl server
# See Readme.md for more information
########################################################################

function assembleUrl {
	local NEXL_SERVER="${1}"
	local NEXL_SOURCE="${2}"
	local NEXL_EXPREESSION="${3}"

	# remove leading slash character in NEXL_SOURCE if present
	NEXL_SOURCE=$( echo ${NEXL_SOURCE} | sed 's/^\///' )

	# assembling url from NEXL_SERVER_URL pattern
	local URL=$( printf "${NEXL_SERVER_URL}" "${NEXL_SERVER}" "${NEXL_SOURCE}" "${NEXL_EXPREESSION}" )

	# iterating over arguments starting from fourth and adding parameters to the URL
	local ARG=
	for ARG in "${@:4}"
	do
		URL="${URL}&${ARG}"
	done

	# returning URL
	echo "${URL}"
}

#   $1          nexl server address and port ( nexl:8181 )
#   $2          nexl source ( is a javascript file which contains your configuration data )
#   $3          nexl expression ( to retrieve the specific data item from nexl source ) ( *** PLEASE PAY ATTENTION *** You have to escape a $ sign in nexl expression, otherwise it will be treated as bash variable. See examples in Readme.md )
#   $4, $5, ... arguments ( optional )
function nexlEval {
    local NEXL_SERVER_URL="http://%s/%s?expression=%s"

	local NEXL_RESULT=

	# assembling URL based on input parameters
	local URL=$( assembleUrl "$@" )

	# set the 10 seconds for timeout if NEXL_HTTP_TIMEOUT is not specified
	if [[ -z "${NEXL_HTTP_TIMEOUT:-}" ]]
	then
		NEXL_HTTP_TIMEOUT=10
	fi

	# evaluating nexl expression by querying the URL
	NEXL_RESULT=$( curl --retry 0 --connect-timeout ${NEXL_HTTP_TIMEOUT} -s -w "%{http_code}" -g "${URL}" )

	# storing exit code
	local EXIT_CODE=$?

	# retrieving HTTP_STATUS from NEXL_RESULT
	local HTTP_STATUS=$( echo ${NEXL_RESULT} | grep -o "[0-9]\{3\}$" )

	# removing HTTP_STATUS from the end of NEXL_RESULT
	NEXL_RESULT=$( echo "${NEXL_RESULT}" | sed 's/[0-9]\{3\}$//' )

	# is EXIT_CODE 0 and HTTP_STATUS within 200..299 ?
	if [[ "${EXIT_CODE}" == "0" ]] && [[ "${HTTP_STATUS}" =~ 2[0-9]{2} ]]
	then
		#                                      adding \n at the end in order to [while read] will be able to read last line
		NEXL_RESULT=$( echo "${NEXL_RESULT}" | sed -e '$a\' )

		# returning results back to caller
		echo "${NEXL_RESULT}"
		return
	fi

	# error occured
	echo -e "\n>>>>>>>>>>>>>>>>>>>>>>>>>> nexl is not available OR failed to evaluate a nexl expression <<<<<<<<<<<<<<<<<<<<<<<<<<\n" 1>&2
	if [[ -n "${NEXL_RESULT:-}" ]]
	then
		echo -e "Reason :${NEXL_RESULT}" 1>&2
	fi

	echo "curl exit code = [${EXIT_CODE}], HTTP_STATUS = [${HTTP_STATUS}]" 1>&2
	echo "nexl url = [${URL}]" 1>&2
}