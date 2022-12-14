import { invoke } from "@tauri-apps/api";

interface SetActivityPayload {
	animeTitle: string; //details
	animeEpisode: string; //state

	start?: number; //startTimestamp
	end?: number; //endTimeStamp

	largeImage?: string;
	largeImageText?: string;

	smallImage?: string;
	smallImageText?: string;

	url?: string; //button url
}

export const setActivity = (payload: {
	isPlaying: boolean;
	progress: number;
	duration: number;
	image: string;
	title: string;
	episode: string;
}) => {
	const now = Date.now();
	const activity: SetActivityPayload = { animeTitle: payload.title, animeEpisode: payload.episode };

	if (payload.isPlaying) {
		activity.start = now + payload.progress * 1000;
		activity.end = now + (payload.duration - payload.progress) * 1000;
	}

	activity.largeImage = payload.image;
	activity.largeImageText = `${payload.title}`;

	activity.smallImage = payload.isPlaying ? "pause" : "play";
	activity.smallImageText = payload.isPlaying ? "pause" : "play";

	invoke("set_activity", { payload: activity }).then(() => console.log("Set activity"));
};

export const clearActivity = () => {
	invoke("set_activity").then(() => console.log("Cleared activity"));
};
