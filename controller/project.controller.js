const db = require("../db");
const userToken = require("../getUserIdByToken");

class ProjectController {
  async createProject(req, res) {
    let resStatus = null;
    let resMessage = null;
    const projectUserId = userToken.getUserIdByToken(req);
    try {
      const { projectName, projectParticipants } = req.body;
      if (projectName) {
        const newProject = await db.query(
          `INSERT INTO project (project_name,project_creator) values ($1, $2) RETURNING *`,
          [projectName, projectUserId]
        );
        console.log(newProject.rows[0]);
        if (projectParticipants) {
          const resUsers = projectParticipants.map(async (participant) => {
            const projectUsers = await db.query(
              `INSERT INTO personToProject (project_id,person_id) values ($1, $2) RETURNING *`,
              [newProject.rows[0].project_id, participant]
            );
            return projectUsers.rows[0].person_id;
          });
          if (resUsers.length) {
            resMessage = "Проект успешно создан";
            resStatus = 200;
          } else {
            resMessage = "Ошибка при добавлении участников";
            resStatus = 500;
          }
        } else {
          resMessage = "Пожалуйста, попробуйте снова";
          resStatus = 500;
        }
      } else {
        resMessage = "Введите название проекта";
        resStatus = 400;
      }
    } catch (e) {
      console.log(e);
      resMessage = "Ошибка в создании проекта";
      resStatus = 400;
    }
    res.status(resStatus).json({
      message: resMessage,
    });
  }
  async getProjectByUser(req, res) {
    const projectUserId = userToken.getUserIdByToken(req);
    if (projectUserId) {
      const allProjects = await db.query(
        `SELECT project.project_id, project.project_name FROM project LEFT JOIN PersonToProject 
        on project.project_id = PersonToProject.project_id
        where project.project_creator = $1 or PersonToProject.person_id = $1
        group by project.project_id
        order by project.project_id`,
        [projectUserId]
      );
      let resultProjects = [];
      allProjects.rows.map((project) => {
        resultProjects.push({
          projectId: project.project_id,
          projectName: project.project_name,
        });
      });
      res.status(200).json(resultProjects);
    } else {
      return res.status(403).json({
        message: "Пользователь не распознан",
      });
    }
  }
  async getProject(req, res) {
    const userId = userToken.getUserIdByToken(req);
    const projectId = req.params.projectId;
    const isGrantAccess = await db.query(
      `SELECT COUNT(*) FROM project LEFT JOIN PersonToProject 
      on project.project_id = PersonToProject.project_id
      where (project.project_creator = $1 or PersonToProject.person_id = $1) and project.project_id = $2
      group by project.project_id`,

      [userId, projectId]
    );
    if (isGrantAccess.rows[0]) {
      const resultUsers = [];
      const resultTasks = [];
      const projectInfo = await db.query(
        `SELECT * FROM project 
        where project_id = $1`,
        [projectId]
      );
      const projectParticipants = await db.query(
        `SELECT * FROM PersonToProject LEFT JOIN person ON PersonToProject.person_id = person.user_id WHERE project_id = $1`,
        [projectId]
      );
      const projectCreator = await db.query(
        `SELECT * FROM project LEFT JOIN person ON project.project_creator = person.user_id WHERE project_id = $1`,
        [projectId]
      );

      resultUsers.push({
        userId: projectCreator.rows[0].user_id,
        userEmail: projectCreator.rows[0].user_email,
      });
      projectParticipants.rows.map((user) => {
        resultUsers.push({
          userId: user.user_id,
          userEmail: user.user_email,
        });
      });

      const projectTasks = await db.query(
        `SELECT * FROM projecttask WHERE project_id = $1`,
        [projectId]
      );
      projectTasks.rows.map((task) => {
        resultTasks.push({
          taskId: task.project_task_id,
          taskTitle: task.project_task_title,
          taskPriority: task.project_task_priority,
          taskResponsible: task.project_task_responsible,
          taskStatus: task.project_task_status,
          taskPriority: task.project_task_priority,
        });
      });
      const resProjectInfo = {
        projectId: projectInfo.rows[0].project_id,
        projectName: projectInfo.rows[0].project_name,
        projectParticipants: resultUsers,
        projectTasks: resultTasks
      };
      res.status(200).json(resProjectInfo);
    } else {
      res.status(403).json({
        message: "нет доступа к проекту",
      });
    }
  }
  async createProjectTask(req, res) {
    const userId = userToken.getUserIdByToken(req);
    const projectId = req.params.projectId;
    const isGrantAccess = await db.query(
      `SELECT COUNT(*) FROM project LEFT JOIN PersonToProject 
      on project.project_id = PersonToProject.project_id
      where (project.project_creator = $1 or PersonToProject.person_id = $1) and project.project_id = $2
      group by project.project_id`,

      [userId, projectId]
    );
    if (isGrantAccess.rows[0]) {
      try {
        const { taskTitle, taskResponsible, taskPriority } = req.body;
        const newTask = await db.query(
          `INSERT INTO projectTask (project_id,project_task_title,project_task_responsible,project_task_priority,project_task_status) values ($1, $2, $3, $4, $5) RETURNING *`,
          [projectId, taskTitle, taskResponsible, taskPriority, 'InPlan']
        );
        if (newTask.rows[0]) {
          res.status(200).json({ message: "Задача успешно добавлена" });
        }
        else {
          res.status(500).json({ message: "Не удалось добавить задачу" });
        }
      } catch {
        res.status(404).json({ message: "Не удалось добавить задачу" });
      }
    } else {
      return res.status(403).json({ message: "Нет доступа к проекту" });
    }
  }
  async getTaskDetail(req, res) {
    const taskId = req.params.taskId;
    try {
      const taskInfo = await db.query(
        `SELECT * FROM projectTask LEFT JOIN person ON projectTask.project_task_responsible = person.user_id WHERE project_task_id = $1`,
        [taskId]
      );
      const resultTaskInfo = {
        taskId: taskInfo.rows[0].project_task_id,
          taskTitle: taskInfo.rows[0].project_task_title,
          taskPriority: taskInfo.rows[0].project_task_priority,
          taskResponsible: taskInfo.rows[0].user_email,
          taskStatus: taskInfo.rows[0].project_task_status,
          taskPriority: taskInfo.rows[0].project_task_priority,
      }
        res.status(200).json(resultTaskInfo);
    } catch {
      res.status(404).json({ message: "Не удалось получить данные" });
    }
  }
  async changeTaskStatus (req, res) {
    const taskId = req.params.taskId;
    const {taskStatus} = req.body;
    try {
      const taskInfo = await db.query(
        `SELECT * FROM projectTask WHERE project_task_id = $1`,
        [taskId]
      );
      console.log(taskInfo.rows[0])
      const updatedTaskInfo = await db.query(
        `UPDATE projectTask set project_id = $1, project_task_title = $2, project_task_responsible = $3, project_task_start_time = $4,
        project_task_end_time = $5, project_task_comment = $6, project_task_status = $7, project_task_priority = $8
          where project_task_id = $9 RETURNING *`, [
            taskInfo.rows[0].project_id,taskInfo.rows[0].project_task_title,taskInfo.rows[0].project_task_responsible,
            taskInfo.rows[0].project_task_start_time,taskInfo.rows[0].project_task_end_time,
            taskInfo.rows[0].project_task_comment,taskStatus,taskInfo.rows[0].project_task_priority,
            taskInfo.rows[0].project_task_id, 
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
}

module.exports = new ProjectController();
