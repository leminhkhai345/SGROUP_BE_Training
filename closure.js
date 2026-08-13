const users = [
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
    { id: 3, name: "Charlie" }
];

function findUser(users){
    return function(id){
        return users.find(user => user.id === id);
    }

}

const findUserById = findUser(users);

const user1 = findUserById(1);
console.log(user1); // Output: { id: 1, name: "Alice" }

const user2 = findUserById(2);
console.log(user2); // Output: { id: 2, name: "Bob" }