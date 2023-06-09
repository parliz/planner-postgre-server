const db = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userToken = require("../getUserIdByToken");
const { secret } = require("../config.js");

const generateAccessToken = (user_id) => {
  const payload = { user_id };
  return jwt.sign(payload, secret, { expiresIn: "24h" });
};
class UserController {
  async createUser(req, res) {
    let resStatus = null;
    let resMessage = null;
    try {
      const { login, email, password, language } = req.body;
      if (login && email && password && language) {
        
        const hashPassword = bcrypt.hashSync(password, 7);
        const newPerson = await db.query(
          `INSERT INTO person (user_login,user_email,user_language,user_password_hash) values ($1, $2, $3, $4) RETURNING *`,
          [login, email, language, hashPassword]
        );
        if (newPerson.rows[0]) {
          resMessage = "Пользователь успешно зарегистрирован";
          resStatus = 200;
        } else {
          resMessage = "Пожалуйста, попробуйте снова. Логин и почта должны быть уникальными";
          resStatus = 500;
        }
      } else {
        resMessage = "Заполните обязательные поля";
        resStatus = 400;
      }
    } catch (e) {
      console.log(e);
      resMessage = "Ошибка регистрации";
      resStatus = 401;
    }
    res.status(resStatus).json({ message: resMessage });
  }
  async getUsers(req, res) {
    const userId = userToken.getUserIdByToken(req); 
    const allPersons = await db.query(`SELECT * FROM person WHERE user_id<>$1`, [userId]);
    let resultUsers = [];
    allPersons.rows.map((user) => {
      resultUsers.push({"userId": user.user_id, "userLogin": user.user_login, "userEmail": user.user_email})
    })
    res.json(resultUsers);
  }
  async login(req, res) {
    try {
      let valid = false;
      const email = req.body.email;
      const password = req.body.password;
      let userLogin = null;
      let userEmail = null;
      let userLanguage = null;
      const onePerson = await db.query(
        `SELECT * FROM person where user_email = $1`,
        [email]
      );
      if (onePerson) {
        const hashPassword = onePerson.rows[0].user_password_hash;
        valid = bcrypt.compareSync(password, hashPassword);
        if (valid) {
          const token = generateAccessToken(onePerson.rows[0].user_id);
          res.status(200).json({ token });
        } else {
          res.status(400).json({ message: "Неправильный пароль" });
        }
      } else {
        res.status(400).json({ message: "Пользователь не найден" });
      }
      
    } catch (e) {
      console.log(e);
      res.status(400).json({ message: "Ошибка авторизации" });
    }
  }
  async getUser(req, res) {
    const userId = userToken.getUserIdByToken(req);   
    console.log("userId: ", userId)
    if (userId) {
      const onePerson = await db.query(
        `SELECT * from person where user_id = $1`,[userId]);
      const userLogin = onePerson.rows[0].user_login;
      const userEmail = onePerson.rows[0].user_email;
      const userLanguage = onePerson.rows[0].user_language;
      res.status(200).json({ userEmail, userLogin, userLanguage });
    } else {
      return res.status(403).json({message: "Пользователь не распознан"})
    }
  }
  async updateUser(req, res) {
    console.log("update user")
    const userId = userToken.getUserIdByToken(req);   
    const { userEmail, userLanguage } = req.body;
    try {
      const personInfo = await db.query(
        `SELECT * from person where user_id = $1`,[userId]);
      console.log(personInfo.rows[0])
      const allPersons = await db.query(
        `UPDATE person set user_login = $1, user_email = $2, user_password_hash = $3, user_language = $4 where user_id = $5 RETURNING *`,
        [personInfo.rows[0].user_login, userEmail, personInfo.rows[0].user_password_hash, userLanguage, userId]
      );
      res.json(allPersons.rows[0]);
    }
    catch {
      res.status(500).json({message: "Возникла ошибка"})
    }

    
  }
  async deleteUser(req, res) {
    const person_id = req.params.id;
    const allPersons = await db.query(
      `DELETE from person where user_id = $1 RETURNING *`,
      [person_id]
    );
    res.json(allPersons.rows[0]);
  }
}

module.exports = new UserController();
