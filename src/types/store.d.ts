type PlaybackProgress = {
	[key in import("../api/anilist").AnilistEpisodeId | "meta"]: key extends "meta"
		? {
				title: import("../api/anilist").AnimeInfo["title"];
				cover: string;
				latest: { id: string };
				completed?: { date: string };
		  }
		: { finished: boolean; lastTime: number; episodeNumber: number; date: string };
};

type RecentlyWatched = {
	id: AnilistAnimeId;
	episodeId: string;
};
