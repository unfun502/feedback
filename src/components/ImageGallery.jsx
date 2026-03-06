import { useState } from 'react';
import { useTheme } from '../theme';
import { NUM } from '../utils';

function ImageGallery({ images, compact = false }) {
  const { t } = useTheme();
  const [lightboxIdx, setLightboxIdx] = useState(null);

  if (!images || images.length === 0) return null;

  if (compact) {
    return (
      <div style={{ display: "flex", gap: 6, marginTop: 10, overflow: "hidden" }}>
        {images.slice(0, 3).map((img, i) => (
          <div key={i} style={{
            width: 48, height: 36, borderRadius: 6, overflow: "hidden",
            border: `1px solid ${t.border}`, flexShrink: 0,
          }}>
            <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        ))}
        {images.length > 3 && (
          <div style={{
            width: 48, height: 36, borderRadius: 6,
            background: t.imgOverlayBg, border: `1px solid ${t.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: NUM, fontSize: 11, color: t.textMuted,
          }}>+{images.length - 3}</div>
        )}
      </div>
    );
  }

  return (
    <>
      <div style={{
        display: "grid",
        gridTemplateColumns: images.length === 1 ? "1fr" : "repeat(auto-fill, minmax(180px, 1fr))",
        gap: 10, marginBottom: 20,
      }}>
        {images.map((img, i) => (
          <div key={i} onClick={(e) => { e.stopPropagation(); setLightboxIdx(i); }}
            style={{
              borderRadius: 12, overflow: "hidden",
              border: `1px solid ${t.border}`, cursor: "pointer",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              aspectRatio: images.length === 1 ? "16/9" : "4/3",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.style.boxShadow = t.shadowMd; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "none"; }}
          >
            <img src={img} alt={`Attachment ${i + 1}`} style={{
              width: "100%", height: "100%", objectFit: "cover", display: "block",
            }} />
          </div>
        ))}
      </div>

      {lightboxIdx !== null && (
        <div onClick={() => setLightboxIdx(null)} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 200, padding: 40, animation: "fadeIn 0.15s ease",
        }}>
          <img src={images[lightboxIdx]} alt="" onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "90%", maxHeight: "85vh", borderRadius: 12,
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
            }} />
          {images.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); setLightboxIdx((lightboxIdx - 1 + images.length) % images.length); }}
                style={{
                  position: "absolute", left: 20, top: "50%", transform: "translateY(-50%)",
                  background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%",
                  width: 44, height: 44, cursor: "pointer", display: "flex",
                  alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 20,
                }}>{"\u2039"}</button>
              <button onClick={(e) => { e.stopPropagation(); setLightboxIdx((lightboxIdx + 1) % images.length); }}
                style={{
                  position: "absolute", right: 20, top: "50%", transform: "translateY(-50%)",
                  background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%",
                  width: 44, height: 44, cursor: "pointer", display: "flex",
                  alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 20,
                }}>{"\u203A"}</button>
            </>
          )}
          <div style={{
            position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)",
            fontFamily: NUM, fontSize: 13, color: "rgba(255,255,255,0.6)",
          }}>{lightboxIdx + 1} / {images.length}</div>
        </div>
      )}
    </>
  );
}

export default ImageGallery;
