import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { getFeatureFlagWithDefault, getSystemSetting } from "@/lib/setup";

export default async function HomePage() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});
	const [showLogo, brandName] = await Promise.all([
		getFeatureFlagWithDefault("show_logo", true),
		getSystemSetting("brand_name", "Orbit Auth"),
	]);

	return (
		<div className="min-h-[80vh] flex items-center justify-center">
			<main className="flex flex-col gap-6 items-center justify-center text-center px-4">
				{showLogo ? <Logo className="w-16 h-16" /> : null}
				<div className="flex flex-col gap-2">
					<h1 className="text-4xl font-bold">{brandName}</h1>
					<p className="text-muted-foreground max-w-md">
						Self-hosted Authentication-as-a-Service platform built with Next.js and Better Auth.
					</p>
				</div>
				<div className="flex gap-4">
					{session ? (
						<>
							<Link href="/dashboard">
								<Button size="lg">Go to Dashboard</Button>
							</Link>
							{session.user.role === "admin" && (
								<Link href="/admin">
									<Button size="lg" variant="outline">Admin Panel</Button>
								</Link>
							)}
						</>
					) : (
						<>
							<Link href="/sign-in">
								<Button size="lg">Sign In</Button>
							</Link>
							<Link href="/setup">
								<Button size="lg" variant="outline">Setup</Button>
							</Link>
						</>
					)}
				</div>
			</main>
		</div>
	);
}
