const db = require("../db");
class TaskController {
  async createTask(req, res) {
    const { taskComment, isTaskDone, taskStartTime, taskEndTime, taskUserId } = req.body;
    const newTask = await db.query(
      `INSERT INTO task ( task_comment,is_task_done,task_start_time,task_end_time,task_user_id) values ($1, $2, $3, $4, $5) RETURNING *`,
      [taskComment, isTaskDone, taskStartTime, taskEndTime, taskUserId]
    );
    res.json(newTask.rows[0]);
  }

  async getTasksByUser(req, res) {
    const taskUserId = req.params.id;
    console.log(taskUserId)
    const allTasks = await db.query(
      `SELECT * from task where task_user_id = $1`,[taskUserId]);
    res.json(allTasks.rows);
  }
  async updateTask(req, res) {
    const { taskComment, isTaskDone, taskStartTime, taskEndTime, taskUserId } =req.body;
    const allPersons = await db.query(
      `UPDATE task set task_comment = $1, is_task_done = $2, task_start_time = $3, task_end_time = $4, task_user_id= $5  where task_id = $6 RETURNING *`,
      [taskComment, isTaskDone, taskStartTime, taskEndTime, taskUserId]
    );
    res.json(allPersons.rows[0]);
  }
  async deleteTask(req, res) {
    const taskId = req.params.id;
    const allPersons = await db.query(
      `DELETE from task where task_id = $1 RETURNING *`,
      [taskId]
    );
    res.json(allPersons.rows[0]);
  }
}

module.exports = new TaskController();
