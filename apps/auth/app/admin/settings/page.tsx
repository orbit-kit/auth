"use client";

import { useEffect, useState } from "react";
import { Toaster, toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Loader2, Settings } from "lucide-react";
import { getGlobalSettings, updateGlobalSettings } from "./actions";
import { Input } from "@/components/ui/input";

export default function AdminSettingsPage() {
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [hibpPasswordsEnabled, setHibpPasswordsEnabled] = useState(true);
	const [googleEnabled, setGoogleEnabled] = useState(false);
	const [showLogo, setShowLogo] = useState(true);
	const [brandName, setBrandName] = useState("Orbit Auth");

	useEffect(() => {
		let mounted = true;
		(async () => {
			setLoading(true);
			try {
				const result = await getGlobalSettings();
				if (!result.success || !result.data) throw new Error(result.error || "Failed to load settings");
				if (!mounted) return;
				setHibpPasswordsEnabled(result.data.hibpPasswordsEnabled);
				setGoogleEnabled(result.data.googleEnabled);
				setShowLogo(result.data.showLogo);
				setBrandName(result.data.brandName);
			} catch (error: unknown) {
				const message = error instanceof Error ? error.message : "Failed to load settings";
				toast.error(message);
			} finally {
				if (mounted) setLoading(false);
			}
		})();
		return () => {
			mounted = false;
		};
	}, []);

	const save = async () => {
		setSaving(true);
		try {
			const result = await updateGlobalSettings({
				hibpPasswordsEnabled,
				googleEnabled,
				showLogo,
				brandName,
			});
			if (!result.success) throw new Error(result.error || "Failed to save");
			toast.success("Settings updated");
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : "Failed to save";
			toast.error(message);
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="container mx-auto p-4 space-y-8">
			<Toaster richColors />
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<div>
						<CardTitle className="text-2xl flex items-center gap-2">
							<Settings className="h-5 w-5" />
							Settings
						</CardTitle>
						<CardDescription>
							Global feature flags for the auth server
						</CardDescription>
					</div>
					<Button onClick={save} disabled={saving || loading} variant="default">
						{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
					</Button>
				</CardHeader>
				<CardContent className="space-y-6">
					{loading ? (
						<div className="flex justify-center items-center h-32">
							<Loader2 className="h-8 w-8 animate-spin" />
						</div>
					) : (
						<>
							<div className="space-y-2">
								<Label htmlFor="brandName">Auth Name</Label>
								<Input
									id="brandName"
									value={brandName}
									onChange={(e) => setBrandName(e.target.value)}
									placeholder="Orbit Auth"
								/>
								<p className="text-sm text-muted-foreground">
									Displayed in the header and page titles.
								</p>
							</div>

							<div className="flex items-center justify-between rounded-lg border p-4">
								<div className="space-y-0.5">
									<Label htmlFor="showLogo" className="cursor-pointer">
										Show Logo
									</Label>
									<p className="text-sm text-muted-foreground">
										Show or hide the built-in logo across the UI.
									</p>
								</div>
								<Switch
									id="showLogo"
									checked={showLogo}
									onCheckedChange={setShowLogo}
								/>
							</div>

							<div className="flex items-center justify-between rounded-lg border p-4">
								<div className="space-y-0.5">
									<Label htmlFor="hibp" className="cursor-pointer">
										Compromised Password Protection
									</Label>
									<p className="text-sm text-muted-foreground">
										Block known-breached passwords using the Pwned Passwords range API.
									</p>
								</div>
								<Switch
									id="hibp"
									checked={hibpPasswordsEnabled}
									onCheckedChange={setHibpPasswordsEnabled}
								/>
							</div>

							<div className="flex items-center justify-between rounded-lg border p-4">
								<div className="space-y-0.5">
									<Label htmlFor="google" className="cursor-pointer">
										Google Sign-In
									</Label>
									<p className="text-sm text-muted-foreground">
										Enable Better Auth Google social provider endpoints.
									</p>
								</div>
								<Switch
									id="google"
									checked={googleEnabled}
									onCheckedChange={setGoogleEnabled}
								/>
							</div>
						</>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
