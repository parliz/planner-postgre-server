const Router = require('express')
const userRouter = new Router()
const userController = require('../controller/user.controller')

userRouter.post('/user', userController.createUser)
userRouter.get('/users', userController.getUsers)
userRouter.get('/login/:email/:password', userController.login)
userRouter.put('/user', userController.updateUser)
userRouter.delete('/user/:id', userController.deleteUser)

module.exports = userRouter
