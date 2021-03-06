import express from "express";
import axios from "axios";

const products = [
    {
        name: "dot",
        arch: ["x86"],
        os: ["windows", "linux", "macos"],
        types: ["raw", "installer"]
    }
];

const app = express();

process.on("uncaughtException", (e) => {
    console.log(e.message, e.stack);
});

app.get("/dot/releases/:os/:arch/:type", async (req, res) => {
    const dot = products.find((p: any) => p.name == "dot");

    if (dot) {
        if (!dot.os.includes(req.params.os))
            return res
                .status(400)
                .send(
                    `Specified OS is invalid. Valid options: ${JSON.stringify(
                        dot.os
                    )}`
                );
        if (!dot.arch.includes(req.params.arch))
            return res
                .status(400)
                .send(
                    `Specified architecture is invalid. Valid options: ${JSON.stringify(
                        dot.arch
                    )}`
                );
        if (!dot.types.includes(req.params.type))
            return res
                .status(400)
                .send(
                    `Specified type is invalid. Valid options: ${JSON.stringify(
                        dot.types
                    )}`
                );

        let found: any;

        const r = await axios.get(
            "https://api.github.com/repos/dothq/browser-desktop/releases"
        );

        r.data
            .sort(
                (a: any, b: any) =>
                    new Date(
                        (b.created_at as any) - (new Date(a.created_at) as any)
                    )
            )
            .forEach((release: any) => {
                const f = release.assets.find((asset: any) => {
                    if (
                        req.params.os == "windows" &&
                        asset.name.startsWith("dot-") &&
                        asset.name.endsWith(".exe")
                    )
                        return asset;
                    if (
                        req.params.os == "macos" &&
                        asset.name.startsWith("dot-") &&
                        asset.name.endsWith(".dmg")
                    )
                        return asset;
                    if (
                        req.params.os == "linux" &&
                        asset.name.startsWith("dot-") &&
                        asset.name.endsWith(".tar.bz2")
                    )
                        return asset;
                });

                // If you don't check to see if it has been assigned, it will be reassigned
                // with every new file found. As they are sorted from newest to oldest,
                // the oldest asset is generally used
                if (f && !found) found = f;
            });

        console.log(found);

        if (found) res.redirect(found.browser_download_url);
        else {
            res.status(404).send("No releases found.");
            return;
        }
    } else {
        return res.status(500);
    }
});

const port = process.env.PORT || 4000;

app.listen(port, () => console.log(`Download server started at ${port}`));
