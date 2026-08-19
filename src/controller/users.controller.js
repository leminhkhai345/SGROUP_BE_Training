import * as userService from '../services/users.service.js';

const getAllUsers = async (req, res) => {
    try{
        const users = await userService.getAllUsers();
        return res.status(200).json({
            success: true,
            message: 'get all users successfully',
            data: users
        });
    } catch (error){
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
}


const getUserById = async (req, res) => {
    const userId = req.params.id;
    try{
        const user = await userService.getUserById(userId);
        if(!user){
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }
        return res.status(200).json({
            success: true,
            message: 'get user by id successfully',
            data: user
        });
    } catch(error){
        res.status(500).json({
            success: false,
            message: "internal server error",
            error: error.message
        });
    }
}

const createUser = async (req, res) => {
    const createUserRequest = req.body;
    try{
        const user = await userService.addUser(createUserRequest);
        if(!user){
            return res.status(403).json({
                success: true,
                message: "create user falure",
            })
        }
        return res.status(201).json({
            success: true,
            message: "create User successfully",
            data: user
        });
    } catch(err){
        res.status(500).json({
            success: false,
            message: "internal server error",
            error: err.message
        });
    }
}

const updateUser = async (req, res) => {
    const updateUserRequest = req.body;
    const userId = req.params.id;
    try{
        const user = await userService.updateUser(userId, updateUserRequest);
        if(!user){
            return res.status(403).json({
                success: true,
                message: "update user falure",
            })
        }
        return res.status(201).json({
            success: true,
            message: "update User successfully",
            data: user
        });
    } catch(err){
        res.status(500).json({
            success: false,
            message: "internal server error",
            error: err.message
        });
    }
}

const deleteUser = async (req, res) => {
    const userId = req.params.id;
    try{
        const success = await userService.deleteUser(userId);
        if(!success){
            return res.status(403).json({
                success: true,
                message: "unable to delete user",
            })
        }
        return res.status(204).json({
            success: true,
            message: "delete User successfully",
        });
    } catch(err){
        res.status(500).json({
            success: false,
            message: "internal server error",
            error: err.message
        });
    }

}

export { getAllUsers, getUserById , createUser, updateUser, deleteUser };