const Router = require('express')
const listRouter = new Router()
const listController = require('../controller/list.controller')

listRouter.post('/list', listController.createList)
listRouter.delete('/list/:listId', listController.deleteList)
listRouter.post('/listName/:listId', listController.changeListName)
listRouter.get('/listEdit/:listId', listController.getListSettings)
listRouter.get('/lists', listController.getListByUser)
listRouter.get('/listItems/:listId', listController.getListItems)
listRouter.get('/listItem/:listId', listController.getListItem)
listRouter.post('/listItem/', listController.createListItem)
listRouter.put('/listItem/:listItemId', listController.changeListItemDone)
listRouter.delete('/listItem/:listItemId', listController.deleteListItem)
listRouter.put('/listEditItem/:listItemId', listController.changeListItem)
listRouter.post('/listCopy/:listId', listController.copyList)
listRouter.post('/copyListItem/:listId', listController.copyListItem)
listRouter.get('/copyLists', listController.getCopyLists)
listRouter.get('/listParticipants/:listId', listController.getListParticipants)
listRouter.put('/listParticipants/:listId', listController.addListParticipants)
listRouter.delete('/listParticipants/:listId/:userId', listController.deleteListParticipants)

module.exports = listRouter
