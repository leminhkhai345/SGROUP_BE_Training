import { ConflictError, UnauthorizedError } from "../core/error.response.js";
import * as userRepository from "../repository/users.repository.js";
import * as passwordHelper from "../utils/passwordHelper.js";
import * as jwtHelper from "../utils/jwtHelper.js";

const register = async ( {name, email, password}) => {
    const user = await userRepository.findByEmail(email);
    if(user){
        throw new ConflictError("email already exist");
    }
    const newUser = {
        email: email,
        name: name,
        password_hash: await passwordHelper.hashPassword(password),
        role: "MEMBER"
    }
    return await userRepository.create(newUser);
}

const login = async({email, password}) => {
    const user = await userRepository.findByEmail(email);
    if(!user) {
        throw new UnauthorizedError("email or password is not correct");
    }
    const isMatch = await passwordHelper.comparePassword(password, user.password_hash);
    if(!isMatch){
        throw new UnauthorizedError("email or password is not correct");
    }
    const payload = {
        id: user.id,
        email: email,
        role: user.role
    };
    const accessToken = jwtHelper.generateToken(payload);
    const refreshToken = jwtHelper.generateRefreshToken(payload);
    return { accessToken, refreshToken };
}



export {register, login};