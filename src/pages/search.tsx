import { motion } from "framer-motion";
import { useContext, useEffect, useRef, useState } from "preact/hooks";
import { JSXInternal } from "preact/src/jsx";
import { useNavigate } from "react-router";
import { AnimeSearch, searchAnime } from "../api/anilist";
import { AppContext } from "../components/app";

export const Search = ({ onClickOff }: { onClickOff: () => void }) => {
	const [searchResults, setSearchResults] = useState<AnimeSearch["results"]>([]);
	const inputRef = useRef<HTMLInputElement>(null);
	const navigate = useNavigate();
	const ctx = useContext(AppContext);

	useEffect(() => {
		if (inputRef.current === null) return;

		inputRef.current.focus();

		const enter = (e: KeyboardEvent) => {
			if (e.key === "Enter") {
				const value = inputRef.current?.value ?? "";
				if (value === "") return;

				searchAnime(value)
					.then((v) => {
						setSearchResults(v.results);
					})
					.catch((e) => console.log(e));
			}
		};

		window.addEventListener("keydown", enter);

		return () => {
			window.removeEventListener("keydown", enter);
		};
	}, [inputRef.current]);

	return (
		<motion.div
			style={{
				zIndex: 3,
				position: "absolute",
				top: 0,
				left: 0,
				width: "100vw",
				height: "100vh",
				backgroundColor: "#1d1d1d",
			}}
			initial={{ opacity: 0 }}
			animate={{ opacity: 1, transition: { duration: 0.15 } }}
			exit={{ opacity: 0, transition: { delay: 0.2, duration: 0.15 } }}
			onClick={onClickOff}
		>
			<motion.div
				class="searchbar"
				style={{
					position: "absolute",
					margin: "5px",
					display: "flex",
					alignItems: "center",
					justifyContent: "start",
				}}
				initial={{ left: "25%", top: "calc(35px + 20px)", width: "50%", height: "35px" }}
				animate={{ left: "12.5%", top: "10%", width: "75%", height: "6vmin", transition: { duration: 0.05 } }}
				exit={{
					left: "25%",
					top: "calc(35px + 20px)",
					width: "50%",
					height: "35px",
					transition: { duration: 0.1 },
				}}
				onClick={(e: JSXInternal.TargetedMouseEvent<HTMLDivElement>) => {
					e.stopImmediatePropagation();
				}}
			>
				<motion.div
					class="material-icons search-icon"
					style={{ marginLeft: "5px" }}
					initial={{ fontSize: "0px", height: "0px" }}
					animate={{ fontSize: "4vmin", height: "4vmin", transition: { duration: 0.05 } }}
				>
					search
				</motion.div>
				<input
					ref={inputRef}
					type="text"
					style="outline: none; background-color: transparent; border: none; width: calc(100% - 10px - 6vmin); height: 3.5vmin; font-family: Lato; margin-left: 1vmin; font-size: 3vmin; font-weight: 200; color: #ccc"
				></input>
			</motion.div>
			<div style="position: absolute; display: flex; flex-direction: column; gap: 1vmin; left: 12.5%; top: calc(10% + 8vmin); margin: 5px; width: 75%; height: calc(100% - 20% - 8vmin); overflow-x: hidden; overflow-y: auto">
				{searchResults.length > 0 &&
					searchResults.map((v) => {
						return (
							<div
								class="search-background-image"
								style={`position: relative; cursor: pointer; display: flex; align-items: center; border-radius: 8px; width: 100%; height: 10vmin; background-color: #333; border-radius: 8px`}
								onClick={(e) => {
									e.stopImmediatePropagation();
									ctx.setTransitionElement(e.currentTarget);
									ctx.setCurrentAnime(v);
									navigate(`/${v.id}`);
								}}
							>
								<img
									draggable={false}
									style="position: absolute; width: 100%; height: 100%; object-fit: cover; filter: brightness(0.35); border-radius: 8px"
									src={v.cover}
								/>
								<img
									draggable={false}
									style="z-index:2; margin-left: 1vmin; width: auto; height: 8vmin; object-fit: cover; border-radius: 8px;"
									src={v.image}
								/>
								<div style="z-index:2; margin-left: 1vmin; display: flex; flex-direction: column; gap: 0.5vmin">
									<span style="margin: 0; font-family: Lato; font-size: 3vmin; line-height: 3vmin; font-weight: 600;">
										{v.title.romaji}
									</span>
									<span style="margin: 0; color: #bbb; font-family: Lato; font-size: 1.25vmin; line-height: 1.25vmin; font-weight: 600; font-style: italic">
										{v.title.english}
									</span>
								</div>
							</div>
						);
					})}
			</div>
		</motion.div>
	);
};
