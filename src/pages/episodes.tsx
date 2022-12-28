import { StateUpdater, useContext, useEffect, useRef, useState } from "preact/hooks";
import { AppContext } from "../components/app";
import { Breadcrumbs } from "../components/breadcrumbs";
import { motion } from "framer-motion";
import gradient from "../util/gradient";
import { AnilistAnimeId, AnilistEpisodeId, getStreamingLinks, StreamingLinks } from "../api/anilist";
import HLS from "hls.js";
import { window } from "@tauri-apps/api";
import { Store } from "tauri-plugin-store-api";
import "../styles/episodes.css";
import { clearActivity, setActivity } from "../api/discord";

const FINISHED_THRESHOLD = 60; //seconds

const playbackProgressStore = new Store(".playback-progress.dat");

export const getRecentlyWatched = async (): Promise<Array<RecentlyWatched>> => {
	return (await playbackProgressStore.get("recent")) ?? [];
};

export const getPlaybackProgress = async () => {
	return (await playbackProgressStore.entries()) as Array<[AnilistAnimeId, PlaybackProgress]>;
};

export const savePlaybackProgress = async (
	video: HTMLVideoElement,
	time?: number,
	setRecentlyWatched?: StateUpdater<number>,
) => {
	time ??= video.currentTime;
	if (time <= 0) return;

	const animeId = video.getAttribute("anime-id");
	const episodeId = video.getAttribute("episode-id");

	if (animeId === null || episodeId === null) return;

	const _episodeNumber = video.getAttribute("episode-number");
	const episodeNumber = _episodeNumber !== null ? parseInt(_episodeNumber) : 0;

	const meta = JSON.parse(video.getAttribute("anime-meta") ?? "{}");
	const isFinished = time >= video.duration - FINISHED_THRESHOLD;
	const newStore: PlaybackProgress = {
		...((await playbackProgressStore.get(`${animeId}`)) ?? {}),
		[episodeId as string]: {
			finished: isFinished,
			lastTime: time,
			episodeNumber,
			date: new Date().toUTCString(),
		},
		meta: {
			title: meta.title,
			cover: meta.cover,
			latest: { id: episodeId },
			completed: isFinished && episodeNumber === meta.total ? { date: new Date().toUTCString() } : undefined,
		},
	};
	await playbackProgressStore.set(`${animeId}`, newStore);

	const recent = ((await playbackProgressStore.get<Array<RecentlyWatched>>("recent")) ?? []).filter(
		(v) => v.id !== animeId,
	);

	let existing: RecentlyWatched = {
		id: animeId as AnilistAnimeId,
		episodeId,
	};

	recent.unshift(existing);

	while (recent.length > 10) {
		recent.pop();
	}

	await playbackProgressStore.set("recent", recent);

	if (setRecentlyWatched !== undefined) setRecentlyWatched((prev) => prev + 1);

	return newStore;
};

export const Episodes = () => {
	const ctx = useContext(AppContext);
	const animeInfo = ctx.currentAnimeInfo;
	const [episodeSources, setEpisodeSources] = useState(new Map<AnilistEpisodeId, StreamingLinks>());
	const [episodeQuality, setEpisodeQuality] = useState("1080p");
	const [userProgress, setUserProgress] = useState<PlaybackProgress | undefined>();
	const [loadError, setLoadError] = useState(false);
	const [currentEpisode, setCurrentEpisode] = useState(animeInfo?.episodes[0]);

	const videoRef = useRef<HTMLVideoElement>(null);

	useEffect(() => {
		if (animeInfo?.id) {
			playbackProgressStore.get<PlaybackProgress>(animeInfo.id).then((v) => {
				if (v === null) return;
				if (v.meta.latest) {
					const episodeNumber = v[v.meta.latest.id as AnilistEpisodeId].episodeNumber;
					const episodeId = v.meta.latest.id;
					const episodeMatch = animeInfo.episodes[episodeNumber - 1];
					if (episodeMatch.id === episodeId) {
						setCurrentEpisode(episodeMatch);
					} else {
						const episodeMatch = animeInfo.episodes.find((v) => v.id === episodeId);
						if (episodeMatch !== undefined) setCurrentEpisode(episodeMatch);
					}
				}
				setUserProgress(v);
			});
		}
	}, [animeInfo?.id]);

	useEffect(() => {
		if (loadError === true) return;

		if (currentEpisode && !episodeSources.has(currentEpisode.id)) {
			getStreamingLinks(currentEpisode.id)
				.then((v) => {
					if (!v.sources) {
						setLoadError(true);
						return;
					}

					const newMap = new Map(episodeSources);
					newMap.set(currentEpisode.id, v);
					setLoadError(false);
					setEpisodeSources(newMap);
				})
				.catch((e) => console.log(e))
				.finally();
		}
	}, [currentEpisode, loadError]);

	useEffect(() => {
		let animeId = animeInfo?.id;
		let episodeId = currentEpisode?.id;
		let video = videoRef.current;

		const setHLS = (index: number, timePosition?: number) => {
			const current = episodeSources.get(episodeId!)!.sources[index];
			if (current === undefined) return;
			if (current.isM3U8) {
				const hls = new HLS({ startPosition: timePosition ?? -1 });
				hls.loadSource(current.url);
				hls.attachMedia(video!);
			} else {
				video!.src = `${current.url}#t=${timePosition ?? 0}`;
			}

			video!.load();
		};

		const startTime = (episodeId && userProgress?.[episodeId]?.lastTime) ?? 0;
		if (video !== null && episodeId !== undefined && episodeSources.has(episodeId)) {
			setHLS(
				episodeSources.get(episodeId!)!.sources.findIndex((v) => v.quality === episodeQuality) ?? 0,
				startTime,
			);
		}

		const fullScreenChange = async () => {
			if (document.fullscreenElement !== null) {
				await window.getCurrent().setFullscreen(true);
			} else {
				await window.getCurrent().setFullscreen(false);
			}
		};

		if (video !== null) {
			if (animeId !== undefined && episodeId !== undefined) {
				video.setAttribute("anime-id", animeId);
				video.setAttribute("episode-id", episodeId);

				video.setAttribute("episode-number", currentEpisode!.number.toString());

				video.setAttribute(
					"anime-meta",
					JSON.stringify({
						cover: animeInfo!.cover,
						title: animeInfo!.title,
						total: animeInfo!.totalEpisodes,
					}),
				);
			}

			video.onfullscreenchange = fullScreenChange;
			video.addEventListener("webkitfullscreenchange", fullScreenChange);

			video.onpause = () => {
				setActivity({
					isPlaying: false,
					duration: Math.floor(video?.duration ?? 0),
					episode: currentEpisode?.title ?? `Episode ${currentEpisode?.number}`,
					image: animeInfo?.image ?? "",
					progress: Math.floor(video?.currentTime ?? 0),
					title: animeInfo?.title.romaji ?? "",
				});
			};

			video.onplay = () => {
				setActivity({
					isPlaying: true,
					duration: Math.floor(video?.duration ?? 0),
					episode: currentEpisode?.title ?? `Episode ${currentEpisode?.number}`,
					image: animeInfo?.image ?? "",
					progress: Math.floor(video?.currentTime ?? 0),
					title: animeInfo?.title.romaji ?? "",
				});
			};
		}

		return async () => {
			if (video !== null) {
				video.removeEventListener("webkitfullscreenchange", fullScreenChange);
			}

			if (video !== null && episodeId !== undefined) {
				clearActivity();

				const newStore = await savePlaybackProgress(
					video,
					video.currentTime,
					ctx.setUpdateRecentlyWatchedCounter,
				);
				if (newStore !== undefined) {
					setUserProgress(newStore);
				}
			}
		};
	}, [videoRef.current, currentEpisode, episodeSources, episodeQuality]);

	return (
		<div style="position: absolute; top: 0; left: 0; width: 100vw; height: 100vh;">
			<motion.div
				style={{
					position: "relative",
					left: 0,
					width: "100vw",
					height: "100vh",
					backgroundColor: "#111",
					paddingTop: "20px",
					zIndex: 4,
				}}
				initial={{ top: "100%" }}
				animate={{
					top: 0,
					transition: {
						duration: 0.25,
					},
				}}
			>
				<div style="position: absolute; left: 5vmin; top: calc(50% - 35%); width: 25vmin; height: 70%; background-color: #1a1a1a; border-radius: 8px; overflow-y: auto">
					{animeInfo?.episodes.map((v) => {
						const currentEpisodeId = currentEpisode?.id;
						return (
							<div
								style={`display: flex; align-items: center; gap: 1vmin; padding: 0 2vmin 1vmin 2vmin; margin: 0; color: ${
									currentEpisodeId === v.id
										? "#673ab8"
										: userProgress?.[v.id]?.finished
										? "#444"
										: userProgress?.[v.id] !== undefined
										? "#777"
										: "#ccc"
								}; font-family: Lato; font-size: 1.75vmin; font-weight: 600;`}
								onClick={() => {
									setCurrentEpisode(v);
								}}
							>
								<p>{v.number}</p>
								<p style="text-overflow: ellipsis; white-space: nowrap; overflow: hidden; font-weight: 400;">
									{v.title !== null ? v.title : `Episode ${v.number}`}
								</p>
							</div>
						);
					})}
				</div>
				<div style="position: absolute; left: 35vmin; top: calc(50% - 35%); width: min(115vmin, 100% - 40vmin); background-color: #1a1a1a; border-radius: 8px;">
					<video
						id={`anime-player`}
						key={currentEpisode?.id ?? "anime-player"}
						style={`width: 100%; aspect-ratio: ${16 / 9}; border-radius: 8px;`}
						controls
						poster={currentEpisode?.image ?? ""}
						ref={videoRef}
					/>

					{loadError && (
						<div
							style={`position: absolute; top: 0; left: 0; width: 100%; aspect-ratio: ${16 / 9};`}
							onClick={() => {
								setLoadError(false);
							}}
						>
							<div
								class="refresh-button"
								style="position: absolute; top: calc(50% - 4vmin); left: calc(50% - 4vmin); border-radius: 50%; width: 8vmin; height: 8vmin;"
							>
								<p
									class="material-icons"
									style="margin-top: 25%; width: 100%; height: 100%; text-align: center; font-size: 4vmin; color: #fff"
								>
									refresh
								</p>
							</div>
						</div>
					)}

					<div style="position: relative; width: 100%; aspect-ratio: 16; height: 30px; padding: 10px">
						<div style="display: flex; height: 100%; gap: 1vmin;">
							{currentEpisode !== undefined &&
								episodeSources.has(currentEpisode.id) &&
								episodeSources.get(currentEpisode.id)!.sources.map((v) => {
									if (v.quality === "default" || v.quality === "backup") return;

									if (v.quality === episodeQuality) {
										return (
											<div style="cursor: pointer; height: 20px; background-color: #fff; border-radius: 8px; padding: 2px 6px 2px 6px; color: #111; font-family: Lato; font-size: 14px; font-weight: 600">
												{v.quality}
											</div>
										);
									} else {
										return (
											<div
												class="quality-button"
												style="height: 20px; padding: 2px 6px 2px 6px; font-family: Lato; font-size: 14px;"
												onClick={() => {
													setEpisodeQuality(v.quality);
												}}
											>
												{v.quality}
											</div>
										);
									}
								})}
						</div>
					</div>
				</div>
			</motion.div>
			<motion.div
				style={{
					zIndex: 4,
					position: "fixed",
					left: 0,
					top: 0,
					width: "100%",
					height: "10%",
					backgroundImage: gradient(180),
				}}
				initial={{
					top: "-15%",
				}}
				animate={{
					top: 0,
					transition: { duration: 0.15 },
				}}
			/>
			<Breadcrumbs />
		</div>
	);
};
