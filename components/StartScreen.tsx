/**
 * Copyright 2024 jinhwa1111@gmail.com
*/

import React, { useRef, useState, useCallback } from 'react';
import { UploadIcon, MagicWandIcon } from './icons';

interface StartScreenProps {
  onFileSelect: (files: FileList | null) => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onFileSelect }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFileSelect(e.target.files);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files);
    }
  }, [onFileSelect]);

  return (
    <div 
      className={`text-center animate-fade-in max-w-2xl mx-auto flex flex-col items-center gap-6 p-4 transition-all duration-300 ${isDragging ? 'scale-105' : ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div 
        className={`w-full border-4 border-dashed rounded-xl p-8 md:p-12 transition-colors duration-300 ${isDragging ? 'border-[#351e66] bg-violet-50' : 'border-gray-300 bg-gray-50/50'}`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/png, image/jpeg, image/webp"
        />
        <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-gradient-to-br from-[#351e66] to-[#593aa1] rounded-full text-white shadow-lg">
                <MagicWandIcon className="w-10 h-10" />
            </div>
          <h2 className="text-3xl font-bold text-gray-800">AI 이미지 에디터</h2>
          <p className="text-md text-gray-500">
            편집할 이미지를 업로드하거나 여기에 끌어다 놓으세요.
            <br />
            클릭 한 번으로 마법 같은 편집을 경험해보세요.
          </p>
          <button
            onClick={handleClick}
            className="mt-4 flex items-center justify-center gap-2 bg-gradient-to-br from-[#351e66] to-[#482c84] text-white font-bold py-4 px-8 text-lg rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-[#351e66]/20 hover:shadow-xl hover:shadow-[#351e66]/40 hover:-translate-y-px active:scale-95 active:shadow-inner"
          >
            <UploadIcon className="w-6 h-6" />
            이미지 선택하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default StartScreen;
