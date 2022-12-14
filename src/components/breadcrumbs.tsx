import "../styles/breadcrumbs.css";
import { useMatches, useNavigate } from "react-router";

export const Breadcrumbs = () => {
	const navigate = useNavigate();
	const matches = useMatches();
	const crumbs = matches
		.filter((match) => !!(match.handle as BreadcrumbHandle)?.crumb)
		.map((match) => {
			return { element: (match.handle as BreadcrumbHandle).crumb(match as BreadcrumbMatch), match };
		});

	return (
		<ul style="z-index: 5; position: fixed; top: 5px; left: 20px; padding: 10px;">
			{crumbs.map((crumb, index) => {
				return (
					<li key={index} onClick={() => navigate(crumb.match.pathname)} class="breadcrumb">
						{crumb.element}
					</li>
				);
			})}
		</ul>
	);
};
