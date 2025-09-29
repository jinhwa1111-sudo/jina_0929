/**
 * Copyright 2024 jinhwa1111@gmail.com
*/

import React, { useState } from 'react';
import { PersonSparklesIcon } from './icons';

interface AdjustmentPanelProps {
  onApplyAdjustment: (prompt: string) => void;
  onApplyPortraitEnhancement: () => void;
  isLoading: boolean;
}

const AdjustmentPanel: React.FC<AdjustmentPanelProps> = ({ onApplyAdjustment, onApplyPortraitEnhancement, isLoading }) => {
  const [selectedPresetPrompt, setSelectedPresetPrompt] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');

  const presets = [
    { name: '배경 흐리게', prompt: '피사계 심도 효과를 적용하여 주 피사체는 선명하게 유지하면서 배경을 흐리게 만듭니다.' },
    { name: '디테일 향상', prompt: '이미지가 부자연스러워 보이지 않도록 선명도와 디테일을 약간 향상시킵니다.' },
    { name: '따뜻한 조명', prompt: '이미지에 따뜻하고 황금 시간대 스타일의 조명을 제공하기 위해 색온도를 조정합니다.' },
    { name: '스튜디오 조명', prompt: '주 피사체에 극적이고 전문적인 스튜디오 조명을 추가합니다.' },
  ];

  const activePrompt = selectedPresetPrompt || customPrompt;

  const handlePresetClick = (prompt: string) => {
    setSelectedPresetPrompt(prompt);
    setCustomPrompt('');
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomPrompt(e.target.value);
    setSelectedPresetPrompt(null);
  };

  const handleApply = () => {
    if (activePrompt) {
      onApplyAdjustment(activePrompt);
    }
  };

  return (
    <div className="w-full bg-gray-50/50 border border-gray-200 rounded-lg p-4 flex flex-col gap-4 animate-fade-in backdrop-blur-sm">
      <h3 className="text-lg font-semibold text-center text-gray-700">전문적인 조정 적용하기</h3>
      
      <button
        onClick={onApplyPortraitEnhancement}
        disabled={isLoading}
        className="flex items-center justify-center gap-3 w-full bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-purple-800 disabled:to-pink-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
      >
        <PersonSparklesIcon className="w-6 h-6" />
        AI 인물 사진 보정
      </button>

      <div className="relative flex py-3 items-center">
        <div className="flex-grow border-t border-gray-300"></div>
        <span className="flex-shrink mx-4 text-gray-500 text-sm">또는 직접 조정</span>
        <div className="flex-grow border-t border-gray-300"></div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {presets.map(preset => (
          <button
            key={preset.name}
            onClick={() => handlePresetClick(preset.prompt)}
            disabled={isLoading}
            className={`w-full text-center bg-black/5 border border-transparent text-gray-700 font-semibold py-3 px-4 rounded-md transition-all duration-200 ease-in-out hover:bg-black/10 hover:border-gray-300 active:scale-95 text-base disabled:opacity-50 disabled:cursor-not-allowed ${selectedPresetPrompt === preset.prompt ? 'ring-2 ring-offset-2 ring-offset-gray-100 ring-[#351e66]' : ''}`}
          >
            {preset.name}
          </button>
        ))}
      </div>

      <input
        type="text"
        value={customPrompt}
        onChange={handleCustomChange}
        placeholder="또는 직접 조정을 설명하세요 (예: '배경을 숲으로 변경')"
        className="flex-grow bg-white border border-gray-300 text-gray-800 rounded-lg p-4 focus:ring-2 focus:ring-[#351e66] focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 text-base"
        disabled={isLoading}
      />

      {activePrompt && (
        <div className="animate-fade-in flex flex-col gap-4 pt-2">
            <button
                onClick={handleApply}
                className="w-full bg-gradient-to-br from-[#351e66] to-[#482c84] text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-[#351e66]/20 hover:shadow-xl hover:shadow-[#351e66]/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-[#221342] disabled:to-[#2a1850] disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
                disabled={isLoading || !activePrompt.trim()}
            >
                조정 적용하기
            </button>
        </div>
      )}
    </div>
  );
};

export default AdjustmentPanel;