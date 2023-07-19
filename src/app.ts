#!/usr/bin/env node

import express from 'express';
const cors = require('cors');
const compression = require('compression')
const axios = require('axios')

import {YoutubeDl} from "./YoutubeDl";

const app = express();
const port = process.env.PORT || 8080;

var fs = require('fs');
var http = require('http');
var https = require('https');
var key  = fs.readFileSync('/etc/letsencrypt/live/justtype.ru/privkey.pem', 'utf8');
var cert = fs.readFileSync('/etc/letsencrypt/live/justtype.ru/cert.pem', 'utf8');
var ca = fs.readFileSync('/etc/letsencrypt/live/justtype.ru/chain.pem', 'utf8');
var credentials = {key: key, cert: cert, ca:ca};

app.use(compression())
app.use(cors())

app.get('/v1/video', async (req, res) => {
    try {
        const url = req.query.url as string;
        const cliOptions = req.query.options as string;
        const cli = req.query.cli as "youtube-dl" | "yt-dlp";
        res.header("Content-Security-Policy", "default-src *; img-src *; media-src *");
        if(!url){
            res.status(400);
            res.send('Missing url');
            return;
        }
        if (cli && cli !== "youtube-dl" && cli !== "yt-dlp"){
            res.status(400);
            res.send('Unsupported cli. valid options: youtube-dl | yt-dlp');
            return;
        }
        let schema = req.query.schema as string[];
        let metadata = await YoutubeDl.getVideoMetadata(url, {cli, cliOptions}, schema);
        res.json(metadata);
    } catch (e) {
        console.error(e)
        res.status(500);
        res.send(e);
    }
});

app.get('/watch', async (req, res) => {
    try {
        const v = req.query.v as string;
        const cliOptions = req.query.options as string;
        const cli = req.query.cli as "youtube-dl" | "yt-dlp";
        res.header("Content-Security-Policy", "default-src *; img-src *; media-src *");
        if(!v){
            res.status(400);
            res.send('Missing video id!');
            return;
        }
        if (cli && cli !== "youtube-dl" && cli !== "yt-dlp"){
            res.status(400);
            res.send('Unsupported cli. valid options: youtube-dl | yt-dlp');
            return;
        }
        let metadata = await YoutubeDl.getVideoMetadata(v, {cli, cliOptions}, ['url']);
        res.redirect(metadata.url);
    } catch (e) {
        console.error(e)
        res.status(500);
        res.send(e);
    }
});

app.get('/proxy', async (req, res) => {
    try {
        const v = req.query.v as string;
        const cliOptions = req.query.options as string;
        const cli = req.query.cli as "youtube-dl" | "yt-dlp";
        res.header("Content-Security-Policy", "default-src *; img-src *; media-src *");
        if(!v){
            res.status(400);
            res.send('Missing video id!');
            return;
        }
        if (cli && cli !== "youtube-dl" && cli !== "yt-dlp"){
            res.status(400);
            res.send('Unsupported cli. valid options: youtube-dl | yt-dlp');
            return;
        }
        let metadata = await YoutubeDl.getVideoMetadata(v, {cli, cliOptions}, ['url']);
        // res.rewrite(new URL("/proxy", metadata.url));
        const video = await axios.get(metadata.url, { responseType: 'stream'})
        video.data.pipe(res);
    } catch (e) {
        console.error(e)
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
