import { StateUpdater } from "preact/hooks";
import { Store } from "tauri-plugin-store-api";
import { AnilistAnimeId, AnilistEpisodeId } from "../api/anilist";

const FINISHED_THRESHOLD = 60; //seconds

const planStore = new Store(".plan.dat");

export const getPlanToWatch = async (id?: AnilistAnimeId) => {
	if (id !== undefined) return await planStore.get(id);
	return await planStore.entries();
};

export const setPlanToWatch = async (id: AnilistAnimeId, plan?: PlanToWatch) => {
	if (plan === undefined) {
		await planStore.delete(id);
	} else {
		await planStore.set(id, plan);
	}
};

const playbackProgressStore = new Store(".playback-progress.dat");

export const getRecentlyWatched = async (): Promise<Array<RecentlyWatched>> => {
	return (await playbackProgressStore.get("recent")) ?? [];
};

export const getPlaybackProgress = async (id?: AnilistAnimeId) => {
	if (id !== undefined) return await playbackProgressStore.get(id);
	return await playbackProgressStore.entries();
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
			total: meta.total,
			latest: { id: episodeId as AnilistEpisodeId },
			completed: isFinished && episodeNumber === meta.total ? { date: new Date().toUTCString() } : undefined,
		},
	};
	await playbackProgressStore.set(`${animeId}`, newStore);

	const recent = ((await playbackProgressStore.get<Array<RecentlyWatched>>("recent")) ?? []).filter(
		(v) => v.id !== animeId,
	);

	let existing: RecentlyWatched = {
		id: animeId as AnilistAnimeId,
		episodeId: episodeId as AnilistEpisodeId,
	};

	recent.unshift(existing);

	while (recent.length > 10) {
		recent.pop();
	}

	await playbackProgressStore.set("recent", recent);
	await setPlanToWatch(animeId as AnilistAnimeId);

	if (setRecentlyWatched !== undefined) setRecentlyWatched((prev) => prev + 1);

	return newStore;
};
