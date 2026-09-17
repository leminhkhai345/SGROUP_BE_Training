import { ConflictError, NotFoundError } from "../core/error.response.js";
import * as userRepository from "../repository/users.repository.js";
import * as passwordHelper from "../utils/passwordHelper.js";

const getAllUsers = async ({sortBy, order}) => {
  return await userRepository.findAll({sortBy, order});
};

const getUserById = async (userId) => {
  const user =  await userRepository.findById(userId);
  if (!user) {
    throw new NotFoundError("User not found");
  }
  return user;
};


const updateUser = async (userId, updateUserRequest) => {
  const email = updateUserRequest.email;
  const name = updateUserRequest.name;
  const user = await userRepository.findById(userId);
    if (!user) {
    throw new NotFoundError("user not found");
  }
  if (user) {
    return await userRepository.update(userId, {email, name});
  }
};

const deleteUser = async (userId) => {
  await userRepository.deleteById(userId);
};


const getMyProfile = async (email) => {
  const data = await userRepository.findByEmail(email);
  if(!data) {
    throw new NotFoundError("can not find profile");
  }
  const user = {
    name: data.name,
    email: data.email,
    role: data.role,
    dob: data.dob,
  }
  return user;
}

export { getAllUsers, getUserById, updateUser, deleteUser, getMyProfile };
