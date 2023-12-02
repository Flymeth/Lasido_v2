export function hex_to_int(color: string) {
    return parseInt(color.replace("#", ""), 16)
}