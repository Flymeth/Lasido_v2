import fs from "node:fs";
import path from "node:path";

const owners= fs.readFileSync(path.join(__dirname, "../../owners"), {encoding: "utf-8"}).split(/\D+/).filter(Boolean)
export default owners;