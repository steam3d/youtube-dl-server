#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors = require('cors');
const compression = require('compression');
const YoutubeDl_1 = require("./YoutubeDl");
const app = (0, express_1.default)();
const port = process.env.PORT || 8080;

var fs = require('fs');
var http = require('http');
var https = require('https');
var key  = fs.readFileSync('/etc/letsencrypt/live/justtype.ru/privkey.pem', 'utf8');
var cert = fs.readFileSync('/etc/letsencrypt/live/justtype.ru/cert.pem', 'utf8');
var ca = fs.readFileSync('/etc/letsencrypt/live/justtype.ru/chain.pem', 'utf8');
var credentials = {key: key, cert: cert, ca:ca};

app.use(compression());
app.use(cors());
app.get('/v1/video', async (req, res) => {
    try {
        const url = req.query.url;
        const cliOptions = req.query.options;
        const cli = req.query.cli;
        res.setHeader("Content-Security-Policy", "default-src 'self' https://justtype.ru:8443/watch?v=A1Qb4zfurA8&cli=yt-dlp");
        if (!url) {
            res.status(400);
            res.send('Missing url');
            return;
        }
        if (cli && cli !== "youtube-dl" && cli !== "yt-dlp") {
            res.status(400);
            res.send('Unsupported cli. valid options: youtube-dl | yt-dlp');
            return;
        }
        let schema = req.query.schema;
        let metadata = await YoutubeDl_1.YoutubeDl.getVideoMetadata(url, { cli, cliOptions }, schema);
        res.json(metadata);
    }
    catch (e) {
        console.error(e);
        res.status(500);
        res.send(e);
    }
});
app.get('/watch', async (req, res) => {
    try {
        const v = req.query.v;
        const cliOptions = req.query.options;
        const cli = req.query.cli;
        res.setHeader("Content-Security-Policy", "default-src 'self' https://justtype.ru:8443/watch?v=A1Qb4zfurA8&cli=yt-dlp");
        if (!v) {
            res.status(400);
            res.send('Missing video id!');
            return;
        }
        if (cli && cli !== "youtube-dl" && cli !== "yt-dlp") {
            res.status(400);
            res.send('Unsupported cli. valid options: youtube-dl | yt-dlp');
            return;
        }
        let metadata = await YoutubeDl_1.YoutubeDl.getVideoMetadata(v, { cli, cliOptions }, ['url']);
        res.redirect(metadata.url);
    }
    catch (e) {
        console.error(e);
        res.status(500);
        res.send(e);
    }
});

var httpServer = http.createServer(app);
var httpsServer = https.createServer(credentials, app);

httpServer.listen(port, () => {
    console.log(`server is listening on http://localhost:${port}`);
    console.log(`Try this url in your browser: http://localhost:${port}/watch?v=dQw4w9WgXcQ&cli=yt-dlp`);
});

httpsServer.listen(8443, () => {
    console.log(`server is listening on https://localhost:8443`);
    console.log(`Try this url in your browser: https://localhost:8443/watch?v=dQw4w9WgXcQ&cli=yt-dlp`);
});
//# sourceMappingURL=app.js.map