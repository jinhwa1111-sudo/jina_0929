/**
 * Copyright 2024 jinhwa1111@gmail.com
*/

import React, { useState } from 'react';

interface FilterPanelProps {
  onApplyFilter: (prompt: string) => void;
  isLoading: boolean;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ onApplyFilter, isLoading }) => {
  const [selectedPresetPrompt, setSelectedPresetPrompt] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');

  const presets = [
    { name: '신스웨이브', prompt: '네온 마젠타와 청록색 빛, 미묘한 스캔 라인으로 활기찬 80년대 신스웨이브 미학을 적용합니다.' },
    { name: '애니메이션', prompt: '굵은 윤곽선, 셀 셰이딩, 채도 높은 색상으로 생동감 있는 일본 애니메이션 스타일을 부여합니다.' },
    { name: '로모', prompt: '고대비, 과포화된 색상, 어두운 비네팅 효과가 있는 로모그래피 스타일의 크로스 프로세싱 필름 효과를 적용합니다.' },
    { name: '글리치', prompt: '디지털 글리치 효과와 색수차를 이용해 이미지를 미래지향적인 홀로그램 프로젝션으로 변환합니다.' },
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
      onApplyFilter(activePrompt);
    }
  };

  return (
    <div className="w-full bg-gray-50/50 border border-gray-200 rounded-lg p-4 flex flex-col gap-4 animate-fade-in backdrop-blur-sm">
      <h3 className="text-lg font-semibold text-center text-gray-700">필터 적용하기</h3>
      
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
        placeholder="또는 직접 필터를 설명하세요 (예: '80년대 신스웨이브 느낌')"
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
            필터 적용하기
          </button>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;