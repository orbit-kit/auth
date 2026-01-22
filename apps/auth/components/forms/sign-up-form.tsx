"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

const signUpSchema = z
	.object({
		name: z.string().min(1, "Name is required."),
		email: z.string().email("Please enter a valid email address."),
		password: z.string().min(8, "Password must be at least 8 characters."),
		passwordConfirmation: z.string().min(1, "Please confirm your password."),
	})
	.refine((data) => data.password === data.passwordConfirmation, {
		message: "Passwords do not match.",
		path: ["passwordConfirmation"],
	});

type SignUpFormValues = z.infer<typeof signUpSchema>;

interface SignUpFormProps {
	onSuccess?: () => void;
	callbackURL?: string;
	defaultEmail?: string;
}

export function SignUpForm({
	onSuccess,
	callbackURL = "/dashboard",
	defaultEmail = "",
}: SignUpFormProps) {
	const [loading, setLoading] = useState(false);

	const form = useForm<SignUpFormValues>({
		resolver: zodResolver(signUpSchema),
		defaultValues: {
			name: "",
			email: defaultEmail,
			password: "",
			passwordConfirmation: "",
		},
	});

	// Update email when defaultEmail changes (e.g., from sign-in redirect)
	const currentEmail = form.watch("email");
	if (defaultEmail && defaultEmail !== currentEmail && currentEmail === "") {
		form.setValue("email", defaultEmail);
	}

	const onSubmit = async (data: SignUpFormValues) => {
		setLoading(true);

		try {
			// Use Better Auth's signUp method
			const result = await authClient.signUp.email({
				email: data.email,
				password: data.password,
				name: data.name,
				callbackURL,
			});

			// Check for explicit error
			if (result.error) {
				const errorMessage = result.error.message || "Sign up failed";
				// Provide helpful message for common errors
				if (errorMessage.toLowerCase().includes("already") || errorMessage.toLowerCase().includes("exists")) {
					toast.error("An account with this email already exists. Please sign in instead.");
				} else if (errorMessage.toLowerCase().includes("password")) {
					toast.error(errorMessage);
				} else {
					toast.error(errorMessage);
				}
				setLoading(false);
				return;
			}

			// Sign up succeeded - the session cookie is set by the server
			toast.success("Account created successfully!");
			onSuccess?.();

			// Manually redirect after successful sign up
			// Using window.location.href for full page navigation
			window.location.href = callbackURL;
		} catch (error) {
			// Handle network errors that weren't caught by Better Auth
			console.error("[SignUp] Error:", error);
			toast.error("Network error. Please check your connection and try again.");
			setLoading(false);
		}
	};

	return (
		<form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
			<FieldGroup>
				<Controller
					name="name"
					control={form.control}
					render={({ field, fieldState }) => (
						<Field data-invalid={fieldState.invalid}>
							<FieldLabel htmlFor="sign-up-name">Name</FieldLabel>
							<Input
								{...field}
								id="sign-up-name"
								placeholder="John Doe"
								aria-invalid={fieldState.invalid}
								autoComplete="name"
								disabled={loading}
							/>
							{fieldState.invalid && (
								<FieldError errors={[fieldState.error]} />
							)}
						</Field>
					)}
				/>
				<Controller
					name="email"
					control={form.control}
					render={({ field, fieldState }) => (
						<Field data-invalid={fieldState.invalid}>
							<FieldLabel htmlFor="sign-up-email">Email</FieldLabel>
							<Input
								{...field}
								id="sign-up-email"
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
							<FieldLabel htmlFor="sign-up-password">Password</FieldLabel>
							<Input
								{...field}
								id="sign-up-password"
								type="password"
								placeholder="Password"
								aria-invalid={fieldState.invalid}
								autoComplete="new-password"
								disabled={loading}
							/>
							{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
						</Field>
					)}
				/>
				<Controller
					name="passwordConfirmation"
					control={form.control}
					render={({ field, fieldState }) => (
						<Field data-invalid={fieldState.invalid}>
							<FieldLabel htmlFor="sign-up-password-confirmation">
								Confirm Password
							</FieldLabel>
							<Input
								{...field}
								id="sign-up-password-confirmation"
								type="password"
								placeholder="Confirm Password"
								aria-invalid={fieldState.invalid}
								autoComplete="new-password"
								disabled={loading}
							/>
							{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
						</Field>
					)}
				/>
			</FieldGroup>
			<Button type="submit" className="w-full" disabled={loading}>
				{loading ? (
					<Loader2 size={16} className="animate-spin" />
				) : (
					"Create Account"
				)}
			</Button>
		</form>
	);
}
