import { Router } from "express";
import { registerUser,logoutUser, loginUser,refreshAccessToken } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router(); 


router.route("/register").post(
    upload.fields([ // middleware
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),
    registerUser);

router.route("/login").post(loginUser);

//secured Route
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);



export default router;



/*
"/users" hoga ya /registervuse hoga
isme hme ye rkhna h ki 
url aise  hoga 
http://localhost:8000/users/register

pehle user call hua fir usne control /register ko dediya
*/