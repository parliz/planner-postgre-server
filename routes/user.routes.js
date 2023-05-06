const Router = require('express')
const userRouter = new Router()
const userController = require('../controller/user.controller')

userRouter.post('/newUser', userController.createUser)
userRouter.post('/user', userController.getUser)
userRouter.get('/users', userController.getUsers)
userRouter.post('/login', userController.login)
userRouter.put('/user', userController.updateUser)
userRouter.delete('/user/:id', userController.deleteUser)

module.exports = userRouter
