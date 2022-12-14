interface BreadcrumbHandle {
	crumb: (data: BreadcrumbMatch) => import("preact").JSX.Element;
	key?: keyof BreadcrumbMatch["params"];
	transform?: (name: string) => string;
}

type BreadcrumbMatch = {
	id: string;
	pathname: string;
	params: {
		name?: string;
		episode?: string;
	};
	data: unknown;
	handle: BreadcrumbHandle;
};
