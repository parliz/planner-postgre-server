const Router = require('express')
const projectRouter = new Router()
const projectController = require('../controller/project.controller')

projectRouter.post('/project', projectController.createProject)
// projectRouter.get('/projectUsers', projectController.getUsersForProject)
projectRouter.get('/projects', projectController.getProjectByUser)
projectRouter.get('/project/:projectId', projectController.getProject)
projectRouter.post('/projectTask/:projectId', projectController.createProjectTask)
projectRouter.get('/projectTask/:taskId', projectController.getTaskDetail)
projectRouter.put('/projectTask/:taskId', projectController.changeTaskStatus)
// projectRouter.delete('/task/:id', projectController.deleteTask)

module.exports = projectRouter