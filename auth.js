const jose = require('jose')
const JWKS = jose.createRemoteJWKSet(new URL(process.env.JWKS_URL))
async function verifyToken(token) {
    try{  
        const { payload } = await jose.jwtVerify(token, JWKS, { algorithms: ['ES256']})
        return {status: 'valid', userId: payload.sub}}
    catch(err){
        if (err.code==='ERR_JWT_EXPIRED'){
            return {status: 'expired'}
        }else return {status: 'invalid'}
    }
}

module.exports = verifyToken