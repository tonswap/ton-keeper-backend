"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_handlebars_1 = require("express-handlebars");
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
const tonconnect_server_1 = require("@tonapps/tonconnect-server");
// use generateServerSecret();
const staticSecret = 'mO8G0c/9ZgfBx1EDMz4aMs4zmz1YsB1ENzK6d0H76QE=';
const port = 8080;
function init() {
    const host = '127.0.0.1';
    const hostname = '1d55-77-137-68-5.eu.ngrok.io'; //`${host}:${port}`;
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)());
    app.engine("handlebars", (0, express_handlebars_1.engine)());
    app.set("view engine", "handlebars");
    app.set("views", path_1.default.resolve(__dirname, "./views"));
    const tonconnect = new tonconnect_server_1.TonConnectServer({ staticSecret });
    app.get('/authRequest', (req, res) => {
        console.log("auth request !!!!");
        const request = tonconnect.createRequest({
            image_url: 'https://ddejfvww7sqtk.cloudfront.net/images/landing/ton-nft-tegro-dog/avatar/image_d0315e1461.jpg',
            return_url: `${hostname}/tonconnect`,
            items: [{
                    type: tonconnect_server_1.AuthRequestTypes.ADDRESS,
                    required: true
                }, {
                    type: tonconnect_server_1.AuthRequestTypes.OWNERSHIP,
                    required: true
                }],
        }, {
            customField: 'some data...'
        });
        res.send(request);
    });
    app.get('/tonconnect', async (req, res) => {
        try {
            const encodedResponse = req.query.tonlogin;
            const response = tonconnect.decodeResponse(encodedResponse);
            const print = { response };
            for (let payload of response.payload) {
                switch (payload.type) {
                    case tonconnect_server_1.AuthRequestTypes.OWNERSHIP:
                        const isVerified = await tonconnect.verifyTonOwnership(payload, response.client_id);
                        print.message = isVerified
                            ? `ton-ownership is verified for ${payload.address}`
                            : `ton-ownership is NOT verified`;
                        break;
                    case tonconnect_server_1.AuthRequestTypes.ADDRESS:
                        print.message = `ton-address ${payload.address}`;
                        break;
                }
            }
            res.send(print);
        }
        catch (error) {
            console.log(error);
            res.status(400).send({ error });
        }
    });
    app.get('/', (req, res) => {
        res.render('home', {
            layout: false,
            requestEndpoint: `${hostname}/authRequest`
        });
    });
    app.listen(port, host, () => {
        console.log(`Server running at http://${hostname}/`);
    });
}
init();
