const express=require("express")
const router=express.Router()
const {registerUser}=require("../controllers/userController")
const {authUser}=require("../controllers/userController")
const {allUsers}=require("../controllers/userController")
const {protect}=require("../middleware/authMiddleware")

router.route('/').post(registerUser).get(protect,allUsers)

router.post('/login',authUser)

module.exports=router;