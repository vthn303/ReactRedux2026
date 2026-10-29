import { useState } from "react";
import { Card, CardContent, Typography } from "@mui/material";

const IMAGE_SLOTS = 4;

function ImageTile({ src, alt }) {
  const [failed, setFailed] = useState(false);

  // Thiếu ảnh hoặc ảnh lỗi (vd: đang offline) => ô xám
  if (!src || failed) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center bg-[#d9d9d9] text-sm text-white">
        No image
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className="aspect-[4/3] h-full w-full object-cover"
    />
  );
}

export default function BreedCard({ breed }) {
  const { name, description, images = [] } = breed.attributes;

  // Luôn đủ 4 ô, thiếu ảnh thì undefined
  const tiles = Array.from({ length: IMAGE_SLOTS }, (_, i) => images[i]?.medium);

  return (
    <Card elevation={0} className="overflow-hidden rounded-none bg-[#bc9c98]! text-white">
      {/* Lưới 2x2, nền trắng + gap tạo đường kẻ giữa các ảnh */}
      <div className="grid grid-cols-2 gap-0.5 bg-white">
        {tiles.map((src, i) => (
          <ImageTile key={i} src={src} alt={`${name} ${i + 1}`} />
        ))}
      </div>

      <CardContent className="px-5 py-4">
        <Typography variant="h6" component="h3" className="font-normal! text-white!">
          {name}
        </Typography>
        <Typography variant="body2" className="mt-1 line-clamp-3 text-white!">
          {description}
        </Typography>
      </CardContent>
    </Card>
  );
}

