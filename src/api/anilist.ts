export type AnilistAnimeId = string & {
	/**
	 * @hidden
	 */
	readonly __nominal_anilist_id: true;
};

export type AnilistEpisodeId = string & {
	/**
	 * @hidden
	 */
	readonly __nominal_anilist_episode_id: true;
};

type AnimeTitle = { romaji: string; english: string; native: string };

interface RecentEpisodes {
	currentPage: number;
	hasNextPage: boolean;
	totalPages: number;
	totalResults: number;
	results: Array<{
		id: AnilistAnimeId;
		malId: number;
		title: AnimeTitle;
		episodeId: AnilistEpisodeId;
		episodeTitle: string;
		episodeNumber: number;
		image: string;
		rating: 0;
	}>;
}

interface TrendingAnime {
	currentPage: number;
	hasNextPage: boolean;
	results: Array<{
		id: AnilistAnimeId;
		malId: number;
		title: AnimeTitle;
		image: string;
		trailer: { site: string; id: string; thumbnail: string };
		description: string;
		cover: string;
		rating: number;
		releasedDate: number;
		totalEpisodes: number;
		genres: Array<string>;
		duration: number;
		type: "TV";
	}>;
}

export interface AnimeSearch {
	currentPage: number;
	hasNextPage: boolean;
	results: Array<{
		id: AnilistAnimeId;
		malId: number;
		title: AnimeTitle;
		status: string;
		image: string;
		cover: string;
		popularity: number;
		description: string;
		rating: number;
		genres: Array<string>;
		color: string;
		totalEpisodes: number;
		type: string;
		releaseDate: number;
	}>;
}

export interface AnimeCard {
	id: AnilistAnimeId;
	title?: AnimeTitle;
	image?: string;
	cover?: string;
	episodeNumber?: number;
}

export const searchAnime = (text: string): Promise<AnimeSearch> => {
	return new Promise((resolve, reject) => {
		fetch(`https://api.consumet.org/meta/anilist/${text}?perPage=20`)
			.then((response) => {
				response.json().then((v) => {
					resolve(v as AnimeSearch);
				});
			})
			.catch((e) => reject(e));
	});
};

export interface AnimeInfo {
	id: AnilistAnimeId;
	title: AnimeTitle;
	malId: number;
	synonyms: Array<string>;
	isLicensed: boolean;
	isAdult: boolean;
	countryOfOrigin: string;
	trailer: { id: string; site: string; thumbnail: string };
	image: string;
	popularity: number;
	color: string;
	cover: string;
	description: string;
	status: string;
	releaseDate: string;
	startDate: { year: number; month: number; day: number };
	endDate: { year: number; month: number; day: number };
	nextAiringEpisode: { year: number; month: number; day: number };
	totalEpisodes: number;
	rating: number;
	duration: number;
	genres: Array<string>;
	season: string;
	studios: Array<string>;
	subOrDub: "sub" | "dub";
	type: string;
	recommendations: Array<{
		id: AnilistAnimeId;
		malId: number;
		title: {
			romaji: string;
			english: string;
			native: string;
		};
		status: string;
		episodes: number;
		image: string;
		cover: string;
		rating: number;
		type: string;
	}>;
	characters: Array<{
		id: number;
		role: string;
		name: { first: string; last: string; full: string; native: string };
		image: string;
		voiceActors: Array<{
			id: number;
			name: { first: string; last: string; full: string; native: string };
			image: string;
		}>;
	}>;
	relations: Array<{
		id: AnilistAnimeId;
		relationType: string;
		malId: number;
		title: {
			romaji: string;
			english: string;
			native: string;
		};
		status: string;
		episodes: number;
		image: string;
		color: string;
		type: string;
		rating: number;
	}>;
	episodes: Array<{ id: AnilistEpisodeId; title: string; description: string; number: number; image: string }>;
}

export const getAnime = (id: AnilistAnimeId): Promise<AnimeInfo> => {
	return new Promise((resolve, reject) => {
		fetch(`https://api.consumet.org/meta/anilist/info/${id}`)
			.then((response) => {
				response.json().then((v) => {
					resolve(v as AnimeInfo);
				});
			})
			.catch((e) => reject(e));
	});
};

export const getRecentEpisodes = (): Promise<RecentEpisodes> => {
	return new Promise((resolve, reject) => {
		fetch("https://api.consumet.org/meta/anilist/recent-episodes?perPage=20")
			.then((response) => {
				response.json().then((v) => {
					resolve(v as RecentEpisodes);
				});
			})
			.catch((e) => reject(e));
	});
};

export const getTrending = (): Promise<TrendingAnime> => {
	return new Promise((resolve, reject) => {
		fetch("https://api.consumet.org/meta/anilist/trending?perPage=20")
			.then((response) => {
				response.json().then((v) => {
					resolve(v as TrendingAnime);
				});
			})
			.catch((e) => reject(e));
	});
};

export interface StreamingLinks {
	headers: {
		Referer: string;
	};
	sources: Array<{ url: string; isM3U8: true; quality: "360p" | "720p" | "1080p" | "default" | "backup" }>;
}

export const getStreamingLinks = (id: AnilistEpisodeId): Promise<StreamingLinks> => {
	return new Promise((resolve, reject) => {
		fetch(`https://api.consumet.org/meta/anilist/watch/${id}`)
			.then((response) => {
				response.json().then((v) => {
					resolve(v as StreamingLinks);
				});
			})
			.catch((e) => reject(e));
	});
};
