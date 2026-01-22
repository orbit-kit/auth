import SetupCheck from "@/components/setup-check";

export default function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <SetupCheck>{children}</SetupCheck>;
}
