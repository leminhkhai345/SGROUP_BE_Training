import { readData, writeData } from "../repository/readData.js";

const getAllUsers = async () => {
  try {
    const data = await readData();
    return data.users;
  } catch (error) {
    console.error("Error getting all users:", error);
    throw error;
  }
};

const getUserById = async (userId) => {
  try {
    const data = await readData();
    const user = data.users.find(u => u.id === parseInt(userId));
    return user;
  } catch (error) {
    console.error("Error getting user with id ${userId}:", error);
    throw error;
  }
};

const addUser = async (createUserRequest) => {
  try{
    const data = await readData();
    const user = data.users.find(u => u.email === createUserRequest.email);
    if(!user){
      const user = {
        id: data.users.length + 1,
        name: createUserRequest.name,
        email: createUserRequest.email,
        password: createUserRequest.password
      }
      data.users.push(user);
      await writeData(data);
      return user;

    }
    return null;
  } catch (error) {
    console.error("Error adding user:", error);
    throw error;
  }
}

const updateUser = async (userId, updateUserRequest) => {
  try{
    const data = await readData();
    const user = data.users.find(user => user.id === parseInt(userId));

    if(user){
      user.email = updateUserRequest.email;
      user.name = updateUserRequest.name;
      user.password = updateUserRequest.password;

      await writeData(data);
      return user;
    }
    return null;
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  } 
}


const deleteUser = async (userId) => {
  try{
    const data = await readData();
    const userIndex = data.users.findIndex(user => user.id === parseInt(userId));
    if(userIndex !== -1){
      data.users.splice(userIndex, 1);
      await writeData(data);
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
}

export { getAllUsers, getUserById, addUser, updateUser, deleteUser };