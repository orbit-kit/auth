"use client";

import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
    Copy,
    Eye,
    EyeOff,
    Loader2,
    Plus,
    RefreshCw,
    Trash,
    Key,
    Globe,
    Shield,
} from "lucide-react";
import { useState } from "react";
import { Toaster, toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    createOAuthClient,
    listOAuthClients,
    deleteOAuthClient,
    type OAuthClientCreateInput,
} from "./actions";

export default function OAuthClientsPage() {
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

	type OAuthClientListData = NonNullable<Awaited<ReturnType<typeof listOAuthClients>>["data"]>;
	type OAuthClientListItem = OAuthClientListData[number];

    const { data: clientsData = [], isLoading: isClientsLoading, refetch } = useQuery<OAuthClientListData>({
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
        mutationFn: createOAuthClient,
        onSuccess: (result) => {
            console.log("Create result:", result);
            if (result.success && result.data && result.data.clientId) {
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
                console.error("Create failed:", result);
                toast.error(result.error || "Failed to create client - no client ID returned");
            }
        },
        onError: (error: Error) => {
            console.error("Create error:", error);
            toast.error(error.message || "Failed to create OAuth client");
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteOAuthClient,
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


    const handleCreateClient = async (e: React.FormEvent) => {
        e.preventDefault();
        const filteredRedirectUris = newClient.redirectUris.filter((uri) => uri.trim() !== "");
        if (filteredRedirectUris.length === 0) {
            toast.error("At least one redirect URI is required");
            return;
        }
        createMutation.mutate({
            ...newClient,
            redirectUris: filteredRedirectUris,
        });
    };

    const addRedirectUri = () => {
        setNewClient({
            ...newClient,
            redirectUris: [...newClient.redirectUris, ""],
        });
    };

    const updateRedirectUri = (index: number, value: string) => {
        const uris = [...newClient.redirectUris];
        uris[index] = value;
        setNewClient({ ...newClient, redirectUris: uris });
    };

    const removeRedirectUri = (index: number) => {
        if (newClient.redirectUris.length > 1) {
            const uris = newClient.redirectUris.filter((_, i) => i !== index);
            setNewClient({ ...newClient, redirectUris: uris });
        }
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard`);
    };

    const baseUrl = typeof window !== "undefined"
        ? window.location.origin
        : process.env.BETTER_AUTH_URL || "http://localhost:5000";

    return (
        <div className="container mx-auto p-4 space-y-8">
            <Toaster richColors />

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
                                            onChange={(e) =>
                                                setNewClient({ ...newClient, name: e.target.value })
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
                                                    onChange={(e) => updateRedirectUri(index, e.target.value)}
                                                    required
                                                />
                                                {newClient.redirectUris.length > 1 && (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => removeRedirectUri(index)}
                                                    >
                                                        <Trash className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                        <Button type="button" variant="outline" size="sm" onClick={addRedirectUri}>
                                            <Plus className="mr-2 h-4 w-4" /> Add URI
                                        </Button>
                                    </div>

                                    <div className="flex items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <Label htmlFor="confidential" className="cursor-pointer">
                                                Confidential Client
                                            </Label>
                                            <p className="text-sm text-muted-foreground">
                                                Confidential clients can securely store secrets (web servers).
                                                Public clients cannot (mobile apps, SPAs).
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
                                        <Button
                                            type="submit"
                                            disabled={createMutation.isPending}
                                        >
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
                        <div className="flex justify-center items-center h-64">
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
                                {clientsData.map((client: OAuthClientListItem) => (
                                    <TableRow key={client.clientId}>
                                        <TableCell className="font-medium">
                                            {client.name || "Unnamed"}
                                        </TableCell>
                                        <TableCell>
                                            <code className="text-sm bg-muted px-2 py-1 rounded">
                                                {client.clientId.substring(0, 12)}...
                                            </code>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 ml-1"
                                                onClick={() => copyToClipboard(client.clientId, "Client ID")}
                                            >
                                                <Copy className="h-3 w-3" />
                                            </Button>
                                        </TableCell>
                                        <TableCell>
                                            {client.public ? (
                                                <Badge variant="outline">
                                                    <Globe className="h-3 w-3 mr-1" />
                                                    Public
                                                </Badge>
                                            ) : (
                                                <Badge variant="default">
                                                    <Shield className="h-3 w-3 mr-1" />
                                                    Confidential
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="max-w-xs truncate">
                                            {client.redirectUris?.join(", ") || "-"}
                                        </TableCell>
                                        <TableCell>
                                            {client.createdAt
                                                ? new Date(client.createdAt).toLocaleDateString()
                                                : "-"}
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
                        <div className="text-center py-12">
                            <Key className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium">No OAuth Clients</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Create your first OAuth client to allow applications to authenticate.
                            </p>
                            <Button onClick={() => setIsCreateDialogOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" /> Create Client
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Credentials Dialog - shown after creation */}
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

                    {createdClient && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Client Name</Label>
                                <p className="text-sm font-medium">{createdClient.name}</p>
                            </div>

                            <div className="space-y-2">
                                <Label>Client ID</Label>
                                <div className="flex gap-2">
                                    <code className="flex-1 text-sm bg-muted px-3 py-2 rounded block break-all">
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

                            {createdClient.clientSecret && (
                                <div className="space-y-2">
                                    <Label>Client Secret</Label>
                                    <div className="flex gap-2">
                                        <code className="flex-1 text-sm bg-muted px-3 py-2 rounded block break-all">
                                            {showSecret
                                                ? createdClient.clientSecret
                                                : "•".repeat(40)}
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
                                        ⚠️ Save this secret now! It won't be shown again.
                                    </p>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label>Discovery URL</Label>
                                <div className="flex gap-2">
                                    <code className="flex-1 text-sm bg-muted px-3 py-2 rounded block break-all">
                                        {baseUrl}/.well-known/openid-configuration
                                    </code>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() =>
                                            copyToClipboard(
                                                `${baseUrl}/.well-known/openid-configuration`,
                                                "Discovery URL"
                                            )
                                        }
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="rounded-lg border p-4 bg-muted/50">
                                <Label className="mb-2 block">Add to your client .env file:</Label>
                                <pre className="text-xs overflow-x-auto whitespace-pre-wrap break-all">
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
                                            `OAUTH_CLIENT_ID=${createdClient.clientId}\n${createdClient.clientSecret
                                                ? `OAUTH_CLIENT_SECRET=${createdClient.clientSecret}\n`
                                                : ""
                                            }OAUTH_DISCOVERY_URL=${baseUrl}/.well-known/openid-configuration`,
                                            "Environment variables"
                                        )
                                    }
                                >
                                    <Copy className="mr-2 h-4 w-4" />
                                    Copy All
                                </Button>
                            </div>
                        </div>
                    )}

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
