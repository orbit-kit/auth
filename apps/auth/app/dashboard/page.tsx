import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { SignOutButton } from "./_components/sign-out-button";

export default async function DashboardPage() {
	const requestHeaders = await headers();

	const session = await auth.api.getSession({
		headers: requestHeaders,
	});

	if (!session) {
		redirect("/sign-in");
	}

	return (
		<div className="min-h-[80vh] flex items-center justify-center p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<CardTitle>Welcome, {session.user.name}!</CardTitle>
					<CardDescription>
						You are logged in as {session.user.email}
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="p-4 bg-muted rounded-lg">
						<p className="text-sm text-muted-foreground mb-2">User ID</p>
						<p className="font-mono text-sm break-all">{session.user.id}</p>
					</div>
					<div className="p-4 bg-muted rounded-lg">
						<p className="text-sm text-muted-foreground mb-2">Role</p>
						<p className="font-mono text-sm">{session.user.role || "user"}</p>
					</div>
					{session.user.role === "admin" && (
						<Link href="/admin" className="block">
							<div className="w-full py-2 px-4 border rounded-md text-center hover:bg-muted transition-colors">
								Go to Admin Panel
							</div>
						</Link>
					)}
					<SignOutButton />
				</CardContent>
			</Card>
		</div>
	);
}
