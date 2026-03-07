import { useState, useRef } from 'react';
import { useTheme } from '../theme';
import { BODY } from '../utils';
import { compressImage } from '../imageUtils';
import api from '../api';

function ImageDropZone({ images, onImagesChange }) {
  const { t } = useTheme();
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleFiles = async (files) => {
    const validFiles = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, 5 - images.length);

    if (validFiles.length === 0) return;

    // Create placeholder entries with uploading state
    const newEntries = validFiles.map((f) => ({
      file: f,
      preview: URL.createObjectURL(f),
      name: f.name,
      url: null,
      uploading: true,
      error: null,
    }));

    const updated = [...images, ...newEntries];
    onImagesChange(updated);

    // Upload each file concurrently
    for (let i = 0; i < newEntries.length; i++) {
      const entry = newEntries[i];
      const idx = images.length + i;
      uploadFile(entry, idx, updated);
    }
  };

  const uploadFile = async (entry, idx, currentImages) => {
    try {
      const compressed = await compressImage(entry.file);
      const url = await api.uploadImage(compressed);
      onImagesChange((prev) =>
        prev.map((img, i) => i === idx ? { ...img, url, uploading: false, error: null } : img)
      );
    } catch (err) {
      onImagesChange((prev) =>
        prev.map((img, i) => i === idx ? { ...img, uploading: false, error: err.message || 'Upload failed' } : img)
      );
    }
  };

  const handleRetry = (idx) => {
    const entry = images[idx];
    if (!entry || !entry.file) return;
    onImagesChange((prev) =>
      prev.map((img, i) => i === idx ? { ...img, uploading: true, error: null } : img)
    );
    uploadFile(entry, idx, images);
  };

  const handleRemove = (idx) => {
    const img = images[idx];
    if (img.preview) URL.revokeObjectURL(img.preview);
    onImagesChange((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? t.dropzoneActiveBorder : t.dropzoneBorder}`,
          borderRadius: 12, padding: "20px 16px", textAlign: "center",
          cursor: "pointer",
          background: dragging ? t.dropzoneActiveBg : t.dropzoneBg,
          transition: "all 0.2s ease",
        }}
      >
        <input ref={fileInputRef} type="file" accept="image/*" multiple
          style={{ display: "none" }}
          onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }} />
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
          stroke={dragging ? t.dropzoneActiveBorder : t.textFaint}
          strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ marginBottom: 6 }}>
          <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
        </svg>
        <div style={{ fontFamily: BODY, fontSize: 13, color: dragging ? t.dropzoneActiveBorder : t.textMuted }}>
          {dragging ? "Drop images here" : "Click or drag images"}
        </div>
        <div style={{ fontFamily: BODY, fontSize: 11, color: t.textFaint, marginTop: 2 }}>
          Up to 5 images, max 5MB each
        </div>
      </div>

      {images.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          {images.map((img, i) => (
            <div key={i} style={{ position: "relative" }}>
              <img src={img.preview || img.url} alt={img.name} style={{
                width: 64, height: 48, objectFit: "cover",
                borderRadius: 8,
                border: `1px solid ${img.error ? '#ef4444' : t.border}`,
                opacity: img.uploading ? 0.5 : 1,
                transition: "opacity 0.2s ease",
              }} />

              {/* Uploading spinner overlay */}
              {img.uploading && (
                <div style={{
                  position: "absolute", inset: 0, display: "flex",
                  alignItems: "center", justifyContent: "center",
                  borderRadius: 8,
                }}>
                  <div style={{
                    width: 16, height: 16, border: "2px solid #78716c",
                    borderTopColor: "#fafaf9", borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }} />
                </div>
              )}

              {/* Error retry button */}
              {img.error && !img.uploading && (
                <div
                  onClick={(e) => { e.stopPropagation(); handleRetry(i); }}
                  title={img.error}
                  style={{
                    position: "absolute", inset: 0, display: "flex",
                    alignItems: "center", justifyContent: "center",
                    background: "rgba(239,68,68,0.15)", borderRadius: 8,
                    cursor: "pointer",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round">
                    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                  </svg>
                </div>
              )}

              {/* Remove button */}
              <button onClick={(e) => { e.stopPropagation(); handleRemove(i); }} style={{
                position: "absolute", top: -6, right: -6,
                width: 18, height: 18, borderRadius: "50%",
                background: "#ef4444", border: "none", color: "#fff",
                fontSize: 11, cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "center", lineHeight: 1,
              }}>{"\u00D7"}</button>
            </div>
          ))}
        </div>
      )}

      {/* Spinner animation */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default ImageDropZone;
