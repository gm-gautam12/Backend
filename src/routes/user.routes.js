import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";


const router = Router(); 


router.route("/register").post(registerUser);

export default router;



/*
"/users" hoga ya /registervuse hoga
isme hme ye rkhna h ki 
url aise  hoga 
http://localhost:8000/users/register

pehle user call hua fir usne control /register ko dediya
*/