type PlaybackProgress = {
	[key in import("../api/anilist").AnilistEpisodeId | "meta"]: key extends "meta"
		? {
				title: import("../api/anilist").AnimeInfo["title"];
				cover: string;
				total: number;
				latest: { id: import("../api/anilist").AnilistEpisodeId };
				completed?: { date: string };
		  }
		: { finished: boolean; lastTime: number; episodeNumber: number; date: string };
};

type RecentlyWatched = {
	id: AnilistAnimeId;
	episodeId: import("../api/anilist").AnilistEpisodeId;
};

type PlanToWatch = {
	title: import("../api/anilist").AnimeInfo["title"];
	cover: string;
	date: string;
	total: number;
};
