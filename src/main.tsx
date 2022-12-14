import { render } from "preact";
import { RouterProvider, createMemoryRouter, createRoutesFromElements, Route } from "react-router";
import { Titlebar } from "./components/titlebar";
import { Home } from "./pages/home";
import { Anime } from "./pages/anime";
import { AppProvider } from "./components/app";
import { Episodes } from "./pages/episodes";
import { window } from "@tauri-apps/api";
import { onWindowClose } from "./util/lifecycle";

const crumb = (match: BreadcrumbMatch) => {
	const text = (match.handle.key !== undefined ? match.params[match.handle.key] : match.id)!.toUpperCase();
	return <a class="crumb">{match.handle.transform !== undefined ? match.handle.transform(text) : text}</a>;
};

const App = () => {
	const router = createMemoryRouter(
		createRoutesFromElements(
			<Route path="/" id="home" element={<Home />} handle={{ crumb } as BreadcrumbHandle}>
				<Route path=":name" element={<Anime />} handle={{ crumb, key: "name" } as BreadcrumbHandle}>
					<Route
						path="episodes"
						id="episodes"
						element={<Episodes />}
						handle={{ crumb } as BreadcrumbHandle}
					></Route>
				</Route>
			</Route>,
		),
	);

	return (
		<>
			<Titlebar />
			<AppProvider>
				<RouterProvider router={router} />
			</AppProvider>
		</>
	);
};

render(<App />, document.getElementById("app") as HTMLElement);

window.getCurrent().onCloseRequested(async () => {
	await onWindowClose();
});
