import { AnimePayload, EnimeAnimeId, EnimeEpisodeId } from "../api/enime";

export default {
	animeInfoCache: new Map(),
} as {
	animeInfoCache: Map<EnimeAnimeId, NullableField<AnimePayload, "episodes" | "relations">>;

	/** store outside of app context because there are processes that are run when the window closes, which is outside of the React environment */
	currentAnime?: NullableField<AnimePayload, "episodes" | "relations">;
	currentEpisode?: { id: EnimeEpisodeId; number: number };
	animeTransitionElement?: HTMLDivElement;
};
