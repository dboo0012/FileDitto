import { useMemo } from 'react';
import { FormatUtils, SupportedFormat } from '../types/supportedFormats';
import { FileItem } from '../components/FileListItem';

interface UseFormatRecommendationsReturn {
  recommendedFormats: SupportedFormat[];
  availableFormats: Record<string, SupportedFormat[]>;
  isFormatCompatible: (format: SupportedFormat) => boolean;
  getFormatDescription: (format: SupportedFormat) => string;
}

/**
 * Hook to provide format recommendations based on uploaded files
 */
export function useFormatRecommendations(files: FileItem[]): UseFormatRecommendationsReturn {
  // Get recommended formats based on uploaded files
  const recommendedFormats = useMemo(() => {
    if (files.length === 0) return [];
    
    const fileInfo = files.map(file => ({
      name: file.name,
      type: file.type
    }));
    
    return FormatUtils.getRecommendedFormats(fileInfo);
  }, [files]);

  // Get available formats grouped by media type
  const availableFormats = useMemo(() => {
    if (files.length === 0) {
      // Show all backend supported formats when no files are uploaded
      return FormatUtils.getFormatsGroupedByType();
    }

    // Only show formats compatible with uploaded file types
    const detectedTypes = new Set<string>();
    files.forEach(file => {
      const mediaType = FormatUtils.detectMediaType(file.name, file.type);
      if (mediaType) {
        detectedTypes.add(mediaType);
      }
    });

    const grouped: Record<string, SupportedFormat[]> = {};
    detectedTypes.forEach(type => {
      const typeKey = type.charAt(0).toUpperCase() + type.slice(1);
      grouped[typeKey] = FormatUtils.getBackendSupportedFormatsByType(type as any);
    });

    return grouped;
  }, [files]);

  // Check if a format is compatible with uploaded files
  const isFormatCompatible = useMemo(() => {
    return (format: SupportedFormat): boolean => {
      if (files.length === 0) return true;
      
      return files.some(file => {
        const extension = file.name.split('.').pop()?.toLowerCase();
        if (!extension) return false;
        
        return FormatUtils.isConversionSupported(extension, format);
      });
    };
  }, [files]);

  // Get format description with compatibility info
  const getFormatDescription = useMemo(() => {
    return (format: SupportedFormat): string => {
      const formatInfo = FormatUtils.getFormatInfo(format);
      if (!formatInfo) return format.toUpperCase();
      
      const isCompatible = isFormatCompatible(format);
      const compatibilityNote = files.length > 0 && !isCompatible ? ' (not compatible)' : '';
      
      return `${formatInfo.name} - ${formatInfo.description}${compatibilityNote}`;
    };
  }, [files, isFormatCompatible]);

  return {
    recommendedFormats,
    availableFormats,
    isFormatCompatible,
    getFormatDescription,
  };
}
