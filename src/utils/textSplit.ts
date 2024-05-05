export function splitByLength(text: string, maximumLength: number, splitBy: string | RegExp = "") {
    const partitions: string[] = []
    const splittedText = text.split(splitBy);

    splittedText.forEach(line => {
        if(
            !partitions.length
            || (
                (partitions.at(-1)?.length || 0) + line.length
            ) > maximumLength
        ) partitions.push("");
        const lastPartitionIndex = partitions.length - 1

        partitions[lastPartitionIndex]+= (
            partitions[lastPartitionIndex] ? "\n" : ""
        ) + line;
    })

    return partitions
}