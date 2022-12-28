import { AnimatePresence } from "framer-motion";
import { useContext, useEffect, useState } from "preact/hooks";
import { Outlet } from "react-router";
import { AnilistAnimeId, AnilistEpisodeId, AnimeCard, getRecentEpisodes, getTrending } from "../api/anilist";
import { AppContext } from "../components/app";
import { Carousel } from "../components/carousel";
import "../styles/search.css";
import { getPlaybackProgress, getRecentlyWatched } from "./episodes";
import { Search } from "./search";

export const Home = () => {
	const [recent, setRecent] = useState<Array<AnimeCard>>([]);
	const [trending, setTrending] = useState<Array<AnimeCard>>([]);
	const [store, setStore] = useState<{
		recentlyWatched: Array<RecentlyWatched>;
		playbackProgress: Map<AnilistAnimeId, PlaybackProgress>;
	}>({ recentlyWatched: [], playbackProgress: new Map() });
	const [isSearching, setIsSearching] = useState(false);
	const ctx = useContext(AppContext);

	useEffect(() => {
		getTrending()
			.then((value) => {
				setTrending(value.results ?? []);
			})
			.catch((e) => console.log(e));

		getRecentEpisodes()
			.then((value) => {
				setRecent(value.results ?? []);
			})
			.catch((e) => console.log(e));
	}, []);

	useEffect(() => {
		Promise.all([getRecentlyWatched(), getPlaybackProgress()])
			.then((v) => {
				const progressMap = new Map<AnilistAnimeId, PlaybackProgress>();
				for (const [id, progress] of v[1]) {
					progressMap.set(id, progress);
				}

				setStore({
					recentlyWatched: v[0],
					playbackProgress: progressMap,
				});
			})
			.catch((e) => console.log(e));
	}, [ctx.updateRecentlyWatchedCounter]);

	useEffect(() => {
		let exit: (e: KeyboardEvent) => void;
		if (isSearching) {
			exit = (e) => {
				if (e.key === "Escape") {
					setIsSearching(false);
				}
			};
		} else {
			exit = (e) => {
				if (e.key === "Enter") {
					setIsSearching(true);
				}
			};
		}

		window.addEventListener("keydown", exit);

		return () => {
			window.removeEventListener("keydown", exit);
		};
	}, [isSearching]);

	return (
		<>
			<div class="under-titlebar" style="padding: 20px; overflow: scroll;">
				<div style="display: flex; justify-content: center; align-items: center; width: 100%; height: 35px">
					<div
						class="searchbar"
						style="width: 50%; height: 35px; margin: 5px; display: flex; align-items: center; justify-content: start;"
						onClick={() => {
							setIsSearching(true);
						}}
					>
						<div class="material-icons search-icon" style="font-size: 20px; height: 20px; margin-left: 5px">
							search
						</div>
						<span style="font-family: Lato; margin-left: 5px; font-size: 16px; font-weight: 200; color: #aaa">
							Search anime...
						</span>
					</div>
				</div>

				<br />
				{store.recentlyWatched.length > 0 && (
					<div style="position: relative; width: 100vw; height: 30vmin;">
						<p
							class="title-text one-per-line no-select"
							style="position: absolute; top: 50%; transform: translate(0%, -100%);"
						>
							CONTINUE WATCHING
						</p>
						<Carousel
							anime={store.recentlyWatched.map((recent) => {
								const animeInfo = store.playbackProgress.get(recent.id);
								if (animeInfo === undefined)
									return {
										id: recent.id,
										title: { english: "not found", native: "not found", romaji: "not found" },
										cover: "",
										episodeNumber: 0,
									};

								return {
									id: recent.id,
									title: animeInfo?.meta.title,
									cover: animeInfo?.meta.cover,
									episodeNumber: animeInfo?.[recent.episodeId as AnilistEpisodeId].episodeNumber,
								};
							})}
							leftOffset={50}
						/>
					</div>
				)}
				<p
					class="title-text no-select"
					style="margin-top: 20px; font-size: 3vmin; line-height: 3vmin; color: #ffffffcc;"
				>
					RECENT
				</p>
				<div style="position: relative; width: 100vw; height: 30vmin;">
					<Carousel anime={recent} leftOffset={3} />
				</div>
				<p
					class="title-text no-select"
					style="margin-top: 20px; font-size: 3vmin; line-height: 3vmin; color: #ffffffcc;"
				>
					TRENDING
				</p>
				<div style="position: relative; width: 100vw; height: 30vmin;">
					<Carousel anime={trending} leftOffset={3} />
				</div>
			</div>
			<Outlet />
			<AnimatePresence>{isSearching && <Search onClickOff={() => setIsSearching(false)} />}</AnimatePresence>
		</>
	);
};
