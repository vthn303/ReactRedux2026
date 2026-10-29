import { Skeleton } from "@mui/material";

export default function BreedCardSkeleton() {
  return (
    <div className="overflow-hidden bg-[#bc9c98]/40">
      <Skeleton variant="rectangular" className="aspect-[4/3] h-auto w-full" />
      <div className="p-4">
        <Skeleton width="60%" />
        <Skeleton />
        <Skeleton width="80%" />
      </div>
    </div>
  );
}

