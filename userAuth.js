const jwt = require('jsonwebtoken')
module.exports = function (req, res, next) {
    try {
        const token = req.headers.authorization.split(" ")[1];
        if (!token) {
            return res.statue(403).json({message: "Пользователь не авторизован"})
        }
    } catch (e) {
        console.log(e)
        return res.status(500).json({message: "Ошибка получения пользователя"})
    }
}
