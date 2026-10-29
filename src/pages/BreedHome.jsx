import { Typography } from "@mui/material";
import BreedList from "../components/BreedList";

export default function BreedHome() {
	return (
		<main className="mx-auto max-w-6xl p-6">
			<Typography
				variant="h4"
				component="h1"
				className="mb-6 font-semibold! text-white!"
			>
				Dog Breeds
			</Typography>

			<BreedList />
		</main>
	);
}
