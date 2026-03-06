import { Link, createFileRoute } from "@tanstack/react-router";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { getCurrentUser, getRootLayoutData, getSetupState, isAdminRole } from "@/lib/auth-api";

export const Route = createFileRoute("/")({
	loader: async () => {
		const [user, layoutData, setupState] = await Promise.all([
			getCurrentUser(),
			getRootLayoutData(),
			getSetupState(),
		]);

		return {
			user,
			setupCompleted: setupState.isCompleted,
			...layoutData,
		};
	},
	component: HomePage,
});

function HomePage() {
	const { user, showLogo, brandName, setupCompleted } = Route.useLoaderData();

	return (
		<div className="flex min-h-[80vh] items-center justify-center">
			<main className="flex flex-col items-center justify-center gap-6 px-4 text-center">
				{showLogo ? <Logo className="h-16 w-16" /> : null}
				<div className="flex flex-col gap-2">
					<h1 className="text-4xl font-bold">{brandName}</h1>
					<p className="max-w-md text-muted-foreground">
						Self-hosted Authentication-as-a-Service platform built with TanStack Start and Better Auth.
					</p>
				</div>
				<div className="flex gap-4">
					{user ? (
						<>
							<Button asChild size="lg">
								<Link to="/dashboard">Go to Dashboard</Link>
							</Button>
							{isAdminRole(user.role) ? (
								<Button asChild size="lg" variant="outline">
									<Link to="/admin">Admin Panel</Link>
								</Button>
							) : null}
						</>
					) : (
						<>
							<Button asChild size="lg">
								<Link to="/sign-in">Sign In</Link>
							</Button>
							{!setupCompleted ? (
								<Button asChild size="lg" variant="outline">
									<Link to="/setup">Setup</Link>
								</Button>
							) : null}
						</>
					)}
				</div>
			</main>
		</div>
	);
}
