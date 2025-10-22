const jwt = require('jsonwebtoken');

const auth_middleware= (req,res,next)=>{
    const authorization = req.headers.authorization;
    if(!authorization || !authorization.startsWith('Bearer ')){
        return res.status(403).json({
            Message:"User is unauthorized"
        })
    }
    const token = authorization.split(" ")[1];
    try{
        const decoded= jwt.verify(token,process.env.JWT_SECRET);
        if(!decoded.userId){
            return res.status(403).json({
        message: "Invalid token payload"})
        }
        req.userId=decoded.userId;
        next()
    }catch (err){
        return res.status(403).json({err: 'token verification failed'});
    }
}

module.exports={auth_middleware};