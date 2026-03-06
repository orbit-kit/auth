import { Suspense, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Logo } from "@/components/logo";
import { SignInForm } from "@/components/forms/sign-in-form";
import { SignUpForm } from "@/components/forms/sign-up-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getRootLayoutData, getSignInRouteData } from "@/lib/auth-api";

type SignInSearch = Record<string, string | string[] | undefined>;

function buildCallbackURL(searchParams: SignInSearch): string {
	const clientId = typeof searchParams.client_id === "string" ? searchParams.client_id : undefined;
	const responseType = typeof searchParams.response_type === "string" ? searchParams.response_type : undefined;
	const redirectTo =
		(typeof searchParams.redirectTo === "string" ? searchParams.redirectTo : undefined) ||
		(typeof searchParams.redirect_to === "string" ? searchParams.redirect_to : undefined) ||
		(typeof searchParams.callbackUrl === "string" ? searchParams.callbackUrl : undefined) ||
		(typeof searchParams.returnTo === "string" ? searchParams.returnTo : undefined);

	if (clientId && responseType) {
		const params = new URLSearchParams();
		for (const [key, value] of Object.entries(searchParams)) {
			if (value === undefined) continue;
			if (Array.isArray(value)) {
				for (const item of value) {
					params.append(key, item);
				}
			} else {
				params.set(key, value);
			}
		}

		return `/api/auth/oauth2/authorize?${params.toString()}`;
	}

	if (redirectTo?.startsWith("/") && !redirectTo.startsWith("//")) {
		return redirectTo;
	}

	return "/dashboard";
}

export const Route = createFileRoute("/sign-in")({
	validateSearch: (search): SignInSearch => search as SignInSearch,
	loaderDeps: ({ search }) => search,
	loader: async ({ deps }) => {
		const [layoutData, routeData] = await Promise.all([
			getRootLayoutData(),
			getSignInRouteData(),
		]);

		return {
			callbackURL: buildCallbackURL(deps),
			...layoutData,
			...routeData,
		};
	},
	component: SignInPage,
});

function SignInLoading() {
	return (
		<div className="min-h-[80vh] px-4">
			<div className="mx-auto w-full max-w-md">
				<div className="mb-6 flex justify-center">
					<Skeleton className="h-12 w-12 rounded-full" />
				</div>
				<Card>
					<CardHeader className="text-center">
						<Skeleton className="mx-auto mb-2 h-6 w-32" />
						<Skeleton className="mx-auto h-4 w-48" />
					</CardHeader>
					<CardContent className="space-y-4">
						<Skeleton className="h-10 w-full" />
						<Skeleton className="h-10 w-full" />
						<Skeleton className="h-10 w-full" />
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

function SignInPage() {
	const { callbackURL, googleEnabled, showLogo, brandName } = Route.useLoaderData();
	const [activeTab, setActiveTab] = useState("sign-in");
	const [prefillEmail, setPrefillEmail] = useState("");

	return (
		<Suspense fallback={<SignInLoading />}>
			<div className="flex min-h-[80vh] items-center justify-center px-4">
				<div className="w-full max-w-md">
					<div className="mb-6 flex justify-center">
						{showLogo ? <Logo className="h-12 w-12" /> : null}
					</div>
					<Card>
						<CardHeader className="text-center">
							<CardTitle>Welcome to {brandName}</CardTitle>
							<CardDescription>
								Sign in to your account or create a new one
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Tabs value={activeTab} onValueChange={setActiveTab}>
								<TabsList className="mb-6 w-full">
									<TabsTrigger value="sign-in" className="flex-1">
										Sign In
									</TabsTrigger>
									<TabsTrigger value="sign-up" className="flex-1">
										Sign Up
									</TabsTrigger>
								</TabsList>
								<TabsContent value="sign-in">
									<SignInForm
										callbackURL={callbackURL}
										onSwitchToSignUp={(email) => {
											if (email) {
												setPrefillEmail(email);
											}
											setActiveTab("sign-up");
										}}
										showGoogle={googleEnabled}
									/>
								</TabsContent>
								<TabsContent value="sign-up">
									<SignUpForm
										callbackURL={callbackURL}
										defaultEmail={prefillEmail}
									/>
								</TabsContent>
							</Tabs>
						</CardContent>
					</Card>
				</div>
			</div>
		</Suspense>
	);
}
