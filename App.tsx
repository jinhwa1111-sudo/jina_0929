/**
 * Copyright 2024 jinhwa1111@gmail.com
*/


import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import { generateEditedImage, generateFilteredImage, generateAdjustedImage, generatePortraitEnhancement } from './services/geminiService';
import Header from './components/Header';
import Spinner from './components/Spinner';
import FilterPanel from './components/FilterPanel';
import AdjustmentPanel from './components/AdjustmentPanel';
import CropPanel from './components/CropPanel';
import { UndoIcon, RedoIcon, EyeIcon, CoffeeIcon } from './components/icons';
import StartScreen from './components/StartScreen';

// Helper to convert a data URL string to a File object
const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    if (arr.length < 2) throw new Error("Invalid data URL");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");

    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
}

type Tab = '리터치' | '조정' | '필터' | '자르기';

const App: React.FC = () => {
  const [history, setHistory] = useState<File[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [editHotspot, setEditHotspot] = useState<{ x: number, y: number } | null>(null);
  const [displayHotspot, setDisplayHotspot] = useState<{ x: number, y: number } | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('리터치');
  
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspect, setAspect] = useState<number | undefined>();
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const currentImage = history[historyIndex] ?? null;
  const originalImage = history[0] ?? null;

  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);

  // Effect to create and revoke object URLs safely for the current image
  useEffect(() => {
    if (currentImage) {
      const url = URL.createObjectURL(currentImage);
      setCurrentImageUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setCurrentImageUrl(null);
    }
  }, [currentImage]);
  
  // Effect to create and revoke object URLs safely for the original image
  useEffect(() => {
    if (originalImage) {
      const url = URL.createObjectURL(originalImage);
      setOriginalImageUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setOriginalImageUrl(null);
    }
  }, [originalImage]);


  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const addImageToHistory = useCallback((newImageFile: File) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newImageFile);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    // Reset transient states after an action
    setCrop(undefined);
    setCompletedCrop(undefined);
  }, [history, historyIndex]);

  const handleImageUpload = useCallback((file: File) => {
    setError(null);
    setHistory([file]);
    setHistoryIndex(0);
    setEditHotspot(null);
    setDisplayHotspot(null);
    setActiveTab('리터치');
    setCrop(undefined);
    setCompletedCrop(undefined);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!currentImage) {
      setError('편집할 이미지가 없습니다.');
      return;
    }
    
    if (!prompt.trim()) {
        setError('편집 내용을 입력해주세요.');
        return;
    }

    if (!editHotspot) {
        setError('편집할 영역을 이미지 위에서 클릭해주세요.');
        return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
        const editedImageUrl = await generateEditedImage(currentImage, prompt, editHotspot);
        const newImageFile = dataURLtoFile(editedImageUrl, `edited-${Date.now()}.png`);
        addImageToHistory(newImageFile);
        setEditHotspot(null);
        setDisplayHotspot(null);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
        setError(`이미지 생성에 실패했습니다. ${errorMessage}`);
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  }, [currentImage, prompt, editHotspot, addImageToHistory]);
  
  const handleApplyFilter = useCallback(async (filterPrompt: string) => {
    if (!currentImage) {
      setError('필터를 적용할 이미지가 없습니다.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
        const filteredImageUrl = await generateFilteredImage(currentImage, filterPrompt);
        const newImageFile = dataURLtoFile(filteredImageUrl, `filtered-${Date.now()}.png`);
        addImageToHistory(newImageFile);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
        setError(`필터 적용에 실패했습니다. ${errorMessage}`);
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  }, [currentImage, addImageToHistory]);
  
  const handleApplyAdjustment = useCallback(async (adjustmentPrompt: string) => {
    if (!currentImage) {
      setError('조정을 적용할 이미지가 없습니다.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
        const adjustedImageUrl = await generateAdjustedImage(currentImage, adjustmentPrompt);
        const newImageFile = dataURLtoFile(adjustedImageUrl, `adjusted-${Date.now()}.png`);
        addImageToHistory(newImageFile);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
        setError(`조정 적용에 실패했습니다. ${errorMessage}`);
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  }, [currentImage, addImageToHistory]);

  const handleApplyPortraitEnhancement = useCallback(async () => {
    if (!currentImage) {
      setError('보정할 인물 사진이 없습니다.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
        const enhancedImageUrl = await generatePortraitEnhancement(currentImage);
        const newImageFile = dataURLtoFile(enhancedImageUrl, `enhanced-${Date.now()}.png`);
        addImageToHistory(newImageFile);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
        setError(`인물 사진 보정에 실패했습니다. ${errorMessage}`);
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  }, [currentImage, addImageToHistory]);

  const handleApplyCrop = useCallback(() => {
    if (!completedCrop || !imgRef.current) {
        setError('자르기할 영역을 선택해주세요.');
        return;
    }

    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        setError('자르기를 처리할 수 없습니다.');
        return;
    }

    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = completedCrop.width * pixelRatio;
    canvas.height = completedCrop.height * pixelRatio;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height,
    );
    
    const croppedImageUrl = canvas.toDataURL('image/png');
    const newImageFile = dataURLtoFile(croppedImageUrl, `cropped-${Date.now()}.png`);
    addImageToHistory(newImageFile);

  }, [completedCrop, addImageToHistory]);

  const handleUndo = useCallback(() => {
    if (canUndo) {
      setHistoryIndex(historyIndex - 1);
      setEditHotspot(null);
      setDisplayHotspot(null);
    }
  }, [canUndo, historyIndex]);
  
  const handleRedo = useCallback(() => {
    if (canRedo) {
      setHistoryIndex(historyIndex + 1);
      setEditHotspot(null);
      setDisplayHotspot(null);
    }
  }, [canRedo, historyIndex]);

  const handleReset = useCallback(() => {
    if (history.length > 0) {
      setHistoryIndex(0);
      setError(null);
      setEditHotspot(null);
      setDisplayHotspot(null);
    }
  }, [history]);

  const handleUploadNew = useCallback(() => {
      setHistory([]);
      setHistoryIndex(-1);
      setError(null);
      setPrompt('');
      setEditHotspot(null);
      setDisplayHotspot(null);
  }, []);

  const handleDownload = useCallback(() => {
      if (currentImage) {
          const link = document.createElement('a');
          link.href = URL.createObjectURL(currentImage);
          link.download = `edited-${currentImage.name}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(link.href);
      }
  }, [currentImage]);
  
  const handleFileSelect = (files: FileList | null) => {
    if (files && files[0]) {
      handleImageUpload(files[0]);
    }
  };

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (activeTab !== '리터치') return;
    
    const img = e.currentTarget;
    const rect = img.getBoundingClientRect();

    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    
    setDisplayHotspot({ x: offsetX, y: offsetY });

    const { naturalWidth, naturalHeight, clientWidth, clientHeight } = img;
    const scaleX = naturalWidth / clientWidth;
    const scaleY = naturalHeight / clientHeight;

    const originalX = Math.round(offsetX * scaleX);
    const originalY = Math.round(offsetY * scaleY);

    setEditHotspot({ x: originalX, y: originalY });
};

  const renderContent = () => {
    if (error) {
       return (
           <div className="text-center animate-fade-in bg-red-100/50 border border-red-300 p-8 rounded-lg max-w-2xl mx-auto flex flex-col items-center gap-4">
            <h2 className="text-2xl font-bold text-red-800">오류가 발생했습니다</h2>
            <p className="text-md text-red-600">{error}</p>
            <button
                onClick={() => setError(null)}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg text-md transition-colors"
              >
                다시 시도
            </button>
          </div>
        );
    }
    
    if (!currentImageUrl) {
      return <StartScreen onFileSelect={handleFileSelect} />;
    }

    const imageDisplay = (
      <div className="relative">
        {/* Base image is the original, always at the bottom */}
        {originalImageUrl && (
            <img
                key={originalImageUrl}
                src={originalImageUrl}
                alt="원본"
                className="w-full h-auto object-contain max-h-[60vh] rounded-xl pointer-events-none"
            />
        )}
        {/* The current image is an overlay that fades in/out for comparison */}
        <img
            ref={imgRef}
            key={currentImageUrl}
            src={currentImageUrl}
            alt="현재"
            onClick={handleImageClick}
            className={`absolute top-0 left-0 w-full h-auto object-contain max-h-[60vh] rounded-xl transition-opacity duration-200 ease-in-out ${isComparing ? 'opacity-0' : 'opacity-100'} ${activeTab === '리터치' ? 'cursor-crosshair' : ''}`}
        />
      </div>
    );
    
    // For ReactCrop, we need a single image element. We'll use the current one.
    const cropImageElement = (
      <img 
        ref={imgRef}
        key={`crop-${currentImageUrl}`}
        src={currentImageUrl} 
        alt="자를 이미지"
        className="w-full h-auto object-contain max-h-[60vh] rounded-xl"
      />
    );


    return (
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-6 animate-fade-in">
        <div className="relative w-full shadow-2xl rounded-xl overflow-hidden bg-gray-200">
            {isLoading && (
                <div className="absolute inset-0 bg-white/70 z-30 flex flex-col items-center justify-center gap-4 animate-fade-in backdrop-blur-sm">
                    <Spinner />
                    <p className="text-gray-700">AI가 마법을 부리는 중...</p>
                </div>
            )}
            
            {activeTab === '자르기' ? (
              <ReactCrop 
                crop={crop} 
                onChange={c => setCrop(c)} 
                onComplete={c => setCompletedCrop(c)}
                aspect={aspect}
                className="max-h-[60vh]"
              >
                {cropImageElement}
              </ReactCrop>
            ) : imageDisplay }

            {displayHotspot && !isLoading && activeTab === '리터치' && (
                <div 
                    className="absolute rounded-full w-6 h-6 bg-[#351e66]/50 border-2 border-white pointer-events-none -translate-x-1/2 -translate-y-1/2 z-10"
                    style={{ left: `${displayHotspot.x}px`, top: `${displayHotspot.y}px` }}
                >
                    <div className="absolute inset-0 rounded-full w-6 h-6 animate-ping bg-[#482c84]"></div>
                </div>
            )}
        </div>
        
        <div className="w-full bg-gray-100/80 border border-gray-200/80 rounded-lg p-2 flex items-center justify-center gap-2 backdrop-blur-sm">
            {(['리터치', '조정', '필터', '자르기'] as Tab[]).map(tab => (
                 <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`w-full capitalize font-semibold py-3 px-5 rounded-md transition-all duration-200 text-base ${
                        activeTab === tab 
                        ? 'bg-gradient-to-br from-[#351e66] to-[#593aa1] text-white shadow-lg shadow-[#593aa1]/40' 
                        : 'text-gray-600 hover:text-black hover:bg-black/5'
                    }`}
                >
                    {tab}
                </button>
            ))}
        </div>
        
        <div className="w-full">
            {activeTab === '리터치' && (
                <div className="flex flex-col items-center gap-4">
                    <p className="text-md text-gray-500">
                        {editHotspot ? '좋아요! 이제 아래에 편집 내용을 설명해주세요.' : '정밀한 편집을 위해 이미지의 특정 영역을 클릭하세요.'}
                    </p>
                    <form onSubmit={(e) => { e.preventDefault(); handleGenerate(); }} className="w-full flex items-center gap-2">
                        <input
                            type="text"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder={editHotspot ? "예: '셔츠 색을 파란색으로 바꿔줘'" : "먼저 이미지의 한 점을 클릭하세요"}
                            className="flex-grow bg-white border border-gray-300 text-gray-800 rounded-lg p-5 text-lg focus:ring-2 focus:ring-[#351e66] focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={isLoading || !editHotspot}
                        />
                        <button 
                            type="submit"
                            className="bg-gradient-to-br from-[#351e66] to-[#482c84] text-white font-bold py-5 px-8 text-lg rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-[#351e66]/20 hover:shadow-xl hover:shadow-[#351e66]/40 hover:-translate-y-px active:scale-95 active:shadow-inner disabled:from-[#221342] disabled:to-[#2a1850] disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
                            disabled={isLoading || !prompt.trim() || !editHotspot}
                        >
                            생성하기
                        </button>
                    </form>
                </div>
            )}
            {activeTab === '자르기' && <CropPanel onApplyCrop={handleApplyCrop} onSetAspect={setAspect} isLoading={isLoading} isCropping={!!completedCrop?.width && completedCrop.width > 0} />}
            {activeTab === '조정' && <AdjustmentPanel onApplyAdjustment={handleApplyAdjustment} onApplyPortraitEnhancement={handleApplyPortraitEnhancement} isLoading={isLoading} />}
            {activeTab === '필터' && <FilterPanel onApplyFilter={handleApplyFilter} isLoading={isLoading} />}
        </div>
        
        <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <button 
                onClick={handleUndo}
                disabled={!canUndo}
                className="flex items-center justify-center text-center bg-gray-100 border border-gray-300 text-gray-700 font-semibold py-3 px-5 rounded-md transition-all duration-200 ease-in-out hover:bg-gray-200 hover:border-gray-400 active:scale-95 text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100/50"
                aria-label="마지막 작업 취소"
            >
                <UndoIcon className="w-5 h-5 mr-2" />
                실행 취소
            </button>
            <button 
                onClick={handleRedo}
                disabled={!canRedo}
                className="flex items-center justify-center text-center bg-gray-100 border border-gray-300 text-gray-700 font-semibold py-3 px-5 rounded-md transition-all duration-200 ease-in-out hover:bg-gray-200 hover:border-gray-400 active:scale-95 text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100/50"
                aria-label="마지막 작업 다시 실행"
            >
                <RedoIcon className="w-5 h-5 mr-2" />
                다시 실행
            </button>
            
            <div className="h-6 w-px bg-gray-300 mx-1 hidden sm:block"></div>

            {canUndo && (
              <button 
                  onMouseDown={() => setIsComparing(true)}
                  onMouseUp={() => setIsComparing(false)}
                  onMouseLeave={() => setIsComparing(false)}
                  onTouchStart={() => setIsComparing(true)}
                  onTouchEnd={() => setIsComparing(false)}
                  className="flex items-center justify-center text-center bg-gray-100 border border-gray-300 text-gray-700 font-semibold py-3 px-5 rounded-md transition-all duration-200 ease-in-out hover:bg-gray-200 hover:border-gray-400 active:scale-95 text-base"
                  aria-label="원본 이미지를 보려면 누르고 있으세요"
              >
                  <EyeIcon className="w-5 h-5 mr-2" />
                  원본 비교
              </button>
            )}

            <button 
                onClick={handleReset}
                disabled={!canUndo}
                className="text-center bg-transparent border border-gray-300 text-gray-700 font-semibold py-3 px-5 rounded-md transition-all duration-200 ease-in-out hover:bg-gray-100 hover:border-gray-400 active:scale-95 text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                초기화
            </button>
            <button 
                onClick={handleUploadNew}
                className="text-center bg-gray-100 border border-gray-300 text-gray-700 font-semibold py-3 px-5 rounded-md transition-all duration-200 ease-in-out hover:bg-gray-200 hover:border-gray-400 active:scale-95 text-base"
            >
                새 이미지 업로드
            </button>

            <button 
                onClick={handleDownload}
                className="flex-grow sm:flex-grow-0 ml-auto bg-gradient-to-br from-green-600 to-green-500 text-white font-bold py-3 px-5 rounded-md transition-all duration-300 ease-in-out shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base"
            >
                이미지 다운로드
            </button>
        </div>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen text-gray-800 flex flex-col">
      <Header />
      <main className={`flex-grow w-full max-w-[1600px] mx-auto p-4 md:p-8 flex justify-center ${currentImage ? 'items-start' : 'items-center'}`}>
        {renderContent()}
      </main>
      <footer className="w-full py-6 px-4 md:px-8 text-center bg-gray-50 border-t border-gray-200 mt-auto">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="mailto:jinhwa1111@gmail.com"
              className="text-center bg-transparent border border-gray-300 text-gray-700 font-semibold py-3 px-5 rounded-md transition-all duration-200 ease-in-out hover:bg-gray-100 hover:border-gray-400 active:scale-95 text-base"
            >
              이메일 문의하기
            </a>
            <a
              href="https://buymeacoffee.com/wlab"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 text-base font-bold text-gray-800 bg-[#FFDD00] rounded-md shadow-md hover:bg-[#ffec4d] transition-transform duration-200 ease-in-out hover:-translate-y-0.5 active:scale-95"
            >
              <CoffeeIcon className="w-5 h-5" />
              Buy jina a coffee
            </a>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Copyright © {new Date().getFullYear()} jinhwa1111@gmail.com
          </p>
        </footer>
    </div>
  );
};

export default App;