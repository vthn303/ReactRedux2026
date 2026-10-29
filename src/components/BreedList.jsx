import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@mui/material";
import breedApi from "../api/breedApi";
import {
	fetchBreedsRequest,
	fetchBreedsSuccess,
	fetchBreedsFailure,
} from "../features/breeds/actions";
import BreedCard from "./BreedCard";
import BreedCardSkeleton from "./BreedCardSkeleton";
import ErrorMessage from "./ErrorMessage";

export default function BreedList() {
	const dispatch = useDispatch();
	const { items, loading, error } = useSelector((state) => state.breeds);

	const load = async () => {
		dispatch(fetchBreedsRequest()); // 1. Báo đang tải

		try {
			const res = await breedApi.getAll({
				"page[number]": 1,
				"page[size]": 12,
			});
			dispatch(fetchBreedsSuccess(res.data, res.meta)); // 2. Thành công
		} catch (err) {
			dispatch(fetchBreedsFailure(err)); // 3. Thất bại (kể cả OFFLINE)
		}
	};

	useEffect(() => {
		load();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const showSkeleton = loading && items.length === 0;

	return (
		<div className="space-y-6">
			<Button variant="contained" onClick={load} disabled={loading}>
				Gọi lại API get all breeds
			</Button>

			{error && <ErrorMessage error={error} onRetry={load} />}

			<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{showSkeleton
					? Array.from({ length: 6 }, (_, i) => (
							<BreedCardSkeleton key={i} />
						))
					: items.map((b) => <BreedCard key={b.id} breed={b} />)}
			</div>
		</div>
	);
}
