import {
    quicktype,
    InputData,
    jsonInputForTargetLanguage,
} from "quicktype-core";

export async function generateTypesFromJson(
    json: unknown,
    rootTypeName = "Root"
) {
    const jsonInput = jsonInputForTargetLanguage("typescript");

    // Convert object to JSON string
    await jsonInput.addSource({
        name: rootTypeName,
        samples: [JSON.stringify(json)],
    });

    const inputData = new InputData();
    inputData.addInput(jsonInput);

    const result = await quicktype({
        inputData,
        lang: "typescript",
        rendererOptions: {
            "just-types": "true",
        },
    });

    return result.lines.join("\n");
}
