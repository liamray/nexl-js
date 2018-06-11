export const EXAMPLES_FILE_NAME = 'examples.js';

export const EXAMPLES_JS = `// primitive number
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
    distanceToMoon: '\${distanceToMoon}',

    car: {
        make: 'Ford',
        model: 'Mustang',
        year: 1969
    }
};

nexl.defaultExpression = 'This is a default nexl expression for this file. It converts a person object to XML\\n\\n\${person~X}';`;
