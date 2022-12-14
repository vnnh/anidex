import { createContext, FunctionComponent } from "preact";
import { StateUpdater, useState } from "preact/hooks";
import { AnimeCard, AnimeInfo } from "../api/anilist";

type AppContext = {
	transitionElement: HTMLDivElement | undefined;
	setTransitionElement: StateUpdater<AppContext["transitionElement"]>;

	currentAnime: AnimeCard | undefined;
	setCurrentAnime: StateUpdater<AppContext["currentAnime"]>;
	currentAnimeInfo: AnimeInfo | undefined;
	setCurrentAnimeInfo: StateUpdater<AppContext["currentAnimeInfo"]>;

	updateRecentlyWatchedCounter: number;
	setUpdateRecentlyWatchedCounter: StateUpdater<number>;
};

const AppContext = createContext<AppContext>({} as AppContext);

const AppProvider: FunctionComponent = (props) => {
	const [transitionElement, setTransitionElement] = useState<HTMLDivElement | undefined>(undefined);
	const [currentAnime, setCurrentAnime] = useState<AnimeCard | undefined>(undefined);
	const [currentAnimeInfo, setCurrentAnimeInfo] = useState<AnimeInfo | undefined>(undefined);
	const [updateRecentlyWatchedCounter, setUpdateRecentlyWatchedCounter] = useState(0);

	return (
		<AppContext.Provider
			value={{
				transitionElement,
				setTransitionElement,
				currentAnime,
				setCurrentAnime: (v) => {
					setCurrentAnimeInfo(undefined);
					setCurrentAnime(v);
				},
				currentAnimeInfo,
				setCurrentAnimeInfo,
				updateRecentlyWatchedCounter,
				setUpdateRecentlyWatchedCounter,
			}}
		>
			{props.children}
		</AppContext.Provider>
	);
};

export { AppProvider, AppContext };
