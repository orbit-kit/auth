"use client";

import { useState } from "react";
import { Link, createFileRoute, redirect } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { getCurrentUser, isAdminRole } from "@/lib/auth-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_protected/dashboard")({
	loader: async () => {
		const user = await getCurrentUser();

		if (!user) {
			throw redirect({ to: "/sign-in" });
		}

		return { user };
	},
	component: DashboardPage,
});

function SignOutButton() {
	const [loading, setLoading] = useState(false);

	const handleSignOut = async () => {
		setLoading(true);
		await authClient.signOut({
			fetchOptions: {
				onSuccess: () => {
					window.location.href = "/sign-in";
				},
			},
		});
		setLoading(false);
	};

	return (
		<Button
			variant="destructive"
			className="w-full"
			onClick={handleSignOut}
			disabled={loading}
		>
			{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign Out"}
		</Button>
	);
}

function DashboardPage() {
	const { user } = Route.useLoaderData();

	return (
		<div className="flex min-h-[80vh] items-center justify-center p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<CardTitle>Welcome, {user.name}!</CardTitle>
					<CardDescription>
						You are logged in as {user.email}
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="rounded-lg bg-muted p-4">
						<p className="mb-2 text-sm text-muted-foreground">User ID</p>
						<p className="break-all font-mono text-sm">{user.id}</p>
					</div>
					<div className="rounded-lg bg-muted p-4">
						<p className="mb-2 text-sm text-muted-foreground">Role</p>
						<p className="font-mono text-sm">{user.role || "user"}</p>
					</div>
					{isAdminRole(user.role) ? (
						<Button asChild className="w-full" variant="outline">
							<Link to="/admin">Go to Admin Panel</Link>
						</Button>
					) : null}
					<SignOutButton />
				</CardContent>
			</Card>
		</div>
	);
}
