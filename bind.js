const user = {
    name: 'John Doe',
    getName: function(){ return this.name; }
}

const getName = user.getName;
const getName = user.getName.bind(user);

console.log(getName()); // Output: John Doe