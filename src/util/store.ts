import { StateUpdater } from "preact/hooks";
import { Store } from "tauri-plugin-store-api";
import { EnimeAnimeId, EnimeEpisodeId } from "../api/enime";
import cache from "./cache";

const FINISHED_THRESHOLD = 60; //seconds

const planStore = new Store(".plan.dat");

export const getPlanToWatch = async (id?: EnimeAnimeId) => {
	if (id !== undefined) return await planStore.get(id);
	return await planStore.entries();
};

export const setPlanToWatch = async (id: EnimeAnimeId, plan?: PlanToWatch) => {
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

export const getPlaybackProgress = async (id?: EnimeAnimeId) => {
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

	const animeId = cache.currentAnime?.slug;
	const episodeId = cache.currentEpisode?.id;
	const episodeNumber = cache.currentEpisode?.number;

	if (animeId === undefined || episodeId === undefined) return;

	const isFinished = time >= video.duration - FINISHED_THRESHOLD;
	const newStore: PlaybackProgress = {
		...((await playbackProgressStore.get(`${animeId}`)) ?? {}),
		[episodeId as EnimeEpisodeId]: {
			finished: isFinished,
			lastTime: time,
			episodeNumber,
			date: new Date().toUTCString(),
		},
		meta: {
			latest: { id: episodeId as EnimeEpisodeId },
		},
	};
	await playbackProgressStore.set(`${animeId}`, newStore);

	const recent = ((await playbackProgressStore.get<Array<RecentlyWatched>>("recent")) ?? []).filter(
		(v) => v.id !== animeId,
	);

	let existing: RecentlyWatched = {
		id: animeId as EnimeAnimeId,
		episodeId: episodeId as EnimeEpisodeId,
	};

	recent.unshift(existing);

	while (recent.length > 10) {
		recent.pop();
	}

	await playbackProgressStore.set("recent", recent);
	await setPlanToWatch(animeId as EnimeAnimeId);

	if (setRecentlyWatched !== undefined) setRecentlyWatched((prev) => prev + 1);

	return newStore;
};
