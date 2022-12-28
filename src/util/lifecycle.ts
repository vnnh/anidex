import { savePlaybackProgress } from "./store";

export const onWindowClose = async () => {
	const videoPlayer = document.getElementById("anime-player");
	if (videoPlayer) {
		await savePlaybackProgress(videoPlayer as HTMLVideoElement);
	}
};
