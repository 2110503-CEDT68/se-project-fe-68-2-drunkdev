import React from "react";

interface CampImageProps {
  imgSrc?: string;
  campName: string;
  region: string;
  rating: number;
  reviewCount: number;
}

const CampImage: React.FC<CampImageProps> = ({
  imgSrc,
  campName,
  region,
  rating,
  reviewCount,
}) => {
  console.log(imgSrc)
  return (
    <div className="camp-image-wrapper">
      <div className="camp-image-container">
        {imgSrc ? (
          <img src={imgSrc} alt={campName} className="camp-image" />
        ) : (
          <div>Image Not found</div>
        )}
        <div className="camp-image-overlay" />
        <div className="camp-image-badges">
          <span className="badge badge-region">{region}</span>
          <span className="badge badge-rating">
            <StarIcon />
            {rating.toFixed(1)} · {reviewCount} reviews
          </span>
        </div>
      </div>

      <style>{`
        .camp-image-wrapper {
          width: 100%;
          margin-bottom: 1.5rem;
        }
        .camp-image-container {
          position: relative;
          width: 100%;
          height: 360px;
          border-radius: 14px;
          overflow: hidden;
        }
        .camp-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .camp-image-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            transparent 55%,
            rgba(30, 38, 28, 0.35) 100%
          );
        }
        .camp-image-badges {
          position: absolute;
          top: 14px;
          left: 14px;
          right: 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 13px;
          border-radius: 99px;
          font-size: 12px;
          font-weight: 500;
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
        }
        .badge-region {
          background: rgba(255, 255, 255, 0.88);
          color: #444;
        }
        .badge-rating {
          background: rgba(255, 255, 255, 0.88);
          color: #3d3d3d;
        }
        .badge-rating svg {
          width: 13px;
          height: 13px;
          color: #c47f17;
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
};

const StarIcon = () => (
  <svg
    viewBox="0 0 16 16"
    fill="currentColor"
    style={{ color: "#c47f17" }}
  >
    <path d="M8 1l1.85 3.75L14 5.5l-3 2.92.71 4.12L8 10.5l-3.71 1.95.71-4.12L2 5.5l4.15-.75L8 1z" />
  </svg>
);

export default CampImage;
