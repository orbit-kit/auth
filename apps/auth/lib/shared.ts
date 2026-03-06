type SearchParamsLike = Pick<URLSearchParams, "get">;

const allowedCallbackSet: ReadonlySet<string> = new Set([
	"/dashboard",
	"/device",
]);

export const getCallbackURL = (
	queryParams: SearchParamsLike,
): string => {
	const callbackUrl = queryParams.get("callbackUrl");
	if (callbackUrl) {
		if (allowedCallbackSet.has(callbackUrl)) {
			return callbackUrl;
		}
		return "/dashboard";
	}
	return "/dashboard";
};
