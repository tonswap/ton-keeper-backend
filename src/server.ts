import { engine } from "express-handlebars";
import express from "express";
import path from "path";
import cors from "cors";
import { TonConnectServer, AuthRequestTypes } from "@tonapps/tonconnect-server";
import { getLocalIPAddress } from "./utils";

// use generateServerSecret();
const staticSecret = process.env.KEEPER_SECRET || "mO8G0c/9ZgfBx1EDMz4aMs4zmz1YsB1ENzK6d0H76QE=";
const port = process.env.PORT || 8080;
console.log(process.env);

function init() {
    const host = getLocalIPAddress();

    const hostname = `tonkeeper-connect-v1.herokuapp.com`;
    const app = express();

    app.use(cors());
    app.engine("handlebars", engine());
    app.set("view engine", "handlebars");
    app.set("views", path.resolve(__dirname, "./views"));

    const tonconnect = new TonConnectServer({ staticSecret });

    let memory = {};

    app.get("/authRequest/:id", (req, res) => {
        console.log("auth request !!!!");

        const userId = req.params.id;
        const request = tonconnect.createRequest(
            {
                image_url: "https://tonswap.org/favicon2.png",
                callback_url: `https://${hostname}/tonconnect/${userId}`,
                items: [
                    {
                        type: AuthRequestTypes.ADDRESS,
                        required: true,
                    },
                ],
            },
            {
                customField: "Wellcome to tonswap",
            }
        );
        res.send(request);
    });

    app.get("/tonconnect/:id", async (req, res) => {
        try {
            const encodedResponse = req.query.tonlogin as string;
            const response = tonconnect.decodeResponse(encodedResponse);
            console.log(response);
            const userId = req.params.id;

            const print: any = { response };

            for (let payload of response.payload) {
                switch (payload.type) {
                    case AuthRequestTypes.ADDRESS:
                        print.message = `{"address": "${payload.address}" }`;
                        break;
                }
            }
            memory[userId] = print;
            res.send(print);
        } catch (error) {
            console.log(error);
            res.status(400).send({ error });
        }
    });

    app.get("/get-session/:id", async (req, res) => {
        const userId = req.params.id;
        res.send(memory[userId] || {});
    });

    // app.get("/", (req, res) => {
    //     res.render("home", {
    //         layout: false,
    //         requestEndpoint: `${hostname}/authRequest`,
    //     });
    // });

    app.listen(port, () => {
        console.log(`Server running at http://${hostname}/`);
    });
}

init();
