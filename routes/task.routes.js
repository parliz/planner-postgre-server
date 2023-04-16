const Router = require('express')
const taskRouter = new Router()
const taskController = require('../controller/task.controller')

taskRouter.post('/task', taskController.createTask)
taskRouter.get('/task/:id', taskController.getTasksByUser)
taskRouter.put('/task', taskController.updateTask)
taskRouter.delete('/task/:id', taskController.deleteTask)

module.exports = taskRouter
