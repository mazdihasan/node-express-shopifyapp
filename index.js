import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import lib from './lib/lib.js';
import dbConnect from './lib/dbCon.js';
import settings from './appSettings.js';
import { Shopify, DataType } from '@shopify/shopify-api';
const app = express();
// middleware
app.use(cookieParser());
app.use(express.static('public'));

const { API_KEY, API_SECRET_KEY, SCOPES, SHOP } = process.env;
// initialize the shopify api
Shopify.Context.initialize({
  API_KEY,
  API_SECRET_KEY,
  SCOPES: [SCOPES],
  HOST_NAME: SHOP.replace(/https:\/\//, ""),
  IS_EMBEDDED_APP: true
});
// set webhook handlers
Shopify.Webhooks.Registry.addHandler('ORDERS_PAID', {
    path: "/webhooks",
    webhookHandler: handleWebhookRequest,
});
// routes
app.get('/', (req, res) => {

});

app.get('/auth', async(req, res) => {
    let shop = req.query.shop;
    //console.log(req.cookies);
    if(!shop){
        return res.send('shop not found! please set the shop in the query string');
    }
    //set install url
    const install_url = await Shopify.Auth.beginAuth(
        req,
        res,
        shop,
        '/auth/callback',
        false
    )
    res.redirect(install_url);
});

app.get('/auth/callback', async(req, res) => {
    const {shop, hmac, code } = req.query;
    // check all require fields available
    if(!shop || !hmac || !code){
        return res.status(403).send('Something wrong, try to install again');
    }
    // validate auth callback request
    try {
        const shopData = await Shopify.Auth.validateAuthCallback(
            req,
            res,
            req.query,
        );
        //console.log(shopData);
        // save shop data to database
        let spData = await lib.saveToken(shopData.accessToken, shopData.shop);
        //if new shop and success save token
        if(spData.success && spData.new){
            //create shop client
            const client = new Shopify.Clients.Rest(shopData.shop, shopData.accessToken);
            // add script tags
            if(settings.scripts.length > 0){
                let scriptTags = settings.scripts;
                scriptTags.forEach( async(item) => {
                    let scriptUrl = process.env.APP_URL + '/' + item.src;
                    let scriptData = {
                        'script_tag': {
                            'event': item.event,
                            'src': scriptUrl
                        }
                    };
                    await client.post({ path: 'script_tags', data : scriptData, type: DataType.JSON });
                });
            }    
            // set webhooks
            let webhooks = settings.webhooks;
            if(webhooks.length > 0){                
                webhooks.forEach(async(topic) => {
                    await Shopify.Webhooks.Registry.register({
                        path: '/webhooks',
                        topic: topic,
                        accessToken: shopData.accessToken,
                        shop: shopData.shop,
                      });                    
                });
            }
            // set app billing
        }
        //sign token
        const token = jwt.sign({shop:shopData.shop, accessToken: shopData.accessToken}, process.env.APP_SECRET_KEY);
        // set cookie
        res.cookie('token', token, { maxAge: 900000, httpOnly: true });
        // redirect to app dashboard page
        res.redirect('/');        
    } catch (error) {
        res.status(400).send('Something wrong, try to install again', error);
    }
});

// webhook route
app.post('/webhooks', async (req, res) => {
    try {
      await Shopify.Webhooks.Registry.process(req, res);
    } catch (error) {
      console.log(error);
    }
});

// run server
const start = (port) => {
    try {
       //connect to database
      dbConnect(); 
      app.listen(port, () => console.log(`App running on http://localhost:${port}`));
    } catch (error) {
      console.error(error);
      process.exit();
    }
};
const PORT = process.env.PORT || 5000; 
start(PORT);
