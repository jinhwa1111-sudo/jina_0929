/**
 * Copyright 2024 jinhwa1111@gmail.com
*/

import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// Helper function to convert a File object to a Gemini API Part
const fileToPart = async (file: File): Promise<{ inlineData: { mimeType: string; data: string; } }> => {
    const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
    
    const arr = dataUrl.split(',');
    if (arr.length < 2) throw new Error("Invalid data URL");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");
    
    const mimeType = mimeMatch[1];
    const data = arr[1];
    return { inlineData: { mimeType, data } };
};

const handleApiResponse = (
    response: GenerateContentResponse,
    context: string // e.g., "edit", "filter", "adjustment"
): string => {
    // 1. Check for prompt blocking first
    if (response.promptFeedback?.blockReason) {
        const { blockReason, blockReasonMessage } = response.promptFeedback;
        const errorMessage = `요청이 차단되었습니다. 이유: ${blockReason}. ${blockReasonMessage || ''}`;
        console.error(errorMessage, { response });
        throw new Error(errorMessage);
    }

    // 2. Try to find the image part
    const imagePartFromResponse = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

    if (imagePartFromResponse?.inlineData) {
        const { mimeType, data } = imagePartFromResponse.inlineData;
        console.log(`Received image data (${mimeType}) for ${context}`);
        return `data:${mimeType};base64,${data}`;
    }

    // 3. If no image, check for other reasons
    const finishReason = response.candidates?.[0]?.finishReason;
    if (finishReason && finishReason !== 'STOP') {
        const errorMessage = `${context}에 대한 이미지 생성이 예기치 않게 중단되었습니다. 이유: ${finishReason}. 이는 종종 안전 설정과 관련이 있습니다.`;
        console.error(errorMessage, { response });
        throw new Error(errorMessage);
    }
    
    const textFeedback = response.text?.trim();
    const errorMessage = `AI 모델이 ${context}에 대한 이미지를 반환하지 않았습니다. ` + 
        (textFeedback 
            ? `모델이 텍스트로 응답했습니다: "${textFeedback}"`
            : "이는 안전 필터 때문이거나 요청이 너무 복잡할 때 발생할 수 있습니다. 프롬프트를 더 직접적으로 수정하여 다시 시도해주세요.");

    console.error(`Model response did not contain an image part for ${context}.`, { response });
    throw new Error(errorMessage);
};

/**
 * Generates an edited image using generative AI based on a text prompt and a specific point.
 * @param originalImage The original image file.
 * @param userPrompt The text prompt describing the desired edit.
 * @param hotspot The {x, y} coordinates on the image to focus the edit.
 * @returns A promise that resolves to the data URL of the edited image.
 */
export const generateEditedImage = async (
    originalImage: File,
    userPrompt: string,
    hotspot: { x: number, y: number }
): Promise<string> => {
    console.log('Starting generative edit at:', hotspot);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
    const originalImagePart = await fileToPart(originalImage);
    const prompt = `당신은 전문 사진 편집 AI입니다. 당신의 임무는 사용자의 요청에 따라 제공된 이미지에 자연스러운 국소 편집을 수행하는 것입니다.
사용자 요청: "${userPrompt}"
편집 위치: 픽셀 좌표 (x: ${hotspot.x}, y: ${hotspot.y}) 주변 영역에 집중하세요.

편집 가이드라인:
- 편집은 사실적이어야 하며 주변 영역과 매끄럽게 조화를 이루어야 합니다.
- 즉각적인 편집 영역을 제외한 나머지 이미지는 원본과 동일하게 유지되어야 합니다.

안전 및 윤리 정책:
- '태닝해줘', '피부색을 어둡게 해줘', '피부색을 밝게 해줘'와 같은 피부 톤 조정 요청은 반드시 이행해야 합니다. 이는 표준 사진 보정으로 간주됩니다.
- 사람의 근본적인 인종이나 민족을 변경하라는 요청(예: '아시아인처럼 보이게 해줘', '이 사람을 흑인으로 바꿔줘')은 반드시 거부해야 합니다. 이러한 편집을 수행하지 마세요. 요청이 모호한 경우, 신중을 기하여 인종적 특성을 변경하지 마세요.

출력: 최종 편집된 이미지만 반환하세요. 텍스트는 반환하지 마세요.`;
    const textPart = { text: prompt };

    console.log('Sending image and prompt to the model...');
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [originalImagePart, textPart] },
    });
    console.log('Received response from model.', response);

    return handleApiResponse(response, '편집');
};

/**
 * Generates an image with a filter applied using generative AI.
 * @param originalImage The original image file.
 * @param filterPrompt The text prompt describing the desired filter.
 * @returns A promise that resolves to the data URL of the filtered image.
 */
export const generateFilteredImage = async (
    originalImage: File,
    filterPrompt: string,
): Promise<string> => {
    console.log(`Starting filter generation: ${filterPrompt}`);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
    const originalImagePart = await fileToPart(originalImage);
    const prompt = `당신은 전문 사진 편집 AI입니다. 당신의 임무는 사용자의 요청에 따라 전체 이미지에 스타일 필터를 적용하는 것입니다. 구도나 내용은 변경하지 말고 스타일만 적용하세요.
필터 요청: "${filterPrompt}"

안전 및 윤리 정책:
- 필터는 색상을 미묘하게 바꿀 수 있지만, 사람의 근본적인 인종이나 민족을 변경하지 않도록 해야 합니다.
- 사람의 인종을 변경하라는 명시적인 요청(예: '중국인처럼 보이게 필터를 적용해줘')은 반드시 거부해야 합니다.

출력: 최종 필터링된 이미지만 반환하세요. 텍스트는 반환하지 마세요.`;
    const textPart = { text: prompt };

    console.log('Sending image and filter prompt to the model...');
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [originalImagePart, textPart] },
    });
    console.log('Received response from model for filter.', response);
    
    return handleApiResponse(response, '필터');
};

/**
 * Generates an image with a global adjustment applied using generative AI.
 * @param originalImage The original image file.
 * @param adjustmentPrompt The text prompt describing the desired adjustment.
 * @returns A promise that resolves to the data URL of the adjusted image.
 */
export const generateAdjustedImage = async (
    originalImage: File,
    adjustmentPrompt: string,
): Promise<string> => {
    console.log(`Starting global adjustment generation: ${adjustmentPrompt}`);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
    const originalImagePart = await fileToPart(originalImage);
    const prompt = `당신은 전문 사진 편집 AI입니다. 당신의 임무는 사용자의 요청에 따라 전체 이미지에 자연스러운 전역 조정을 수행하는 것입니다.
사용자 요청: "${adjustmentPrompt}"

편집 가이드라인:
- 조정은 전체 이미지에 적용되어야 합니다.
- 결과는 사실적이어야 합니다.

안전 및 윤리 정책:
- '태닝해줘', '피부색을 어둡게 해줘', '피부색을 밝게 해줘'와 같은 피부 톤 조정 요청은 반드시 이행해야 합니다. 이는 표준 사진 보정으로 간주됩니다.
- 사람의 근본적인 인종이나 민족을 변경하라는 요청(예: '아시아인처럼 보이게 해줘', '이 사람을 흑인으로 바꿔줘')은 반드시 거부해야 합니다. 이러한 편집을 수행하지 마세요. 요청이 모호한 경우, 신중을 기하여 인종적 특성을 변경하지 마세요.

출력: 최종 조정된 이미지만 반환하세요. 텍스트는 반환하지 마세요.`;
    const textPart = { text: prompt };

    console.log('Sending image and adjustment prompt to the model...');
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [originalImagePart, textPart] },
    });
    console.log('Received response from model for adjustment.', response);
    
    return handleApiResponse(response, '조정');
};

/**
 * Automatically enhances a portrait photo using generative AI.
 * @param originalImage The original portrait image file.
 * @returns A promise that resolves to the data URL of the enhanced image.
 */
export const generatePortraitEnhancement = async (
    originalImage: File,
): Promise<string> => {
    console.log('Starting AI portrait enhancement.');
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

    const originalImagePart = await fileToPart(originalImage);
    const prompt = `당신은 전문 인물 사진 작가의 AI 어시스턴트입니다. 당신의 임무는 제공된 인물 사진을 미묘하고 전문적으로 향상시키는 것입니다. 과감한 변경은 하지 마세요. 피사체가 자연스럽게 가장 멋지게 보이도록 하는 데 집중하세요.

- **피부:** 피부 결을 부드럽게 다듬고, 피부 톤을 균일하게 만들며, 사소한 잡티를 줄이되 자연스러운 모습을 유지하세요. 주근깨나 모반은 여드름과 같이 일시적인 흠이 아닌 이상 변경하지 마세요. 인물의 피부색을 바꾸지 마세요.
- **조명:** 얼굴에 부드럽고 매력적인 조명을 추가하여 은은한 '광채'를 만들고 거친 그림자를 줄이세요. 눈을 약간 밝게 만드세요.
- **선명도:** 눈, 속눈썹, 머리카락의 선명도와 명료도를 미묘하게 높여 돋보이게 하세요.
- **전체:** 최종 결과물은 AI 생성 이미지가 아닌 전문적으로 보정된 사진처럼 보여야 합니다. 배경과 의상은 그대로 유지하세요.

**안전 및 윤리:** 표준 가이드라인이 적용됩니다. 근본적인 인종이나 민족을 변경하지 마세요. 사실감과 매력을 높이기 위한 피부 톤 조정은 허용됩니다.

**출력:** 최종 편집된 이미지만 반환하세요. 텍스트는 반환하지 마세요.`;
    const textPart = { text: prompt };
    
    console.log('Sending image for portrait enhancement...');
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [originalImagePart, textPart] },
    });
    console.log('Received response from model for portrait enhancement.', response);

    return handleApiResponse(response, '인물 사진 보정');
};