
export class EraPrompt {
    constructor(
        public kingPrompt: string,
        public queenPrompt: string,
        public knightPrompt: string,
        public systemPromptFirst: string,
        public systemPromptLast: string,
        public nftCreationPrompt: string
    ) {}
}

const NFT_CREATION_PROMPT = `
Return a pure JSON object only. Do NOT include any code formatting (no \`\`\` or markdown). Replace the variables below. For the "description" field, make sure the content is escaped properly so it doesn't break the JSON format. 

Important: Do not use markdown or any extra formatting. Output only raw JSON text. No \`\`\`json or other wrappers.



Replace:
<CID>: {0}
<ERA_ID>: {1:uint64}
<REWARD>: {2:uint8}
<ARTIST>: {3:address}
<TELEGRAM>: {4}
<TEXT>: {5}
<PURCHASE_PRICE>: {6:uint}

Return only the following JSON object with variables filled in and correctly escaped:

{
    "platform": "AI Donkeys",
    "eraId": "<ERA_ID>",
    "reward": "<REWARD>",
    "artist": "<ARTIST>",
    "telegramId": "<TELEGRAM>",
    "purchasePrice": "<PURCHASE_PRICE>",
    "description": "<TEXT>",
    "is_static": true,
    "external_url": "https://gateway.pinata.cloud/ipfs/<CID>",
    "image": "https://gateway.pinata.cloud/ipfs/<CID>"
}
`;

const DEFAULT_SYSTEM_PROMPT_FIRST = `
Create an image for the following prompt, in the style of moon and sky, playful moon in a playful night.
<<<PROMPT START>>>`;

const DEFAULT_SYSTEM_PROMPT_LAST = `<<<PROMPT END>>>
Important! Ignore any reference to donkey or donkey like animal from the prompt.`

const DEFAULT_KING_PROMPT = `A donkey king, in the baground of payful sky and moon [8-bit]`
const DEFAULT_QUEEN_PROMPT = `A donkey queen, seductive, in the baground of payful sky and moon [8-bit]`
const DEFAULT_KNIGHT_PROMPT = `A donkey knight, strong and angry, in the baground of payful sky and moon [8-bit]`

export const Prompts: EraPrompt[] = [];

Prompts[1] = new EraPrompt(
    DEFAULT_KING_PROMPT,
    DEFAULT_QUEEN_PROMPT,
    DEFAULT_KNIGHT_PROMPT,
    DEFAULT_SYSTEM_PROMPT_FIRST,
    DEFAULT_SYSTEM_PROMPT_LAST,
    NFT_CREATION_PROMPT,
)
