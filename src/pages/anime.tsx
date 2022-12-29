import { Breadcrumbs } from "../components/breadcrumbs";
import { motion } from "framer-motion";
import { Outlet, useNavigate } from "react-router";
import { useContext, useEffect, useState } from "preact/hooks";
import gradient from "../util/gradient";
import { VNode } from "preact";
import cache from "../util/cache";
import { getPlanToWatch, setPlanToWatch } from "../util/store";
import { AppContext } from "../components/app";

const Chip = ({ text, filled }: { text: string | VNode; filled: boolean }) => {
	if (filled) {
		return (
			<div style="position: relative; background-color: #fff; border-radius: 8px; padding: 2px 6px 2px 6px; margin-right: 8px; color: #111; font-family: Lato; font-size: 12px; font-weight: 600">
				{text}
			</div>
		);
	} else {
		return (
			<div style="position: relative; border: solid #fff; border-radius: 10px; border-width: 1px; padding: 2px 6px 2px 6px; margin-right: 8px; color: #fff; font-family: Lato; font-size: 12px; font-weight: 400">
				{text}
			</div>
		);
	}
};

const VerticalDivider = () => {
	return <div style="width: 1px; height: 50%; margin-left: 8px; margin-right: 16px; background-color: #ffffff33" />;
};

export const Anime = () => {
	const navigate = useNavigate();
	const [planEntry, setPlanEntry] = useState<PlanToWatch | true | null>(null);
	const [updatePlanEntry, setUpdatePlanEntry] = useState(0);
	const ctx = useContext(AppContext);
	const el = cache.animeTransitionElement as HTMLImageElement | undefined;
	const bounds = el ? el.getBoundingClientRect() : undefined;

	const currentAnime = cache.currentAnime!;

	useEffect(() => {
		getPlanToWatch(currentAnime.slug)
			.then((v) => setPlanEntry((v as PlanToWatch) ?? true))
			.catch((e) => console.log(e));
	}, [updatePlanEntry, cache.currentAnime, ctx.updateRecentlyWatchedCounter]);

	const nextDate =
		currentAnime.next !== undefined && new Date(currentAnime.next).valueOf() > Date.now().valueOf()
			? new Date(currentAnime.next).toLocaleDateString()
			: undefined;
	return (
		<div style="position: absolute; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 4;">
			<motion.div
				style={{
					zIndex: 4,
					position: "fixed",
					left: 0,
					top: 0,
					width: "100%",
					height: "50%",
					backgroundImage: gradient(180),
				}}
				initial={{
					top: "-15%",
				}}
				animate={{
					top: 0,
					transition: { duration: 0.15 },
				}}
			/>
			<Breadcrumbs />
			<motion.img
				key="thumbnail"
				class="no-select"
				style={{
					position: "relative",
					objectFit: "cover",
				}}
				src={currentAnime.bannerImage ?? currentAnime.coverImage ?? ""}
				initial={
					bounds && el
						? {
								left: `${bounds.left}px`,
								top: `${bounds.top}px`,
								width: bounds.width,
								height: bounds.height,
								objectPosition: `${parseFloat(el.getAttribute("progress")! ?? "50")}% center`,
								borderRadius: "8px",
						  }
						: {}
				}
				animate={{
					top: 0,
					left: 0,
					width: "100%",
					height: "50%",
					objectPosition: `${Math.max(
						Math.min(parseFloat(el?.getAttribute("progress") ?? "50"), 100),
						0,
					)}% center`,
					borderRadius: "0px",
					transition: {
						duration: 0.15,
					},
				}}
			></motion.img>
			<div
				style={`position: fixed; z-index: 3; left: 0; bottom: 0; width: 100%; height: 8%; background-image: ${gradient(
					0,
					"0, 0%, 7%",
				)};`}
			/>
			<motion.div
				style={{
					display: "flex",
					position: "relative",
					width: "100vw",
					backgroundColor: "#111",
					minHeight: "calc(50% - 20px)",
					paddingTop: "20px",
				}}
				initial={{ top: "50%", left: 0 }}
				animate={{
					top: 0,
					left: 0,
					transition: {
						duration: 0.15,
					},
				}}
			>
				<div style="position: absolute; bottom: 100%; display: flex; align-items: end; margin-top: -18vmin; padding-x: 15px;">
					<div
						class="play-button"
						style="position: absolute; top: -4vmin; right: calc(30px + 4vmin); border-radius: 50%; width: 8vmin; height: 8vmin;"
						onClick={() => {
							navigate(`/${currentAnime.slug}/episodes`);
						}}
					>
						<p
							class="material-icons"
							style="margin-top: 25%; width: 100%; height: 100%; text-align: center; font-size: 4vmin; color: #fff"
						>
							play_arrow
						</p>
					</div>

					{planEntry !== undefined && (
						<div
							class={planEntry === true ? "plan-button" : "unplan-button"}
							style="z-index: 4; position: absolute; top: -2vmin; right: calc(30px + 14vmin); border-radius: 50%; width: 4vmin; height: 4vmin;"
							onClick={async () => {
								await setPlanToWatch(
									currentAnime.slug,
									planEntry === true
										? {
												date: new Date().toUTCString(),
										  }
										: undefined,
								);

								setUpdatePlanEntry((v) => v + 1);
								ctx.setUpdateRecentlyWatchedCounter((v) => v + 1);
							}}
						>
							<p
								class="material-icons"
								style="margin-top: 25%; width: 100%; height: 100%; text-align: center; font-size: 2vmin; color: #fff"
							>
								watch_later
							</p>
						</div>
					)}

					<img
						draggable={false}
						style="position: absolute; z-index: 2; margin-left: 30px; width: 15vmin; height: 20vmin; object-fit: cover; border-radius: 8px;"
						src={currentAnime.coverImage}
					/>
					<div
						class="no-select"
						style="margin: 0; padding-top: 15px; padding-left: calc(17vmin + 30px); padding-right: 30px; width: calc(100vw - 21vmin); background-color: #111; color: #ddd;"
					>
						<p style="margin: 0; color: #777; font-family: Lato; font-size: 1.5vmin; line-height: 1.5vmin; font-weight: 600; font-style: italic">
							{currentAnime.title.english}
						</p>
						<p style="margin: 0; font-family: Lato; font-size: 5vmin; line-height: 5vmin; font-weight: 600;">
							{currentAnime.title.romaji}
						</p>
						<div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: start; margin: 0; height: 4vmin; row-gap: 4px">
							{<Chip text={currentAnime.format.toUpperCase()} filled={false} />}
							{
								<Chip
									text={
										<>
											<span
												class="material-icons"
												style="position: absolute; top: 3px; font-size: 12px; color: #ffd700"
											>
												star
											</span>
											<span style="margin-left: 16px; font-size: 12px">
												{currentAnime.averageScore / 10}
											</span>
										</>
									}
									filled={false}
								/>
							}
							{<Chip text={currentAnime.status.toUpperCase()} filled={false} />}
							<VerticalDivider />
							{currentAnime.genre.map((v) => {
								return <Chip text={v} filled={false} />;
							})}
						</div>
					</div>
				</div>
				<div style="width: 70%;">
					<p
						class="no-select"
						style="margin: 20px 20px 0px 30px; color: #777; font-family: Lato; font-size: 1.75vmin; line-height: 1.75vmin;"
					>
						{`${currentAnime.season.toUpperCase()} ${currentAnime.year} · ${
							currentAnime.currentEpisode
						} EPISODES${nextDate !== undefined ? " · " : ""}`}
						<span style="color: #ddd">{nextDate !== undefined ? `NEXT ON ${nextDate}` : ""}</span>
					</p>
					<p
						class="no-select"
						style="margin: 20px 20px 0px 30px; color: #ddd; font-family: Lato; font-size: 2vmin; line-height: 2vmin;"
					>
						{currentAnime.description ?? ""}
					</p>
				</div>
				<div style="width: 30%; text-align: right;">
					<p
						class="no-select"
						style="margin: 20px 30px 0px 0px; color: #777; font-family: Lato; font-size: 1.75vmin; line-height: 1.75vmin; white-space: pre;"
					>
						<span style="font-weight: 600;">SYNONYMS</span>
						<br />
						{currentAnime.synonyms.join("\n")}
					</p>
				</div>
			</motion.div>
			<Outlet />
		</div>
	);
};
