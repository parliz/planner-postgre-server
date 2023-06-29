const db = require("../db");
const userToken = require("../getUserIdByToken");

class ProjectController {
  async createProject(req, res) {
    let resStatus = null;
    let resMessage = null;
    const projectUserId = userToken.getUserIdByToken(req);
    try {
      const { projectName, projectParticipants, projectDate } = req.body;
      const ownerInfo = await db.query(
        `SELECT * FROM person WHERE user_id = $1`,
        [projectUserId]
      );
      if (projectName) {
        const newProject = await db.query(
          `INSERT INTO project (project_name,project_last_updated) values ($1, $2) RETURNING *`,
          [projectName, projectDate]
        );
        console.log(newProject.rows[0]);
    
        const projectOwner = await db.query(
          `INSERT INTO personToProject (project_id,person_id,is_creator) values ($1, $2, $3) RETURNING *`,
          [newProject.rows[0].project_id, projectUserId, true]
        );
          console.log(projectOwner.rows[0])
        if (projectParticipants.length > 0) {
          const resParticipants = projectParticipants.map(async (participant) => {
            const projectUsers = await db.query(
              `INSERT INTO personToProject (project_id,person_id,is_creator) values ($1, $2, $3) RETURNING *`,
              [newProject.rows[0].project_id, participant, false]
            );
            return projectUsers.rows[0].person_id;
          });
          if (resParticipants.length) {
            resMessage = "Проект успешно создан";
            resStatus = 200;
          } else {
            resMessage = "Ошибка при добавлении участников";
            resStatus = 500;
          }
        } else if (projectOwner.rows[0]) {
          resMessage = "Проект успешно создан";
          resStatus = 200;
        }
        else {
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
        `SELECT project.project_id, project.project_name, project.project_last_updated, PersonToProject.is_creator FROM project LEFT JOIN PersonToProject 
        on project.project_id = PersonToProject.project_id
        where PersonToProject.person_id = $1
        group by project.project_id, PersonToProject.is_creator
        order by project.project_id`,
        [projectUserId]
      );
      let resultProjects = [];
      allProjects.rows.map(async (project) => {
        // const projectEditor = await db.query(
        //   `SELECT * FROM person WHERE user_id = $1`,
        //   [project.project_creator]
        // );
        // console.log(projectEditor.rows[0])
        resultProjects.push({
          projectId: project.project_id,
          projectName: project.project_name,
          projectLastUpdated: project.project_last_updated,
          isProjectCreator: project.is_creator
        });
        console.log(resultProjects)
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
      where PersonToProject.person_id = $1 and project.project_id = $2
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

      projectParticipants.rows.map((user) => {
        resultUsers.push({
          userId: user.user_id,
          userLogin: user.user_login,
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
        projectTasks: resultTasks,
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
      where PersonToProject.person_id = $1 and project.project_id = $2
      group by project.project_id`,

      [userId, projectId]
    );
    if (isGrantAccess.rows[0]) {
      try {
        const { taskTitle, taskResponsible, taskPriority, taskDate, taskStatus, taskPlanDate } = req.body;
        console.log(taskDate)
        const newTask = await db.query(
          `INSERT INTO projectTask (project_id,project_task_title,project_task_responsible,project_task_plan_time,project_task_priority,project_task_status) values ($1, $2, $3, $4, $5, $6) RETURNING *`,
          [projectId, taskTitle, taskResponsible, taskPlanDate, taskPriority, taskStatus]
        );
        const taskComment =  `Создана задача`
        const newTaskComment = await db.query(
          `INSERT INTO TaskComment (project_task_id,project_comment_text,project_comment_date,project_comment_author) values ($1, $2, $3, $4) RETURNING *`,
          [newTask.rows[0].project_task_id, taskComment, taskDate, userId]
        );
        const needUpdateProject = await db.query(
          `SELECT * FROM project WHERE project_id = $1`,
          [newTask.rows[0].project_id]
        );
        const updatedProject = await db.query(
          `UPDATE project set project_name = $2, project_last_updated = $3
            where project_id = $1 RETURNING *`,
          [
            needUpdateProject.rows[0].project_id,
            needUpdateProject.rows[0].project_name,
            taskDate
          ]
        );
        res.status(200).json({ message: "Задача успешно добавлена" });
      } catch {
        res.status(500).json({ message: "Не удалось добавить задачу" });
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
        `SELECT * FROM projectTask LEFT JOIN person ON projectTask.project_task_responsible = person.user_id WHERE project_task_id = $1`,
        [taskId]
      );
      const taskComment = await db.query(
        `SELECT * FROM TaskComment LEFT JOIN person ON TaskComment.project_comment_author = person.user_id WHERE project_task_id = $1`,
        [taskId]
      );
      taskComment.rows.map((comment) => {
        resultComments.push({
          commentId: comment.comment_id,
          commentText: comment.project_comment_text,
          commentDate: comment.project_comment_date,
          commentAuthor: comment.user_login
        });
      });
      const resultTaskInfo = {
        taskId: taskInfo.rows[0].project_task_id,
        taskTitle: taskInfo.rows[0].project_task_title,
        taskPlanDate: taskInfo.rows[0].project_task_plan_time,
        taskPriority: taskInfo.rows[0].project_task_priority,
        taskResponsible: taskInfo.rows[0].user_email,
        taskStatus: taskInfo.rows[0].project_task_status,
        taskPriority: taskInfo.rows[0].project_task_priority,
        taskComment: resultComments
      };
      res.status(200).json(resultTaskInfo);
    } catch {
      res.status(404).json({ message: "Не удалось получить данные" });
    }
  }
  async changeTaskStatus(req, res) {
    const userId = userToken.getUserIdByToken(req);
    const taskId = req.params.taskId;
    const { taskStatus, taskDate } = req.body;
    console.log(taskDate)
    try {
      const taskComment = `Статус обновлен на ${taskStatus}`
      const taskInfo = await db.query(
        `SELECT * FROM projectTask WHERE project_task_id = $1`,
        [taskId]
      );
      console.log(taskInfo.rows[0]);
      const updatedTaskInfo = await db.query(
        `UPDATE projectTask set project_id = $1, project_task_title = $2, project_task_responsible = $3, project_task_plan_time = $4,
        project_task_status = $5, project_task_priority = $6
          where project_task_id = $7 RETURNING *`,
        [
          taskInfo.rows[0].project_id,
          taskInfo.rows[0].project_task_title,
          taskInfo.rows[0].project_task_responsible,
          taskInfo.rows[0].project_task_plan_time,
          taskStatus,
          taskInfo.rows[0].project_task_priority,
          taskInfo.rows[0].project_task_id,
        ]
      );
      const needUpdateProject = await db.query(
        `SELECT * FROM project WHERE project_id = $1`,
        [taskInfo.rows[0].project_id]
      );
      const updatedProject = await db.query(
        `UPDATE project set project_name = $2, project_last_updated = $3
          where project_id = $1 RETURNING *`,
        [
          needUpdateProject.rows[0].project_id,
          needUpdateProject.rows[0].project_name,
          taskDate
        ]
      );
      const newTaskComment = await db.query(
        `INSERT INTO TaskComment (project_task_id,project_comment_text,project_comment_date,project_comment_author) values ($1, $2, $3, $4) RETURNING *`,
        [taskId, taskComment, taskDate, userId]
      );
      if (updatedTaskInfo.rows[0] && newTaskComment && updatedProject.rows[0]) {
        res.status(200).json({ message: "Статус обновлен" });
      } else {
        res.status(500).json({ message: "Возникла ошибка обновления статуса" });
      }
    } catch {
      res.status(404).json({ message: "Возникла ошибка" });
    }
  }
  async changeTaskPriority(req, res) {
    const userId = userToken.getUserIdByToken(req);
    const taskId = req.params.taskId;
    const { taskPriority, taskPriorityText, taskDate } = req.body;
    
    const taskComment = `Приоритет обновлен на ${taskPriorityText}`
    try {
      const taskInfo = await db.query(
        `SELECT * FROM projectTask WHERE project_task_id = $1`,
        [taskId]
      );
      const updatedTaskInfo = await db.query(
        `UPDATE projectTask set project_id = $1, project_task_title = $2, project_task_responsible = $3, project_task_start_time = $4,
        project_task_end_time = $5, project_task_status = $6, project_task_priority = $7
          where project_task_id = $8 RETURNING *`,
        [
          taskInfo.rows[0].project_id,
          taskInfo.rows[0].project_task_title,
          taskInfo.rows[0].project_task_responsible,
          taskInfo.rows[0].project_task_start_time,
          taskInfo.rows[0].project_task_end_time,
          taskInfo.rows[0].project_task_status,
          taskPriority,
          taskInfo.rows[0].project_task_id,
        ]
      );
      const needUpdateProject = await db.query(
        `SELECT * FROM project WHERE project_id = $1`,
        [taskInfo.rows[0].project_id]
      );
      const updatedProject = await db.query(
        `UPDATE project set project_name = $2, project_last_updated = $4
          where project_id = $1 RETURNING *`,
        [
          needUpdateProject.rows[0].project_id,
          needUpdateProject.rows[0].project_name,
          taskDate
        ]
      );
      const newTaskComment = await db.query(
        `INSERT INTO TaskComment (project_task_id,project_comment_text,project_comment_date,project_comment_author) values ($1, $2, $3, $4) RETURNING *`,
        [taskId, taskComment, taskDate, userId]
      );
      if (updatedTaskInfo.rows[0] && newTaskComment.rows[0] && updatedProject.rows[0]) {
        res.status(200).json({ message: "Приоритет обновлен" });
      } else {
        res.status(500).json({ message: "Возникла ошибка обновления приоритета" });
      }
    } catch {
      res.status(404).json({ message: "Возникла ошибка" });
    }
  }
  async changeTaskResponsible(req, res) {
    const userId = userToken.getUserIdByToken(req);
    const taskId = req.params.taskId;
    const { taskResponsible, taskResponsibleEmail, taskDate } = req.body;
    
    const taskComment = `Ответственный изменен на ${taskResponsibleEmail}`
    try {
      const taskInfo = await db.query(
        `SELECT * FROM projectTask WHERE project_task_id = $1`,
        [taskId]
      );
      const updatedTaskInfo = await db.query(
        `UPDATE projectTask set project_id = $1, project_task_title = $2, project_task_responsible = $3, project_task_start_time = $4,
        project_task_end_time = $5, project_task_status = $6, project_task_priority = $7
          where project_task_id = $8 RETURNING *`,
        [
          taskInfo.rows[0].project_id,
          taskInfo.rows[0].project_task_title,
          taskResponsible,
          taskInfo.rows[0].project_task_start_time,
          taskInfo.rows[0].project_task_end_time,
          taskInfo.rows[0].project_task_status,
          taskInfo.rows[0].project_task_priority,
          taskInfo.rows[0].project_task_id,
        ]
      );
      const needUpdateProject = await db.query(
        `SELECT * FROM project WHERE project_id = $1`,
        [taskInfo.rows[0].project_id]
      );
      const updatedProject = await db.query(
        `UPDATE project set project_name = $2, project_last_updated = $4
          where project_id = $1 RETURNING *`,
        [
          needUpdateProject.rows[0].project_id,
          needUpdateProject.rows[0].project_name,
          taskDate
        ]
      );
      const newTaskComment = await db.query(
        `INSERT INTO TaskComment (project_task_id,project_comment_text,project_comment_date,project_comment_author) values ($1, $2, $3, $4) RETURNING *`,
        [taskId, taskComment, taskDate, userId]
      );
      if (updatedTaskInfo.rows[0] && newTaskComment.rows[0] && updatedProject.rows[0]) {
        res.status(200).json({ message: "Приоритет обновлен" });
      } else {
        res.status(500).json({ message: "Возникла ошибка обновления приоритета" });
      }
    } catch {
      res.status(404).json({ message: "Возникла ошибка" });
    }
  }
  async getProjectParticipants(req, res) {
    const userId = userToken.getUserIdByToken(req);
    try {
      const projectId = req.params.projectId;
      let participants = [];
      let resultUsers = [];
      const projectParticipants = await db.query(
        `SELECT * FROM PersonToProject LEFT JOIN person ON PersonToProject.person_id = person.user_id WHERE project_id = $1`,
        [projectId]
      );
      projectParticipants.rows.map((user) => {
        participants.push({
          userId: user.user_id,
          userLogin: user.user_login
        });
      });
      const users = await db.query(
        `SELECT user_id, user_login
        FROM person 
        WHERE NOT EXISTS (
            SELECT 1 
            FROM persontoproject 
            WHERE person.user_id = persontoproject.person_id  
            AND project_id = $1
        );`,
        [projectId]
      );
      users.rows.map((user) => {
        resultUsers.push({
          userId: user.user_id,
          userLogin: user.user_login
        });
      });
      const projectCreator = await db.query(
        `SELECT user_id, user_login FROM PersonToProject LEFT JOIN person ON PersonToProject.person_id = person.user_id WHERE project_id = $1 AND is_creator = true`,
        [projectId]
      );
      const resCreator = {
        userId: projectCreator.rows[0].user_id,
        userLogin: projectCreator.rows[0].user_login,
        isUserCreator: userId === projectCreator.rows[0].user_id
      }
      res.status(200).json({participants: participants, users: resultUsers, creator: resCreator});
    } catch {
      res.status(500).json({ message: "Возникла ошибка" });
    }
  }
  async setNewTaskComment(req, res) {
    const userId = userToken.getUserIdByToken(req);
    try {
      const { taskId, taskComment, taskDate } = req.body;
      const newTaskComment = await db.query(
        `INSERT INTO TaskComment (project_task_id,project_comment_text,project_comment_date,project_comment_author) values ($1, $2, $3, $4) RETURNING *`,
        [taskId, taskComment, taskDate, userId]
      );
      res.status(200).json({ message: "Комментарий добавлен" });
    } catch {
      res.status(500).json({ message: "Не удалось добавить комментарий" });
    }
  }
  async changeProjectName(req, res) {
    const userId = userToken.getUserIdByToken(req);
    const projectId = req.params.projectId;
    const projectName = req.body.projectName;
    
    try {
      const projectInfo = await db.query(
        `SELECT * FROM project WHERE project_id = $1`,
        [projectId]
      );
      const updatedProjectInfo = await db.query(
        `UPDATE project set project_name = $1, project_last_updated = $2 where project_id = $3 RETURNING *`,
        [
          projectName,
          projectInfo.rows[0].project_last_updated,
          projectId
        ]
      );
      
      if (updatedProjectInfo) {
        res.status(200).json({ message: "Данные успешно обновлены" });
      } else {
        res.status(500).json({ message: "Возникла ошибка при обновлении данных" });
      }
    } catch {
      res.status(404).json({ message: "Возникла ошибка" });
    }
  }
  async addProjectParticipants(req, res) {
    try {
      const projectId = req.params.projectId;
      const userId = req.body.userId;

      const projectParticipants = await db.query(
        `INSERT INTO personToProject (project_id,person_id,is_creator) values ($1, $2, $3) RETURNING *`,
        [projectId, userId, false]
      );
        if (projectParticipants) {
          res.status(200).json({ message: "Участник успешно добавлен" });
        } else {
          res.status(500).json({ message: "Ошибка при добавлении учасника" });
        }
      
    } catch {
      res.status(500).json({ message: "Возникла ошибка" });
    }
  }
  async deleteProjectParticipants(req, res) {
    try {
      const projectId = req.params.projectId;
      const userId = req.params.userId;

      const projectParticipants = await db.query(
        `DELETE FROM persontoproject WHERE project_id=$1 AND person_id=$2 RETURNING *`,
        [projectId, userId]
      );
        if (projectParticipants.rows[0]) {
          res.status(200).json({ message: "Участник успешно удален" });
        } else {
          res.status(500).json({ message: "Ошибка при удалении учасника" });
        }
      
    } catch {
      res.status(500).json({ message: "Возникла ошибка" });
    }
  }
  async deleteProject(req, res) {
    const userId = userToken.getUserIdByToken(req);
    const projectId = req.params.projectId;
    
    try {
      const deletedProject = await db.query(
        `DELETE FROM project WHERE project_id=$1 RETURNING *`,
        [
          projectId
        ]
      );
      
      if (deletedProject) {
        res.status(200).json({ message: "Проект успешно удален" });
      } else {
        res.status(500).json({ message: "Возникла ошибка при удалении" });
      }
    } catch {
      res.status(404).json({ message: "Возникла ошибка" });
    }
  }
}

module.exports = new ProjectController();
