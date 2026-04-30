// components/dashboard/image-upload.tsx
// Multi-image upload component with drag-to-reorder

"use client";

import React, { useState, DragEvent } from "react";
import Image from "next/image";
import { Upload, GripVertical, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  onRemove: (url: string) => void;
  maxImages?: number;
  folder?: string;
}

export function ImageUpload({
  value = [],
  onChange,
  onRemove,
  maxImages = 8,
  folder = "miduka/products",
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (value.length + files.length > maxImages) {
      toast.error(`You can only upload a maximum of ${maxImages} images.`);
      return;
    }

    setIsUploading(true);

    try {
      const newUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validate file type
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
          toast.error(`File ${file.name} is not a supported format (JPEG, PNG, WEBP only).`);
          continue;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`File ${file.name} exceeds the 5MB size limit.`);
          continue;
        }

        const base64 = await convertToBase64(file);

        const response = await fetch("/api/upload", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ base64, folder }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to upload image");
        }

        const data = await response.json();
        newUrls.push(data.url);
      }

      if (newUrls.length > 0) {
        onChange([...value, ...newUrls]);
        toast.success(`Successfully uploaded ${newUrls.length} image(s).`);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(`Upload error: ${error.message}`);
      } else {
        toast.error("An unknown error occurred during upload.");
      }
    } finally {
      setIsUploading(false);
      if (e.target) {
        e.target.value = "";
      }
    }
  };

  const handleDragStart = (e: DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    // Required for Firefox
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const newValues = [...value];
    const draggedItem = newValues[draggedIndex];
    newValues.splice(draggedIndex, 1);
    newValues.splice(dropIndex, 0, draggedItem);

    onChange(newValues);
    setDraggedIndex(null);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {value.map((url, index) => (
          <div
            key={url}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e)}
            onDrop={(e) => handleDrop(e, index)}
            className={cn(
              "relative aspect-square rounded-xl border bg-muted overflow-hidden group cursor-grab active:cursor-grabbing",
              draggedIndex === index && "opacity-50"
            )}
          >
            <div className="absolute top-2 right-2 z-10 flex gap-1">
              <button
                type="button"
                onClick={() => onRemove(url)}
                className="bg-destructive text-destructive-foreground p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-destructive/90"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="absolute top-2 left-2 z-10 flex gap-1">
              <div className="bg-background/80 text-foreground p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm backdrop-blur-sm">
                <GripVertical className="h-4 w-4" />
              </div>
            </div>
            {index === 0 && (
              <div className="absolute bottom-2 left-2 z-10">
                <span className="bg-primary text-primary-foreground text-xs px-2.5 py-1 rounded-full shadow-sm font-medium">
                  Cover
                </span>
              </div>
            )}
            <Image fill src={url} alt={`Upload ${index + 1}`} className="object-cover" sizes="(max-width: 768px) 50vw, 25vw" />
          </div>
        ))}
        {value.length < maxImages && (
          <label className="relative flex flex-col items-center justify-center aspect-square border-2 border-dashed rounded-xl border-muted-foreground/25 hover:bg-muted/50 hover:border-muted-foreground/50 transition-colors cursor-pointer overflow-hidden group">
            {isUploading && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/50 backdrop-blur-sm">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}
            <div className="flex flex-col items-center justify-center text-muted-foreground group-hover:text-foreground transition-colors p-4 text-center">
              <Upload className="h-6 w-6 mb-2" />
              <span className="text-sm font-medium">Upload Image</span>
              <span className="text-[10px] mt-1 opacity-70">Max 5MB</span>
            </div>
            <input
              type="file"
              multiple
              accept="image/jpeg, image/png, image/webp"
              className="hidden"
              onChange={handleUpload}
              disabled={isUploading}
            />
          </label>
        )}
      </div>
      {value.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Drag and drop to reorder images. The first image will be the primary cover image.
        </p>
      )}
    </div>
  );
}
