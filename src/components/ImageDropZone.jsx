import { useState, useRef } from 'react';
import { useTheme } from '../theme';
import { BODY } from '../utils';

function ImageDropZone({ images, onAddImages, onRemoveImage }) {
  const { t } = useTheme();
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleFiles = (files) => {
    const newImages = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, 5 - images.length)
      .map((f) => ({ file: f, preview: URL.createObjectURL(f), name: f.name }));
    onAddImages(newImages);
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
          onChange={(e) => handleFiles(e.target.files)} />
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
              <img src={img.preview} alt={img.name} style={{
                width: 64, height: 48, objectFit: "cover",
                borderRadius: 8, border: `1px solid ${t.border}`,
              }} />
              <button onClick={() => onRemoveImage(i)} style={{
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
    </div>
  );
}

export default ImageDropZone;
