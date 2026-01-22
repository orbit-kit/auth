import { headers } from "next/headers";
import Link from "next/link";
import Button from "@/components/entry-button";
import { auth } from "@/lib/auth";

export default async function Page() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	return (
		<div className="min-h-[80vh] flex items-center justify-center overflow-hidden no-visible-scrollbar">
			<main className="flex flex-col gap-4 row-start-2 items-center justify-center">
				<div className="flex flex-col gap-1">
					<h3 className="text-3xl sm:text-4xl text-black dark:text-white text-center">
						OAuth Client Demo
					</h3>
					<p className="text-center wrap-break-word text-sm md:text-base">
						A simple OAuth client that connects to your central authentication
						server.
					</p>
				</div>

				<div className="flex items-center justify-center">
					<Button session={session} />
				</div>
			</main>
		</div>
	);
}
