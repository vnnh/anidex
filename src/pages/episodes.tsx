import { useContext, useEffect, useRef, useState } from "preact/hooks";
import { AppContext } from "../components/app";
import { Breadcrumbs } from "../components/breadcrumbs";
import { motion } from "framer-motion";
import gradient from "../util/gradient";
import HLS from "hls.js";
import { window } from "@tauri-apps/api";
import "../styles/episodes.css";
import { clearActivity, setActivity } from "../api/discord";
import { getPlaybackProgress, savePlaybackProgress } from "../util/store";
import { EnimeEpisodeId, getEpisodes, getSource } from "../api/enime";
import cache from "../util/cache";

export const Episodes = () => {
	const ctx = useContext(AppContext);

	const currentAnime = cache.currentAnime!;

	const [updateSources, setUpdateSources] = useState(false);
	const [userProgress, setUserProgress] = useState<PlaybackProgress | undefined>();
	const [currentEpisode, setCurrentEpisode] = useState<{ id: EnimeEpisodeId; number: number } | undefined>();
	const episodeDivRef = useRef<HTMLDivElement | null>(null);

	const videoRef = useRef<HTMLVideoElement>(null);

	useEffect(() => {
		if (currentAnime.episodes !== undefined) {
			setUpdateSources(true);
		} else {
			getEpisodes(currentAnime.slug).then((v) => {
				currentAnime.episodes = v;
				setUpdateSources(true);
			});
		}
	}, [currentAnime.episodes]);

	useEffect(() => {
		if (currentAnime.episodes === undefined) return;

		getPlaybackProgress(currentAnime.slug).then((v) => {
			if (v === null) {
				setCurrentEpisode({ id: currentAnime.episodes![0].id, number: currentAnime.episodes![0].number });
				return;
			}

			if ((v as PlaybackProgress).meta.latest) {
				const episodeId = (v as PlaybackProgress).meta.latest.id;
				const episodeNumber = (v as PlaybackProgress)[episodeId].episodeNumber;
				setCurrentEpisode({ id: episodeId, number: episodeNumber });
			} else {
				setCurrentEpisode({ id: currentAnime.episodes![0].id, number: currentAnime.episodes![0].number });
			}

			setUserProgress(v as PlaybackProgress);
		});
	}, [currentAnime.episodes, updateSources]);

	useEffect(() => {
		if (episodeDivRef.current !== null) {
			(episodeDivRef.current! as unknown as { scrollIntoViewIfNeeded: () => void }).scrollIntoViewIfNeeded();
		}
	}, [episodeDivRef.current]);

	useEffect(() => {
		if (currentAnime.episodes === undefined) return;
		if (currentEpisode === undefined) return;

		const episodeId = currentEpisode.id;
		const episode = currentAnime.episodes![currentEpisode.number - 1];
		const video = videoRef.current;

		cache.currentEpisode = {
			id: episodeId,
			number: currentEpisode.number,
		};

		const setHLS = async (timePosition?: number) => {
			const preferredSource = episode.sources[0];
			const source = await getSource(preferredSource.id);
			if (source === undefined) return;
			const sourceUrl =
				preferredSource.url !== undefined && preferredSource.url.includes("zoro")
					? `https://cors.proxy.consumet.org/${source.url}`
					: source.url;

			if (sourceUrl.endsWith("m3u8")) {
				const hls = new HLS({ startPosition: timePosition ?? -1 });
				hls.loadSource(sourceUrl);
				hls.attachMedia(video!);
			} else {
				video!.src = `${sourceUrl}#t=${timePosition ?? 0}`;
			}

			video!.load();
		};

		const startTime = (episodeId && userProgress?.[episodeId]?.lastTime) ?? 0;
		if (video !== null && episodeId !== undefined) {
			setHLS(startTime);
		}

		const fullScreenChange = async () => {
			if (document.fullscreenElement !== null) {
				await window.getCurrent().setFullscreen(true);
			} else {
				await window.getCurrent().setFullscreen(false);
			}
		};

		if (video !== null) {
			video.onfullscreenchange = fullScreenChange;
			video.addEventListener("webkitfullscreenchange", fullScreenChange);

			video.onpause = () => {
				setActivity({
					isPlaying: false,
					duration: Math.floor(video?.duration ?? 0),
					episode: episode.title ?? `Episode ${episode.number}`,
					image: currentAnime.coverImage ?? "",
					progress: Math.floor(video?.currentTime ?? 0),
					title: currentAnime.title.romaji ?? "",
				});
			};

			video.onplay = () => {
				setActivity({
					isPlaying: true,
					duration: Math.floor(video?.duration ?? 0),
					episode: episode.title ?? `Episode ${currentEpisode?.number}`,
					image: currentAnime.coverImage ?? "",
					progress: Math.floor(video?.currentTime ?? 0),
					title: currentAnime.title.romaji ?? "",
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
	}, [videoRef.current, currentEpisode, updateSources]);

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
				<div style="position: absolute; left: 5vmin; top: calc(50% - 35%); width: 28vmin; height: 70%; background-color: #1a1a1a; border-radius: 8px; overflow-y: auto; gap: 1vmin">
					{currentAnime.episodes !== undefined &&
						currentAnime.episodes.map((v) => {
							const currentEpisodeId = currentEpisode?.id;

							return (
								<div
									style={`position: relative; font-family: Lato; font-size: 1.75vmin; font-weight: 600; margin: 1vmin; color: ${
										currentEpisodeId === v.id
											? "#673ab8"
											: userProgress?.[v.id]?.finished
											? "#444"
											: userProgress?.[v.id] !== undefined
											? "#777"
											: "#ccc"
									}; padding-bottom: 2vmin`}
									onClick={() => {
										setCurrentEpisode(v);
									}}
									{...(currentEpisodeId === v.id ? { ref: episodeDivRef } : {})}
								>
									<img
										draggable={false}
										style="width: 100%; object-fit: cover; border-radius: 8px;"
										src={v.image}
									/>
									{`Episode ${v.number}: ${v.title}`}
								</div>
							);
						})}
				</div>
				<div
					style={`position: absolute; left: 35vmin; top: calc(50% - 35%); width: min(115vmin, 100% - 40vmin); aspect-ratio: ${
						16 / 9
					} background-color: #1a1a1a; border-radius: 8px;`}
				>
					<video
						id={`anime-player`}
						key={currentEpisode?.id ?? "anime-player"}
						style={`width: 100%; aspect-ratio: ${16 / 9}; border-radius: 8px;`}
						controls
						poster={
							currentAnime.episodes !== undefined && currentEpisode !== undefined
								? currentAnime.episodes[currentEpisode.number - 1].image ?? ""
								: ""
						}
						ref={videoRef}
					/>

					<div style="position: relative; width: 100%; aspect-ratio: 16; height: 30px; padding: 10px; font-family: Lato; font-weight: 500">
						{currentAnime.episodes !== undefined && currentEpisode !== undefined && (
							<>
								<p style="margin: 0; font-family: Lato; font-size: 2vmin; line-height: 2vmin; font-weight: 600;">
									{currentAnime.title.romaji}
								</p>
								<p style="margin: 0; color: #777; font-family: Lato; font-size: 1.5vmin; line-height: 1.5vmin; font-weight: 600; font-style: italic; padding-top: 0.75vmin">
									{`Episode ${currentAnime.episodes![currentEpisode.number - 1].number}: ${
										currentAnime.episodes![currentEpisode.number - 1].title
									}`}
								</p>
							</>
						)}
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
