export const verboseLog = (text: string) => {
    if (Deno.args.includes("--verbose")) {
        console.log(text);
    }
};
