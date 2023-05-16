const Router = require('express')
const listRouter = new Router()
const listController = require('../controller/list.controller')

listRouter.post('/list', listController.createList)
// listRouter.get('/listUsers', listController.getUsersForlist)
listRouter.get('/lists', listController.getListByUser)
listRouter.get('/listItem/:listId', listController.getListItems)
listRouter.post('/listItem/', listController.createListItem)
// listRouter.get('/listTask/:taskId', listController.getTaskDetail)
// listRouter.put('/listTask/:taskId', listController.changeTaskStatus)
// listRouter.get('/listTaskParticipants/:listId', listController.getlistParticipants)
// listRouter.post('/listTaskComment', listController.setNewTaskComment)


// listRouter.delete('/task/:id', listController.deleteTask)

module.exports = listRouter
