const db = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {secret} = require("../config.js");

const generateAccessToken = (user_id) => {
  const payload = { user_id}
  return jwt.sign(payload, secret, {expiresIn: "24h"})
}
class UserController {
  async createUser(req, res) {
    try {
      const { login, email, password, language } = req.body;
      const hashPassword = bcrypt.hashSync(password, 7);
      const newPerson = await db.query(
        `INSERT INTO person (user_login,user_email,user_language,user_password_hash) values ($1, $2, $3, $4) RETURNING *`,
        [login, email, language, hashPassword]
      );
      if (newPerson.rows[0]) {
        res.json("Пользователь успешно зарегистрирован");
      } else {
        res.json("Пожалуйста, попробуйте снова");
      }
    } catch (e) {
      console.log(e);
      res.status(400).json({ message: "Ошибка регистрации" });
    }
  }
  async getUsers(req, res) {
    const allPersons = await db.query(`SELECT * FROM person`);
    res.json(allPersons.rows);
  }
  async login(req, res) {
    try {
      let valid = false;
      const email = req.params.email;
      const password = req.params.password;
      const onePerson = await db.query(`SELECT * FROM person where user_email = $1`,[email]);
      if (onePerson) {
        const hashPassword = onePerson.rows[0].user_password_hash;
        valid = bcrypt.compareSync(password, hashPassword);
        if (valid) {
          
        } else {
          res.status(400).json({ message: "Неправильный пароль" });
        }
      } else {
        res.status(400).json({ message: "Пользователь не найден" });
      }
      const token = generateAccessToken(onePerson.rows[0].user_id)
      res.status(200).json({token});
    } catch (e) {
      console.log(e);
      res.status(400).json({ message: "Ошибка авторизации" });
    }
  }
  async updateUser(req, res) {
    0;
    const { user_id, user_login, user_name, user_email, user_password_hash } =
      req.body;
    const allPersons = await db.query(
      `UPDATE person set user_login = $1, user_name = $2, user_email = $3, user_password_hash = $4 where user_id = $5 RETURNING *`,
      [user_login, user_name, user_email, user_password_hash, user_id]
    );
    res.json(allPersons.rows[0]);
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
