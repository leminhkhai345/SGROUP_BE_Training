//array
const numbers = [1, 2, 3];

const newNumbers = [...numbers, 4, 5];

console.log(newNumbers);

//object
const person = {
    name: 'John',
    age: 30
};

const newPerson = {
    ...person,
    city: 'New York'
};
    
console.log(newPerson);