const jwt=require('jsonwebtoken')


const generateAccessToken=(user)=>{
    return jwt.sign(user,process.env.ACCESS_SECRET,{expiresIn:'15m'})
}

const generateRefreshToken=(user)=>{
    return jwt.sign(user,process.env.REFRESH_SECRET,{expiresIn:'30d'})
}

module.exports={generateAccessToken,generateRefreshToken}