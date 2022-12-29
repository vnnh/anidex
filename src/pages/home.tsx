import { AnimatePresence } from "framer-motion";
import { useContext, useEffect, useState } from "preact/hooks";
import { Outlet } from "react-router";
import {
	EnimeAnimeId,
	getAnime,
	getPopular,
	getRecentEpisodes,
	RecentEpisodes,
	SearchAnimePayload,
} from "../api/enime";
import { AppContext } from "../components/app";
import { Carousel } from "../components/carousel";
import "../styles/search.css";
import cache from "../util/cache";
import { getPlanToWatch, getPlaybackProgress, getRecentlyWatched } from "../util/store";
import { Search } from "./search";
import { ViewHistory } from "./viewHistory";

export const Home = () => {
	const [trending, setTrending] = useState<Array<SearchAnimePayload>>([]);
	const [recent, setRecent] = useState<Array<RecentEpisodes["data"][number]>>([]);
	const [store, setStore] = useState<{
		recentlyWatched: Array<RecentlyWatched>;
		playbackProgress: Map<EnimeAnimeId, PlaybackProgress>;
		rawPlaybackProgress: Array<[EnimeAnimeId, PlaybackProgress]>;
		planToWatch: Array<[EnimeAnimeId, PlanToWatch]>;
	}>({ recentlyWatched: [], playbackProgress: new Map(), rawPlaybackProgress: [], planToWatch: [] });
	const [isSearching, setIsSearching] = useState(false);
	const [viewHistory, setViewHistory] = useState(false);
	const ctx = useContext(AppContext);

	useEffect(() => {
		getPopular()
			.then((value) => {
				setTrending(value.data ?? []);

				for (const v of value.data) {
					cache.animeInfoCache.set(v.slug, v);
				}
			})
			.catch((e) => console.log(e));

		getRecentEpisodes()
			.then((value) => {
				setRecent(value.data ?? []);

				for (const v of value.data) {
					cache.animeInfoCache.set(v.anime.slug, v.anime);
				}
			})
			.catch((e) => console.log(e));
	}, []);

	useEffect(() => {
		Promise.all([getRecentlyWatched(), getPlaybackProgress(), getPlanToWatch()])
			.then((v) => {
				const progressMap = new Map<EnimeAnimeId, PlaybackProgress>();
				for (const [id, progress] of v[1] as Array<[EnimeAnimeId, PlaybackProgress]>) {
					progressMap.set(id, progress);
				}

				const promises = [];
				for (const b of v[0]) {
					if (!cache.animeInfoCache.has(b.id)) {
						promises.push(
							getAnime(b.id).then((v) => {
								cache.animeInfoCache.set(b.id, v);
							}),
						);
					}
				}

				for (const [b] of v[1] as Array<[EnimeAnimeId, PlaybackProgress]>) {
					if (b !== "recent" && !cache.animeInfoCache.has(b)) {
						promises.push(
							getAnime(b).then((v) => {
								cache.animeInfoCache.set(b, v);
							}),
						);
					}
				}

				for (const [b] of v[2] as Array<[EnimeAnimeId, PlanToWatch]>) {
					if (!cache.animeInfoCache.has(b)) {
						promises.push(
							getAnime(b).then((v) => {
								cache.animeInfoCache.set(b, v);
							}),
						);
					}
				}

				Promise.all(promises).then(() => {
					setStore({
						recentlyWatched: v[0],
						playbackProgress: progressMap,
						rawPlaybackProgress: v[1] as Array<[EnimeAnimeId, PlaybackProgress]>,
						planToWatch: v[2] as Array<[EnimeAnimeId, PlanToWatch]>,
					});
				});
			})
			.catch((e) => console.log(e));
	}, [ctx.updateRecentlyWatchedCounter]);

	useEffect(() => {
		let exit: (e: KeyboardEvent) => void;
		if (isSearching || viewHistory) {
			exit = (e) => {
				if (e.key === "Escape") {
					setIsSearching(false);
					setViewHistory(false);
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
	}, [isSearching, viewHistory]);

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
					<div
						class="searchbar"
						style="width: 35px; height: 35px; margin: 5px; display: flex; align-items: center; justify-content: center;"
						onClick={() => {
							setViewHistory(true);
						}}
					>
						<div
							class="material-icons search-icon"
							style="font-size: 20px; height: 20px; margin-right: 1px"
						>
							history
						</div>
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

								return {
									anime: cache.animeInfoCache.get(recent.id)!,
									number: animeInfo?.[recent.episodeId].episodeNumber,
								};
							})}
							leftOffset={50}
						/>
					</div>
				)}
				{store.planToWatch.length > 0 && (
					<>
						<p
							class="title-text no-select"
							style="margin-top: 20px; font-size: 3vmin; line-height: 3vmin; color: #ffffffcc;"
						>
							PLAN TO WATCH
						</p>
						<div style="position: relative; width: 100vw; height: 30vmin;">
							<Carousel
								anime={store.planToWatch
									.sort((a, b) => {
										return new Date(b[1].date).valueOf() - new Date(a[1].date).valueOf();
									})
									.map((plan) => {
										const playbackProgress = store.playbackProgress.get(plan[0]);

										return {
											anime: cache.animeInfoCache.get(plan[0])!,
											number:
												playbackProgress !== undefined
													? playbackProgress[playbackProgress.meta.latest.id].episodeNumber
													: undefined,
										};
									})}
								leftOffset={3}
							/>
						</div>
					</>
				)}
				<p
					class="title-text no-select"
					style="margin-top: 20px; font-size: 3vmin; line-height: 3vmin; color: #ffffffcc;"
				>
					RECENT
				</p>
				<div style="position: relative; width: 100vw; height: 30vmin;">
					<Carousel
						anime={recent.map((v) => {
							return {
								anime: v.anime,
								number: v.number,
							};
						})}
						leftOffset={3}
						useCover={true}
					/>
				</div>
				<p
					class="title-text no-select"
					style="margin-top: 20px; font-size: 3vmin; line-height: 3vmin; color: #ffffffcc;"
				>
					TRENDING
				</p>
				<div style="position: relative; width: 100vw; height: 30vmin;">
					<Carousel
						anime={trending.map((v) => {
							return { anime: v };
						})}
						leftOffset={3}
						useCover={true}
					/>
				</div>
			</div>
			<Outlet />
			<AnimatePresence>{isSearching && <Search onClickOff={() => setIsSearching(false)} />}</AnimatePresence>
			<AnimatePresence>
				{viewHistory && (
					<ViewHistory
						onClickOff={() => setViewHistory(false)}
						playbackProgress={store.rawPlaybackProgress}
						planToWatch={store.planToWatch}
					/>
				)}
			</AnimatePresence>
		</>
	);
};
