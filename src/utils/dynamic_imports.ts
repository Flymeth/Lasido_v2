import path from "path";
import fs from "fs";

export async function dyn_import<RETURNS>(file_path: string | URL): Promise<RETURNS> {
    const module_path = path.join("file://", file_path.toString())
    const module = await import(module_path)
    return module.default as RETURNS
}

export async function rec_dyn_import<RETURNS>(folder_path: string | URL): Promise<RETURNS[]> {
    const files = fs.readdirSync(folder_path.toString()).filter(f => !f.startsWith("_") && f.endsWith(".js"))
    const modules: RETURNS[] = []
    for await(const file of files) {
        const file_path = path.join(folder_path.toString(), file)
        modules.push(await dyn_import(file_path))
    }
    return modules
}