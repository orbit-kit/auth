import { redirect } from "next/navigation";
import { isSetupCompleted } from "@/lib/setup";

export default async function SetupCheck({
	children,
}: {
	children: React.ReactNode;
}) {
	const setupCompleted = await isSetupCompleted();

	if (!setupCompleted) {
		redirect("/setup");
	}

	return <>{children}</>;
}
