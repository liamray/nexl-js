// primitive number
distanceToMoon = 384400;

// array
fruits = ['Mango', 'Banana', 'Orange', 'Annona', 'Grape'];

// object
person = {
	name: 'Alex',
	age: 25,
	country: 'Canada'
};

// nested objects
nestedObjs = {
	distanceToMoon: '${distanceToMoon}',

	car: {
		make: 'Ford',
		model: 'Mustang',
		year: 1969
	}
};

/*******************************************************************************************************************************************
 ::::::::: nexl expressions examples :::::::::
 Similarly to SQL, nexl expressions pick data elements from JavaScript file(s), mix, transform and assemble new data structures from them
 Try each example yourself by putting it in "Expression" field and clicking "Evaluate nexl expression" button ( F9 )
 ********************************************************************************************************************************************

 ${person.name}
 First resolves person object and then resolves a [name] property of that object

 ${fruits}
 Resolves fruits array

 ${fruits#S}
 1) Resolves fruits array
 2) Sorts it #S

 ${fruits&,}
 1) Resolves fruits array
 2) Joins all array elements with comma &,

 ${fruits&\n}
 1) Resolves fruits array
 2) Joins all array elements with CR &\n

 ${fruits#S&,}
 1) Resolves fruits array
 2) Sorts it #S
 3) Joins all elements with comma &,

 ${fruits-Banana}
 1) Resolves fruits array
 2) Removes all 'Banana' string element(s) from that array

 ${fruits+Apple}
 1) Resolves fruits array
 2) Appends an 'Apple' string element to that array

 ${fruits-Banana+Apple#S&,}
 1) Resolves fruits array
 2) Removes all 'Banana' string element(s)
 3) Appends 'Apple' string element
 4) Sorts array #S
 5) Joins all elements with comma &,

 ${fruits[-1]}
 1) Resolves fruits array
 2) Resolves the second array element from the end ( negative index )

 ${person~X}
 ${person~Y}
 ${person~P}
 1) Resolves person object
 2) Produces an XML ( ~X ), YAML ( ~Y ) and key-value pairs ( ~P ) from that object

 ${person~K}
 1) Resolves person object
 2) Resolves its key set as array ~K

 ${person~V}
 1) Resolves person object
 2) Resolves all its values as array ~V

 ${person~V&,}
 1) Resolves person object
 2) Resolves its values as array ~V
 3) Joins all array elements with comma &,

 ${person~K#s[$]}
 1) Resolves person object
 2) Resolves its key set as array ~K
 3) Sorts array in descending order #s
 4) Resolves last array element [$]

 ${person.country[3..$]^U1}
 1) Resolves person object
 2) Resolves a country property as string from that object
 3) Substrings country string from fourth element to the end [3..$]
 4) Capitalizes string's first letter ^U1

 ${person<Alex}
 1) Resolves person object
 2) Resolves its key by 'Alex' string value <Alex ( i.e. makes object property reverse resolution ). The result is array because it can resolve multiple values

 ${person<Alex[0]}
 1) Resolves person object
 2) Resolves its key by 'Alex' string value <Alex
 3) Resolves the first array element [0]

 ${person~K+${fruits}&,}
 1) Resolves person object
 2) Resolves its key set as array
 3) Appends ${fruits} array to the that array
 4) Joins all array elements with comma &,

 ${distanceToMoon}
 Resolves distanceToMoon primitive variable

 ${distanceToMoon~O}
 1) Resolves distanceToMoon primitive variable
 2) Converts that variable to JavaScript object ~O

 ${distanceToMoon~O~P}
 1) Resolves distanceToMoon primitive variable
 2) Converts that variable to JavaScript object ~O
 3) Produces a key-value pairs of it ( i.e. distanceToMoon=384400 )

 ${distanceToMoon~O+${person}}
 1) Resolves distanceToMoon primitive variable
 2) Converts that variable to JavaScript object ~O
 3) Merges a ${person} object to that object

 ${Math.PI}
 Resolves Math object and then resolves a PI property from that object

 ${Math.PI|Math.round()}
 1) Resolves Math object
 2) Resolves PI property from that object
 3) Pushes that value to the stack
 4) Resolves Math object
 5) Resolves round function from that object
 6) Executes that function which automatically gets Math.PI value from the stack

 ${Math.round( ${Math.PI} )}
 Same to the previous example without stack

 ${Math.PI|distanceToMoon|Math.max()}
 1) Resolves Math object
 2) Resolves PI property from that object
 3) Pushes that value to the stack
 4) Resolves distanceToMoon primitive variable
 5) Pushes that value to the stack
 6) Resolves Math object
 7) Resolves max function from that object
 8) Executes that function which automatically gets Math.PI and distanceToMoon values from the stack

 ${fruits[]${_item_^U}}
 Resolves fruits array and iterates over array elements with ${_item_^U} expression. This expression does :
 1) Resolve _item_ virtual JavaScript variable which represents each item in iteration
 2) Upper case it
 3) Replace current array element in iteration with that value


 ${person[]${_key_^U+ |_value_^L|concat()}}
 Resolves person object and iterates over its fields with ${_key_^U|@ |_value_^L|concat()} expression. This expression does :
 1) Resolve _key_ virtual JavaScript variable which represents object key in iteration
 2) Uppercase it ( ^U )
 3) Append space character to that string ( +  )
 4) Push it to the stack |
 5) Resolve _value_ virtual JavaScript variable which represents object value in iteration
 6) Lowercase it
 7) Push it to the stack |
 8) Resolve concat nexl function
 9) Execute that function which automatically gets its arguments from the stack and concatenates those 3 items to one string


 ${person~K|person~V|concat()}
 1) Resolves person object
 2) Resolves its key set as array ~K
 3) Pushes that array to the stack |
 4) Resolves person object
 5) Resolves its values as array ~V
 6) Pushes that array to the stack |
 7) Resolves concat() nexl function and calls it. This function automatically gets all arguments from the stack ( those two arrays )
 concat() function joins multiple arrays, merges multiple objects and merges multiple primitives

 ${nestedObjs}
 Resolves nestedObjs object. This object has calculable distanceToMoon field with '${distanceToMoon}' string value.
 This value will be evaluated and substituted by nexl engine

 ${random()}
 Similar to ${Math.random()} expression. From the nexl 2.3.0 version all Math objects are automatically available without Math prefix

 ${random()=distanceToMoon;nestedObjs}
 1) Resolves random() function and evaluates it
 2) Assigns function result to the distanceToMoon variable. It overrides the distanceToMoon variable's value
 3) Resolves nestedObjs object which has a calculable distanceToMoon field and it gets a value returned by random() function
 * Please pay attention, when you override variable's value it will not affect other requests to nexl. All nexl requests are isolated from each other

 ${person-age;person}
 1) Resolves person object
 2) Eliminates an age property from that object
 3) Resolves person object again ( but this time without age property )
 * Please pay attention ! person object modification doesn't update nexl source file ! If affects only for current HTTP request.
 All other requests will get a person object as it declared

 ${distanceToMoon~O|person|concat()=tmp;tmp~K|tmp~V|concat()#S}
 1) Resolves distanceToMoon variable and wrap it with object ~O
 2) Pushes that value to the stack |
 3) Resolves person object and pushes it to the stack |
 4) Resolves concat() function and executes it with arguments from the stack. It will merge two objects from the stack
 5) Stack is cleaned up after function call
 6) Assigns last execution result to tmp variable which is object
 7) Resolves tmp object, resolves its key set ~K and pushes that value to the stack |
 8) Resolves again tmp object, resolves its values ~V and pushes that value to the stack |
 9) Resolves concat() function and calls it. It will merge two arrays pushed to the stack before
 10) Sorts array #S

 ${nestedObjs|@1|keys()}
 1) Resolves nestedObjs object and pushes it to the stack |
 2) Pushes a '1' string value to the stack |
 3) Resolves keys() function and calls it -> keys( nestedObjs, '1' ) where arguments are taken from the stack
 The keys() function resolves object key set at specified level.
 In this example it will resolve key set of nestedObjs object at first depth level

 ${nestedObjs|@1|vals()}
 Similar to the previous example but resolves values

 ${person%name}
 1) Resolves person object
 2) Resolves its all values except name

 ${person|@name|keyVals()}
 1) Resolves person object and pushes that value to the stack |
 2) Pushes a 'name' string value to the stack |
 3) Resolves keyVals() function and calls it -> keyVals( person, 'name' ) where arguments are taken from the stack
 This function returns object with 'name' field. Arrays are also acceptable for the second argument

 ${distanceToMoon|distanceToMoon|distanceToMoon|inc()}
 1) Resolves distanceToMoon variable and pushes it the stack ( 3 times )
 2) Resolves inc() function and calls it -> inc( distanceToMoon, distanceToMoon, distanceToMoon ) where arguments are taken from the stack
 This function increases its first argument to all subsequent arguments

 ${fruits|@1|@3|delAt()}
 1) Resolves fruits array and pushes it to the stack |
 2) Pushes a '1' string value to the stack |
 3) Pushes a '3' string value to the stack |
 4) Resolve delAt() function and calls it -> delAt( fruits, '1', '3' ) where arguments are taken from the stack
 This function deletes 3 array elements from first position

 ${person|@name|@sername|setKey()}
 1) Resolves person object and pushes it to the stack |
 2) Pushes a 'name' string value to the stack |
 3) Pushes a 'sername' string value to the stack |
 4) Resolves setKey() function and calls it -> setKey( person, 'name', 'sername' ) where arguments are taken from the stack
 This function changes the 'name' field to 'sername' in person object

 ${person|@name|@sername|setVal()}
 Similar to the previous example but it changes a value of 'name' field in person object


 :::: More about nexl expressions here -> http://www.nexl-js.com/nexl-scripting-language.html ::::
 */
