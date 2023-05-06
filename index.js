const express = require('express')
const userRouter = require('./routes/user.routes')
const taskRouter = require('./routes/task.routes')
const PORT = process.env.PORT || 5000;

const app = express();
app.use(express.json())

app.use('/api', userRouter)
app.use('/api', taskRouter)

app.listen(PORT, () => console.log(`server started on port ${PORT}`))
