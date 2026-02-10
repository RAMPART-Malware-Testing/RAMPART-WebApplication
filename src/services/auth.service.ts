import axios from "axios";
const URL = process.env.SERVER_URL || "http://localhost:8006"

export async function loginService(req:LoginParams){
    try{
        const res = await axios.post(`${URL}/api/login`,{
            username:req.username,
            password:req.password
        },{
            headers:{
                "User-Agent":req.userAgent,
                "x-client-ip": req.ip,
            }
        })
        return res.data;
    }catch{
        return {success:false, message:"Connect Server Error!!!"}
    }
    
}