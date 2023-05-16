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
          `INSERT INTO list (list_name,list_creator) values ($1, $2) RETURNING *`,
          [listName, listUserId]
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
  async getListByUser(req, res) {
    const listUserId = userToken.getUserIdByToken(req);
    if (listUserId) {
      const allLists = await db.query(
        `SELECT list.list_id, list.list_name FROM list LEFT JOIN personToList 
        on list.list_id = personToList.list_id
        where list.list_creator = $1 or PersonToList.person_id = $1
        group by list.list_id
        order by list.list_id`,
        [listUserId]
      );
      let resultLists = [];
      allLists.rows.map((list) => {
        resultLists.push({
          listId: list.list_id,
          listName: list.list_name,
        });
      });
      res.status(200).json(resultLists);
    } else {
      return res.status(403).json({
        message: "Пользователь не распознан",
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
        where (list.list_creator = $1 or personToList.person_id = $1) and list.list_id = $2
        group by list.list_id`, [userId, listId]
      );
      if (isGrantAccess) {
        const allListItems = await db.query(
          `SELECT *FROM listitem where list_id = $1`, [listId]
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
        res.status(200).json(resultListItems);
      } else {
        res.status(401).json({ message: "нет доступа к списку"});
      }
    } catch {
      res.status(500).json({ message: "Ошибка"});
    }
    
    // const listItemId = req.params.listId;
    // const isGrantAccess = await db.query(
    //   `SELECT COUNT(*) FROM list LEFT JOIN personToList
    //   on list.list_id = personToList.list_id
    //   where (list.list_creator = $1 or PersonToList.person_id = $1) and List.List_id = $2
    //   group by list.list_id`,

    //   [userId, listId]
    // );
    // if (isGrantAccess.rows[0]) {
    //   const resultUsers = [];
    //   const resultTasks = [];
    //   const ListInfo = await db.query(
    //     `SELECT * FROM List
    //     where List_id = $1`,
    //     [ListId]
    //   );
    //   const ListParticipants = await db.query(
    //     `SELECT * FROM PersonToList LEFT JOIN person ON PersonToList.person_id = person.user_id WHERE List_id = $1`,
    //     [ListId]
    //   );
    //   const ListCreator = await db.query(
    //     `SELECT * FROM List LEFT JOIN person ON List.List_creator = person.user_id WHERE List_id = $1`,
    //     [ListId]
    //   );

    //   resultUsers.push({
    //     userId: ListCreator.rows[0].user_id,
    //     userEmail: ListCreator.rows[0].user_email,
    //   });
    //   ListParticipants.rows.map((user) => {
    //     resultUsers.push({
    //       userId: user.user_id,
    //       userEmail: user.user_email,
    //     });
    //   });

    //   const ListTasks = await db.query(
    //     `SELECT * FROM Listtask WHERE List_id = $1`,
    //     [ListId]
    //   );
    //   ListTasks.rows.map((task) => {
    //     resultTasks.push({
    //       taskId: task.List_task_id,
    //       taskTitle: task.List_task_title,
    //       taskPriority: task.List_task_priority,
    //       taskResponsible: task.List_task_responsible,
    //       taskStatus: task.List_task_status,
    //       taskPriority: task.List_task_priority,
    //     });
    //   });
    //   const resListInfo = {
    //     ListId: ListInfo.rows[0].List_id,
    //     ListName: ListInfo.rows[0].List_name,
    //     ListParticipants: resultUsers,
    //     ListTasks: resultTasks,
    //   };
    //   res.status(200).json(resListInfo);
    // } else {
    //   res.status(403).json({
    //     message: "нет доступа к проекту",
    //   });
    // }
  }
  async createListItem(req, res) {
    const userId = userToken.getUserIdByToken(req);
    const { listId, listItemTitle, listItemText } = req.body;
    const isGrantAccess = await db.query(
      `SELECT COUNT(*) FROM list LEFT JOIN personToList 
      on list.list_id = personToList.list_id
      where (list.list_creator = $1 or personToList.person_id = $1) and list.list_id = $2
      group by list.list_id`, [userId, listId]
    );
    console.log(isGrantAccess.rows[0]);
    if (isGrantAccess.rows[0]) {
      try {
        const newTask = await db.query(
          `INSERT INTO listItem (list_id,list_item_title,list_item_text) values ($1, $2, $3) RETURNING *`,
          [listId, listItemTitle, listItemText]
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
  async changeTaskStatus(req, res) {
    const taskId = req.params.taskId;
    const { taskStatus } = req.body;
    try {
      const taskInfo = await db.query(
        `SELECT * FROM ListTask WHERE List_task_id = $1`,
        [taskId]
      );
      console.log(taskInfo.rows[0]);
      const updatedTaskInfo = await db.query(
        `UPDATE ListTask set List_id = $1, List_task_title = $2, List_task_responsible = $3, List_task_start_time = $4,
        List_task_end_time = $5, List_task_comment = $6, List_task_status = $7, List_task_priority = $8
          where List_task_id = $9 RETURNING *`,
        [
          taskInfo.rows[0].List_id,
          taskInfo.rows[0].List_task_title,
          taskInfo.rows[0].List_task_responsible,
          taskInfo.rows[0].List_task_start_time,
          taskInfo.rows[0].List_task_end_time,
          taskInfo.rows[0].List_task_comment,
          taskStatus,
          taskInfo.rows[0].List_task_priority,
          taskInfo.rows[0].List_task_id,
        ]
      );
      if (updatedTaskInfo.rows[0]) {
        res.status(200).json({ message: "Статус обновлен" });
      } else {
        res.status(500).json({ message: "Возникла ошибка обновления статуса" });
      }
    } catch {
      res.status(404).json({ message: "Возникла ошибка" });
    }
  }
  async getListParticipants(req, res) {
    try {
      const ListId = req.params.ListId;
      let resultUsers = [];
      const ListParticipants = await db.query(
        `SELECT * FROM PersonToList LEFT JOIN person ON PersonToList.person_id = person.user_id WHERE List_id = $1`,
        [ListId]
      );
      const ListCreator = await db.query(
        `SELECT * FROM List LEFT JOIN person ON List.List_creator = person.user_id WHERE List_id = $1`,
        [ListId]
      );

      resultUsers.push({
        userId: ListCreator.rows[0].user_id,
        userEmail: ListCreator.rows[0].user_email,
      });
      ListParticipants.rows.map((user) => {
        resultUsers.push({
          userId: user.user_id,
          userEmail: user.user_email,
        });
      });
      res.status(200).json(resultUsers);
    } catch {
      res.status(500).json({ message: "Возникла ошибка" });
    }
  }
}

module.exports = new ListController();
