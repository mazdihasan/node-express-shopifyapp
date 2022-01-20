if(process.env.APP_ENV != 'production'){
    require('dotenv').config();
}
const express = require('express');
const cookieParser = require('cookie-parser');
const nonce = require('nonce')();
const lib = require('./lib/lib');
const dbConnect = require('./lib/dbCon');
const app = require("liquid-express")(express());
// middleware
app.use(cookieParser());
app.use(express.static('public'));
// routes
app.get('/', (req, res) => {
    // @test
    // console.log(req.query);
    // const {shop, hmac, session } = req.query;
    // console.log(lib.verifyHmac(req, hmac));
    res.render('index', {
        name: "Md Mazdi"
    })
});

app.get('/login', (req, res) => {
    let shop = req.query.shop;
    //console.log(req.cookies);
    if(!shop){
        return res.send('shop not found');
    }
    shop = shop.replace(/(^\w+:|^)\/\//, '').replace('/', '').trim();
    // check shopify domain match
    const shopify_domain_regex =/^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify.com/;
    if(!shopify_domain_regex.test(shop)){
        return res.send('invalid shopify domain');
    }

    const state = nonce();
    // app url
    const app_url = process.env.APP_URL || 'https://6504-103-135-254-6.ngrok.io';
    const redirect_uri = app_url +'/auth/callback';
    //set install url
    const install_url = 
    `https://${shop}/admin/oauth/authorize?client_id=${process.env.APP_API_KEY}&scope=${process.env.APP_API_SCOPES}&state=${state}&redirect_uri=${redirect_uri}`;
    //set state cookie
    res.cookie('state', state);
    res.redirect(install_url);
    //res.send('Login page');
});

app.get('/auth/callback', async(req, res) => {
    const {state, shop, hmac, code } = req.query;
    // verify state nonce
    if(state !== req.cookies.state){
        return res.status(403).send('Sorry Request origin not verified');
    }
    // check all require fields available
    if(!shop || !hmac || !code){
        return res.status(403).send('Something wrong, try to install again');
    }
    // verify hmac
    //let verifyHmac = lib.verifyHmac(req, hmac);
     if(!lib.verifyHmac(req, hmac)){
        return res.status(400).send('Sorry HMAC validation failed');
     }
     //get shop access token
     let accessToken = await lib.getAccessToken(shop, code);
     if(!accessToken){
        return res.status(400).send('Sorry can\'t get shop access token');
     }
     //save access token on database and set cookie
     let spData = await lib.saveToken(accessToken, shop);
     if(!spData.success){
        return res.status(400).send('Sorry access token not saved'); 
     }
     res.cookie('shop', shop);

     // set script tags
     let scriptData = lib.setScriptTag(shop, token, 'test.js');
     // set webhooks

     // set app billing

     // redirect to app dashboard
     res.redirect('/');
});

//connect to database
dbConnect();

// run server
const PORT = process.env.PORT || 5000; 
app.listen(PORT, () => console.log(`App running on http://localhost:${PORT}`));
