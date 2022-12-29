type PlaybackProgress = {
	[key in import("../api/enime").EnimeEpisodeId | "meta"]: key extends "meta"
		? {
				latest: { id: import("../api/enime").EnimeEpisodeId };
		  }
		: { finished: boolean; lastTime: number; episodeNumber: number; date: string };
};

type RecentlyWatched = {
	id: import("../api/enime").EnimeAnimeId;
	episodeId: import("../api/enime").EnimeEpisodeId;
};

type PlanToWatch = {
	date: string;
};
