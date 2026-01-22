"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

const signInSchema = z.object({
	email: z.string().email("Please enter a valid email address."),
	password: z.string().min(1, "Password is required."),
	rememberMe: z.boolean(),
});

type SignInFormValues = z.infer<typeof signInSchema>;

interface SignInFormProps {
	onSuccess?: () => void;
	callbackURL?: string;
	onSwitchToSignUp?: (email?: string) => void;
	showGoogle?: boolean;
}

export function SignInForm({
	onSuccess,
	callbackURL = "/dashboard",
	onSwitchToSignUp,
	showGoogle = false,
}: SignInFormProps) {
	const [loading, setLoading] = useState(false);

	const form = useForm<SignInFormValues>({
		resolver: zodResolver(signInSchema),
		defaultValues: {
			email: "",
			password: "",
			rememberMe: false,
		},
	});

	const onSubmit = async (data: SignInFormValues) => {
		setLoading(true);

		try {
			// Use Better Auth's signIn method
			const result = await authClient.signIn.email({
				email: data.email,
				password: data.password,
				rememberMe: data.rememberMe,
			});

			// Check for explicit error
			if (result.error) {
				const errorMessage = result.error.message || "Sign in failed";
				// Provide helpful message for common errors
				if (errorMessage.toLowerCase().includes("user") && errorMessage.toLowerCase().includes("not found")) {
					toast.error("No account found with this email. Please sign up first.", {
						action: onSwitchToSignUp ? {
							label: "Sign Up",
							onClick: () => onSwitchToSignUp(data.email),
						} : undefined,
					});
					// Automatically switch to sign up tab after a short delay
					if (onSwitchToSignUp) {
						setTimeout(() => onSwitchToSignUp(data.email), 1500);
					}
				} else if (errorMessage.toLowerCase().includes("invalid") || errorMessage.toLowerCase().includes("credential")) {
					toast.error("Invalid email or password. Please try again.");
				} else {
					toast.error(errorMessage);
				}
				setLoading(false);
				return;
			}

			// Sign in succeeded - the session cookie is set by the server
			// Note: Our custom fetch converts 302 redirects to { success: true }
			// so result.data might not contain user/session info
			toast.success("Successfully signed in");
			onSuccess?.();

			// Manually redirect after successful sign in
			// Using window.location.href for full page navigation
			window.location.href = callbackURL;
		} catch (error) {
			// Handle network errors that weren't caught by Better Auth
			console.error("[SignIn] Error:", error);
			toast.error("Network error. Please check your connection and try again.");
			setLoading(false);
		}
	};

	const onGoogle = async () => {
		setLoading(true);
		try {
			const result = await authClient.signIn.social({
				provider: "google",
				callbackURL,
				disableRedirect: true,
			});

			if (result.error) {
				toast.error(result.error.message || "Google sign in failed");
				setLoading(false);
				return;
			}

			const url = (result.data as unknown as { url?: string }).url;
			if (url) {
				window.location.href = url;
				return;
			}

			toast.error("Google sign in failed");
			setLoading(false);
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : "Google sign in failed";
			toast.error(message);
			setLoading(false);
		}
	};

	return (
		<form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
			<FieldGroup>
				<Controller
					name="email"
					control={form.control}
					render={({ field, fieldState }) => (
						<Field data-invalid={fieldState.invalid}>
							<FieldLabel htmlFor="sign-in-email">Email</FieldLabel>
							<Input
								{...field}
								id="sign-in-email"
								type="email"
								placeholder="m@example.com"
								aria-invalid={fieldState.invalid}
								autoComplete="email"
								disabled={loading}
							/>
							{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
						</Field>
					)}
				/>
				<Controller
					name="password"
					control={form.control}
					render={({ field, fieldState }) => (
						<Field data-invalid={fieldState.invalid}>
							<FieldLabel htmlFor="sign-in-password">Password</FieldLabel>
							<Input
								{...field}
								id="sign-in-password"
								type="password"
								placeholder="password"
								aria-invalid={fieldState.invalid}
								autoComplete="current-password"
								disabled={loading}
							/>
							{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
						</Field>
					)}
				/>
				<Controller
					name="rememberMe"
					control={form.control}
					render={({ field }) => (
						<Field orientation="horizontal">
							<Checkbox
								id="sign-in-remember"
								checked={field.value}
								onCheckedChange={field.onChange}
								disabled={loading}
							/>
							<FieldLabel htmlFor="sign-in-remember" className="font-normal">
								Remember me
							</FieldLabel>
						</Field>
					)}
				/>
			</FieldGroup>
			<Button type="submit" className="w-full" disabled={loading}>
				{loading ? <Loader2 size={16} className="animate-spin" /> : "Sign In"}
			</Button>
			{showGoogle ? (
				<Button type="button" variant="outline" className="w-full" disabled={loading} onClick={onGoogle}>
					Continue with Google
				</Button>
			) : null}
		</form>
	);
}
