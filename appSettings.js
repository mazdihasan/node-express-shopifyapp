const settings = {};
settings.scripts = [
    {'event':'onload', 'src':'js/app.js'}
];
settings.webhooks = [
    {'topic': 'app/uninstalled', 'address': 'webhooks/app/uninstalled'},
    {'topic': 'orders/create', 'address': 'webhooks/orders/create'},
    {'topic': 'orders/paid', 'address': 'webhooks/orders/paid'}
];
export default settings;