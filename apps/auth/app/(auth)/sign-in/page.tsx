import { getFeatureFlagWithDefault } from "@/lib/setup";
import { SignInClientPage } from "./sign-in-client";
import { getSystemSetting } from "@/lib/setup";

function buildCallbackURL(searchParams: Record<string, string | string[] | undefined>): string {
	const clientId = typeof searchParams.client_id === "string" ? searchParams.client_id : undefined;
	const responseType = typeof searchParams.response_type === "string" ? searchParams.response_type : undefined;
	const redirectTo =
		(typeof searchParams.redirect_to === "string" ? searchParams.redirect_to : undefined) ||
		(typeof searchParams.callbackUrl === "string" ? searchParams.callbackUrl : undefined) ||
		(typeof searchParams.returnTo === "string" ? searchParams.returnTo : undefined);

	if (clientId && responseType) {
		const params = new URLSearchParams();
		for (const [key, value] of Object.entries(searchParams)) {
			if (value === undefined) continue;
			if (Array.isArray(value)) {
				for (const v of value) params.append(key, v);
			} else {
				params.set(key, value);
			}
		}
		return `/api/auth/oauth2/authorize?${params.toString()}`;
	}

	return redirectTo || "/dashboard";
}

export default async function SignInPage(props: {
	searchParams: Record<string, string | string[] | undefined>;
}) {
	const searchParams = props.searchParams;
	const callbackURL = buildCallbackURL(searchParams);
	const googleEnabledFlag = await getFeatureFlagWithDefault("oauth_google", false);
	const googleConfigured = !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;
	const googleEnabled = googleEnabledFlag && googleConfigured;
	const showLogo = await getFeatureFlagWithDefault("show_logo", true);
	const brandName = await getSystemSetting("brand_name", "Orbit Auth");

	return (
		<SignInClientPage
			callbackURL={callbackURL}
			googleEnabled={googleEnabled}
			showLogo={showLogo}
			brandName={brandName}
		/>
	);
}
