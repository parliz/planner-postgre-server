const db = require("../db");
const bcrypt = require("bcrypt");
class UserController {
  async createUser(req, res) {
    const { login, name, email, password } = req.body;
    console.log(req.body);
    const hashPassword = bcrypt.hashSync(password, 7);
    console.log(login, name, email, hashPassword);
    const newPerson = await db.query(
      `INSERT INTO person (user_login,user_name,user_email,user_password_hash) values ($1, $2, $3, $4) RETURNING *`,
      [login, name, email, hashPassword]
    );
    // res.json(newPerson.rows[0]);
    res.json("Пользователь успешно зарегистрирован")
  }
  async getUsers(req, res) {
    const allPersons = await db.query(
        `SELECT * FROM person`);
      res.json(allPersons.rows);
  }
  async getOneUser(req, res) {
    const {userEmail, userPassword} = req.body;
    // const userPasswordHash = bcrypt.hashSync(userPassword, 7);
    // console.log("userPasswordHash: ",userPasswordHash);
    const onePerson = await db.query(
        `SELECT * FROM person where user_email = $1 and user_password_hash = $2`,[userEmail, userPasswordHash]);
      res.json(onePerson.rows);
  }
  async updateUser(req, res) {
    const {user_id, user_login, user_name, user_email, user_password_hash} = req.body;
    const allPersons = await db.query(
        `UPDATE person set user_login = $1, user_name = $2, user_email = $3, user_password_hash = $4 where user_id = $5 RETURNING *`,[user_login, user_name, user_email, user_password_hash, user_id]);
      res.json(allPersons.rows[0]);
  }
  async deleteUser(req, res) {
    const person_id = req.params.id;
    const allPersons = await db.query(
        `DELETE from person where user_id = $1 RETURNING *`,[person_id]);
      res.json(allPersons.rows[0]);
  }
}

module.exports = new UserController();
