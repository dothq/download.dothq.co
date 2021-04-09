import express from 'express';
import axios from 'axios';

const products = [
    {
        name: "dot",
        arch: ["x86"],
        os: [
            "windows",
            "linux",
            "macos"
        ],
        types: [
            "raw",
            "installer"
        ]
    }
]

const app = express();

app.get("/dot/releases/:os/:arch/:type", (req, res) => {
    const dot = products.find((p: any) => p.name == "dot");

    if(dot) {
        if(!dot.os.includes(req.params.os)) res.status(400).end(`Specified OS is invalid. Valid options: ${JSON.stringify(dot.os)}`)
        if(!dot.arch.includes(req.params.arch)) res.status(400).end(`Specified architecture is invalid. Valid options: ${JSON.stringify(dot.arch)}`)
        if(!dot.types.includes(req.params.type)) res.status(400).end(`Specified type is invalid. Valid options: ${JSON.stringify(dot.types)}`)
    
        axios.get("https://api.github.com/repos/dothq/browser-desktop/releases")
            .then(r => {
                r.data.forEach((release: any) => {
                    const found = release.assets.find((asset: any) => {
                        if(req.params.os == "windows" && asset.name.startsWith("Install") && asset.name.endsWith(".exe")) return asset
                        if(req.params.os == "macos" && asset.name.startsWith("Dot") && asset.name.endsWith(".dmg")) return asset
                        if(req.params.os == "linux" && asset.name.startsWith("dot-") && asset.name.endsWith(".tar.bz2") && req.params.type == "raw") return asset
                    });
    
                    if(found && found.browser_download_url) res.redirect(found.browser_download_url)
                    else res.status(404).end("No releases found.")
                })
            })
    } else {
        res.status(500);
    }
});

const port = process.env.PORT || 4000

app.listen(port, () => console.log(`Download server started at ${port}`))