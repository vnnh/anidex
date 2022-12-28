import { motion } from "framer-motion";
import { useContext } from "preact/hooks";
import { useNavigate } from "react-router";
import { AnilistAnimeId } from "../api/anilist";
import { AppContext } from "../components/app";

export const ViewHistory = ({
	onClickOff,
	playbackProgress,
	planToWatch,
}: {
	onClickOff: () => void;
	playbackProgress: Array<[AnilistAnimeId, PlaybackProgress]>;
	planToWatch: Array<[AnilistAnimeId, PlanToWatch]>;
}) => {
	const navigate = useNavigate();
	const ctx = useContext(AppContext);

	return (
		<motion.div
			style={{
				zIndex: 3,
				position: "absolute",
				top: 0,
				left: 0,
				width: "100vw",
				height: "100vh",
				backgroundColor: "#1d1d1d",
			}}
			initial={{ opacity: 0 }}
			animate={{ opacity: 1, transition: { duration: 0.15 } }}
			exit={{ opacity: 0, transition: { duration: 0.15 } }}
			onClick={onClickOff}
		>
			<div style="position: absolute; display: flex; flex-direction: column; justify-content: center; align-items: center; left: 12.5%; top: 0; width: 75%;">
				<p class="title-text no-select" style="margin: 0; margin-top: 40px; margin-bottom: 5px">
					WATCH HISTORY
				</p>
				<div
					class="searchbar"
					style={`cursor: default; width: 30vmin; height: 8vmin; border-radius: 8px; margin-left: 0.5vmin; padding: 1vmin 1vmin 1vmin 1vmin; background-color: #2d2d2d; font-family: Lato; line-height: 2.6vmin`}
					onClick={(e) => {
						e.stopImmediatePropagation();
					}}
				>
					Started <b>{playbackProgress.length - 1}</b>
					<br />
					Completed{" "}
					<b>
						{
							playbackProgress.filter(
								([id, playbackProgress]) =>
									id !== "recent" && playbackProgress.meta.completed !== undefined,
							).length
						}
					</b>
					<br />
					Plan to Watch <b>{planToWatch.length}</b>
				</div>
			</div>

			<div style="position: absolute; display: flex; flex-direction: column; justify-content: start; align-items: center; gap: 1vmin; left: 12.5%; top: calc(35px + 23vmin); margin: 5px; width: 75%; height: calc(100% - 35px - 23vmin); overflow-x: hidden; overflow-y: auto">
				{playbackProgress
					.filter(([id]) => id !== "recent")
					.sort((a, b) => {
						return (
							new Date(b[1][b[1].meta.latest.id].date).valueOf() -
							new Date(a[1][a[1].meta.latest.id].date).valueOf()
						);
					})
					.map((v) => {
						const lastWatched = new Date(v[1][v[1].meta.latest.id].date);
						return (
							<div
								class="search-background-image"
								style={`position: relative; cursor: pointer; display: flex; align-items: center; border-radius: 8px; width: 100%; height: 14vmin; background-color: #333; border-radius: 8px`}
								onClick={(e) => {
									e.stopImmediatePropagation();
									ctx.setTransitionElement(e.currentTarget);
									ctx.setCurrentAnime({
										id: v[0],
										title: v[1].meta.title,
										cover: v[1].meta.cover,
									});
									navigate(`/${v[0]}`);
								}}
							>
								<img
									draggable={false}
									style="position: absolute; width: 100%; height: 100%; object-fit: cover; filter: brightness(0.35); border-radius: 8px"
									src={v[1].meta.cover}
								/>
								<div style="z-index:2; margin-left: 1vmin; display: flex; flex-direction: column; gap: 0.5vmin">
									<span style="margin: 0; font-family: Lato; font-size: 4vmin; line-height: 4vmin; font-weight: 600;">
										{v[1].meta.title.romaji}
									</span>
									<span style="margin: 0; color: #bbb; font-family: Lato; font-size: 2vmin; line-height: 2vmin; font-weight: 600; font-style: italic">
										{v[1].meta.title.english}
									</span>
								</div>
								<a style="position: absolute; z-index: 2; bottom: 0; right: 0; margin: 1vmin; font-family: Lato; font-size: 1.75vmin; line-height: 1.75vmin; font-weight: 500; color: #ccc">
									Last watched{" "}
									<span style="font-weight: 600">
										{`${lastWatched.toLocaleDateString()} ${lastWatched.toLocaleTimeString()}`}
									</span>
								</a>
							</div>
						);
					})}
			</div>
		</motion.div>
	);
};
