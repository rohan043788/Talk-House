const asyncHandler=require("express-async-handler")
const Chat=require("../models/chatModel")
const User=require("../models/userModel")

const accessChat=asyncHandler(async (request,response) =>{
    const {userId}=request.body

    if(!userId)
    {
        console.log("userId param not sent in request body")
        response.sendStatus(400)
    }

    var chat=await Chat.find({
        isGroupChat:false,
        $and:[
            {users:{$elemMatch:{$eq:request.user._id}}},
            {users:{$elemMatch:{$eq:userId}}}
        ]
    }).populate("users","-password").populate("latestMessage")

    chat=await User.populate(chat,{
        path:"latestMessage.sender",
        select:"name pic email"
    })

    if(chat.length>0)
    {
        response.send(chat[0])
    }
    else{
        var chatData={
            chatName:"sender",
            isGroupChat:false,
            users:[request.user._id,userId]
        }

        try{
            const createChat=await Chat.create(chatData)

            const fullChat=await Chat.findOne({_id:createChat._id}).populate("users","-password")
            response.status(200).send(fullChat)
        }
        catch(error)
        {
            response.status(400)
            throw new Error(error.message)
        }
    }
})

const fetchChats=asyncHandler(async (request,response) => {
    try{
        var results=Chat.find({
            users:{$elemMatch:{$eq:request.user._id}}
        }).populate("users","-password").populate("latestMessage").populate("groupAdmin").sort({updatedAt:-1})

        results=await User.populate(results,{
            path:"latestMessage.sender",
            select:"name pic email"
        })

        response.status(200).send(results)
    }
    catch(error)
    {
        response.status(400)
        throw new Error(error.message)
    }
})

// const retrieveChat=asyncHandler(async (request,response) => {
//     const {chatId}=request.body

//     if(!chatId)
//     {
//         console.log("chatId param not sent in request body")
//         response.sendStatus(400)
//     }

//     try{
//         var chat=await Chat.find({
//             _id:chatId
//         }).populate("users","-password").populate("latestMessage")

//         chat=await User.populate(chat,{
//             path:"latestMessage.sender",
//             select:"name pic email"
//         })

//         response.send(chat)
//     }
//     catch(error)
//     {
//         response.status(400)
//         throw new Error(error.message)
//     }
// })

const createGroupChat=asyncHandler(async (request,response) => {
    if(!request.body.users || !request.body.name)
    {
        response.status(400).send("Please enter all fields!")
    }

    var users=JSON.parse(request.body.users)

    if(users.length<2)
    {
        response.status(400).send("Group must contain atleast 2 users")
    }

    users.push(request.user)

    try{
        const groupChat=await Chat.create({
            chatName:request.body.name,
            isGroupChat:true,
            users:users,
            groupAdmin:request.user
        })

        const fullChat=await Chat.findOne({_id:groupChat._id}).populate("users","-password").populate("groupAdmin","-password")

        response.status(200).json(fullChat)
    }
    catch(error)
    {
        response.status(400)
        throw new Error(error.message)
    }
})

const renameGroup=asyncHandler(async (request,response) => {
    const {chatId,chatName}=request.body

    if(!chatId || !chatName)
    {
        response.status(400).send("chatId or chatName not sent in request body")
    }

    try{
        const updatedChat=await Chat.findByIdAndUpdate(
            chatId,
            {
                chatName:chatName
            },
            {
                new:true
            }
        ).populate("users","-password").populate("groupAdmin","-password");

        response.status(200).json(updatedChat);
    }
    catch(error)
    {
        response.status(400)
        throw new Error(error.message)
    }

})

const addToGroup=asyncHandler(async (request,response) => {
    const {chatId,userId}=request.body

    if(!chatId || !userId)
    {
        response.status(400).send("chatId or userId not sent in request body")
    }

    try{
        const added=await Chat.findByIdAndUpdate(chatId,
            {
                $push:{users:userId}
            },
            {
                new:true
            }).populate("users","-password").populate("groupAdmin","-password")

        response.status(200).json(added)
    }
    catch(error)
    {
        response.status(400)
        throw new Error(error.message)
    }
})

const removeFromGroup=asyncHandler(async (request,response) => {
    const {chatId,userId}=request.body

    if(!chatId || !userId)
    {
        response.status(400).send("chatId or userId not sent in request body")
    }

    try{
        const removed=await Chat.findByIdAndUpdate(chatId,
            {
                $pull:{users:userId}
            },
            {
                new:true
            }).populate("users","-password").populate("groupAdmin","-password")

        response.status(200).json(removed)
    }
    catch(error)
    {
        response.status(400)
        throw new Error(error.message)
    }
})

module.exports={accessChat,fetchChats,createGroupChat,renameGroup,addToGroup,removeFromGroup};