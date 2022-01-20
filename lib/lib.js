/**
 * utility functions
 */

// dependency
const crypto = require('crypto');
const queryString = require('querystring');
const axios = require('axios');
const Shop = require('../models/Shop');
const Shopify = require('shopify-api-node');
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

lib.saveToken = async(token, shop) => {
    try {
        let dbShop = await Shop.findOne({shop});
        let response = {};
        // check active shop in database and has token
        if(dbShop && dbShop.active && dbShop.token !== ''){
            response = {'success': true, 'new':false, 'data': dbShop, 'message': 'active shop in database' };
            return response;
        }

        if(dbShop && (!dbShop.active || dbShop.token == '')){
            dbShop = await Shop.updateOne({shop}, {token: token, active: 1});
            response = {'success': true, 'new':false, 'data': dbShop, 'message': 'shop updated in database' };
            return response;
        }        
        if(!dbShop){
            dbShop = await Shop.create({shop, token});
            response = {'success': true, 'new':true,  'data': dbShop, 'message': 'new shop saved' };
        }
        return response;
    } catch (error) {
       console.log(error);
       let response = {'success': false, 'error': error }; 
       return response;
    }
}

lib.setScriptTag = async(shop, token, file_name) => {
    let script_path = process.env.APP_URL +'/'+file_name;
    let api_version = process.env.APP_API_VERSION || '2022-01';
    let apiUrl = `https://${shop}/admin/api/${api_version}/script_tags.json`;
    let data = {
        'script_tag': {
            'event':'onload',
            'src': script_path
        }
    };
    try {
       let scriptData = axios.post(apiUrl, data, {
           headers: {
            'Content-Type': 'application/json',   
            'X-Shopify-Access-Token': token
           },
       });
       return { 'success': true, 'data': scriptData}; 
    } catch (error) {
        return { 'success': false, 'error': error}; 
    }
}

module.exports = lib;