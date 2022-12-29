import { AnilistAnimeId } from "./anilist";

export type EnimeAnimeId = string & {
	/**
	 * @hidden
	 */
	readonly __nominal_enime_id: true;
};

export type EnimeEpisodeId = string & {
	/**
	 * @hidden
	 */
	readonly __nominal_enime_episode_id: true;
};

type AnimeTitle = { romaji: string; english: string; native: string };

export interface AnimePayload {
	id: EnimeAnimeId;
	slug: EnimeAnimeId;
	anilistId: AnilistAnimeId;
	coverImage: string;
	bannerImage: string;
	status: "RELEASING" | "FINISHED" | "NOT_YET_RELEASED" | "CANCELLED" | "HIATUS";
	format: "TV" | "TV_SHORT" | "MOVIE" | "SPECIAL" | "OVA" | "ONA" | "MUSIC" | "MANGA" | "NOVEL" | "ONE_SHOT";
	season: "WINTER" | "SPRING" | "SUMMER" | "FALL";
	year: number;
	title: AnimeTitle;
	currentEpisode: number;
	next: string;
	synonyms: Array<string>;
	lastEpisodeUpdate: string;
	description: string;
	duration: number;
	averageScore: number;
	popularity: number;
	color: string;
	mappings: {
		anilist: AnilistAnimeId;
	};
	genre: Array<string>;

	episodes: Array<EpisodePayload>;
	relations: Array<{
		type:
			| "ADAPTATION"
			| "PREQUEL"
			| "SEQUEL"
			| "PARENT"
			| "SIDE_STORY"
			| "CHARACTER"
			| "SUMMARY"
			| "ALTERNATIVE"
			| "SPIN_OFF"
			| "OTHER";
		anime: AnimePayload;
	}>;
}

export interface EpisodePayload {
	id: EnimeEpisodeId;
	number: number;
	title: string;
	titleVariations: { english: string; native: string };
	description: string;
	image: string;
	airedAt: string;

	introStart: null | number;
	introEnd: null | number;
	filler: null;

	sources: Array<{
		id: EnimeAnimeId;
		url: string;
		target: string;
		priority: number;
	}>;
}

export type SearchAnimePayload = Omit<AnimePayload, "episodes" | "relations">;

export interface AnimeSearch {
	data: Array<SearchAnimePayload>;
	meta: {
		total: number;
		lastPage: number;
		currentPage: number;
		perPage: number;
		prev: null | number;
		next: null | number;
	};
}

export const searchAnime = (search: string) => {
	return new Promise<AnimeSearch>((resolve, reject) => {
		fetch(`https://api.enime.moe/search/${search}`)
			.then((response) => {
				response.json().then((v) => {
					resolve(v as AnimeSearch);
				});
			})
			.catch((e) => reject(e));
	});
};

export interface RecentEpisodes {
	data: Array<
		EpisodePayload & {
			animeId: EnimeAnimeId;
			anime: AnimePayload;
		}
	>;
	meta: {
		total: number;
		lastPage: number;
		currentPage: number;
		perPage: number;
		prev: null | number;
		next: null | number;
	};
}

export const getRecentEpisodes = () => {
	return new Promise<RecentEpisodes>((resolve, reject) => {
		fetch(`https://api.enime.moe/recent`)
			.then((response) => {
				response.json().then((v) => {
					resolve(v as RecentEpisodes);
				});
			})
			.catch((e) => reject(e));
	});
};

export const getPopular = () => {
	return new Promise<AnimeSearch>((resolve, reject) => {
		fetch(`https://api.enime.moe/popular`)
			.then((response) => {
				response.json().then((v) => {
					resolve(v as AnimeSearch);
				});
			})
			.catch((e) => reject(e));
	});
};

type EpisodeNumberSearch = EpisodePayload & {
	anime: AnimeSearch["data"][number];
};

export const searchFromEpisode = (animeId: EnimeAnimeId, episodeNumber: number) => {
	return new Promise<EpisodeNumberSearch>((resolve, reject) => {
		fetch(`https://api.enime.moe/view/${animeId}/${episodeNumber}`)
			.then((response) => {
				response.json().then((v) => {
					resolve(v as EpisodeNumberSearch);
				});
			})
			.catch((e) => reject(e));
	});
};

export const getAnime = (animeId: EnimeAnimeId) => {
	return new Promise<AnimePayload>((resolve, reject) => {
		fetch(`https://api.enime.moe/anime/${animeId}`)
			.then((response) => {
				response.json().then((v) => {
					resolve(v as AnimePayload);
				});
			})
			.catch((e) => reject(e));
	});
};

export const getEpisodes = (animeId: EnimeAnimeId) => {
	return new Promise<AnimePayload["episodes"]>((resolve, reject) => {
		fetch(`https://api.enime.moe/anime/${animeId}/episodes`)
			.then((response) => {
				response.json().then((v) => {
					resolve(v as AnimePayload["episodes"]);
				});
			})
			.catch((e) => reject(e));
	});
};

interface EpisodeSource {
	id: EnimeEpisodeId;
	url: string;
	target: string;
	priority: number;
	website: string;
	subtitle: boolean;
}

export const getSource = (id: string) => {
	return new Promise<EpisodeSource>((resolve, reject) => {
		fetch(`https://api.enime.moe/source/${id}`)
			.then((response) => {
				response.json().then((v) => resolve(v));
			})
			.catch((e) => reject(e));
	});
};
