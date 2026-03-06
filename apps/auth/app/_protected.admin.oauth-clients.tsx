import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Eye, EyeOff, Globe, Key, Loader2, Plus, RefreshCw, Shield, Trash } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const DEFAULT_OAUTH_SCOPES = ["openid", "profile", "email", "offline_access"] as const;

type OAuthClientCreateInput = {
	name: string;
	redirectUris: string[];
	isConfidential: boolean;
};

type OAuthClientResult = {
	success: boolean;
	data?: {
		clientId: string;
		clientSecret?: string;
		name: string;
		redirectUris: string[];
		isPublic: boolean;
	};
	error?: string;
};

type OAuthClientListItem = {
	clientId: string;
	name: string;
	public: boolean;
	redirectUris: string[];
	createdAt: Date;
};

function toErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}
	if (typeof error === "string") {
		return error;
	}
	return "Unknown error";
}

const createOAuthClient = createServerFn({ method: "POST" })
	.inputValidator((data: OAuthClientCreateInput) => data)
	.handler(async ({ data }): Promise<OAuthClientResult> => {
		try {
			const [
				crypto,
				{ getRequestHeaders },
				{ auth },
				{ db },
				{ oauthClient },
			] = await Promise.all([
				import("node:crypto"),
				import("@tanstack/react-start/server"),
				import("@/lib/auth"),
				import("@/lib/db"),
				import("@/lib/db/schema"),
			]);
			const generateId = () => crypto.randomBytes(16).toString("hex");
			const generateClientId = () => crypto.randomBytes(32).toString("hex");
			const generateClientSecret = () => crypto.randomBytes(64).toString("hex");
			const hashSecret = async (value: string) => {
				const hash = crypto.createHash("sha256").update(value).digest();
				return hash.toString("base64url");
			};
			const session = await auth.api.getSession({
				headers: getRequestHeaders(),
			});

			if (!session?.user) {
				return {
					success: false,
					error: "Not authenticated",
				};
			}

			const clientId = generateClientId();
			const rawClientSecret = data.isConfidential ? generateClientSecret() : null;
			const hashedClientSecret = rawClientSecret ? await hashSecret(rawClientSecret) : null;

			await db.insert(oauthClient).values({
				id: generateId(),
				clientId,
				clientSecret: hashedClientSecret,
				name: data.name,
				redirectUris: data.redirectUris,
				scopes: [...DEFAULT_OAUTH_SCOPES],
				tokenEndpointAuthMethod: data.isConfidential ? "client_secret_basic" : "none",
				grantTypes: ["authorization_code", "refresh_token"],
				responseTypes: ["code"],
				type: data.isConfidential ? "web" : "native",
				public: !data.isConfidential,
				userId: session.user.id,
				skipConsent: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			return {
				success: true,
				data: {
					clientId,
					clientSecret: rawClientSecret || undefined,
					name: data.name,
					redirectUris: data.redirectUris,
					isPublic: !data.isConfidential,
				},
			};
		} catch (error: unknown) {
			console.error("Failed to create OAuth client:", error);
			return {
				success: false,
				error: toErrorMessage(error) || "Failed to create OAuth client",
			};
		}
	});

const listOAuthClients = createServerFn({ method: "GET" }).handler(async (): Promise<{
	success: boolean;
	data?: OAuthClientListItem[];
	error?: string;
}> => {
	try {
		const [{ getRequestHeaders }, { auth }, { db }, { oauthClient }, { eq }] = await Promise.all([
			import("@tanstack/react-start/server"),
			import("@/lib/auth"),
			import("@/lib/db"),
			import("@/lib/db/schema"),
			import("drizzle-orm"),
		]);
		const session = await auth.api.getSession({
			headers: getRequestHeaders(),
		});

		if (!session?.user) {
			return {
				success: false,
				error: "Not authenticated",
			};
		}

		const clients = await db.query.oauthClient.findMany({
			where: eq(oauthClient.userId, session.user.id),
		});

		return {
			success: true,
			data: clients.map((client) => ({
				clientId: client.clientId,
				name: client.name ?? "Unnamed",
				public: client.public ?? false,
				redirectUris: client.redirectUris,
				createdAt: client.createdAt,
			})),
		};
	} catch (error: unknown) {
		console.error("Failed to list OAuth clients:", error);
		return {
			success: false,
			data: [],
			error: toErrorMessage(error) || "Failed to list OAuth clients",
		};
	}
});

const deleteOAuthClient = createServerFn({ method: "POST" })
	.inputValidator((clientId: string) => clientId)
	.handler(async ({ data: clientId }): Promise<OAuthClientResult> => {
		try {
			const [
				{ getRequestHeaders },
				{ auth },
				{ db },
				{ oauthClient },
				{ and, eq },
			] = await Promise.all([
				import("@tanstack/react-start/server"),
				import("@/lib/auth"),
				import("@/lib/db"),
				import("@/lib/db/schema"),
				import("drizzle-orm"),
			]);
			const session = await auth.api.getSession({
				headers: getRequestHeaders(),
			});

			if (!session?.user) {
				return {
					success: false,
					error: "Not authenticated",
				};
			}

			const deleted = await db
				.delete(oauthClient)
				.where(and(eq(oauthClient.clientId, clientId), eq(oauthClient.userId, session.user.id)))
				.returning({ clientId: oauthClient.clientId });

			if (!deleted.length) {
				return {
					success: false,
					error: "Not authorized",
				};
			}

			return { success: true };
		} catch (error: unknown) {
			console.error("Failed to delete OAuth client:", error);
			return {
				success: false,
				error: toErrorMessage(error) || "Failed to delete OAuth client",
			};
		}
	});

export const Route = createFileRoute("/_protected/admin/oauth-clients")({
	component: OAuthClientsPage,
});

function OAuthClientsPage() {
	const queryClient = useQueryClient();
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [isCredentialsDialogOpen, setIsCredentialsDialogOpen] = useState(false);
	const [showSecret, setShowSecret] = useState(false);
	const [createdClient, setCreatedClient] = useState<{
		clientId: string;
		clientSecret?: string;
		name: string;
	} | null>(null);
	const [newClient, setNewClient] = useState<OAuthClientCreateInput>({
		name: "",
		redirectUris: [""],
		isConfidential: true,
	});

	const { data: clientsData = [], isLoading: isClientsLoading, refetch } = useQuery<OAuthClientListItem[]>({
		queryKey: ["oauth-clients"],
		queryFn: async () => {
			const result = await listOAuthClients();
			if (!result.success) {
				throw new Error(result.error);
			}
			return result.data || [];
		},
	});

	const createMutation = useMutation({
		mutationFn: async (input: OAuthClientCreateInput) => createOAuthClient({ data: input }),
		onSuccess: (result) => {
			if (result.success && result.data?.clientId) {
				toast.success("OAuth client created successfully");
				setCreatedClient({
					clientId: result.data.clientId,
					clientSecret: result.data.clientSecret,
					name: result.data.name,
				});
				setIsCreateDialogOpen(false);
				setIsCredentialsDialogOpen(true);
				setNewClient({ name: "", redirectUris: [""], isConfidential: true });
				queryClient.invalidateQueries({ queryKey: ["oauth-clients"] });
			} else {
				toast.error(result.error || "Failed to create client");
			}
		},
		onError: (error: Error) => {
			toast.error(error.message || "Failed to create OAuth client");
		},
	});

	const deleteMutation = useMutation({
		mutationFn: async (clientId: string) => deleteOAuthClient({ data: clientId }),
		onSuccess: (result) => {
			if (result.success) {
				toast.success("OAuth client deleted successfully");
				queryClient.invalidateQueries({ queryKey: ["oauth-clients"] });
			} else {
				toast.error(result.error || "Failed to delete client");
			}
		},
		onError: (error: Error) => {
			toast.error(error.message || "Failed to delete OAuth client");
		},
	});

	const handleCreateClient = async (event: React.FormEvent) => {
		event.preventDefault();
		const redirectUris = newClient.redirectUris.filter((uri) => uri.trim() !== "");
		if (!redirectUris.length) {
			toast.error("At least one redirect URI is required");
			return;
		}
		createMutation.mutate({
			...newClient,
			redirectUris,
		});
	};

	const copyToClipboard = (text: string, label: string) => {
		navigator.clipboard.writeText(text);
		toast.success(`${label} copied to clipboard`);
	};

	const baseUrl =
		typeof window !== "undefined"
			? window.location.origin
			: process.env.BETTER_AUTH_URL || "http://localhost:5000";

	return (
		<div className="container mx-auto space-y-8 p-4">
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<div>
						<CardTitle className="text-2xl">OAuth Clients</CardTitle>
						<CardDescription>
							Manage OAuth client applications that can authenticate with your server
						</CardDescription>
					</div>
					<div className="flex gap-2">
						<Button variant="outline" size="icon" onClick={() => refetch()}>
							<RefreshCw className={`h-4 w-4 ${isClientsLoading ? "animate-spin" : ""}`} />
						</Button>
						<Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
							<DialogTrigger asChild>
								<Button>
									<Plus className="mr-2 h-4 w-4" /> Create Client
								</Button>
							</DialogTrigger>
							<DialogContent className="max-w-lg">
								<DialogHeader>
									<DialogTitle>Create OAuth Client</DialogTitle>
									<DialogDescription>
										Create a new OAuth client application. Confidential clients will receive a client secret.
									</DialogDescription>
								</DialogHeader>
								<form onSubmit={handleCreateClient} className="space-y-4">
									<div>
										<Label htmlFor="name">Client Name</Label>
										<Input
											id="name"
											placeholder="My Application"
											value={newClient.name}
											onChange={(event) =>
												setNewClient({ ...newClient, name: event.target.value })
											}
											required
										/>
									</div>

									<div className="space-y-2">
										<Label>Redirect URIs</Label>
										{newClient.redirectUris.map((uri, index) => (
											<div key={index} className="flex gap-2">
												<Input
													placeholder="http://localhost:3000/api/auth/oauth2/callback/central-oauth"
													value={uri}
													onChange={(event) => {
														const redirectUris = [...newClient.redirectUris];
														redirectUris[index] = event.target.value;
														setNewClient({ ...newClient, redirectUris });
													}}
													required
												/>
												{newClient.redirectUris.length > 1 ? (
													<Button
														type="button"
														variant="outline"
														size="icon"
														onClick={() => {
															setNewClient({
																...newClient,
																redirectUris: newClient.redirectUris.filter((_, current) => current !== index),
															});
														}}
													>
														<Trash className="h-4 w-4" />
													</Button>
												) : null}
											</div>
										))}
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={() =>
												setNewClient({
													...newClient,
													redirectUris: [...newClient.redirectUris, ""],
												})
											}
										>
											<Plus className="mr-2 h-4 w-4" /> Add URI
										</Button>
									</div>

									<div className="flex items-center justify-between rounded-lg border p-4">
										<div className="space-y-0.5">
											<Label htmlFor="confidential" className="cursor-pointer">
												Confidential Client
											</Label>
											<p className="text-sm text-muted-foreground">
												Confidential clients can securely store secrets. Public clients cannot.
											</p>
										</div>
										<Switch
											id="confidential"
											checked={newClient.isConfidential}
											onCheckedChange={(checked) =>
												setNewClient({ ...newClient, isConfidential: checked })
											}
										/>
									</div>

									<DialogFooter>
										<Button type="submit" disabled={createMutation.isPending}>
											{createMutation.isPending ? (
												<>
													<Loader2 className="mr-2 h-4 w-4 animate-spin" />
													Creating...
												</>
											) : (
												<>
													<Key className="mr-2 h-4 w-4" />
													Create Client
												</>
											)}
										</Button>
									</DialogFooter>
								</form>
							</DialogContent>
						</Dialog>
					</div>
				</CardHeader>
				<CardContent>
					{isClientsLoading ? (
						<div className="flex h-64 items-center justify-center">
							<Loader2 className="h-8 w-8 animate-spin" />
						</div>
					) : clientsData.length > 0 ? (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Name</TableHead>
									<TableHead>Client ID</TableHead>
									<TableHead>Type</TableHead>
									<TableHead>Redirect URIs</TableHead>
									<TableHead>Created</TableHead>
									<TableHead>Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{clientsData.map((client) => (
									<TableRow key={client.clientId}>
										<TableCell className="font-medium">
											{client.name || "Unnamed"}
										</TableCell>
										<TableCell>
											<code className="rounded bg-muted px-2 py-1 text-sm">
												{client.clientId.substring(0, 12)}...
											</code>
											<Button
												variant="ghost"
												size="icon"
												className="ml-1 h-6 w-6"
												onClick={() => copyToClipboard(client.clientId, "Client ID")}
											>
												<Copy className="h-3 w-3" />
											</Button>
										</TableCell>
										<TableCell>
											{client.public ? (
												<Badge variant="outline">
													<Globe className="mr-1 h-3 w-3" />
													Public
												</Badge>
											) : (
												<Badge variant="default">
													<Shield className="mr-1 h-3 w-3" />
													Confidential
												</Badge>
											)}
										</TableCell>
										<TableCell className="max-w-xs truncate">
											{client.redirectUris?.join(", ") || "-"}
										</TableCell>
										<TableCell>
											{client.createdAt ? new Date(client.createdAt).toLocaleDateString() : "-"}
										</TableCell>
										<TableCell>
											<Button
												variant="destructive"
												size="sm"
												onClick={() => deleteMutation.mutate(client.clientId)}
												disabled={deleteMutation.isPending}
											>
												{deleteMutation.isPending ? (
													<Loader2 className="h-4 w-4 animate-spin" />
												) : (
													<Trash className="h-4 w-4" />
												)}
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					) : (
						<div className="py-12 text-center">
							<Key className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
							<h3 className="text-lg font-medium">No OAuth Clients</h3>
							<p className="mb-4 text-sm text-muted-foreground">
								Create your first OAuth client to allow applications to authenticate.
							</p>
							<Button onClick={() => setIsCreateDialogOpen(true)}>
								<Plus className="mr-2 h-4 w-4" /> Create Client
							</Button>
						</div>
					)}
				</CardContent>
			</Card>

			<Dialog open={isCredentialsDialogOpen} onOpenChange={setIsCredentialsDialogOpen}>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<Key className="h-5 w-5" />
							Client Created Successfully
						</DialogTitle>
						<DialogDescription>
							Save these credentials now. The client secret will not be shown again.
						</DialogDescription>
					</DialogHeader>

					{createdClient ? (
						<div className="space-y-4">
							<div className="space-y-2">
								<Label>Client Name</Label>
								<p className="text-sm font-medium">{createdClient.name}</p>
							</div>

							<div className="space-y-2">
								<Label>Client ID</Label>
								<div className="flex gap-2">
									<code className="block flex-1 break-all rounded bg-muted px-3 py-2 text-sm">
										{createdClient.clientId}
									</code>
									<Button
										variant="outline"
										size="icon"
										onClick={() => copyToClipboard(createdClient.clientId, "Client ID")}
									>
										<Copy className="h-4 w-4" />
									</Button>
								</div>
							</div>

							{createdClient.clientSecret ? (
								<div className="space-y-2">
									<Label>Client Secret</Label>
									<div className="flex gap-2">
										<code className="block flex-1 break-all rounded bg-muted px-3 py-2 text-sm">
											{showSecret ? createdClient.clientSecret : "*".repeat(40)}
										</code>
										<Button
											variant="outline"
											size="icon"
											onClick={() => setShowSecret(!showSecret)}
										>
											{showSecret ? (
												<EyeOff className="h-4 w-4" />
											) : (
												<Eye className="h-4 w-4" />
											)}
										</Button>
										<Button
											variant="outline"
											size="icon"
											onClick={() =>
												copyToClipboard(createdClient.clientSecret!, "Client Secret")
											}
										>
											<Copy className="h-4 w-4" />
										</Button>
									</div>
									<p className="text-sm text-yellow-600 dark:text-yellow-400">
										Warning: save this secret now. It will not be shown again.
									</p>
								</div>
							) : null}

							<div className="space-y-2">
								<Label>Discovery URL</Label>
								<div className="flex gap-2">
									<code className="block flex-1 break-all rounded bg-muted px-3 py-2 text-sm">
										{baseUrl}/.well-known/openid-configuration
									</code>
									<Button
										variant="outline"
										size="icon"
										onClick={() =>
											copyToClipboard(
												`${baseUrl}/.well-known/openid-configuration`,
												"Discovery URL",
											)
										}
									>
										<Copy className="h-4 w-4" />
									</Button>
								</div>
							</div>

							<div className="rounded-lg border bg-muted/50 p-4">
								<Label className="mb-2 block">Add to your client .env file:</Label>
								<pre className="overflow-x-auto whitespace-pre-wrap break-all text-xs">
									{`OAUTH_CLIENT_ID=${createdClient.clientId}
${createdClient.clientSecret ? `OAUTH_CLIENT_SECRET=${createdClient.clientSecret}` : "# No secret (public client)"}
OAUTH_DISCOVERY_URL=${baseUrl}/.well-known/openid-configuration`}
								</pre>
								<Button
									variant="outline"
									size="sm"
									className="mt-2"
									onClick={() =>
										copyToClipboard(
											`OAUTH_CLIENT_ID=${createdClient.clientId}\n${createdClient.clientSecret ? `OAUTH_CLIENT_SECRET=${createdClient.clientSecret}\n` : ""}OAUTH_DISCOVERY_URL=${baseUrl}/.well-known/openid-configuration`,
											"Environment variables",
										)
									}
								>
									<Copy className="mr-2 h-4 w-4" />
									Copy All
								</Button>
							</div>
						</div>
					) : null}

					<DialogFooter>
						<Button
							onClick={() => {
								setIsCredentialsDialogOpen(false);
								setCreatedClient(null);
								setShowSecret(false);
							}}
						>
							Done
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
