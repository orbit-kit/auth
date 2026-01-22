"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

export default function SetupPage() {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [isChecking, setIsChecking] = useState(true);
	const [adminPath, setAdminPath] = useState("/admin");
	const [adminEmail, setAdminEmail] = useState("");
	const [adminPassword, setAdminPassword] = useState("");
	const [adminName, setAdminName] = useState("");

	useEffect(() => {
		const checkSetup = async () => {
			try {
				const res = await fetch("/api/setup");
				const data = await res.json();
				if (data.isCompleted) {
					router.push("/sign-in");
				}
			} catch (error) {
				console.error("Failed to check setup status:", error);
			} finally {
				setIsChecking(false);
			}
		};
		checkSetup();
	}, [router]);

	if (isChecking) {
		return (
			<div className="min-h-[80vh] flex items-center justify-center">
				<Card className="w-full max-w-lg">
					<CardContent className="flex justify-center items-center py-12">
						<div className="animate-pulse">Checking setup status...</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		if (adminPassword.length < 8) {
			toast.error("Password must be at least 8 characters");
			setLoading(false);
			return;
		}

		if (!adminPath) {
			toast.error("Admin path is required");
			setLoading(false);
			return;
		}

		try {
			const response = await fetch("/api/setup", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					adminUrl: adminPath,
					adminEmail,
					adminPassword,
					adminName,
					features: {},
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				toast.error(data.error || "Setup failed");
				setLoading(false);
				return;
			}

			toast.success("Setup completed successfully!");

			const signInResult = await authClient.signIn.email({
				email: adminEmail,
				password: adminPassword,
			});

			if (signInResult.error) {
				router.push("/sign-in");
			} else {
				router.push("/dashboard");
			}
			router.refresh();
		} catch {
			toast.error("An error occurred during setup");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-[80vh] flex items-center justify-center">
			<Card className="w-full max-w-lg">
				<CardHeader>
					<CardTitle className="text-2xl">Setup Orbit Auth</CardTitle>
					<CardDescription>
						Create your admin account to get started.
					</CardDescription>
				</CardHeader>
				<form onSubmit={handleSubmit}>
					<CardContent className="space-y-6">
						<div className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="adminPath">Admin Panel Path</Label>
								<Input
									id="adminPath"
									type="text"
									placeholder="/admin"
									value={adminPath}
									onChange={(e) => setAdminPath(e.target.value)}
									required
								/>
								<p className="text-xs text-muted-foreground">
									The path where your admin panel will be accessible.
								</p>
							</div>
							<div className="space-y-2">
								<Label htmlFor="adminName">Admin Name</Label>
								<Input
									id="adminName"
									type="text"
									placeholder="Admin"
									value={adminName}
									onChange={(e) => setAdminName(e.target.value)}
									required
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="adminEmail">Admin Email</Label>
								<Input
									id="adminEmail"
									type="email"
									placeholder="admin@example.com"
									value={adminEmail}
									onChange={(e) => setAdminEmail(e.target.value)}
									required
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="adminPassword">Admin Password</Label>
								<Input
									id="adminPassword"
									type="password"
									placeholder="Enter your password"
									value={adminPassword}
									onChange={(e) => setAdminPassword(e.target.value)}
									required
									minLength={8}
								/>
								<p className="text-xs text-muted-foreground">
									Must be at least 8 characters.
								</p>
							</div>
						</div>
					</CardContent>
					<CardFooter>
						<Button type="submit" className="w-full" disabled={loading}>
							{loading ? "Setting up..." : "Complete Setup"}
						</Button>
					</CardFooter>
				</form>
			</Card>
		</div>
	);
}
