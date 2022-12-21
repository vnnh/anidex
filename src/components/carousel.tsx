import { RefObject } from "preact";
import { useContext, useEffect, useRef, useState } from "preact/hooks";
import "../styles/carousel.css";
import { useNavigate } from "react-router";
import { AppContext } from "./app";
import { motion } from "framer-motion";
import { AnimeCard } from "../api/anilist";
import gradient from "../util/gradient";

interface CarouselItemProps {
	cover: string;
	title: string;
	episodeNumber?: number;

	onclick: () => void;
}

const CarouselItem = (props: CarouselItemProps) => {
	const [isMoving, setMoving] = useState(false);
	const [x0, setX0] = useState(0);
	const ctx = useContext(AppContext);

	return (
		<div style="position: relative;">
			<motion.img
				class="carousel-item"
				src={props.cover}
				draggable={false}
				onMouseDown={(e: MouseEvent) => {
					if (e.button === 0) {
						setMoving(false);
						setX0(e.clientX);
					}
				}}
				onMouseMove={(e: MouseEvent) => {
					if (e.button === 0) {
						if (Math.abs(e.clientX - x0) > 5) {
							setMoving(true);
						}
					}
				}}
				onMouseUp={(e: MouseEvent) => {
					if (e.button === 0) {
						if (!isMoving) {
							ctx.setTransitionElement((e.currentTarget as HTMLDivElement | undefined) ?? undefined);
							props.onclick();
						}
					}
				}}
				whileHover={{
					filter: "brightness(0.75)",
					transition: { duration: 0.3 },
				}}
			/>
			<div
				style={`position: absolute; left: 0; bottom: 0; width: 100%; height: 20%; background-image: ${gradient(
					0,
					"0, 0%, 7%",
				)};`}
			/>
			<p
				class="title-text no-select"
				style="position: absolute; bottom: 1vmin; left: 1vmin; margin: 0; font-size: 2vmin; line-height: 2vmin; color: #ffffffcc;"
			>
				{props.title}
			</p>
			{props.episodeNumber && (
				<p
					class="title-text no-select"
					style="position: absolute; top: 0; right: 0; padding: 1vmin; border-radius: 0 8px 0 0; margin: 0; font-size: 1.5vmin; line-height: 1.5vmin; color: #fff; background-color: #111111dd; "
				>
					{props.episodeNumber}
				</p>
			)}
		</div>
	);
};

export const Carousel = (props: { anime: Array<AnimeCard>; leftOffset?: number }) => {
	const navigate = useNavigate();
	const containerRef: RefObject<HTMLDivElement> = useRef(null);
	const trackRef: RefObject<HTMLDivElement> = useRef(null);
	const ctx = useContext(AppContext);

	useEffect(() => {
		if (containerRef.current !== null) {
			const container = containerRef.current!;

			let x0: number | undefined = undefined;
			let progress = 0;
			const scrollCarousel = () => {
				trackRef.current!.style.transform = `translate(${progress}vmin, 0%)`;

				/*trackRef.current!.animate(
					{
						transform: `translate(${progress}vmin, 0%)`,
					},
					{ duration: 1200, fill: "forwards" },
				);*/

				trackRef.current!.setAttribute("progress", `${progress}`);

				Array.from(trackRef.current!.getElementsByClassName("carousel-item")).forEach((trackItem, i) => {
					const boundingRect = trackItem.getBoundingClientRect();
					const vmin = Math.min(window.innerHeight, window.innerWidth) * 0.01;
					const x =
						20 + (props.leftOffset ?? 0) * vmin + progress * vmin + (boundingRect.width * i + 4 * vmin * i);
					const isOnScreen = x >= -boundingRect.width && x < window.innerWidth;

					if (isOnScreen) {
						(trackItem as HTMLImageElement).style.objectPosition = `${
							50 - (x / window.innerWidth) * 50
						}% center`;
						/*(trackItem as HTMLImageElement).animate(
							{
								objectPosition: `${50 - (x / window.innerWidth) * 50}% center`,
							},
							{ duration: 1200, fill: "forwards" },
						);*/
						trackItem.setAttribute("progress", `${50 - (x / window.innerWidth) * 50}`);
					}
				});
			};

			const onDown = (e: MouseEvent | Touch) => (x0 = e.clientX);
			const onUp = () => (x0 = undefined);
			const onMove = (e: MouseEvent | Touch) => {
				if (x0 !== undefined) {
					const delta = x0 - e.clientX;
					x0 = e.clientX;
					const maxDelta = window.innerWidth / 2;

					if (trackRef.current !== null) {
						progress = Math.min(
							Math.max(progress + -(delta / maxDelta) * 100, -22 * props.anime.length),
							0,
						);
						scrollCarousel();
					}
				}
			};

			container.onmousedown = onDown;
			container.ontouchstart = (e) => onDown(e.touches[0]);
			container.onwheel = (e) => {
				const initialProgress = progress;
				progress = Math.min(Math.max(progress - e.deltaY / 8, -22 * props.anime.length), 0);
				if (initialProgress !== progress) {
					e.preventDefault();
					scrollCarousel();
				}
			};
			scrollCarousel();

			const mouseLeaveWindow = (e: MouseEvent) => {
				if (e.target === undefined) {
					onUp();
				}
			};

			const onTouchMove = (e: TouchEvent) => onMove(e.touches[0]);
			window.addEventListener("mousemove", onMove);
			window.addEventListener("touchmove", onTouchMove);
			window.addEventListener("mouseleave", mouseLeaveWindow);
			window.addEventListener("mouseup", onUp);
			window.addEventListener("touchend", onUp);

			return () => {
				window.removeEventListener("mousemove", onMove);
				window.removeEventListener("touchmove", onTouchMove);
				window.removeEventListener("mouseleave", mouseLeaveWindow);
				window.removeEventListener("mouseup", onUp);
				window.removeEventListener("touchend", onUp);
			};
		}
	}, [containerRef.current, trackRef.current, props.anime]);

	return (
		<div id="carousel-container" style="width: 100%; height: 100%" ref={containerRef}>
			<div class="carousel-track" style={props.leftOffset ? `left: ${props.leftOffset}vmin` : ``} ref={trackRef}>
				{props.anime.map((v) => {
					return (
						<CarouselItem
							cover={v.cover ?? v.image ?? ""}
							episodeNumber={v.episodeNumber}
							title={v.title?.romaji ?? "not found"}
							onclick={() => {
								ctx.setCurrentAnime(v);
								navigate(`/${v.id}`);
							}}
						/>
					);
				})}
			</div>
		</div>
	);
};
