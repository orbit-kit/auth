"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";

export default function SignInPage() {
	const router = useRouter();

	return (
		<div className="w-full">
			<div className="flex items-center flex-col justify-center w-full md:py-10">
				<div className="w-full max-w-md">
					<Card className="w-full">
						<CardHeader>
							<CardTitle className="text-lg md:text-xl">Sign In</CardTitle>
							<CardDescription className="text-xs md:text-sm">
								Click below to sign in with your OAuth provider
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid gap-4">
								<Button
									className="w-full"
									onClick={async () => {
										try {
											await authClient.signIn.oauth2({
												providerId: "central-oauth",
												callbackURL: "/dashboard",
											});
										} catch (error) {
											toast.error("Failed to sign in");
											console.error(error);
										}
									}}
								>
									Sign in with OAuth
								</Button>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
