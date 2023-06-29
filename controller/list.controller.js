const db = require("../db");
const userToken = require("../getUserIdByToken");

class ListController {
  async createList(req, res) {
    let resMessage = null;
    let resStatus = null;
    const listUserId = userToken.getUserIdByToken(req);
    try {
      const { listName, listParticipants } = req.body;
      if (listName) {
        const newList = await db.query(
          `INSERT INTO list (list_name) values ($1) RETURNING *`,
          [listName]
        );
        const ListCreator = await db.query(
          `INSERT INTO personToList (list_id,person_id, is_person_creator) values ($1, $2, $3) RETURNING *`,
          [newList.rows[0].list_id, listUserId, true]
        );
        console.log(newList.rows[0]);
        if (listParticipants.length > 0) {
          const resUsers = listParticipants.map(async (participant) => {
            const ListUsers = await db.query(
              `INSERT INTO personToList (list_id,person_id) values ($1, $2) RETURNING *`,
              [newList.rows[0].list_id, participant]
            );
            return ListUsers.rows[0].person_id;
          });
          if (resUsers.length) {
            resMessage = "Список успешно создан";
            resStatus = 200;
          } else {
            resMessage = "Ошибка при добавлении участников";
            resStatus = 500;
          }
        } else if (newList) {
          resMessage = "Список успешно создан";
          resStatus = 200;
        }
      } else {
        resMessage = "Введите название списка";
        resStatus = 400;
      }
    } catch (e) {
      console.log(e);
      resMessage = "Ошибка в создании списка";
      resStatus = 400;
    }
    res.status(resStatus).json({
      message: resMessage,
    });
  }
  async deleteList(req, res) {
    let resMessage = null;
    let resStatus = null;
    try {
      const listId = req.params.listId;
      console.log(req.params.listId)
      console.log(listId)
      if (listId) {
        console.log(listId)
        let deletedList = null;
        const deletedListItems = await db.query(
          `DELETE FROM listitem WHERE list_id=$1 RETURNING *`,
          [listId]
        );
        if (deletedListItems) {
          deletedList = await db.query(
            `DELETE FROM list WHERE list_id=$1 RETURNING *`,
            [listId]
          );
        }
        if (deletedList) {
          resMessage = "Удаление прошло успешно";
          resStatus = 200;
        }else {
          resMessage = "Возникла ошибка при удалении";
          resStatus = 500;
        }

      } else {
        resMessage = "Выберите список для удаления";
        resStatus = 400;
      }
    } catch (e) {
      console.log(e);
      resMessage = "Ошибка в удалении списка";
      resStatus = 400;
    }
    res.status(resStatus).json({
      message: resMessage,
    });
  }
  async changeListName(req, res) {
    const userId = userToken.getUserIdByToken(req);
    const listId = req.params.listId;
    const listName = req.body.listName;
    
    try {
      const updatedListInfo = await db.query(
        `UPDATE list set list_name = $1 where list_id = $2 RETURNING *`,
        [
          listName,
          listId
        ]
      );
      
      if (updatedListInfo) {
        res.status(200).json({ message: "Данные успешно обновлены" });
      } else {
        res.status(500).json({ message: "Возникла ошибка при обновлении данных" });
      }
    } catch {
      res.status(404).json({ message: "Возникла ошибка" });
    }
  }
  async getListByUser(req, res) {
    const listUserId = userToken.getUserIdByToken(req);
    if (listUserId) {
      const allLists = await db.query(
        `SELECT list.list_id, list.list_name, personToList.person_id, personToList.is_person_creator FROM list LEFT JOIN personToList 
        on list.list_id = personToList.list_id
        where PersonToList.person_id = $1
        group by list.list_id, PersonToList.person_id, personToList.is_person_creator
        order by list.list_id`,
        [listUserId]
      );
      let resultLists = [];
      
      allLists.rows.map((list) => {
        console.log(list.list_creator, listUserId)
        resultLists.push({
          listId: list.list_id,
          listName: list.list_name,
          isCreator: list.is_person_creator
        });
      });
      res.status(200).json(resultLists);
    } else {
      return res.status(403).json({
        message: "Пользователь не распознан",
      });
    }
  }
  async getListSettings(req, res) {
    console.log("controller getListSettings")
    const userId = userToken.getUserIdByToken(req);
    const listId = req.params.listId;
    let resultUsers = [];
    let resultAllUsers = [];
    let participantIdList = [];
    console.log(listId)
    try {
      const listCreator = await db.query(
            `SELECT * FROM personToList where list_id = $1 AND is_person_creator = true`, [listId]
          );
      console.log(listCreator.rows[0].person_id === userId)
      if (listCreator.rows[0].person_id === userId) {
        const listParticipants = await db.query(
          `SELECT person.user_id, person.user_login, person.user_email FROM personToList LEFT JOIN person 
          on person.user_id = personToList.person_id
          where personToList.list_id = $1 AND personToList.person_id<> $2`,
          [listId, userId]
        );
        listParticipants.rows.map((user) => {
          resultUsers.push({
            userId: user.user_id,
            userEmail: user.user_email,
            userLogin: user.user_login
          });
          participantIdList.push(user.user_id)
        });
        const allUsers = await db.query(
          `SELECT user_id, user_login, user_email FROM person where user_id!= $1;`,
          [userId]
        );

        for (var user of allUsers.rows)
        {
          if (!participantIdList.includes(user.user_id)) {
            resultAllUsers.push({
              userId: user.user_id,
              userEmail: user.user_email,
              userLogin: user.user_login
            });
          }
        }

        res.status(200).json({participants: resultUsers, allUsers: resultAllUsers});
      } else {
        return res.status(403).json({
          message: "Вы не можете редактировать данный список",
        });
      }
    } catch {
      return res.status(400).json({
            message: "Возникла ошибка",
          });
    }
  }
  async getListItems(req, res) {
    const userId = userToken.getUserIdByToken(req);
    const listId = req.params.listId;
    let resultListItems = [];
    try {
      const isGrantAccess = await db.query(
        `SELECT COUNT(*) FROM list LEFT JOIN personToList 
        on list.list_id = personToList.list_id
        where (personToList.is_person_creator = true or personToList.person_id = $1) and list.list_id = $2
        group by list.list_id`, [userId, listId]
      );
      if (isGrantAccess) {
        const allListItems = await db.query(
          `SELECT *FROM listitem where list_id = $1`, [listId]
        );
        const listTitle = await db.query(
          `SELECT list_name FROM list where list_id = $1`, [listId]
        );
        allListItems.rows.map((item) => {
          resultListItems.push({
            listItemId: item.list_item_id,
            listItemTitle: item.list_item_title,
            listItemTag: item.list_item_img,
            listItemText: item.list_item_text,
            isListItemDone: item.list_item_is_done,
          });
        });
        res.status(200).json({listTitle: listTitle.rows[0].list_name, listItems: resultListItems});
      } else {
        res.status(401).json({ message: "нет доступа к списку"});
      }
    } catch {
      res.status(500).json({ message: "Ошибка"});
    }


  }
  async getListItem(req, res) {
    const listId = req.params.listId;
    let resultItemInfo = [];
    try {
      const itemInfo = await db.query(
        `SELECT * FROM listitem 
        where list_item_id = $1`, [listId]
      );
          resultItemInfo = {
            listItemId: itemInfo.rows[0].list_item_id,
            listItemTitle: itemInfo.rows[0].list_item_title,
            listItemImg: itemInfo.rows[0].list_item_img,
            listItemText: itemInfo.rows[0].list_item_text,
            isListItemDone: itemInfo.rows[0].list_item_is_done,
          }
        res.status(200).json(resultItemInfo);
    } catch {
      res.status(500).json({ message: "Ошибка"});
    }
  }
  async createListItem(req, res) {
    const userId = userToken.getUserIdByToken(req);
    const { listId, listItemTitle, listItemImg, listItemText } = req.body;
    const isGrantAccess = await db.query(
      `SELECT COUNT(*) FROM list LEFT JOIN personToList 
      on list.list_id = personToList.list_id
      where (personToList.is_person_creator = true or personToList.person_id = $1) and list.list_id = $2
      group by list.list_id`, [userId, listId]
    );
    console.log(isGrantAccess.rows[0]);
    if (isGrantAccess.rows[0]) {
      try {
        const newTask = await db.query(
          `INSERT INTO listItem (list_id,list_item_title,list_item_img,list_item_text,list_item_is_done) values ($1, $2, $3, $4, $5) RETURNING *`,
          [listId, listItemTitle, listItemImg, listItemText, false]
        );
        console.log(newTask.rows[0]);
        res.status(200).json({ message: "Успешно создано" });
      } catch {
        res.status(500).json({ message: "Не удалось создать" });
      }
    } else {
      return res.status(403).json({ message: "Нет доступа к проекту" });
    }
  }
  async getTaskDetail(req, res) {
    const taskId = req.params.taskId;
    const resultComments = [];
    try {
      const taskInfo = await db.query(
        `SELECT * FROM ListTask LEFT JOIN person ON ListTask.List_task_responsible = person.user_id WHERE List_task_id = $1`,
        [taskId]
      );
      const taskComment = await db.query(
        `SELECT * FROM TaskComment WHERE List_task_id = $1`,
        [taskId]
      );
      taskComment.rows.map((comment) => {
        resultComments.push({
          commentId: comment.comment_id,
          commentText: comment.List_task_comment,
          commentDate: comment.List_task_creation_date,
        });
      });
      const resultTaskInfo = {
        taskId: taskInfo.rows[0].List_task_id,
        taskTitle: taskInfo.rows[0].List_task_title,
        taskPriority: taskInfo.rows[0].List_task_priority,
        taskResponsible: taskInfo.rows[0].user_email,
        taskStatus: taskInfo.rows[0].List_task_status,
        taskPriority: taskInfo.rows[0].List_task_priority,
        taskComment: resultComments,
      };
      res.status(200).json(resultTaskInfo);
    } catch {
      res.status(404).json({ message: "Не удалось получить данные" });
    }
  }
  async changeListItemDone(req, res) {
    console.log("controller changeListItemDone")
    const listItemId = req.params.listItemId;
    const isItemDone = req.body;
    console.log(isItemDone)
    try {
      const listItem = await db.query(
        `SELECT * FROM listItem WHERE list_item_id = $1`,
        [listItemId]
      );
      console.log(listItem.rows[0]);
      const updatedListItemInfo = await db.query(
        `UPDATE listItem set list_id = $1, list_item_title = $2, list_item_img = $3, list_item_text = $4,
        list_item_is_done = $5 where list_item_id = $6 RETURNING *`,
        [
          listItem.rows[0].list_id,
          listItem.rows[0].list_item_title,
          listItem.rows[0].list_item_img,
          listItem.rows[0].list_item_text,
          isItemDone.isItemDone,
          listItem.rows[0].list_item_id
        ]
      );
      if (updatedListItemInfo.rows[0]) {
        res.status(200).json({ message: "Статус обновлен" });
      } else {
        res.status(500).json({ message: "Возникла ошибка обновления статуса" });
      }
    } catch {
      res.status(404).json({ message: "Возникла ошибка" });
    }
  }
  async changeListItem(req, res) {
    const listItemId = req.params.listItemId;
    const {listId, listItemImg, listItemText, listItemTitle, isListItemDone} = req.body;
    try {
      const changeedListItem = await db.query(
        `UPDATE listitem set list_id = $1, list_item_title = $2, list_item_img = $3, list_item_text = $4,
        list_item_is_done = $5 where list_item_id = $6 RETURNING *`,
        [
          listId,
          listItemTitle,
          listItemImg,
          listItemText,
          isListItemDone,
          listItemId
        ]);
        if (changeedListItem) {
          res.status(200).json({ message: "Обновление прошло успешно" });
        } else {
          res.status(500).json({ message: "Возникла ошибка при обновлении" });
        }
    } catch {
      res.status(500).json({ message: "Возникла ошибка" });
    }
  }
  async deleteListItem (req, res) {
    const listItemId = req.params.listItemId;
    const deletedListItem = await db.query(
      `DELETE from listItem where list_item_id = $1 RETURNING *`,
      [listItemId]
    );
    if (deletedListItem.rows[0]) {
      res.status(200).json({ message: "Элемент списка успешно удален" });
    } else {
      res.status(500).json({ message: "Возникла ошибка при удалении" });
    }
  }
  async getListParticipants(req, res) {
    const userId = userToken.getUserIdByToken(req);
    const listId = req.params.ListId;
    try {
      let participants = [];
      let resultUsers = [];
      const ListParticipants = await db.query(
        `SELECT * FROM PersonToList LEFT JOIN person ON PersonToList.person_id = person.user_id WHERE list_id = $1`,
        [req.params.listId]
      );
      ListParticipants.rows.map((user) => {
        participants.push({
          userId: user.user_id,
          userLogin: user.user_login,
        });
      });

      const users = await db.query(
        `SELECT user_id, user_login
        FROM person 
        WHERE NOT EXISTS (
            SELECT 1 
            FROM persontolist 
            WHERE person.user_id = persontolist.person_id  
            AND list_id = $1
        );`,
        [req.params.listId]
      );
      users.rows.map((user) => {
        resultUsers.push({
          userId: user.user_id,
          userLogin: user.user_login
        });
      });

      const ListCreator = await db.query(
        `SELECT user_id, user_login FROM PersonToList LEFT JOIN person ON PersonToList.person_id = person.user_id 
            WHERE list_id = $1 AND is_person_creator = true`,
        [req.params.listId]
      );
      const resCreator ={
        userId: ListCreator.rows[0].user_id,
        userLogin: ListCreator.rows[0].user_login,
        isUserCreator: userId === ListCreator.rows[0].user_id
      };

      res.status(200).json({participants: participants, users: resultUsers, creator: resCreator});
    } catch {
      res.status(500).json({ message: "Возникла ошибка" });
    }
  }
  async addListParticipants(req, res) {
    try {
      const listId = req.params.listId;
      const userId = req.body.userId;

      const listParticipants = await db.query(
        `INSERT INTO personToList (list_id,person_id,is_person_creator) values ($1, $2, $3) RETURNING *`,
        [listId, userId, false]
      );
        if (listParticipants) {
          res.status(200).json({ message: "Участник успешно добавлен" });
        } else {
          res.status(500).json({ message: "Ошибка при добавлении учасника" });
        }
      
    } catch {
      res.status(500).json({ message: "Возникла ошибка" });
    }
  }
  async deleteListParticipants(req, res) {
    try {
      const listId = req.params.listId;
      const userId = req.params.userId;

      const listParticipants = await db.query(
        `DELETE FROM persontolist WHERE list_id=$1 AND person_id=$2 RETURNING *`,
        [listId, userId]
      );
        if (listParticipants.rows[0]) {
          res.status(200).json({ message: "Участник успешно удален" });
        } else {
          res.status(500).json({ message: "Ошибка при удалении учасника" });
        }
      
    } catch {
      res.status(500).json({ message: "Возникла ошибка" });
    }
  }
  async copyList(req, res) {
    console.log("copyList")
    try {
      const listId = req.params.listId;
      const userId = userToken.getUserIdByToken(req);

      const listInfo = await db.query(
        `SELECT * FROM list where list_id = $1`,
        [listId]
      );
      const copyList = await db.query(
        `INSERT INTO list (list_name) values ($1) RETURNING *`,
        [listInfo.rows[0].list_name]
      );

      const copyPersonToList = await db.query(
        `INSERT INTO personToList (list_id,person_id,is_person_creator) values ($1, $2, $3) RETURNING *`,
        [copyList.rows[0].list_id, userId, true]
      );

      const listItemInfo = await db.query(
        `SELECT * FROM listitem where list_id = $1`,
        [listId]
      );
      
      if (listItemInfo) {
        listItemInfo.rows.map(async (item) => {
          const copyListItem = await db.query(
            `INSERT INTO listitem (list_id,list_item_title,list_item_img,list_item_text,list_item_is_done) values ($1, $2, $3, $4, $5) RETURNING *`,
            [copyList.rows[0].list_id, item.list_item_title, item.list_item_img, item.list_item_text, item.list_item_is_done]
          );
        });
        res.status(200).json({ message: "Список скопирован" });
      } else if (copyPersonToList) {
        res.status(200).json({ message: "Список скопирован" });
      }

        // if (copyList) {
        //   res.status(200).json({ message: "Список скопирован" });
        // } else {
        //   res.status(500).json({ message: "Ошибка при копировании" });
        // }
      
    } catch {
      res.status(500).json({ message: "Возникла ошибка" });
    }
  }
  async getCopyLists(req, res) {
    const listUserId = userToken.getUserIdByToken(req);
    if (listUserId) {
      const allLists = await db.query(
        `SELECT list.list_id, list.list_name, personToList.person_id FROM list LEFT JOIN personToList 
        on list.list_id = personToList.list_id
        where PersonToList.person_id = $1 AND personToList.is_person_creator = true
        group by list.list_id, PersonToList.person_id, personToList.is_person_creator
        order by list.list_id`,
        [listUserId]
      );
      let resultLists = [];
      
      allLists.rows.map((list) => {
        console.log(list.list_creator, listUserId)
        resultLists.push({
          listId: list.list_id,
          listName: list.list_name
        });
      });
      res.status(200).json(resultLists);
    } else {
      return res.status(403).json({
        message: "Пользователь не распознан",
      });
    }
  }
  async copyListItem(req, res) {
    const listId = req.params.listId;
    const listItemId = req.body.listItemId;
    try {
      const copiedListItem = await db.query(
        `SELECT * FROM listitem where list_item_id = $1`,
        [
          listItemId
        ]);
        const copyItem = await db.query(
          `INSERT INTO listItem (list_id,list_item_title,list_item_img,list_item_text,list_item_is_done) values ($1, $2, $3, $4, $5) RETURNING *`,
          [
            listId, 
            copiedListItem.rows[0].list_item_title, 
            copiedListItem.rows[0].list_item_img, 
            copiedListItem.rows[0].list_item_text, 
            false
          ]
        );
        if (copyItem.rows[0]) {
          res.status(200).json({ message: "Копирование прошло успешно" });
        } else {
          res.status(500).json({ message: "Возникла ошибка при копировании" });
        }
    } catch {
      res.status(500).json({ message: "Возникла ошибка" });
    }
  }
}

module.exports = new ListController();
