"use client";

import { Suspense, useCallback, useState } from "react";
import { SignInForm } from "@/components/forms/sign-in-form";
import { SignUpForm } from "@/components/forms/sign-up-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Logo } from "@/components/logo";

function SignInLoading() {
	return (
		<div className="min-h-[80vh] flex items-center justify-center px-4">
			<div className="w-full max-w-md">
				<div className="flex justify-center mb-6">
					<Skeleton className="w-12 h-12 rounded-full" />
				</div>
				<Card>
					<CardHeader className="text-center">
						<Skeleton className="h-6 w-32 mx-auto mb-2" />
						<Skeleton className="h-4 w-48 mx-auto" />
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

export function SignInClientPage(props: {
	callbackURL: string;
	googleEnabled: boolean;
	showLogo: boolean;
	brandName: string;
}) {
	const [activeTab, setActiveTab] = useState("sign-in");
	const [prefillEmail, setPrefillEmail] = useState("");

	const handleSwitchToSignUp = useCallback((email?: string) => {
		if (email) setPrefillEmail(email);
		setActiveTab("sign-up");
	}, []);

	return (
		<Suspense fallback={<SignInLoading />}>
			<div className="min-h-[80vh] flex items-center justify-center px-4">
				<div className="w-full max-w-md">
					<div className="flex justify-center mb-6">
						{props.showLogo ? <Logo className="w-12 h-12" /> : null}
					</div>
					<Card>
						<CardHeader className="text-center">
							<CardTitle>Welcome to {props.brandName}</CardTitle>
							<CardDescription>
								Sign in to your account or create a new one
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Tabs value={activeTab} onValueChange={setActiveTab}>
								<TabsList className="w-full mb-6">
									<TabsTrigger value="sign-in" className="flex-1">
										Sign In
									</TabsTrigger>
									<TabsTrigger value="sign-up" className="flex-1">
										Sign Up
									</TabsTrigger>
								</TabsList>
								<TabsContent value="sign-in">
									<SignInForm
										callbackURL={props.callbackURL}
										onSwitchToSignUp={handleSwitchToSignUp}
										showGoogle={props.googleEnabled}
									/>
								</TabsContent>
								<TabsContent value="sign-up">
									<SignUpForm
										callbackURL={props.callbackURL}
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
