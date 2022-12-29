import { createContext, FunctionComponent } from "preact";
import { StateUpdater, useState } from "preact/hooks";

type AppContext = {
	updateRecentlyWatchedCounter: number;
	setUpdateRecentlyWatchedCounter: StateUpdater<number>;
};

const AppContext = createContext<AppContext>({} as AppContext);

const AppProvider: FunctionComponent = (props) => {
	const [updateRecentlyWatchedCounter, setUpdateRecentlyWatchedCounter] = useState(0);

	return (
		<AppContext.Provider
			value={{
				updateRecentlyWatchedCounter,
				setUpdateRecentlyWatchedCounter,
			}}
		>
			{props.children}
		</AppContext.Provider>
	);
};

export { AppProvider, AppContext };
