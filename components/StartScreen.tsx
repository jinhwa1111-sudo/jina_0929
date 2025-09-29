/**
 * Copyright 2024 jinhwa1111@gmail.com
*/

import React, { useState } from 'react';
import { UploadIcon, MagicWandIcon, PaletteIcon, SunIcon } from './icons';

interface StartScreenProps {
  onFileSelect: (files: FileList | null) => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onFileSelect }) => {
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFileSelect(e.target.files);
  };

  return (
    <div 
      className={`w-full max-w-5xl mx-auto text-center p-8 transition-all duration-300 rounded-2xl border-2 border-dashed ${isDraggingOver ? 'bg-[#e9e4f5] border-[#593aa1]' : 'bg-gray-50 border-gray-300'}`}
      onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
      onDragLeave={() => setIsDraggingOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDraggingOver(false);
        onFileSelect(e.dataTransfer.files);
      }}
    >
      <div className="flex flex-col items-center gap-6 animate-fade-in">
        <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl md:text-7xl">
          AI 사진 편집, <span className="text-[#351e66]">더 쉽게</span>.
        </h1>
        <p className="max-w-2xl text-lg text-gray-600 md:text-xl">
          간단한 텍스트 프롬프트로 사진을 보정하고, 창의적인 필터를 적용하고, 전문적인 조정을 해보세요. 복잡한 도구는 필요 없습니다.
        </p>

        <div className="mt-6 flex flex-col items-center gap-4">
            <label htmlFor="image-upload-start" className="relative inline-flex items-center justify-center px-10 py-5 text-xl font-bold text-white bg-[#351e66] rounded-full cursor-pointer group hover:bg-[#482c84] transition-colors">
                <UploadIcon className="w-6 h-6 mr-3 transition-transform duration-500 ease-in-out group-hover:rotate-[360deg] group-hover:scale-110" />
                이미지 업로드
            </label>
            <input id="image-upload-start" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
            <p className="text-sm text-gray-500">또는 파일을 드래그 앤 드롭하세요</p>
        </div>

        <div className="mt-16 w-full">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-6 rounded-lg border border-gray-200 flex flex-col items-center text-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-4">
                       <MagicWandIcon className="w-6 h-6 text-[#351e66]" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">정밀한 리터칭</h3>
                    <p className="mt-2 text-gray-600">이미지의 어느 지점이든 클릭하여 흠집을 제거하고, 색상을 변경하고, 정확하게 요소를 추가하세요.</p>
                </div>
                <div className="bg-white p-6 rounded-lg border border-gray-200 flex flex-col items-center text-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-4">
                       <PaletteIcon className="w-6 h-6 text-[#351e66]" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">창의적인 필터</h3>
                    <p className="mt-2 text-gray-600">예술적인 스타일로 사진을 변환하세요. 빈티지 룩부터 미래적인 빛까지 완벽한 필터를 찾거나 만들어보세요.</p>
                </div>
                <div className="bg-white p-6 rounded-lg border border-gray-200 flex flex-col items-center text-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-4">
                       <SunIcon className="w-6 h-6 text-[#351e66]" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">전문가급 조정</h3>
                    <p className="mt-2 text-gray-600">조명을 향상시키고, 배경을 흐리게 하거나, 분위기를 바꿔보세요. 복잡한 도구 없이 스튜디오 품질의 결과를 얻으세요.</p>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default StartScreen;