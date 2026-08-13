//array

// const numbers = [1, 2, 3];

// const newNumbers = [...numbers, 4, 5];

// console.log(newNumbers);


// in destructuring 
const numbers = [1, 2, 3, 4, 5];

const [first, second, ...rest] = numbers;

console.log(first);
// 1

console.log(second);
// 2

console.log(rest);
// [3, 4, 5]