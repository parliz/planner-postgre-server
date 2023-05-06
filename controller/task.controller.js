const db = require("../db");
const userToken = require("../getUserIdByToken");
class TaskController {
  async createTask(req, res) {
    const taskUserId = userToken.getUserIdByToken(req);
    const isTaskDone = false;
    const { taskComment, taskDate } = req.body;
    const newTask = await db.query(
      `INSERT INTO task ( task_comment,is_task_done,task_date,task_user_id) values ($1, $2, $3, $4) RETURNING *`,
      [taskComment, isTaskDone, taskDate, taskUserId]
    );
    res.json(newTask.rows[0]);
  }

  async getTasksByUser(req, res) {
    const taskUserId = userToken.getUserIdByToken(req);
    if (taskUserId) {
      const allTasks = await db.query(
        `SELECT * from task where task_user_id = $1`,
        [taskUserId]
      );
      let task = {
        taskId: allTasks.rows[0].task_id,
        isTaskDone: allTasks.rows[0].is_task_done,
        taskComment: allTasks.rows[0].is_task_done,
        taskTimeStart: allTasks.rows[0].task_time_start,
        taskTimeEnd: allTasks.rows[0].task_time_end,
      };
      res.status(200).json(task);
    } else {
      return res.status(403).json({ message: "Пользователь не распознан" });
    }
  }
  async getTasksByDay(req, res) {
    console.log("getTasksByDay in controller");
    const taskUserId = userToken.getUserIdByToken(req);
    const day = req.params.day;
    console.log("user", taskUserId);
    console.log("day", day);
    if (taskUserId) {
      const allTasks = await db.query(
        `SELECT * from task where task_user_id = $1 and task_date = $2`,
        [taskUserId, day]
      );
      let resultTasks = [];
      allTasks.rows.map((task) => {
        resultTasks.push({
          taskId: task.task_id,
          isTaskDone: task.is_task_done,
          taskComment: task.task_comment,
          taskDate: task.task_date,
        });
      });
      res.status(200).json(resultTasks);
    } else {
      return res.status(403).json({ message: "Пользователь не распознан" });
    }
  }
  async updateTask(req, res) {
    const taskId = req.params.taskId;
    const updateData = req.body;
    const { taskComment, isTaskDone } = req.body;
    console.log(isTaskDone);
    console.log(taskComment);
    let initTask = await db.query(`SELECT * FROM task where task_id = $1`, [
      taskId,
    ]);
    console.log(initTask.rows[0]);
    if (isTaskDone !== null && isTaskDone !== undefined) {
      const updatedDoneTask = await db.query(
        `UPDATE task set task_comment = $1, is_task_done = $2, task_date = $3, task_user_id= $4  where task_id = $5 RETURNING *`,
        [
          initTask.rows[0].task_comment,
          isTaskDone,
          initTask.rows[0].task_date,
          initTask.rows[0].task_user_id,
          taskId,
        ]
      );
      let task = {
        taskId: updatedDoneTask.rows[0].task_id,
        isTaskDone: updatedDoneTask.rows[0].is_task_done,
        taskComment: updatedDoneTask.rows[0].task_comment,
        taskDate: updatedDoneTask.rows[0].task_date
      };
      res.status(200).json(task);
    } else if (taskComment !== null && taskComment !== undefined) {
      console.log(taskComment)
      const updatedComTask = await db.query(
        `UPDATE task set task_comment = $1, is_task_done = $2, task_date = $3, task_user_id= $4  where task_id = $5 RETURNING *`,
        [
          taskComment,
          initTask.rows[0].is_task_done,
          initTask.rows[0].task_date,
          initTask.rows[0].task_user_id,
          taskId,
        ]
      );
      let task = {
        taskId: updatedComTask.rows[0].task_id,
        isTaskDone: updatedComTask.rows[0].is_task_done,
        taskComment: updatedComTask.rows[0].task_comment,
        taskDate: updatedComTask.rows[0].task_date,
      };
      res.status(200).json(task);
    } else {
      res.status(500).json({ message: "Ошибка в обновлении данных" });
    }
    
  }
  async deleteTask(req, res) {
    const taskId = req.params.id;
    const deletedTask = await db.query(
      `DELETE from task where task_id = $1 RETURNING *`,
      [taskId]
    );
    if (deletedTask) {
      res.status(200).json({ message: "Задача успешно удалена" });
    } else {
      res.status(500).json({ message: "Возникла ошибка при удалении задачи" });
    }
    
  }
  async getTasksByTime() {}
}

module.exports = new TaskController();
