const Router = require('express')
const taskRouter = new Router()
const taskController = require('../controller/task.controller')

taskRouter.post('/task', taskController.createTask)
// taskRouter.get('/task/:id', taskController.getTasksByUser)
taskRouter.get('/task/:day', taskController.getTasksByDay)
taskRouter.put('/task/:taskId', taskController.updateTask)
taskRouter.delete('/task/:id', taskController.deleteTask)

module.exports = taskRouter
