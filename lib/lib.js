/**
 * helper functions
 */

// dependency
const crypto = require('crypto');
const queryString = require('querystring');
const axios = require('axios');
const lib = {};

// very hmac
lib.verifyHmac = (req, hmac) => {
    const map = Object.assign({}, req.query);
    delete map['signature'];
    delete map['hmac'];
    const msg = queryString.stringify(map);    
    const pHmac = Buffer.from(hmac, 'utf-8');
    const gHash = Buffer.from(
      crypto.createHmac('sha256', process.env.APP_API_SECRET).update(msg).digest('hex'),'utf-8'
    );
    let hmcEqual = false;    
    try {
        hmcEqual = crypto.timingSafeEqual(pHmac, gHash);  
     } catch (e) {
        hmcEqual = false;  
     }
    return hmcEqual;  
}

lib.getAccessToken = async(shop, code) => {
    let payload = {
        client_id: process.env.APP_API_KEY,
        client_secret: process.env.APP_API_SECRET,
        code: code
    };
    let apiUrl = `https://${shop}/admin/oauth/access_token`;
    try {
        let response = await axios.post(apiUrl, payload);
        console.log(response);
        if(!response.data.access_token){
            return false;
        } 
        return response.data.access_token;
        
    } catch (error) {
       console.log(error);
       return false; 
    }
} 

module.exports = lib;