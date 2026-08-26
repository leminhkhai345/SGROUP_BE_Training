import { ConflictError } from "../core/error.response.js";
import { readData, writeData } from "../repository/readData.js";

const getAllUsers = async () => {
  const data = await readData();
  return data.users;
};

const getUserById = async (userId) => {
  const data = await readData();
  return data.users.find((u) => u.id === parseInt(userId));
};

const addUser = async (createUserRequest) => {
  const data = await readData();
  const user = data.users.find((u) => u.email === createUserRequest.email);
  if (!user) {
    const user = {
      id: data.users.length + 1,
      name: createUserRequest.name,
      email: createUserRequest.email,
      password: createUserRequest.password,
    };
    data.users.push(user);
    await writeData(data);
    return user;
  }
  else throw new ConflictError('Email already exists');
};

const updateUser = async (userId, updateUserRequest) => {
  const data = await readData();
  const user = data.users.find((user) => user.id === parseInt(userId));

  if (user) {
    user.email = updateUserRequest.email;
    user.name = updateUserRequest.name;
    user.password = updateUserRequest.password;

    await writeData(data);
    return user;
  }
};

const deleteUser = async (userId) => {
  const data = await readData();
  const userIndex = data.users.findIndex(
    (user) => user.id === parseInt(userId),
  );
  if (userIndex !== -1) {
    data.users.splice(userIndex, 1);
    await writeData(data);
    return true;
  }
  return false;
};

export { getAllUsers, getUserById, addUser, updateUser, deleteUser };
