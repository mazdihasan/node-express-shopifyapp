/**
 * utility functions
 */

// dependency
import Shop from '../models/Shop.js';
const lib = {};

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

export default lib;