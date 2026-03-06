import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { getCurrentUser, getSetupState } from "@/lib/auth-api";

export const Route = createFileRoute("/_protected")({
	beforeLoad: async ({ location }) => {
		const [{ isCompleted }, user] = await Promise.all([
			getSetupState(),
			getCurrentUser(),
		]);

		if (!isCompleted) {
			throw redirect({ to: "/setup" });
		}

		if (!user) {
			throw redirect({
				to: "/sign-in",
				search: { redirectTo: location.href },
			});
		}

		return { user };
	},
	component: ProtectedLayout,
});

function ProtectedLayout() {
	return <Outlet />;
}
