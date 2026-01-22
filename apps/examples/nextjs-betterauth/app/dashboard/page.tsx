"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSessionQuery } from "@/data/user/session-query";
import { useSignOutMutation } from "@/data/user/sign-out-mutation";

export default function DashboardPage() {
	const router = useRouter();
	const { data: session, isLoading } = useSessionQuery();
	const signOutMutation = useSignOutMutation();

	if (isLoading) {
		return (
			<div className="w-full flex items-center justify-center min-h-[50vh]">
				<p>Loading...</p>
			</div>
		);
	}

	if (!session) {
		router.push("/sign-in");
		return null;
	}

	return (
		<div className="w-full">
			<div className="flex gap-4 flex-col">
				<Card>
					<CardHeader>
						<CardTitle>Dashboard</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							<p>
								<strong>Email:</strong> {session.user.email}
							</p>
							<p>
								<strong>Name:</strong> {session.user.name || "N/A"}
							</p>
							<p>
								<strong>User ID:</strong> {session.user.id}
							</p>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Actions</CardTitle>
					</CardHeader>
					<CardContent>
						<Button
							type="button"
							variant="destructive"
							disabled={signOutMutation.isPending}
							onClick={() => {
								signOutMutation.mutate(undefined, {
									onSuccess: () => {
										router.push("/");
									},
								});
							}}
						>
							{signOutMutation.isPending ? "Signing out..." : "Sign Out"}
						</Button>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
