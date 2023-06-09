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
projectRouter.put('/projectTaskPriority/:taskId', projectController.changeTaskPriority)
projectRouter.put('/projectTaskResponsible/:taskId', projectController.changeTaskResponsible)
projectRouter.get('/projectTaskParticipants/:projectId', projectController.getProjectParticipants)
projectRouter.put('/projectParticipants/:projectId', projectController.addProjectParticipants)
projectRouter.delete('/projectParticipants/:projectId/:userId', projectController.deleteProjectParticipants)
projectRouter.post('/projectTaskComment', projectController.setNewTaskComment)
projectRouter.post('/projectName/:projectId', projectController.changeProjectName)
projectRouter.delete('/project/:projectId', projectController.deleteProject)

module.exports = projectRouter
