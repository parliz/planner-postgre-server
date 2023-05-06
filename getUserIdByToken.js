const jwt = require("jsonwebtoken");
const {secret} = require("./config.js");
class getUserId {
    
    getUserIdByToken(req) {
        const token = req.headers.authorization;
        console.log(token)
        const decodedData = token ? jwt.verify(token, secret).user_id : null
        console.log(decodedData)
        return decodedData
    }
}

module.exports = new getUserId();
