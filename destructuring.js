const user = {
    name: 'John Doe',
    age: 30,
    email: 'john.doe@example.com',
    address: {
        street: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zip: '12345'
    }
};

const {name, age, hehe = 10, ...otherProperties} = user;
console.log(otherProperties); 

const {street} = otherProperties.address;
console.log(street); // Output: 123 Main St