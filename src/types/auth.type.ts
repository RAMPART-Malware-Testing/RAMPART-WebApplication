interface LoginParams{
    username:string, 
    password:string, 
    userAgent:string | null, 
    ip:string | null
}

interface RegisterParams{
    username:string, 
    email:string, 
    password:string, 
}