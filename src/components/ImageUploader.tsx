import { useState, useRef, type ChangeEvent, type DragEvent, type FormEvent } from 'react';
import { Upload, Image as ImageIcon, X, Check, Link, Sparkles } from 'lucide-react';

interface ImageUploaderProps {
  currentImageUrl: string;
  onImageSelected: (imageDataUrl: string) => void;
  onRemoveImage?: () => void;
  label?: string;
  className?: string;
}

const PRESET_ARTWORKS = [
  {
    name: 'SMB Blueprint',
    url: '/src/assets/images/smb_automation_blueprint_1792526861207.jpg'
  },
  {
    name: 'Operational AI',
    url: '/src/assets/images/enterprise_ai_playbook_1792526861798.jpg'
  },
  {
    name: 'Cloud Infrastructure',
    url: '/src/assets/images/cloud_infrastructure_guide_1792526862062.jpg'
  },
  {
    name: 'Cybersecurity Handbook',
    url: '/src/assets/images/cybersecurity_compliance_handbook_1792526862382.jpg'
  }
];

/**
 * Compresses an image file on client-side using HTML5 Canvas
 * to prevent localStorage QuotaExceeded errors while maintaining high visual clarity.
 */
function compressAndResizeImage(file: File, maxWidth = 900, maxHeight = 1200): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Convert to high-quality JPEG
        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        resolve(dataUrl);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function ImageUploader({
  currentImageUrl,
  onImageSelected,
  onRemoveImage,
  label = 'Cover Image Upload',
  className = ''
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [manualUrl, setManualUrl] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }
    setUploadError(null);
    setIsProcessing(true);
    try {
      const optimizedDataUrl = await compressAndResizeImage(file);
      onImageSelected(optimizedDataUrl);
      setIsProcessing(false);
    } catch (err) {
      console.error('Image processing failed:', err);
      setUploadError('Failed to read and process image file.');
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleApplyUrl = (e: FormEvent) => {
    e.preventDefault();
    if (manualUrl.trim()) {
      onImageSelected(manualUrl.trim());
      setManualUrl('');
      setShowUrlInput(false);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-700">{label}</label>
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-[11px] text-slate-500 hover:text-[#0A1628] flex items-center gap-1 cursor-pointer"
        >
          <Link className="w-3 h-3" />
          {showUrlInput ? 'Hide URL input' : 'Enter image URL'}
        </button>
      </div>

      {/* Manual URL input drawer */}
      {showUrlInput && (
        <form onSubmit={handleApplyUrl} className="flex gap-2">
          <input
            type="text"
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            placeholder="https://example.com/cover.jpg"
            className="flex-1 text-xs px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0A1628]"
          />
          <button
            type="submit"
            className="bg-[#0A1628] hover:bg-black text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            Apply
          </button>
        </form>
      )}

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-sky-500 bg-sky-50/60 ring-2 ring-sky-200'
            : currentImageUrl
            ? 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
            : 'border-slate-300 hover:border-[#0A1628] hover:bg-slate-50 bg-white'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/jpg"
          onChange={handleFileChange}
          className="hidden"
        />

        {isProcessing ? (
          <div className="py-4 space-y-2">
            <div className="w-7 h-7 border-2 border-[#0A1628] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-medium text-slate-700">Optimizing and encoding cover image...</p>
          </div>
        ) : currentImageUrl ? (
          <div className="flex items-center gap-4 text-left">
            {/* Thumbnail */}
            <div className="w-14 h-18 rounded bg-slate-900 overflow-hidden shadow-xs shrink-0 border border-slate-200 relative">
              <img
                src={currentImageUrl}
                alt="Uploaded book cover preview"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Info and Actions */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                <Check className="w-4 h-4" />
                Cover Image Loaded
              </div>
              <p className="text-[11px] text-slate-500 truncate mt-0.5 max-w-xs">
                {currentImageUrl.startsWith('data:') ? 'Custom uploaded image (optimized)' : currentImageUrl}
              </p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-[11px] text-sky-700 font-semibold hover:underline cursor-pointer">
                  Click or drag to replace
                </span>
                {onRemoveImage && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveImage();
                    }}
                    className="text-[11px] text-red-600 font-semibold hover:underline cursor-pointer"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2 py-2">
            <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center mx-auto">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800">
                Click to upload cover image, or drag and drop
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                PNG, JPG, or WebP (auto-optimized to 3:4 book ratio)
              </p>
            </div>
          </div>
        )}
      </div>

      {uploadError && (
        <p className="text-xs text-red-600 font-medium">{uploadError}</p>
      )}

      {/* Preset Artwork Quick Selector */}
      <div className="pt-1">
        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-2">
          Or select from pre-generated high-fidelity artworks:
        </span>
        <div className="grid grid-cols-4 gap-2">
          {PRESET_ARTWORKS.map((preset) => {
            const isSelected = currentImageUrl === preset.url;
            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => onImageSelected(preset.url)}
                className={`relative rounded-lg overflow-hidden border p-1 text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#0A1628] ring-2 ring-[#0A1628]/20 bg-slate-100'
                    : 'border-slate-200 hover:border-slate-400 bg-white'
                }`}
              >
                <div className="w-full aspect-[3/4] rounded overflow-hidden bg-slate-100">
                  <img
                    src={preset.url}
                    alt={preset.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="block text-[10px] font-medium text-slate-700 truncate mt-1">
                  {preset.name}
                </span>
                {isSelected && (
                  <div className="absolute top-1.5 right-1.5 bg-[#0A1628] text-white rounded-full p-0.5">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
