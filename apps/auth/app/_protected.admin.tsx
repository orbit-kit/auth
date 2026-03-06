import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { getCurrentUser, isAdminRole } from "@/lib/auth-api";

export const Route = createFileRoute("/_protected/admin")({
	beforeLoad: async ({ location }) => {
		const user = await getCurrentUser();

		if (!user) {
			throw redirect({
				to: "/sign-in",
				search: { redirectTo: location.href },
			});
		}

		if (!isAdminRole(user.role)) {
			throw redirect({ to: "/dashboard" });
		}

		return { user };
	},
	component: AdminLayout,
});

function AdminLayout() {
	return <Outlet />;
}
