const express=require("express")
const dotenv=require("dotenv")
const connectDB=require("./config/db")
const userRoutes=require("./routes/userRoutes")
const chatRoutes=require("./routes/chatRoutes")
const messageRoutes=require("./routes/messageRoutes")
const {notFound,errorHandler}=require("./middleware/errorMiddleware")
const Chat=require("../backend/models/chatModel")

const app=express()
dotenv.config()
connectDB()

app.use(express.json())

app.get('/',(request,response)=>{
    response.send("API is running successfully !")
})

app.use('/api/user',userRoutes)
app.use('/api/chat',chatRoutes)
app.use('/api/message',messageRoutes)

app.use(notFound)
app.use(errorHandler)

const PORT =process.env.PORT || 5000

const server=app.listen(PORT,()=>{
    console.log(`Server running on port ${PORT}`)
})

const io=require("socket.io")(server,{
    pingTimeout:60000,
    cors:{
        origin:"http://localhost:3000"
    }
})

io.on("connection",(socket)=>{
    console.log("connected to socket.io")

    socket.on("setup",(userData)=>{
        socket.join(userData._id)
        socket.emit("connected")
    })

    socket.on("join chat",(room)=>{
        socket.join(room)
        console.log("user joined room - "+room)
    })

    socket.on("typing",(room)=>{
        socket.in(room).emit("typing")
    })

    socket.on("stop typing",(room)=>{
        socket.in(room).emit("stop typing")
    })

    socket.on("new message",async (newMessageReceived)=>{
        var chat=newMessageReceived.chat
        // console.log(newMessageReceived)
        chat=await Chat.find({
            _id:chat,
        }).populate("users","-password")
        // console.log(chat)

        if(!chat[0].users)
        {
            return console.log("chat.users is not defined")
        }

        chat[0].users.forEach((user) => {
            if(user._id!=newMessageReceived.sender)
            {
                socket.broadcast.emit("message received",newMessageReceived)
                console.log("signal sent")
            }
            

        });
    })

    socket.off("setup",()=>{
        console.log("user disconnected")
        socket.leave(userData._id)
    })
})