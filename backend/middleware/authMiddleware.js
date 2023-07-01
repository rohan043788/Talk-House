const jwt=require("jsonwebtoken")
const asyncHandler=require("express-async-handler")
const User=require("../models/userModel")

const protect=asyncHandler(async (request,response,next) => {
    let token;

    if(request.headers.authorization && request.headers.authorization.startsWith("Bearer"))
    {
        try{
            token=request.headers.authorization.split(" ")[1]
            const decoded=jwt.verify(token,process.env.JWT_SECRET)
            request.user=await User.findById(decoded.id).select("-password")
            next()
        }
        catch(error)
        {
            response.status(401)
            throw new Error("User not authorized, token failed")
        }
    }
    else{
        response.status(401)
        throw new Error("User not authorized, no token")
    }
})

module.exports={protect};