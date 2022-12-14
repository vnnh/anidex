import { window } from "@tauri-apps/api";
import "../styles/titlebar.css";
import { onWindowClose } from "../util/lifecycle";

export const Titlebar = () => {
	return (
		<div data-tauri-drag-region class="titlebar" id="titlebar">
			<div
				class="titlebar-button"
				id="titlebar-minimize"
				onClick={() => {
					window.getCurrent().minimize();
				}}
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" alt="minimize">
					<path fill="currentColor" d="M19 13H5v-2h14v2Z" />
				</svg>
			</div>

			<div
				class="titlebar-button"
				id="titlebar-maximize"
				onClick={() => {
					window.getCurrent().toggleMaximize();
				}}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="0.9em"
					height="0.9em"
					preserveAspectRatio="xMidYMid meet"
					viewBox="0 0 24 24"
					alt="maximize"
				>
					<path
						fill="currentColor"
						d="M19 3H5c-1.11 0-2 .89-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2m0 2v14H5V5h14Z"
					/>
				</svg>
			</div>

			<div
				class="titlebar-button"
				id="titlebar-close"
				onClick={async () => {
					await onWindowClose();
					window.getCurrent().close();
				}}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="1em"
					height="1em"
					preserveAspectRatio="xMidYMid meet"
					viewBox="0 0 24 24"
					alt="close"
				>
					<path
						fill="currentColor"
						d="M6.4 19L5 17.6l5.6-5.6L5 6.4L6.4 5l5.6 5.6L17.6 5L19 6.4L13.4 12l5.6 5.6l-1.4 1.4l-5.6-5.6Z"
					/>
				</svg>
			</div>
		</div>
	);
};
